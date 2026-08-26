import os
from pypdf import PdfReader


def extract_text(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        reader = PdfReader(file_path)
        return "\n".join((page.extract_text() or "") for page in reader.pages)
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()


def get_page_image_info(file_path: str) -> tuple[int, list[int]]:
    """
    Returns (num_pages, image_page_indices) for a PDF. For non-PDFs, returns
    (1, []) since there's no page/image concept.
    """
    ext = os.path.splitext(file_path)[1].lower()
    if ext != ".pdf":
        return 1, []
    try:
        reader = PdfReader(file_path)
        image_pages = []
        for i, page in enumerate(reader.pages):
            try:
                if len(page.images) > 0:
                    image_pages.append(i)
            except Exception:
                continue
        return len(reader.pages), image_pages
    except Exception:
        return 1, []
