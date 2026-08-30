"""
Main processing pipeline.
Orchestrates: document conversion → question extraction → answer extraction
             → mapping → optional grading → result assembly.

Provider priority: OpenAI (primary) → Gemini (fallback)
"""
import logging
from typing import List, Tuple

from models.schemas import Answer, AssessmentResult, Question
from services.document import file_to_page_images
from services.mapping import build_summary, map_answers_to_questions
from services.providers.base_provider import AIProvider

logger = logging.getLogger(__name__)

# Errors that should trigger fallback
TRANSIENT_ERRORS = (
    "rate_limit_exceeded",
    "quota",
    "timeout",
    "server_error",
    "overloaded",
    "unavailable",
    "RateLimitError",
    "APIStatusError",
    "APITimeoutError",
    "InternalServerError",
)


def _is_transient(error: Exception) -> bool:
    msg = str(type(error).__name__) + str(error).lower()
    return any(k.lower() in msg.lower() for k in TRANSIENT_ERRORS)


async def run_pipeline(
    question_paper_bytes: bytes,
    question_paper_filename: str,
    answer_sheet_bytes: bytes,
    answer_sheet_filename: str,
    primary_provider: AIProvider,
    fallback_provider: AIProvider | None,
    do_grading: bool = True,
) -> AssessmentResult:
    """
    Full pipeline: files → AssessmentResult.
    """
    # ── 1. Convert documents to page images ──────────────────────────────────
    logger.info("[Pipeline] Converting question paper to images")
    qp_images, _ = file_to_page_images(question_paper_bytes, question_paper_filename)

    logger.info("[Pipeline] Converting answer sheet to images")
    as_images, as_page_count = file_to_page_images(answer_sheet_bytes, answer_sheet_filename)

    # ── 2. Extract questions ──────────────────────────────────────────────────
    questions, fallback_used, provider_name = await _run_with_fallback(
        primary_provider.extract_questions,
        fallback_provider.extract_questions if fallback_provider else None,
        "extract_questions",
        qp_images,
    )

    if not questions:
        raise ValueError("No questions could be extracted from the question paper.")

    # ── 3. Extract answers ────────────────────────────────────────────────────
    provider = primary_provider if not fallback_used else fallback_provider
    answers_raw, used_fb2, _ = await _run_with_fallback(
        primary_provider.extract_answers,
        fallback_provider.extract_answers if fallback_provider else None,
        "extract_answers",
        as_images,
        questions,
    )
    fallback_used = fallback_used or used_fb2

    # ── 4. Map answers → questions ────────────────────────────────────────────
    logger.info("[Pipeline] Mapping answers to questions")
    mapped_questions, matched_answers, unmatched = map_answers_to_questions(questions, answers_raw)

    # ── 5. Optional grading ───────────────────────────────────────────────────
    if do_grading and any(q.total_marks is not None for q in mapped_questions):
        logger.info("[Pipeline] Grading answers")
        try:
            grading_provider = provider or primary_provider
            mapped_questions = await grading_provider.grade_answers(mapped_questions, matched_answers)
        except Exception as e:
            logger.warning(f"[Pipeline] Grading failed, skipping: {e}")

    # ── 6. Build result ───────────────────────────────────────────────────────
    summary = build_summary(mapped_questions, unmatched)

    return AssessmentResult(
        provider=provider_name,
        fallback_used=fallback_used,
        questions=mapped_questions,
        answers=matched_answers,
        unmatched_answers=unmatched,
        summary=summary,
        answer_sheet_page_count=as_page_count,
    )


async def _run_with_fallback(primary_fn, fallback_fn, step_name: str, *args):
    """
    Run primary_fn(*args). On transient failure, retry once then try fallback_fn.
    Returns (result, fallback_used, provider_name).
    """
    # Try primary
    try:
        result = await primary_fn(*args)
        return result, False, "openai"
    except Exception as e:
        logger.warning(f"[AI] OpenAI {step_name} failed: {type(e).__name__}: {e}")
        if not _is_transient(e):
            raise  # Don't fallback for non-transient errors

    # Retry primary once
    try:
        logger.info(f"[AI] Retrying OpenAI {step_name}")
        result = await primary_fn(*args)
        return result, False, "openai"
    except Exception as e:
        logger.warning(f"[AI] OpenAI {step_name} retry failed: {e}")

    # Try fallback
    if fallback_fn is None:
        raise RuntimeError(f"OpenAI {step_name} failed and no fallback provider configured.")

    logger.info(f"[AI] Falling back to Gemini for {step_name}")
    try:
        result = await fallback_fn(*args)
        return result, True, "gemini"
    except Exception as e:
        logger.error(f"[AI] Gemini {step_name} also failed: {e}")
        raise RuntimeError(
            f"Both AI providers failed during {step_name}. Please try again."
        ) from e
