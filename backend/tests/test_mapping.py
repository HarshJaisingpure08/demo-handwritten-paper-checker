"""
Focused tests for core mapping, validation, and pipeline logic.
"""
import pytest
from models.schemas import Answer, AnswerRegion, Question, QuestionStatus
from services.mapping import (
    _normalize_number,
    _numbers_equivalent,
    build_summary,
    map_answers_to_questions,
)
from utils.validation import clamp_region, validate_regions


# ── Fixtures ──────────────────────────────────────────────────────────────────

def make_question(number: str, order: int, total_marks: int | None = None) -> Question:
    return Question(
        id=f"q_{number.replace('(', '').replace(')', '')}",
        number=number,
        text=f"Question {number}",
        order=order,
        total_marks=total_marks,
    )


def make_answer(qnum: str | None, confidence: float = 0.95, page: int = 1) -> Answer:
    return Answer(
        id=f"a_{qnum or 'x'}",
        question_number=qnum,
        text=f"Answer for {qnum}",
        confidence=confidence,
        regions=[AnswerRegion(page=page, x=0.1, y=0.1, width=0.8, height=0.2)],
    )


# ── Number normalization ──────────────────────────────────────────────────────

def test_normalize_strips_q_prefix():
    assert _normalize_number("Q1") == "1"
    assert _normalize_number("q. 3(a)") == "3(a)"
    assert _normalize_number("Q3(b)") == "3(b)"


def test_normalize_hindi_prefixes_and_digits():
    assert _normalize_number("प्रश्न 1") == "1"
    assert _normalize_number("प्र. 2") == "2"
    assert _normalize_number("उत्तर 3") == "3"
    assert _normalize_number("उत्. 4") == "4"
    assert _normalize_number("प्रश्न ३(क)") == "3(क)"
    assert _normalize_number("प्र. १") == "1"


def test_numbers_equivalent():
    assert _numbers_equivalent("3a", "3(a)") is True
    assert _numbers_equivalent("11b", "11(b)") is True
    assert _numbers_equivalent("1", "2") is False


def test_hindi_subparts_equivalent():
    assert _numbers_equivalent("3क", "3(a)") is True
    assert _numbers_equivalent("3(क)", "3a") is True
    assert _numbers_equivalent("प्रश्न 3 (ख)", "3(b)") is True


# ── Question ordering ─────────────────────────────────────────────────────────

def test_question_order_preserved():
    questions = [
        make_question("1", 1),
        make_question("2", 2),
        make_question("3(a)", 3),
        make_question("3(b)", 4),
        make_question("4", 5),
    ]
    assert [q.number for q in questions] == ["1", "2", "3(a)", "3(b)", "4"]


# ── Explicit mapping ──────────────────────────────────────────────────────────

def test_explicit_mapping_basic():
    questions = [make_question("1", 1), make_question("2", 2), make_question("3", 3)]
    answers = [make_answer("1"), make_answer("2"), make_answer("3")]

    qs, matched, unmatched = map_answers_to_questions(questions, answers)
    assert all(q.status == QuestionStatus.answered for q in qs)
    assert len(unmatched) == 0


def test_out_of_order_answers():
    questions = [
        make_question("1", 1), make_question("2", 2),
        make_question("3(a)", 3), make_question("3(b)", 4),
        make_question("4", 5),
    ]
    # Answers written out of order
    answers = [
        make_answer("1", page=1),
        make_answer("4", page=2),
        make_answer("3(b)", page=3),
        make_answer("2", page=4),
        make_answer("3(a)", page=5),
    ]
    qs, matched, unmatched = map_answers_to_questions(questions, answers)
    q_map = {q.number: q for q in qs}

    assert q_map["1"].status == QuestionStatus.answered
    assert q_map["2"].status == QuestionStatus.answered
    assert q_map["3(a)"].status == QuestionStatus.answered
    assert q_map["3(b)"].status == QuestionStatus.answered
    assert q_map["4"].status == QuestionStatus.answered
    assert len(unmatched) == 0


