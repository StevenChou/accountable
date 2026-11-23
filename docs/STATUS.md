# 專案進度

## 2026-11-23｜MVP 建置

- 已依「A · 跟進工作台」建置儀表板、公司、聯絡人、商機與商機看板。商機拖放、結案、活動時間軸與待跟進由本機 SQLite 保存。首次啟動自動建立範例資料。
- `npm test` 在 Mac 通過 36 項測試，包括 6 項 Vitest、21 項 pytest 與 9 項 Chrome Playwright 測試。另驗證 `npm run build`、封鎖瀏覽器外部請求後的本機操作，以及 1024 px 視窗的看板橫向捲動。
- 第 7 步「建置 MVP」已完成。接下來是課程的 Test 階段。[Day 3 第 8 步](../notes/week1day3-claude-code.html#step-8)

### 在本機執行

在 repo 根目錄操作。準備 Node.js 24 以上、uv、Python 3.12 與 Google Chrome。首次安裝相依套件需要網路。

```sh
npm ci
uv sync --locked --python 3.12
npm run dev
```

在 Chrome 開啟 `http://127.0.0.1:5173/`。完成安裝後可離線執行 `npm run dev` 及使用應用程式。在同一個終端機按 Ctrl+C 停止前後端。

- `npm test` 執行三套測試。Playwright 會啟停自己的服務，並用暫存資料庫。
- `npm run seed` 會**清除目前選定的資料庫內容**，再填入初始範例。重設完成後重新整理瀏覽器。
- 日常資料預設存於 `data/accountable.sqlite3`。若需要獨立資料庫，可在啟動與重設時皆設定相同的 `ACCOUNTABLE_DB_PATH`。

## 2026-11-23｜MVP 實作計畫

- 已依「A · 跟進工作台」撰寫 [MVP 實作計畫](plan.md)，列出預計變動的檔案、八個建置階段、風險與對應規格的驗收方式。
- 已依審閱結果補齊六項實作與驗收細節，包括測試資料庫隔離、刪除筆數重驗、拖放回應遺失、直接新增已結案商機、讀取重試及跨欄統計。
- 第 6 步的實作計畫已確認並提交至 `b7f8915`。[Day 3 課程筆記](../notes/week1day3-claude-code.html#step-6)

## 2026-11-23｜MVP 設計規格

- 已完成 [MVP 設計規格](spec.md)，涵蓋五個功能區塊、資料關聯、商機與跟進規則，以及八項驗收條件。已確認刪除聯絡人或商機時，會先列出受影響的活動與未完成跟進筆數，再依使用者確認一併刪除。
- 已完成三份儀表板與商機看板設計稿及六張 Playwright 截圖。已選定 [A · 跟進工作台](mockups/1-follow-up.html)，讓使用者從首頁先處理待跟進事項。選擇、理由和版面已記入 [MVP 設計規格](spec.md#選定設計)。
- [Day 3 課程筆記](../notes/week1day3-claude-code.html) 已標記第 5 步完成。Design 文件已提交。

## 2026-11-21｜MVP 規劃

- 已完成使用者訪談並更新 [產品意圖](intent.md)。確認第一版給小型企業的老闆兼業務使用，保留五個功能區塊，介面採繁體中文，金額採新臺幣。
- 本機啟動與離線操作將在使用者的 Mac 上驗收，並保留 Mac、Linux 與 Windows 的相容目標。
- [Day 3 課程筆記](../notes/week1day3-claude-code.html) 已標記第 3 步完成，並同步更新驗收清單。
