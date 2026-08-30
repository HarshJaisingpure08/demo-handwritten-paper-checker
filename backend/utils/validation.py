"""
Validation utilities for AI output.
"""
from typing import List
from models.schemas import AnswerRegion


def validate_regions(regions: List[AnswerRegion]) -> bool:
    """Return True if all regions have valid normalized coordinates."""
    for r in regions:
        if not (0.0 <= r.x <= 1.0 and 0.0 <= r.y <= 1.0):
            return False
        if not (0.0 < r.width <= 1.0 and 0.0 < r.height <= 1.0):
            return False
        if r.x + r.width > 1.05 or r.y + r.height > 1.05:  # 5% tolerance
            return False
        if r.page < 1:
            return False
    return True


def clamp_region(
    page: int, x: float, y: float, width: float, height: float, max_pages: int = 999
) -> AnswerRegion:
    """Clamp raw coordinates and return a validated AnswerRegion."""
    clamped_page = max(1, min(int(page), max_pages))
    clamped_x = max(0.0, min(0.99, float(x)))
    clamped_y = max(0.0, min(0.99, float(y)))
    clamped_w = max(0.01, min(1.0 - clamped_x, float(width)))
    clamped_h = max(0.01, min(1.0 - clamped_y, float(height)))
    return AnswerRegion(
        page=clamped_page,
        x=clamped_x,
        y=clamped_y,
        width=clamped_w,
        height=clamped_h,
    )
