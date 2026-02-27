from pathlib import Path

from fastapi import APIRouter, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/search", tags=["search"])

MDS_DIR = Path("data/mds")
IMAGES_DIR = Path("data/images")

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg", ".tiff"}


class SearchMatch(BaseModel):
    filename: str
    image_filename: str | None
    line: int
    column: int
    context: str


class SearchResponse(BaseModel):
    query: str
    results: list[SearchMatch]
    total: int


def _find_image_for_stem(stem: str) -> str | None:
    """在 data/images/ 中尋找同 stem 的圖檔"""
    for ext in IMAGE_EXTENSIONS:
        candidate = IMAGES_DIR / f"{stem}{ext}"
        if candidate.is_file():
            return candidate.name
    return None


@router.get("", response_model=SearchResponse)
async def search_markdown(q: str = Query(..., min_length=1)):
    """不區分大小寫搜尋所有 Markdown 檔案內容"""
    query_lower = q.lower()
    results: list[SearchMatch] = []

    md_files = sorted(MDS_DIR.glob("*.md"))
    for md_path in md_files:
        stem = md_path.stem
        image_filename = _find_image_for_stem(stem)

        try:
            content = md_path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue

        for line_num, line_text in enumerate(content.splitlines(), start=1):
            line_lower = line_text.lower()
            start = 0
            while True:
                col = line_lower.find(query_lower, start)
                if col == -1:
                    break
                results.append(SearchMatch(
                    filename=md_path.name,
                    image_filename=image_filename,
                    line=line_num,
                    column=col,
                    context=line_text,
                ))
                start = col + 1

    return SearchResponse(query=q, results=results, total=len(results))
