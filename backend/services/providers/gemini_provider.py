"""
Google Gemini provider — fallback AI provider.
Uses gemini-1.5-flash for document understanding.
"""
import json
import logging
import uuid
from typing import Any, Dict, List

import google.generativeai as genai

from models.schemas import Answer, AnswerRegion, Question, QuestionStatus
from services.providers.base_provider import AIProvider
from services.providers.openai_provider import (
    ANSWER_EXTRACTION_PROMPT,
    GRADING_PROMPT,
    QUESTION_EXTRACTION_PROMPT,
    _build_answers,
    _build_questions,
    _parse_json,
)
from utils.validation import validate_regions

logger = logging.getLogger(__name__)


class GeminiProvider(AIProvider):
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    async def extract_questions(self, page_images: List[str]) -> List[Question]:
        logger.info(f"[AI] Gemini question extraction started ({len(page_images)} pages)")

        parts = [QUESTION_EXTRACTION_PROMPT]
        for b64 in page_images:
            parts.append({"mime_type": "image/png", "data": b64})

        response = self.model.generate_content(
            parts,
            generation_config=genai.types.GenerationConfig(
                temperature=0,
                max_output_tokens=8192,
                response_mime_type="application/json",
            ),
        )
        raw = response.text or ""
        data = _parse_json(raw)
        questions = _build_questions(data.get("questions", []))
        logger.info(f"[AI] Gemini extracted {len(questions)} questions")
        return questions

    async def extract_answers(
        self, page_images: List[str], questions: List[Question]
    ) -> List[Answer]:
        logger.info(f"[AI] Gemini answer extraction started ({len(page_images)} pages)")

        question_list = ", ".join(f'"{q.number}: {q.text[:60]}"' for q in questions)
        prompt = ANSWER_EXTRACTION_PROMPT.format(question_list=question_list)

        parts = [prompt]
        for idx, b64 in enumerate(page_images):
            parts.append(f"[Page {idx + 1}]")
            parts.append({"mime_type": "image/png", "data": b64})

        response = self.model.generate_content(
            parts,
            generation_config=genai.types.GenerationConfig(
                temperature=0,
                max_output_tokens=8192,
                response_mime_type="application/json",
            ),
        )
        raw = response.text or ""
        data = _parse_json(raw)
        answers = _build_answers(data.get("answers", []), len(page_images))
        unmatched = _build_answers(data.get("unmatched", []), len(page_images), is_unmatched=True)
        logger.info(f"[AI] Gemini extracted {len(answers)} answers, {len(unmatched)} unmatched")
        return answers + unmatched

    async def grade_answers(
        self, questions: List[Question], answers: List[Answer]
    ) -> List[Question]:
        logger.info("[AI] Gemini grading started")
        graded = list(questions)

        for i, q in enumerate(graded):
            if q.status != "answered" or q.total_marks is None:
                continue
            matched_answers = [a for a in answers if a.question_id == q.id]
            if not matched_answers:
                continue

            answer_text = " ".join(a.text for a in matched_answers)
            prompt = GRADING_PROMPT.format(
                question_text=q.text,
                total_marks=q.total_marks,
                answer_text=answer_text[:1000],
            )

            try:
                response = self.model.generate_content(
                    [prompt],
                    generation_config=genai.types.GenerationConfig(temperature=0, max_output_tokens=256),
                )
                raw = response.text or ""
                grade_data = _parse_json(raw)
                earned = grade_data.get("awarded_marks")
                if earned is None:
                    earned = grade_data.get("earned_marks")
                feedback = grade_data.get("reason") or grade_data.get("feedback")
                if earned is not None and 0 <= float(earned) <= (q.total_marks or 999):
                    graded[i] = q.model_copy(update={"earned_marks": int(round(float(earned))), "feedback": feedback})
            except Exception as e:
                logger.warning(f"[AI] Gemini grading failed for Q{q.number}: {e}")

        logger.info("[AI] Gemini grading completed")
        return graded
