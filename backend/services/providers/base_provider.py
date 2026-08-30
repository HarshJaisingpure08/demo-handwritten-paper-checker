"""
Abstract AI provider interface.
"""
from abc import ABC, abstractmethod
from typing import List, Optional

from models.schemas import Answer, Question


class AIProvider(ABC):
    """Common interface for all AI providers."""

    @abstractmethod
    async def extract_questions(self, page_images: List[str]) -> List[Question]:
        """Extract ordered list of questions from question paper images."""
        ...

    @abstractmethod
    async def extract_answers(
        self, page_images: List[str], questions: List[Question]
    ) -> List[Answer]:
        """Extract handwritten answers from answer sheet images."""
        ...

    @abstractmethod
    async def grade_answers(
        self, questions: List[Question], answers: List[Answer]
    ) -> List[Question]:
        """Optionally grade answers and return updated questions with marks/feedback."""
        ...
