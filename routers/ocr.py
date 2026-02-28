import os
from pathlib import Path

from fastapi import APIRouter, Form, HTTPException, UploadFile

from google.cloud import vision

router = APIRouter(prefix="/api/ocr", tags=["ocr"])

IMAGES_DIR = Path("data/images")


def _check_credentials() -> str | None:
    """檢查 Google Cloud 憑證設定，回傳錯誤訊息或 None。"""
    cred_path = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
    if not cred_path:
        return "未設定環境變數 GOOGLE_APPLICATION_CREDENTIALS"
    if not Path(cred_path).is_file():
        return (
            f"GOOGLE_APPLICATION_CREDENTIALS 指向的檔案不存在："
            f"{cred_path}"
        )
    return None


@router.get("/status")
async def ocr_status():
    """回傳 OCR 服務是否可用。"""
    error = _check_credentials()
    return {"available": error is None, "message": error or ""}


@router.post("")
async def ocr_image(
    filename: str | None = Form(default=None),
    file: UploadFile | None = None,
):
    """對圖片執行中文 OCR 文字辨識（Google Vision API document_text_detection）"""
    cred_error = _check_credentials()
    if cred_error:
        raise HTTPException(status_code=503, detail=cred_error)

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
