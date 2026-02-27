# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Image-To-Md-Editor：一套 Web 應用程式，用於編輯 Server Side 的圖片與對應的 Markdown 檔案。左右雙面板佈局——左側為圖片瀏覽/裁切，右側為 Markdown 編輯/預覽。

## Tech Stack

- **後端：** Python 3.11 + FastAPI
- **前端：** 純 HTML / CSS / JavaScript（無框架）
- **資料儲存：** 檔案系統，以 `data/images/` 和 `data/mds/` 為主要資料路徑

## Architecture

### 檔案關聯模式
- `data/images/{base_name}.{ext}` ↔ `data/mds/{base_name}.md`
- 嵌入圖片：`data/mds/embedded_images/{base_name}_{8位hash}.jpg`

### 前端頁面
1. **編輯版型** — 左右對開 Panel，左側圖片瀏覽與裁切，右側 Markdown 編輯器（含預覽、Mermaid 渲染、儲存）
2. **Data Folder 瀏覽版型** — 檔案列表管理（上傳、刪除、重新命名、編輯）

### 後端 API
FastAPI 負責圖片與 Markdown 檔案的 CRUD 操作，以及圖片文字辨識功能。

## Language

- 所有 commit message、註解、UI 文字使用正體中文
