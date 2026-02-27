import hashlib
from pathlib import Path

from fastapi import APIRouter, UploadFile
from pydantic import BaseModel

router = APIRouter(prefix="/api/embedded-images", tags=["embedded-images"])

EMBEDDED_DIR = Path("data/mds/embedded_images")


class EmbeddedImageResponse(BaseModel):
    path: str


@router.post("", response_model=EmbeddedImageResponse, status_code=201)
async def create_embedded_image(file: UploadFile, base_name: str):
    """儲存裁切圖片至 embedded_images 目錄"""
    content = await file.read()
    hash_8 = hashlib.md5(content).hexdigest()[:8]
    filename = f"{base_name}_{hash_8}.jpg"
    dest = EMBEDDED_DIR / filename
    dest.write_bytes(content)
    return EmbeddedImageResponse(path=f"./embedded_images/{filename}")
