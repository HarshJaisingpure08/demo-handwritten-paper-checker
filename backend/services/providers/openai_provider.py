"""
OpenAI vision provider — primary AI provider.
Uses GPT-4o for document understanding, structured extraction, and grading.
"""
import json
import logging
import uuid
from typing import Any, Dict, List

from openai import AsyncOpenAI

from models.schemas import Answer, AnswerRegion, Question, QuestionStatus
from services.providers.base_provider import AIProvider
from utils.validation import validate_regions

logger = logging.getLogger(__name__)

# ── Prompts ──────────────────────────────────────────────────────────────────

QUESTION_EXTRACTION_PROMPT = """You are an expert at reading printed question papers in English, Hindi (Devanagari script), or bilingual (English + Hindi) format.

Extract ALL questions from this question paper in PRINTED ORDER.
Rules:
- Fully support questions written in English, Hindi, or bilingual formats.
- Preserve exact question numbering (e.g. "1", "2", "3(a)", "3(b)", "प्रश्न 1", "प्र. 2", "3(क)", "3(ख)").
- Treat each sub-part (a), (b), (c) or (क), (ख), (ग) as a SEPARATE question entry.
- Never combine sub-parts into one entry.
- Include total marks per question ONLY if explicitly printed on the question paper for that specific question (e.g. "[2 marks]", "[2 अंक]", "(10 Marks)", "[10]" → total_marks: 10). If the question paper does NOT state maximum marks for a question, total_marks MUST be null. Do NOT invent, estimate, infer, guess, or hardcode maximum marks.
- Extract the full question text in its original language/script (Hindi Devanagari, English, or bilingual).
- The "order" field is a sequential integer starting at 1 for the first question.

Respond with ONLY valid JSON, no markdown, no explanation:
{
  "questions": [
    {
      "number": "1",
      "text": "full question text here (in Hindi/English)",
      "order": 1,
      "total_marks": 2
    },
    {
      "number": "3(a)",
      "text": "sub-question text",
      "order": 3,
      "total_marks": null
    }
  ]
}"""

ANSWER_EXTRACTION_PROMPT = """You are an expert at reading handwritten student answer sheets written in English, Hindi (Devanagari script), or mixed languages/scripts.

The following pages are from a student's handwritten answer sheet.
The list of questions from the question paper is: {question_list}

For each handwritten answer you find:
1. Identify which question it answers (look for written question numbers in English or Hindi, e.g. "Q1", "1.", "Ans 1", "प्रश्न 1", "प्र. 1", "उत्तर 1", "1(क)", "प्रश्न १", etc.).
2. Extract the full text content of the answer accurately in its original language/script (Hindi Devanagari, English, or Hinglish).
3. Determine the bounding box region of the answer on the page using NORMALIZED coordinates (0.0 to 1.0).
   - x, y = top-left corner (x=left, y=top)
   - width, height = size of the region
4. If the answer spans multiple pages, create one region entry per page.
5. If no question number is written, use semantic matching to determine which question is being answered regardless of language.
6. Set confidence 0.0-1.0 based on how certain you are of the mapping.

Respond with ONLY valid JSON, no markdown:
{{
  "answers": [
    {{
      "question_number": "1",
      "text": "extracted answer text (in Hindi/English)",
      "confidence": 0.95,
      "regions": [
        {{"page": 1, "x": 0.05, "y": 0.10, "width": 0.90, "height": 0.25}}
      ]
    }}
  ],
  "unmatched": [
    {{
      "text": "answer text that couldn't be matched",
      "confidence": 0.0,
      "regions": [
        {{"page": 2, "x": 0.05, "y": 0.60, "width": 0.90, "height": 0.15}}
      ]
    }}
  ]
}}"""

GRADING_PROMPT = """You are an expert teacher grading a student's answer written in English or Hindi (Devanagari script).

Question: {question_text}
Maximum marks available (strictly derived from question paper): {total_marks}
Student's answer: {answer_text}

Evaluate the student's answer for correctness, completeness, relevance, reasoning, and key missing points regardless of whether written in English, Hindi, or bilingual script.
Award marks strictly within range 0 to {total_marks}. Partial marks are allowed.
Provide the reason / feedback in a clear, supportive manner in the appropriate language (English or Hindi).

Respond with ONLY valid JSON:
{{
  "maximum_marks": {total_marks},
  "awarded_marks": 2,
  "confidence": 0.9,
  "reason": "Brief explanation of awarded marks (in English or Hindi)."
}}"""


