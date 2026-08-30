"""
Document processing: convert uploaded PDF/image to list of base64-encoded page images.
"""
import base64
import io
import logging
from pathlib import Path
from typing import List, Tuple

from PIL import Image

logger = logging.getLogger(__name__)

SUPPORTED_IMAGE_TYPES = {".jpg", ".jpeg", ".png"}
SUPPORTED_PDF_TYPES = {".pdf"}


def file_to_page_images(file_bytes: bytes, filename: str) -> Tuple[List[str], int]:
    """
    Convert a PDF or image file to a list of base64 PNG page images.

    Returns:
        (list_of_base64_strings, page_count)
    """
    ext = Path(filename).suffix.lower()

    if ext in SUPPORTED_IMAGE_TYPES:
        return _image_to_pages(file_bytes)
    elif ext in SUPPORTED_PDF_TYPES:
        return _pdf_to_pages(file_bytes)
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def _image_to_pages(file_bytes: bytes) -> Tuple[List[str], int]:
    """Single image → single page."""
    img = Image.open(io.BytesIO(file_bytes))
    if img.mode != "RGB":
        img = img.convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return [b64], 1


def _pdf_to_pages(file_bytes: bytes) -> Tuple[List[str], int]:
    """PDF → one base64 PNG per page using PyMuPDF."""
    import fitz  # PyMuPDF

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    pages_b64: List[str] = []

    for page_num in range(len(doc)):
        page = doc[page_num]
        # Render at 150 DPI for a good quality/size balance
        mat = fitz.Matrix(150 / 72, 150 / 72)
        pix = page.get_pixmap(matrix=mat, colorspace=fitz.csRGB)
        img_bytes = pix.tobytes("png")
        b64 = base64.b64encode(img_bytes).decode("utf-8")
        pages_b64.append(b64)
        logger.debug(f"[Document] Rendered PDF page {page_num + 1}/{len(doc)}")

    doc.close()
    return pages_b64, len(pages_b64)


def validate_file(file_bytes: bytes, filename: str, max_mb: int = 20) -> None:
    """Raise ValueError for invalid files."""
    ext = Path(filename).suffix.lower()
    if ext not in (SUPPORTED_IMAGE_TYPES | SUPPORTED_PDF_TYPES):
        raise ValueError(f"Unsupported file type '{ext}'. Upload PDF, JPG, or PNG.")

    mb = len(file_bytes) / (1024 * 1024)
    if mb > max_mb:
        raise ValueError(f"File too large ({mb:.1f}MB). Maximum is {max_mb}MB.")

    if len(file_bytes) < 100:
        raise ValueError("File appears to be empty or corrupted.")
