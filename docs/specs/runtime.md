# 執行模式與部署

React 頁面透過同來源的 `/api` 呼叫 FastAPI 的 JSON API。API 提供公司、聯絡人、商機與活動的讀寫，以及看板、儀表板彙整及全站搜尋。後端使用 SQLAlchemy Core，並驗證欄位、外鍵與階段規則。失敗時前端顯示可採取行動的訊息。[技術堆疊](../TECH_STACK.md) · [登入與存取](auth.md)

## 正式模式

- Supabase 提供帳密登入及共用的 Postgres 資料庫，正式模式需要網路。本機正式模式以 Git 忽略的 `.env` 設定 `DATABASE_URL`、`SUPABASE_URL` 與 `SUPABASE_PUBLISHABLE_KEY`。瀏覽器取得的公開設定只有 Supabase Project URL 與 publishable key，`DATABASE_URL` 留在後端。
- Render 使用免費方案的單一 Web Service，從 `onrender.com` 網址經由 HTTPS 提供服務。FastAPI 同時提供建置後的前端與 API，啟動時先執行資料庫 migrations。以 `render.yaml` 宣告服務與所需環境變數名稱，變數實際值在 Render 設定。本機可透過相同的正式啟動流程執行建置後的應用程式。
- Render 區域為 singapore，鄰近 Supabase 的新加坡資料庫。團隊時區為 Asia/Taipei，透過 `TZ` 設定部署環境的日期計算。CRM 資料表、初始化標記和 Alembic 版本表都啟用 RLS，並限制公開資料 API 的存取。

## 本機開發與測試

- `npm run dev` 同時啟動前後端，使用本機 SQLite、範例資料與虛構使用者。SQLite 預設存於 `data/accountable.sqlite3`，也可用 `ACCOUNTABLE_DB_PATH` 指定其他位置，路徑須在前端與相依套件目錄之外。
- 開發服務只監聽本機回送介面。字型與資源由本機提供，檔案服務限於前端與相依套件目錄。API 只接受本機主機名稱，並拒絕瀏覽器的跨來源請求。
- 開發模式、自動化測試與 `ui-check` 使用虛構使用者與本機資料，即使工作目錄已設定正式憑證也能離線執行。測試各自使用獨立的 SQLite 資料庫，測試寫入限於該資料庫。CI 使用同一套離線測試資料，無須 Supabase 憑證。前後端每個單元測試案例在本機均須在一秒內完成。
- `npm run seed` 會清除目前選定的本機 SQLite 資料庫內容並恢復範例資料。安裝、啟動與重設步驟記錄在[專案進度](../STATUS.md#在本機執行)。

## 範例資料

第一次啟動並建立新資料庫時，以虛構的公司、人物和業務情境初始化。內容涵蓋多個產業、三種聯絡人狀態、六個商機階段、近幾個月的成交與失單、未來幾個月預計結案及已逾期的商機，並提供備註、通話、電子郵件及今日、逾期、即將到期和已完成的跟進範例。日期相對於初始化當天產生，操作人使用虛構使用者。正式模式也以範例資料初始化新資料庫。正常重啟沿用既有資料，包括使用者清空的列表。既有 SQLite 資料搬至 Supabase 屬於本版範圍之外。

[規格索引](../spec.md) · [看板移動 API](pipeline.md#看板移動-api) · [驗收條件](acceptance.md)
