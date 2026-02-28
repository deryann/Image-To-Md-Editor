# Image-To-Md-Editor — 專案指引

## 概述

Web 應用程式，用於編輯伺服器端圖片與對應 Markdown 檔案。左右雙面板佈局：左側圖片瀏覽/裁切、右側 Markdown 編輯/預覽。

## 技術棧

- **後端：** Python 3.11 + FastAPI + uv（套件管理）
- **前端：** 純 HTML / CSS / JavaScript（無框架、無打包工具）
- **OCR：** Google Cloud Vision API
- **資料儲存：** 檔案系統（無資料庫）

## 建置與執行

```bash
# 安裝依賴
uv sync

# 啟動開發伺服器
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

目前無測試套件（暫無 pytest / test 資料夾）。

## 架構

### 目錄結構

```
main.py                  # FastAPI 入口，掛載路由器與靜態檔案
routers/                 # RESTful API 路由器（每個資源一個檔案）
  images.py              # /api/images — 圖片 CRUD + 重新命名同步
  markdown.py            # /api/markdown — Markdown CRUD + 重新命名同步
  files.py               # /api/files — 檔案清單（含配對狀態）
  ocr.py                 # /api/ocr — Google Cloud Vision OCR
  embedded_images.py     # /api/embedded-images — 裁切圖片上傳
  search.py              # /api/search — 全文搜尋
static/                  # 前端 SPA
  index.html             # 單頁應用，hash 路由（#/editor、#/browser）
  js/                    # IIFE 模組（app, editor, cropper, browser, search, router, theme, toast, spinner, responsive）
  css/style.css          # CSS 變數 + Dark Mode + 響應式
data/
  images/                # 原始圖片
  mds/                   # Markdown 檔案
  mds/embedded_images/   # 裁切嵌入圖片（{base_name}_{8位hash}.jpg）
specs/                   # 功能規格書
```

### 檔案關聯模式（核心概念）

- `data/images/{base_name}.{ext}` ↔ `data/mds/{base_name}.md`
- 重新命名任一方時，**必須同步重新命名對方**
- 嵌入圖片路徑：`data/mds/embedded_images/{base_name}_{8位hash}.jpg`

### 後端慣例

- 每個路由器對應一個資源，使用 `APIRouter(prefix="/api/...", tags=[...])`
- 路徑常數定義在檔案頂部：`IMAGES_DIR = Path("data/images")`、`MDS_DIR = Path("data/mds")`
- 使用 Pydantic `BaseModel` 定義請求/回應模型
- 時間戳使用 ISO 格式 UTC
- Markdown 內容以 `PlainTextResponse` 回傳，編碼 UTF-8

### 前端慣例

- **模組模式：** IIFE + 閉包，透過 `return { init, ... }` 導出公開方法
- **元素快取：** 所有 DOM 引用統一在 `cacheElements()` 中以 `els.xxx` 快取
- **狀態管理：** 分散式——各模組以閉包變數維護自身狀態
- **API 呼叫：** `fetch()` + `async/await`，搭配 `Spinner.show()` / `Toast.show()` 回饋
- **初始化順序（app.js）：** Theme → Router → Editor → Cropper → Searcher → Browser → Responsive
- **CSS 變數：** `:root` 定義色彩系統，`[data-theme="dark"]` 覆寫
- **響應式：** 768px 以下堆疊 + 行動 Tab 切換

## 程式風格

### Python

- 遵循 PEP 8、PEP 257
- 函式包含型別提示與 docstring
- 遵循 SOLID、DRY、Clean Code 原則
- API 遵循 RESTful 設計

### JavaScript

- 函式與變數：camelCase
- 常數：UPPER_SNAKE_CASE
- 元素快取：`els.` 前綴
- CSS class：簡化 BEM（`panel-left`、`btn-primary`、`toast-enter`）

## 語言

- 所有 commit message、程式碼註解、UI 文字使用**正體中文**
