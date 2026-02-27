from pathlib import Path

from fastapi import APIRouter, Form, HTTPException, UploadFile

from google.cloud import vision

router = APIRouter(prefix="/api/ocr", tags=["ocr"])

IMAGES_DIR = Path("data/images")


@router.post("")
async def ocr_image(
    filename: str | None = Form(default=None),
    file: UploadFile | None = None,
):
    """對圖片執行中文 OCR 文字辨識（Google Vision API document_text_detection）"""
    if filename:
        path = IMAGES_DIR / filename
        if not path.is_file():
            raise HTTPException(status_code=404, detail="圖片不存在")
        image_bytes = path.read_bytes()
    elif file:
        image_bytes = await file.read()
    else:
        raise HTTPException(status_code=400, detail="請提供 filename 或 file 參數")

    try:
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=image_bytes)
        response = client.document_text_detection(image=image)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Google Vision API 錯誤：{e}")

    if response.error.message:
        raise HTTPException(
            status_code=500,
            detail=f"Google Vision API 錯誤：{response.error.message}",
        )

    text = response.full_text_annotation.text if response.full_text_annotation else ""
    return {"text": text}
