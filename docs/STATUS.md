# 專案進度

## 2026-11-24｜第 10 步「自己檢查」完成

- Codex 在 Mac 執行 `UV_NO_CACHE=1 npm test`，Vitest 6 項、pytest 21 項、Chrome Playwright 9 項全數通過，共 36 項。
- 用獨立的暫存 SQLite 啟動 MVP，在 Chrome 操作五個功能區塊並檢視截圖。確認刪除提示符合實際的關聯變更、重新整理及重啟後保留看板順序、`npm run seed` 恢復範例資料。畫面顯示繁體中文、新臺幣、折線圖、長條圖及六階段統計，1024 px 視窗可在看板區內水平捲動。
- 驗證跟進在今天、第七天和第八天正確分組，完成後移出待辦並保留於時間軸。`NT$100,000` 的商機從提案的 40% 拖到議價後採用 75%，預期營收增加 `NT$35,000`。標為成交後，本月成交金額增加 `NT$100,000`。
- 驗證時以離線模式執行 npm 和 uv，並在 Chrome 封鎖本機服務以外的請求。瀏覽器外部請求及主控台錯誤皆為 0。[驗收條件](spec.md#驗收條件)
- 使用者已看過並確認，第 10 步完成。下一步是建立 `docs/REVIEW.md`。[Day 3 第 11 步](../notes/week1day3-claude-code.html#step-11)

## 2026-11-23｜MVP 與設計稿比對

- 已用 Playwright 在 Chrome 比對「A · 跟進工作台」與 MVP。兩邊都採設計稿的 2026-11-23 和同一組商機、活動及跟進資料，MVP 使用獨立的暫存 SQLite。
- 已對齊儀表板的摘要數字、月份範圍、折線底色及長條標籤。看板已對齊欄距、卡片尺寸與內容排列。1024 px 視窗仍可在看板區內橫向捲動，Chrome 主控台無錯誤。
- 修正後 `npm run build` 通過，`npm test` 仍通過全部 36 項測試。下一步是親自操作 MVP 並對照成功標準。[Day 3 第 10 步](../notes/week1day3-claude-code.html#step-10)

| 視窗尺寸 | 儀表板 | 商機看板 |
| --- | --- | --- |
| 1440 × 900 | [並排截圖](screenshots/day3/dashboard-1440x900.png) | [並排截圖](screenshots/day3/pipeline-1440x900.png) |
| 1280 × 720 | [並排截圖](screenshots/day3/dashboard-1280x720.png) | [並排截圖](screenshots/day3/pipeline-1280x720.png) |

## 2026-11-23｜測試指令驗證

- 已在 [AGENTS.md](../AGENTS.md#testing) 記錄從 repo 根目錄執行 `npm test`、測試順序與暫存資料庫的設定。
- 在 Mac 上重新執行 `npm test`，結果為 Vitest 6 項、pytest 21 項、Chrome Playwright 9 項，共 36 項通過，結束碼為 0。
- 在暫存副本逐一模擬三套測試失敗。每次都確認 `npm test` 傳回非零結束碼，並在失敗的階段停止。
- 第 8 步已完成。[Day 3 第 8 步](../notes/week1day3-claude-code.html#step-8)

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
