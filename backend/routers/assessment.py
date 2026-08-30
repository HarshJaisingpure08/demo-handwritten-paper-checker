"""
Assessment router.
"""
import logging
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

from config import settings
from models.schemas import AssessmentResult
from services.document import validate_file
from services.pipeline import run_pipeline
from services.providers.gemini_provider import GeminiProvider
from services.providers.openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/assessment", tags=["assessment"])

ALLOWED_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
}
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}


def _check_file(upload: UploadFile) -> None:
    ext = Path(upload.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Please upload PDF, JPG, or PNG.",
        )


@router.post("/process", response_model=AssessmentResult)
async def process_assessment(
    question_paper: UploadFile = File(..., description="Question paper (PDF/PNG/JPG)"),
    answer_sheet: UploadFile = File(..., description="Answer sheet (PDF/PNG/JPG)"),
) -> AssessmentResult:
    """
    Process uploaded question paper and answer sheet.
    Returns structured assessment result with mapped answers and highlights.
    """
    # Validate file types
    _check_file(question_paper)
    _check_file(answer_sheet)

    # Read file bytes
    qp_bytes = await question_paper.read()
    as_bytes = await answer_sheet.read()

    # Validate file content
    try:
        validate_file(qp_bytes, question_paper.filename or "file.pdf", settings.max_file_size_mb)
        validate_file(as_bytes, answer_sheet.filename or "file.pdf", settings.max_file_size_mb)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Build providers
    if not settings.openai_api_key and not settings.gemini_api_key:
        raise HTTPException(
            status_code=503,
            detail="No AI provider configured. Please set OPENAI_API_KEY or GEMINI_API_KEY.",
        )

    primary = None
    fallback = None

    if settings.openai_api_key:
        primary = OpenAIProvider(settings.openai_api_key)
    if settings.gemini_api_key:
        gemini = GeminiProvider(settings.gemini_api_key)
        if primary is None:
            primary = gemini
        else:
            fallback = gemini

    if primary is None:
        raise HTTPException(status_code=503, detail="No AI provider available.")

    # Run pipeline
    try:
        logger.info(
            f"[API] Processing: qp={question_paper.filename!r} as={answer_sheet.filename!r}"
        )
        result = await run_pipeline(
            qp_bytes,
            question_paper.filename or "question_paper.pdf",
            as_bytes,
            answer_sheet.filename or "answer_sheet.pdf",
            primary_provider=primary,
            fallback_provider=fallback,
            do_grading=True,
        )
        logger.info(
            f"[API] Done: {result.summary.total_questions} questions, "
            f"{result.summary.answered} answered"
        )
        return result

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"[API] Unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Unable to process the assessment. Please try again with a clearer scan.",
        )
