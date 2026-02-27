# Image-To-Md-Editor
開發一套 Web page 可以編輯 Server Side 的 Images 與相對應的 md 檔案


## 主要的開發工具

### 後端
- Python 3.11 
- FastAPI
- uv 套件管理
- 找尋可供 中文 OCR 的 python 套件套用 OCR 功能
- 預設資料路徑 Images 與 mds 資料夾在專案根目錄下，分別存放圖片與 md 檔案

### 前端
- html
- css
- JavaScript

### 程式碼撰寫規章

- 盡可能符合 SOLID 與 DRY 原則 不要過度重複的程式碼
- 盡可能符合 Clean Code 的原則，讓程式碼易讀、易維護
- 盡可能符合 RESTful API 的設計原則，讓 API 易於理解與使用



### 主要功能說明

#### 編輯版型
- 左右對開的 Panel 
    - 左邊 Panel 
        - 上方有 text 與 ...  > 下一張 < 上一張 的功能可以切換圖片 
        - 下方有 Image Preview 區域可以顯示目前選擇的圖片
    - 右邊 Panel 可以編輯 md 檔案內容，並提供儲存功能將修改後的內容寫回 Server Side 的 md 檔案
        - 上面 panel 
            - Text 說明現在 md 檔的檔名，
            - 有手動儲存按鈕 (Ctrl + S)  可以將修改後的內容寫回 Server Side 的 md 檔案
            - "Attach Image 文字辨識的結果" 按鈕，將圖片經過辨識，插入附加右側 md 編輯區的內容中
            - 具有 preview 按鈕，可以即時預覽Toggle md 檔案內容的渲染結果(必須包括 mermaid 等圖形的渲染)
        - 下方 panel
            - Textarea 可以編輯 md 檔案內容，並提供儲存功能將修改後的內容寫回 Server Side 的 md 檔案


- 檔案關聯說明    
    - Pattern: Images 與 mds 兩個資料夾裡面的檔案是對應的: images/{base_name}.{ext} <-> mds/{base_name}.md
    - 另外 mds/ 底下有子資料夾為 embedded_images/，裡面存放 md 檔案中使用到的圖片，這些圖片不會出現在 images/ 資料夾裡面。 命名規則 mds/embedded_images/{base_name}_{hash_code_8digits}.jpg
    
- 左邊Panel 的特殊功能，當在圖片 preview 區可以框選部分圖片內容，按下 Ctrl+C 可以把這張圖片的內容放置剪貼簿，在右側 Md 檔案的地方按下 Ctrl+V 可以把剛剛複製的圖片內容貼上，並且會自動把這張圖片存放在 mds/embedded_images/ 底下，命名規則 mds/embedded_images/{base_name}_{hash_code_8digits}.jpg，並且在 md 檔案中插入對應的 markdown 語法 ![image](./embedded_images/{base_name}_{hash_code_8digits}.jpg)

#### data folder 的瀏覽版型 
- 顯示 data folder 底下的檔案列表
- 每一個檔案可以具有 刪除檔案/重新命名/編輯的相關功能
- 可以上傳新的圖片檔案，若無 md 並且自動產生對應的 md 檔案，命名規則 mds/{base_name}.md，並且在 md 檔案中插入對應的 markdown 語法 ![image](../images/{base_name}.{ext})
