from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/files", tags=["files"])

IMAGES_DIR = Path("data/images")
MDS_DIR = Path("data/mds")

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg", ".tiff"}


class FileInfo(BaseModel):
    filename: str
    type: str
    has_pair: bool
    size: int
    modified_at: str


@router.get("", response_model=list[FileInfo])
async def list_files():
    """掃描 data/images/ 和 data/mds/，回傳完整檔案清單（含關聯狀態）"""
    # 收集所有 image stems 和 md stems 以便交叉比對
    image_stems: set[str] = set()
    md_stems: set[str] = set()

    image_files: list[Path] = []
    md_files: list[Path] = []

    if IMAGES_DIR.is_dir():
        for path in sorted(IMAGES_DIR.iterdir()):
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS:
                image_stems.add(path.stem)
                image_files.append(path)

    if MDS_DIR.is_dir():
        for path in sorted(MDS_DIR.iterdir()):
            if path.is_file() and path.suffix.lower() == ".md":
                md_stems.add(path.stem)
                md_files.append(path)

    results: list[FileInfo] = []

    for path in image_files:
        stat = path.stat()
        results.append(FileInfo(
            filename=path.name,
            type="image",
            has_pair=path.stem in md_stems,
            size=stat.st_size,
            modified_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
        ))

    for path in md_files:
        stat = path.stat()
        results.append(FileInfo(
            filename=path.name,
            type="markdown",
            has_pair=path.stem in image_stems,
            size=stat.st_size,
            modified_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
        ))

    return results
