from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

router = APIRouter(prefix="/api/markdown", tags=["markdown"])

MDS_DIR = Path("data/mds")
IMAGES_DIR = Path("data/images")

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg", ".tiff"}


class ContentRequest(BaseModel):
    content: str


class RenameRequest(BaseModel):
    new_name: str


@router.get("/{filename}", response_class=PlainTextResponse)
async def get_markdown(filename: str):
    """讀取指定 Markdown 檔案，回傳純文字"""
    path = MDS_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Markdown 檔案不存在")
    return PlainTextResponse(path.read_text(encoding="utf-8"))


@router.put("/{filename}")
async def update_markdown(filename: str, body: ContentRequest):
    """寫入 Markdown 檔案內容"""
    path = MDS_DIR / filename
    path.write_text(body.content, encoding="utf-8")
    return {"detail": f"已儲存 {filename}"}


@router.delete("/{filename}")
async def delete_markdown(filename: str):
    """刪除指定 Markdown 檔案"""
    path = MDS_DIR / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Markdown 檔案不存在")
    path.unlink()
    return {"detail": f"已刪除 {filename}"}


@router.put("/{filename}/rename")
async def rename_markdown(filename: str, body: RenameRequest):
    """重新命名 Markdown 檔案，並同步重新命名 data/images/ 下同 stem 的圖片"""
    src = MDS_DIR / filename
    if not src.is_file():
        raise HTTPException(status_code=404, detail="Markdown 檔案不存在")

    dest = MDS_DIR / body.new_name
    if dest.exists():
        raise HTTPException(status_code=409, detail="目標檔名已存在")

    # 重新命名 Markdown 檔案
    src.rename(dest)

    # 同步重新命名 data/images/ 下同 stem 的圖片
    old_stem = src.stem
    new_stem = dest.stem
    for img_path in IMAGES_DIR.iterdir():
        if img_path.is_file() and img_path.stem == old_stem and img_path.suffix.lower() in IMAGE_EXTENSIONS:
            img_path.rename(IMAGES_DIR / f"{new_stem}{img_path.suffix}")

    return {"detail": f"已重新命名 {filename} → {body.new_name}"}