class OpenAIProvider(AIProvider):
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = "gpt-4o"

    async def extract_questions(self, page_images: List[str]) -> List[Question]:
        logger.info(f"[AI] OpenAI question extraction started ({len(page_images)} pages)")

        content: List[Dict[str, Any]] = [
            {"type": "text", "text": QUESTION_EXTRACTION_PROMPT}
        ]
        for b64 in page_images:
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{b64}", "detail": "high"},
            })

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": content}],
            max_tokens=4096,
            temperature=0,
        )

        raw = response.choices[0].message.content or ""
        data = _parse_json(raw)
        questions = _build_questions(data.get("questions", []))
        logger.info(f"[AI] OpenAI extracted {len(questions)} questions")
        return questions

    async def extract_answers(
        self, page_images: List[str], questions: List[Question]
    ) -> List[Answer]:
        logger.info(f"[AI] OpenAI answer extraction started ({len(page_images)} pages)")

        question_list = ", ".join(f'"{q.number}: {q.text[:60]}"' for q in questions)
        prompt = ANSWER_EXTRACTION_PROMPT.format(question_list=question_list)

        content: List[Dict[str, Any]] = [{"type": "text", "text": prompt}]
        for idx, b64 in enumerate(page_images):
            content.append({
                "type": "text",
                "text": f"[Page {idx + 1}]",
            })
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{b64}", "detail": "high"},
            })

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": content}],
            max_tokens=8192,
            temperature=0,
        )

        raw = response.choices[0].message.content or ""
        data = _parse_json(raw)
        answers = _build_answers(data.get("answers", []), len(page_images))
        unmatched = _build_answers(data.get("unmatched", []), len(page_images), is_unmatched=True)
        logger.info(f"[AI] OpenAI extracted {len(answers)} answers, {len(unmatched)} unmatched")
        return answers + unmatched

    async def grade_answers(
        self, questions: List[Question], answers: List[Answer]
    ) -> List[Question]:
        logger.info("[AI] OpenAI grading started")
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
                response = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=256,
                    temperature=0,
                )
                raw = response.choices[0].message.content or ""
                grade_data = _parse_json(raw)
                earned = grade_data.get("awarded_marks")
                if earned is None:
                    earned = grade_data.get("earned_marks")
                feedback = grade_data.get("reason") or grade_data.get("feedback")
                if earned is not None and 0 <= float(earned) <= (q.total_marks or 999):
                    graded[i] = q.model_copy(update={"earned_marks": int(round(float(earned))), "feedback": feedback})
            except Exception as e:
                logger.warning(f"[AI] Grading failed for Q{q.number}: {e}")

        logger.info("[AI] OpenAI grading completed")
        return graded


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_json(raw: str) -> Dict[str, Any]:
    """Strip markdown code fences, repair trailing truncated brackets, and parse JSON."""
    import re
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
        text = text.strip()

    # Try standard json load first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting JSON object using regex
    match = re.search(r"(\{.*\})", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # If truncated, attempt basic closure
    for closing in ["]}", "}", "\"]}", "\"}]}"]:
        try:
            return json.loads(text + closing)
        except json.JSONDecodeError:
            continue

    logger.error(f"[AI] JSON parse error on raw output:\n{text[:500]}")
    return {}


def _build_questions(raw_list: List[Dict]) -> List[Question]:
    questions = []
    for item in raw_list:
        number = str(item.get("number", "")).strip()
        text = str(item.get("text", "")).strip()
        if not number or not text:
            continue
        questions.append(Question(
            id=f"q_{uuid.uuid4().hex[:8]}",
            number=number,
            text=text,
            order=int(item.get("order", len(questions) + 1)),
            total_marks=item.get("total_marks"),
        ))
    # Sort by order to guarantee correct sequence
    questions.sort(key=lambda q: q.order)
    return questions


def _build_answers(raw_list: List[Dict], page_count: int, is_unmatched: bool = False) -> List[Answer]:
    answers = []
    for item in raw_list:
        regions = []
        for r in item.get("regions", []):
            try:
                region = AnswerRegion(
                    page=max(1, min(int(r.get("page", 1)), page_count)),
                    x=float(r.get("x", 0.0)),
                    y=float(r.get("y", 0.0)),
                    width=float(r.get("width", 0.8)),
                    height=float(r.get("height", 0.1)),
                )
                if validate_regions([region]):
                    regions.append(region)
            except Exception:
                pass

        if not regions:
            # Provide a fallback region spanning the page if AI didn't give one
            regions = [AnswerRegion(page=1, x=0.05, y=0.05, width=0.90, height=0.20)]

        answers.append(Answer(
            id=f"a_{uuid.uuid4().hex[:8]}",
            question_number=str(item.get("question_number", "")).strip() if not is_unmatched else None,
            text=str(item.get("text", "")).strip(),
            confidence=float(item.get("confidence", 0.5)),
            regions=regions,
            is_unmatched=is_unmatched,
        ))
    return answers
