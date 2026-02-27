from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/images", tags=["images"])

IMAGES_DIR = Path("data/images")
MDS_DIR = Path("data/mds")

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg", ".tiff"}


class RenameRequest(BaseModel):
    new_name: str


class ImageInfo(BaseModel):
    filename: str
    size: int
    modified_at: str


@router.get("", response_model=list[ImageInfo])
async def list_images():
    """掃描 data/images/ 目錄，回傳圖片清單"""
    images = []
    for path in sorted(IMAGES_DIR.iterdir()):
        if not path.is_file() or path.suffix.lower() not in IMAGE_EXTENSIONS:
            continue
        stat = path.stat()
        images.append(ImageInfo(
            filename=path.name,
            size=stat.st_size,
            modified_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
        ))
    return images


@router.get("/{filename}")
async def get_image(filename: str):
    """回傳指定圖片檔案"""
    path = IMAGES_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="圖片不存在")
    return FileResponse(path)


@router.post("/upload", response_model=ImageInfo, status_code=201)
async def upload_image(file: UploadFile):
    """上傳圖片至 data/images/"""
    dest = IMAGES_DIR / file.filename
    content = await file.read()
    dest.write_bytes(content)
    stat = dest.stat()
    return ImageInfo(
        filename=dest.name,
        size=stat.st_size,
        modified_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
    )


@router.delete("/{filename}")
async def delete_image(filename: str):
    """刪除指定圖片"""
    path = IMAGES_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="圖片不存在")
    path.unlink()
    return {"detail": f"已刪除 {filename}"}


@router.put("/{filename}/rename", response_model=ImageInfo)
async def rename_image(filename: str, body: RenameRequest):
    """重新命名圖片，並同步重新命名對應的 Markdown 檔案"""
    src = IMAGES_DIR / filename
    if not src.is_file():
        raise HTTPException(status_code=404, detail="圖片不存在")

    dest = IMAGES_DIR / body.new_name
    if dest.exists():
        raise HTTPException(status_code=409, detail="目標檔名已存在")

    # 重新命名圖片
    src.rename(dest)

    # 同步重新命名對應的 .md 檔
    old_md = MDS_DIR / f"{src.stem}.md"
    if old_md.is_file():
        new_md = MDS_DIR / f"{dest.stem}.md"
        old_md.rename(new_md)

    stat = dest.stat()
    return ImageInfo(
        filename=dest.name,
        size=stat.st_size,
        modified_at=datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
    )
