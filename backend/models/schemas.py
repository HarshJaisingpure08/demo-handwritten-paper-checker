from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal
from enum import Enum


class QuestionStatus(str, Enum):
    answered = "answered"
    unanswered = "unanswered"
    needs_review = "needs_review"


class AnswerRegion(BaseModel):
    page: int = Field(..., ge=1, description="1-indexed page number")
    x: float = Field(..., ge=0.0, le=1.0, description="Normalized left coordinate")
    y: float = Field(..., ge=0.0, le=1.0, description="Normalized top coordinate")
    width: float = Field(..., ge=0.0, le=1.0, description="Normalized width")
    height: float = Field(..., ge=0.0, le=1.0, description="Normalized height")

    @field_validator("width", "height")
    @classmethod
    def must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("width and height must be positive")
        return v


class Question(BaseModel):
    id: str
    number: str
    text: str
    order: int
    status: QuestionStatus = QuestionStatus.unanswered
    answer_ids: List[str] = Field(default_factory=list)
    total_marks: Optional[int] = None
    earned_marks: Optional[int] = None
    feedback: Optional[str] = None


class Answer(BaseModel):
    id: str
    question_id: Optional[str] = None
    question_number: Optional[str] = None
    text: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    regions: List[AnswerRegion] = Field(default_factory=list)
    is_unmatched: bool = False


class AssessmentSummary(BaseModel):
    total_questions: int
    answered: int
    unanswered: int
    needs_review: int
    unmatched_answers: int
    total_marks: Optional[int] = None
    earned_marks: Optional[int] = None


class AssessmentResult(BaseModel):
    provider: str
    fallback_used: bool = False
    questions: List[Question]
    answers: List[Answer]
    unmatched_answers: List[Answer] = Field(default_factory=list)
    summary: AssessmentSummary
    answer_sheet_page_count: int = 1
