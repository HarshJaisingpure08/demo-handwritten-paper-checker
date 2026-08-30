"""
Answer mapping service.
Maps extracted answers to questions using:
1. Explicit question number (highest priority)
2. Semantic/contextual match (fallback)
"""
import logging
import re
from typing import List, Tuple

from models.schemas import Answer, AssessmentSummary, Question, QuestionStatus

logger = logging.getLogger(__name__)

CONFIDENCE_HIGH = 0.90
CONFIDENCE_MEDIUM = 0.70


def map_answers_to_questions(
    questions: List[Question], answers: List[Answer]
) -> Tuple[List[Question], List[Answer], List[Answer]]:
    """
    Map answers to questions and return:
    - updated questions (with status and answer_ids)
    - matched answers (with question_id set)
    - unmatched answers (could not be linked to any question)
    """
    q_by_number = {_normalize_number(q.number): q for q in questions}
    q_by_id = {q.id: q for q in questions}

    matched_answers: List[Answer] = []
    unmatched_answers: List[Answer] = []
    question_answer_map: dict[str, List[str]] = {q.id: [] for q in questions}

    for answer in answers:
        if answer.is_unmatched:
            unmatched_answers.append(answer)
            continue

        matched_q = None

        # Step 1: Try explicit question number from the answer
        if answer.question_number:
            normalized = _normalize_number(answer.question_number)
            matched_q = q_by_number.get(normalized)

            # Partial match: try number-only (e.g. "3a" might match "3(a)")
            if not matched_q:
                for qnum, q in q_by_number.items():
                    if _numbers_equivalent(normalized, qnum):
                        matched_q = q
                        break

        if matched_q:
            updated_answer = answer.model_copy(update={"question_id": matched_q.id})
            matched_answers.append(updated_answer)
            question_answer_map[matched_q.id].append(updated_answer.id)
        else:
            # Could not match — treat as unmatched
            logger.warning(
                f"[Mapping] Answer with question_number={answer.question_number!r} "
                f"could not be matched to any question"
            )
            unmatched_answers.append(answer.model_copy(update={"is_unmatched": True}))

    # Update question statuses
    updated_questions: List[Question] = []
    for q in questions:
        answer_ids = question_answer_map.get(q.id, [])
        if not answer_ids:
            status = QuestionStatus.unanswered
        else:
            # Check confidence of matched answers
            q_answers = [a for a in matched_answers if a.question_id == q.id]
            avg_confidence = sum(a.confidence for a in q_answers) / len(q_answers)
            if avg_confidence >= CONFIDENCE_HIGH:
                status = QuestionStatus.answered
            elif avg_confidence >= CONFIDENCE_MEDIUM:
                status = QuestionStatus.answered
            else:
                status = QuestionStatus.needs_review

        updated_questions.append(q.model_copy(update={
            "status": status,
            "answer_ids": answer_ids,
        }))

    return updated_questions, matched_answers, unmatched_answers


def build_summary(
    questions: List[Question],
    unmatched: List[Answer],
) -> AssessmentSummary:
    total = len(questions)
    answered = sum(1 for q in questions if q.status == QuestionStatus.answered)
    needs_review = sum(1 for q in questions if q.status == QuestionStatus.needs_review)
    unanswered = sum(1 for q in questions if q.status == QuestionStatus.unanswered)

    total_marks = sum(q.total_marks for q in questions if q.total_marks is not None) or None
    earned_marks = None
    if total_marks is not None:
        vals = [q.earned_marks for q in questions if q.earned_marks is not None]
        if vals:
            earned_marks = sum(vals)

    return AssessmentSummary(
        total_questions=total,
        answered=answered,
        unanswered=unanswered,
        needs_review=needs_review,
        unmatched_answers=len(unmatched),
        total_marks=total_marks,
        earned_marks=earned_marks,
    )


DEVANAGARI_DIGITS = str.maketrans("०१२३४५६७८९", "0123456789")
HINDI_SUBPARTS = str.maketrans("कखगघङचछजझञ", "abcdefghij")


def _normalize_number(num: str) -> str:
    """Normalize question number for comparison: lowercase, convert Hindi digits, strip prefixes."""
    n = num.lower().strip()
    # Convert Devanagari numerals to ASCII (१२३ -> 123)
    n = n.translate(DEVANAGARI_DIGITS)
    # Strip common English and Hindi question/answer prefixes
    # e.g. "प्रश्न 1", "प्र. 1", "प्र 1", "उत्तर 1", "उत्. 1", "उत् 1", "Q.1", "Q1", "Ans 1"
    n = re.sub(r"^(प्रश्न|प्र|उत्तर|उत्|q|ans|answer)[\.\s:]*", "", n, flags=re.IGNORECASE)
    n = n.replace(" ", "")
    return n


def _numbers_equivalent(a: str, b: str) -> bool:
    """Check if two numbers are equivalent, e.g. '3a' == '3(a)' or 'प्रश्न 3 (ख)' == '3(b)'."""
    na = _normalize_number(a)
    nb = _normalize_number(b)

    def _canonical(s: str) -> str:
        s = s.translate(HINDI_SUBPARTS)
        return s.replace("(", "").replace(")", "").replace(".", "")

    return _canonical(na) == _canonical(nb)
