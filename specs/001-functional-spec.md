# SPEC-001：Functional Specification — Image-To-Md-Editor

> 版本：1.0
> 建立日期：2026-02-27
> 狀態：Draft

---

## 1. 系統總覽

Image-To-Md-Editor 是一套 Web 應用程式，讓使用者透過瀏覽器編輯伺服器端的圖片與對應的 Markdown 檔案。系統包含兩個主要頁面：**編輯器頁面**與**檔案瀏覽器頁面**。

### 1.1 技術架構

| 層級 | 技術 |
|------|------|
| 後端 | Python 3.11 + FastAPI |
| 套件管理 | uv |
| 前端 | 純 HTML / CSS / JavaScript |
| OCR | 中文 OCR Python 套件（待選型） |
| 資料儲存 | 檔案系統 |

### 1.2 資料夾結構

```
project-root/
├── data/
│   ├── images/                  # 原始圖片
│   │   └── {base_name}.{ext}
│   └── mds/                     # Markdown 檔案
│       ├── {base_name}.md
│       └── embedded_images/     # 編輯時嵌入的裁切圖片
│           └── {base_name}_{8位hash}.jpg
```

### 1.3 檔案關聯規則

| 項目 | 路徑格式 |
|------|----------|
| 原始圖片 | `data/images/{base_name}.{ext}` |
| 對應 Markdown | `data/mds/{base_name}.md` |
| 嵌入圖片 | `data/mds/embedded_images/{base_name}_{hash_8}.jpg` |

- `{base_name}` 為圖片與 Markdown 共用的名稱，用以建立一對一關聯
- `{hash_8}` 為 8 位 hash code，用於區分同一份文件中的不同裁切圖片

---

## 2. 頁面規格

### 2.1 頁面一覽

| 頁面 | 路徑（前端） | 說明 |
|------|-------------|------|
| 編輯器頁面 | `/` 或 `/editor` | 主要工作區，左右雙面板 |
| 檔案瀏覽器頁面 | `/browser` | 管理 data folder 內的檔案 |

---

## 3. 編輯器頁面（Editor Page）

### 3.1 版面配置

左右對開雙面板（Split Panel），預設各佔 50% 寬度。

### 3.2 左面板 — 圖片瀏覽區

#### 3.2.1 頂部工具列

| 元件 | 說明 |
|------|------|
| 檔名文字 | 顯示目前圖片的檔案名稱 |
| `<` 上一張按鈕 | 切換至上一張圖片（依檔名排序） |
| `>` 下一張按鈕 | 切換至下一張圖片（依檔名排序） |
| `...` 更多選單 | 保留擴充用途 |

#### 3.2.2 圖片預覽區

- 顯示目前選擇的圖片，支援縮放適配容器
- **框選裁切功能**：使用者可在圖片上拖曳框選區域
- 框選後按 `Ctrl+C`：將選取區域的圖片內容放入剪貼簿

#### 3.2.3 行為規格

| 操作 | 行為 |
|------|------|
| 點擊 `>` | 載入下一張圖片，右面板同步載入對應 `.md` |
| 點擊 `<` | 載入上一張圖片，右面板同步載入對應 `.md` |
| 拖曳框選 + `Ctrl+C` | 裁切選取區域，將圖片存入剪貼簿 |
| 切換圖片時有未儲存內容 | 應提示使用者是否儲存 |

### 3.3 右面板 — Markdown 編輯區

#### 3.3.1 頂部工具列

| 元件 | 說明 |
|------|------|
| 檔名文字 | 顯示目前 `.md` 檔的檔案名稱 |
| 💾 儲存按鈕 | 將編輯內容寫回伺服器（快捷鍵 `Ctrl+S`） |
| 🔍 OCR 按鈕 | 「Attach Image 文字辨識的結果」— 對左側圖片執行 OCR，結果附加到編輯區 |
| 👁 Preview 按鈕 | Toggle 切換 Markdown 預覽模式 |

#### 3.3.2 編輯區域

- **編輯模式**：`<textarea>` 用於直接編輯 Markdown 原始碼
- **預覽模式**：渲染後的 Markdown HTML，支援 Mermaid 圖表渲染
- 兩種模式透過 Preview 按鈕 Toggle 切換

