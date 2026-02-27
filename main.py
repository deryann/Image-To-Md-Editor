from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from routers.images import router as images_router

app = FastAPI(title="Image-To-Md-Editor")

# 註冊 API 路由
app.include_router(images_router)

# 確保必要目錄存在
Path("data/images").mkdir(parents=True, exist_ok=True)
Path("data/mds/embedded_images").mkdir(parents=True, exist_ok=True)

# 掛載靜態檔案服務
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/data", StaticFiles(directory="data"), name="data")


@app.get("/")
async def root():
    return FileResponse("static/index.html")
