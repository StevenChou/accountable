本專案採用以下技術堆疊。

1. 前端位於 `frontend/`，使用 Node.js 26（目前的 LTS，24 以上也可使用）和 TypeScript，搭配 React 與 Vite。
2. 後端位於 `backend/`，使用 Python 3.12、uv 與 FastAPI，`pyproject.toml` 和 `uv.lock` 放在 repo 根目錄。

前端透過後端的 JSON API 取得資料。後端使用 SQLAlchemy Core 的查詢建構工具存取資料。正式模式使用 Supabase Postgres，本機開發與測試使用 SQLite。建立資料庫時會填入範例資料。

資料表格、圖表與可拖曳的商機看板等功能，優先採用廣泛使用且有良好支援的成熟函式庫。現有函式庫可妥善處理的功能，直接沿用。

正式模式採用 Supabase Auth，瀏覽器端使用 `@supabase/supabase-js` 登入。Render 部署單一 Web Service，由 FastAPI 提供建置後的前端及 API。[執行模式與部署規格](specs/runtime.md)

開發指令定義在 repo 根目錄的 `package.json`，`frontend/` 設為 npm workspace。macOS、Linux 與 Windows 都使用相同指令。

- `npm run dev` 同時啟動前端與後端。
- `npm test` 執行全部測試。任一測試失敗時，指令會回傳非零結束碼。
- `npm run seed` 將本機 SQLite 資料庫重設為範例資料。

應用程式的執行方式記錄在 `docs/STATUS.md`。`README.md` 是課程指南，請保留原文。

測試涵蓋以下項目。

1. 使用 Vitest 執行前端單元測試。
2. 使用 pytest 執行後端單元測試。
3. `e2e/` 的測試使用 Playwright Test（`@playwright/test`）和已安裝的 Google Chrome，在瀏覽器中執行整個應用程式的端對端測試。測試會自行啟動應用程式，直接執行 `npm test` 即可。

測試使用獨立的 SQLite 資料庫與虛構使用者，測試寫入僅限於該資料庫。
