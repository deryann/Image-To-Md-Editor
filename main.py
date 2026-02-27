from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from routers.embedded_images import router as embedded_images_router
from routers.files import router as files_router
from routers.images import router as images_router
from routers.markdown import router as markdown_router

app = FastAPI(title="Image-To-Md-Editor")

# 註冊 API 路由
app.include_router(images_router)
app.include_router(markdown_router)
app.include_router(embedded_images_router)
app.include_router(files_router)

# 確保必要目錄存在
Path("data/images").mkdir(parents=True, exist_ok=True)
Path("data/mds/embedded_images").mkdir(parents=True, exist_ok=True)

# 掛載靜態檔案服務
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/data", StaticFiles(directory="data"), name="data")


@app.get("/")
async def root():
    return FileResponse("static/index.html")