def test_unanswered_questions():
    questions = [
        make_question("1", 1), make_question("2", 2),
        make_question("3", 3), make_question("4", 4), make_question("5", 5),
    ]
    answers = [make_answer("1"), make_answer("2"), make_answer("4")]
    qs, _, unmatched = map_answers_to_questions(questions, answers)
    q_map = {q.number: q for q in qs}

    assert q_map["1"].status == QuestionStatus.answered
    assert q_map["2"].status == QuestionStatus.answered
    assert q_map["3"].status == QuestionStatus.unanswered
    assert q_map["4"].status == QuestionStatus.answered
    assert q_map["5"].status == QuestionStatus.unanswered


def test_unmatched_answer():
    questions = [make_question(str(i), i) for i in range(1, 6)]
    answers = [make_answer("99")]  # Q99 does not exist
    qs, matched, unmatched = map_answers_to_questions(questions, answers)
    assert len(unmatched) == 1
    assert unmatched[0].question_number == "99"
    assert all(q.status == QuestionStatus.unanswered for q in qs)


def test_subpart_mapping():
    questions = [make_question("3(a)", 3), make_question("3(b)", 4)]
    answers = [make_answer("3a"), make_answer("3(b)")]
    qs, matched, unmatched = map_answers_to_questions(questions, answers)
    q_map = {q.number: q for q in qs}
    assert q_map["3(a)"].status == QuestionStatus.answered
    assert q_map["3(b)"].status == QuestionStatus.answered


def test_multipage_answer_regions():
    questions = [make_question("4", 1)]
    regions = [
        AnswerRegion(page=3, x=0.1, y=0.1, width=0.8, height=0.3),
        AnswerRegion(page=4, x=0.1, y=0.1, width=0.8, height=0.5),
        AnswerRegion(page=5, x=0.1, y=0.1, width=0.8, height=0.2),
    ]
    answer = Answer(
        id="a_4",
        question_number="4",
        text="Long answer spanning multiple pages",
        confidence=0.95,
        regions=regions,
    )
    qs, matched, unmatched = map_answers_to_questions(questions, [answer])
    assert matched[0].regions[0].page == 3
    assert matched[0].regions[1].page == 4
    assert matched[0].regions[2].page == 5


# ── Validation ────────────────────────────────────────────────────────────────

def test_valid_regions():
    regions = [AnswerRegion(page=1, x=0.1, y=0.1, width=0.8, height=0.2)]
    assert validate_regions(regions) is True


def test_invalid_region_exceeds_bounds():
    regions = [AnswerRegion(page=1, x=0.5, y=0.5, width=0.8, height=0.8)]
    assert validate_regions(regions) is False


def test_clamp_region():
    clamped = clamp_region(page=0, x=-0.1, y=-0.1, width=1.5, height=1.5)
    assert 0.0 <= clamped.x <= 1.0
    assert 0.0 <= clamped.y <= 1.0
    assert clamped.width <= 1.0
    assert clamped.height <= 1.0
    assert clamped.page >= 1


# ── Summary ───────────────────────────────────────────────────────────────────

def test_summary_counts():
    questions = [
        make_question("1", 1), make_question("2", 2),
        make_question("3", 3), make_question("4", 4), make_question("5", 5),
    ]
    answers = [make_answer("1"), make_answer("2"), make_answer("4")]
    qs, matched, unmatched = map_answers_to_questions(questions, answers)
    summary = build_summary(qs, unmatched)
    assert summary.total_questions == 5
    assert summary.answered == 3
    assert summary.unanswered == 2
    assert summary.unmatched_answers == 0


# ── Question Marks Handling ───────────────────────────────────────────────────

def test_question_specific_marks_extraction():
    q1 = make_question("1", 1, total_marks=10)
    q2 = make_question("2", 2, total_marks=5)
    q3 = make_question("3", 3, total_marks=None)  # Unstated in paper

    assert q1.total_marks == 10
    assert q2.total_marks == 5
    assert q3.total_marks is None


def test_summary_with_question_marks():
    q1 = Question(id="q1", number="1", text="Q1", order=1, status=QuestionStatus.answered, total_marks=10, earned_marks=7)
    q2 = Question(id="q2", number="2", text="Q2", order=2, status=QuestionStatus.answered, total_marks=5, earned_marks=4)
    q3 = Question(id="q3", number="3", text="Q3", order=3, status=QuestionStatus.unanswered, total_marks=None, earned_marks=None)

    summary = build_summary([q1, q2, q3], [])
    assert summary.total_marks == 15
    assert summary.earned_marks == 11

