"""批次 OCR 腳本：使用 Google Cloud Vision API 對資料夾中的圖片進行文字辨識，並輸出為 .md 檔案。"""

import argparse
import sys
from pathlib import Path

from google.cloud import vision

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}


def find_images(input_dir: Path) -> list[Path]:
    """掃描資料夾中所有支援的圖片檔案。"""
    return sorted(
        p for p in input_dir.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    )


def ocr_image(client: vision.ImageAnnotatorClient, image_path: Path) -> str:
    """對單張圖片執行 OCR，回傳辨識文字。"""
    image_bytes = image_path.read_bytes()
    image = vision.Image(content=image_bytes)
    response = client.document_text_detection(image=image)

    if response.error.message:
        raise RuntimeError(f"Vision API 錯誤：{response.error.message}")

    return response.full_text_annotation.text if response.full_text_annotation else ""


def main():
    parser = argparse.ArgumentParser(description="批次 OCR：使用 Google Cloud Vision API 辨識圖片文字並輸出 Markdown 檔案")
    parser.add_argument("-i", "--input", required=True, help="輸入圖片資料夾路徑")
    parser.add_argument("-o", "--output", required=True, help="輸出 Markdown 資料夾路徑")
    args = parser.parse_args()

    input_dir = Path(args.input)
    output_dir = Path(args.output)

    if not input_dir.is_dir():
        print(f"錯誤：輸入資料夾不存在：{input_dir}", file=sys.stderr)
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    images = find_images(input_dir)
    if not images:
        print("輸入資料夾中沒有找到圖片檔案。")
        return

    print(f"找到 {len(images)} 張圖片，開始處理...\n")

    client = vision.ImageAnnotatorClient()
    success_count = 0
    fail_count = 0

    for idx, image_path in enumerate(images, 1):
        md_path = output_dir / f"{image_path.stem}.md"
        print(f"[{idx}/{len(images)}] {image_path.name}", end=" ... ")

        try:
            text = ocr_image(client, image_path)
            md_path.write_text(text, encoding="utf-8")
            print(f"完成 → {md_path.name}")
            success_count += 1
        except Exception as e:
            print(f"失敗：{e}")
            fail_count += 1

    print(f"\n處理完成：成功 {success_count} 筆，失敗 {fail_count} 筆")
    print(f"輸出資料夾：{output_dir.resolve()}")


if __name__ == "__main__":
    main()