#### 3.3.3 行為規格

| 操作 | 行為 |
|------|------|
| `Ctrl+S` | 儲存目前 Markdown 內容至伺服器 |
| `Ctrl+V`（剪貼簿有圖片） | 1. 將圖片儲存至 `mds/embedded_images/{base_name}_{hash_8}.jpg` <br> 2. 在游標位置插入 `![image](./embedded_images/{base_name}_{hash_8}.jpg)` |
| 點擊 OCR 按鈕 | 對左側目前圖片執行 OCR，將辨識文字附加至 textarea 末端 |
| 點擊 Preview 按鈕 | Toggle 編輯/預覽模式 |

### 3.4 圖片裁切→貼上流程（核心流程）

```
使用者在左面板拖曳框選
       │
       ▼
按下 Ctrl+C → 裁切圖片存入瀏覽器剪貼簿
       │
       ▼
在右面板 textarea 按下 Ctrl+V
       │
       ▼
前端將圖片 blob 傳送至後端 API
       │
       ▼
後端儲存至 mds/embedded_images/{base_name}_{hash_8}.jpg
       │
       ▼
後端回傳檔案路徑
       │
       ▼
前端在 textarea 游標位置插入 ![image](./embedded_images/{base_name}_{hash_8}.jpg)
```

---

## 4. 檔案瀏覽器頁面（Browser Page）

### 4.1 版面配置

單一清單檢視，列出 `data/` 資料夾內的所有檔案。

### 4.2 檔案列表

每一列顯示：

| 欄位 | 說明 |
|------|------|
| 檔案名稱 | 顯示檔名 |
| 檔案類型 | 圖片 / Markdown |
| 操作按鈕 | 編輯、重新命名、刪除 |

### 4.3 功能規格

| 功能 | 說明 |
|------|------|
| 上傳圖片 | 上傳新圖片至 `data/images/`，若無對應 `.md` 則自動建立 `data/mds/{base_name}.md`，內容預設為 `![image](../images/{base_name}.{ext})` |
| 刪除檔案 | 刪除選定檔案，需二次確認 |
| 重新命名 | 重新命名檔案，若為圖片應同步重新命名對應 `.md`（反之亦然） |
| 編輯 | 導航至編輯器頁面，載入對應的圖片與 Markdown |

---

## 5. 後端 API 規格

### 5.1 圖片相關

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/images` | 取得圖片清單 |
| GET | `/api/images/{filename}` | 取得單張圖片 |
| POST | `/api/images/upload` | 上傳圖片 |
| DELETE | `/api/images/{filename}` | 刪除圖片 |
| PUT | `/api/images/{filename}/rename` | 重新命名圖片 |

### 5.2 Markdown 相關

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/markdown/{filename}` | 取得 Markdown 內容 |
| PUT | `/api/markdown/{filename}` | 儲存 Markdown 內容 |
| DELETE | `/api/markdown/{filename}` | 刪除 Markdown 檔案 |
| PUT | `/api/markdown/{filename}/rename` | 重新命名 Markdown 檔案 |

### 5.3 嵌入圖片

| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | `/api/embedded-images` | 儲存裁切/貼上的圖片，回傳檔案路徑 |

### 5.4 OCR

| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | `/api/ocr` | 對指定圖片執行 OCR，回傳辨識文字 |

### 5.5 檔案瀏覽

| Method | Endpoint | 說明 |
|--------|----------|------|
| GET | `/api/files` | 取得 data 資料夾內的檔案清單（含 images 與 mds） |

---

## 6. 快捷鍵總覽

| 快捷鍵 | 情境 | 功能 |
|--------|------|------|
| `Ctrl+S` | 編輯器頁面 | 儲存 Markdown |
| `Ctrl+C` | 左面板圖片框選後 | 複製裁切區域至剪貼簿 |
| `Ctrl+V` | 右面板 textarea | 貼上圖片並自動嵌入 |

---

## 7. 非功能需求

| 項目 | 規格 |
|------|------|
| 程式碼風格 | 遵循 SOLID、DRY、Clean Code 原則 |
| API 設計 | 遵循 RESTful 設計原則 |
| 前端 | 純 HTML/CSS/JS，不使用前端框架 |
| OCR | 需支援中文辨識 |
