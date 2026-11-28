# 多人成員登入、全站搜尋與使用者選單實作計畫

依已確認的 [變更意圖](intent.md) 與 [產品規格](../../spec.md) 執行。先完成登入與資料庫，再完成全站搜尋及使用者選單。各階段交付前先驗證對應的 Proof。

## Files that change

每個檔案由表中所屬階段的負責人維護。階段一的負責人也負責整合共用入口，將後兩階段交付的元件接到 `App.tsx`，並將搜尋路由掛在 `backend/main.py` 的受保護路由下。

### 階段一 · 登入與資料庫

| 檔案 | 用途 |
| --- | --- |
| `backend/main.py`、`backend/config.py`（新增）、`backend/auth.py`（新增） | 選擇執行模式，設置公開健康檢查與登入入口、CRM API 驗證及正式靜態檔案入口。 |
| `backend/db.py`、`backend/schema.py`、`backend/examples.py`、`backend/seed.py` | 建立 SQLite 和 Postgres 連線、保留整數分精度、初始化範例資料、限制重設指令只操作本機 SQLite。 |
| `alembic.ini`、`migrations/env.py`、`migrations/versions/0001_crm.py`、`migrations/versions/0002_record_actors.py`（新增） | 將現有結構和操作人欄位寫成版本化 migration，處理既有 SQLite、Postgres 新庫與 CRM 資料表的 RLS。 |
| `migrations/versions/0003_protect_migration_version.py`、`lefthook.yml` | 驗收及審查補強，保護 Alembic 版本表並將 migrations 納入提交前檢查。 |
| `backend/api/records.py`、`backend/api/activities.py`、`backend/api/views.py`、`backend/services/records.py`、`backend/services/activities.py`、`backend/services/deals.py` | 沿用讀寫與交易入口，從驗證後的身分記錄操作人。讓詳情和時間軸回傳新增者，並處理拖放、跟進完成、關聯解除與系統活動。 |
| `pyproject.toml`、`uv.lock`、`package.json`、`render.yaml`（新增）、`docs/TECH_STACK.md`、`docs/STATUS.md` | 鎖定後端依賴、讓本機開發與正式模式使用各自的入口、宣告 Render 建置與啟動方式，以及記錄可用指令。 |
| `frontend/src/App.tsx`、`frontend/src/api.ts`、`frontend/src/auth.ts`（新增）、`frontend/src/pages/SignIn.tsx`（新增）、`frontend/src/styles.css` | 保護頁面與管理登入狀態，統一附加 Bearer 權杖及處理失效狀態，在共用頁首預留搜尋、帳號操作區域。 |
| `frontend/src/domain.ts`、`frontend/src/pages/RecordDetail.tsx`、`frontend/src/components/Timeline.tsx` | 定義新增者的回應型別，並在紀錄詳情與活動顯示新增者的完整 Email。 |
| `backend/tests/conftest.py`、`backend/tests/test_api.py`、`backend/tests/test_database.py`、`backend/tests/test_auth.py`（新增）、`backend/tests/test_runtime.py`（新增） | 隔離測試設定，驗證模式、驗證邊界、操作人、migration 和正式服務路由。 |
| `frontend/src/domain.test.ts`、`frontend/test/app.test.tsx`、`frontend/test/fixtures.ts`、`frontend/test/pipeline.test.tsx`、`frontend/test/record-flows.test.tsx`、`frontend/test/auth.test.tsx`（新增） | 更新型別與登入測試資料，檢查登入路由、錯誤及新增者顯示，沿用原有 CRM 回歸測試。 |
| `playwright.config.ts`、`e2e/fixtures.ts`（新增）、`e2e/mvp.spec.ts`、`e2e/auth.spec.ts`（新增） | 沿用臨時 SQLite、健康檢查與 Playwright 服務管理，提供可選擇兩位虛構成員的登入 fixture，更新既有操作測試。 |

新增三項後端執行期相依套件。`psycopg[binary]` 供 SQLAlchemy Core 連到 Supabase Postgres。`alembic` 管理版本化 migration，讓既有 SQLite 能保存資料並升級。`httpx` 已用於後端測試，提升為執行期依賴，以可重用且有逾時限制的 HTTP client 向 Supabase Auth 驗證權杖。`@supabase/supabase-js` 已鎖定，沿用於瀏覽器端登入和工作階段管理。[SQLAlchemy 的 Psycopg 支援](https://docs.sqlalchemy.org/en/20/dialects/postgresql.html#module-sqlalchemy.dialects.postgresql.psycopg) · [Alembic 的 SQLite migrations](https://alembic.sqlalchemy.org/en/latest/batch.html) · [Supabase Auth 取得已驗證使用者](https://supabase.com/docs/reference/javascript/auth-getuser)

### 階段二 · 全站搜尋

| 檔案 | 用途 |
| --- | --- |
| `backend/api/search.py`、`backend/services/search.py`（皆新增） | 定義搜尋 API 和結果型別，跨三類紀錄查名稱或姓名，沿用階段一的 API 驗證。 |
| `frontend/src/components/GlobalSearch.tsx`、`frontend/src/components/global-search.css`（皆新增） | 提供共用頁首的搜尋欄、結果、載入、空白、無結果和失敗狀態，沿用 API client 與既有詳情路由。 |
| `backend/tests/test_search.py`、`frontend/test/global-search.test.tsx`、`e2e/search.spec.ts`（皆新增） | 驗證比對規則、權限、快速輸入後的結果、鍵盤操作和各類型結果連結。 |

### 階段三 · 使用者選單

| 檔案 | 用途 |
| --- | --- |
| `frontend/src/components/UserMenu.tsx`、`frontend/src/components/user-menu.css`（皆新增） | 顯示 Email 縮寫、三種主題與登出，透過共用入口接收已驗證的帳號及登出函式。 |
| `frontend/index.html`、`frontend/src/theme.ts`、`frontend/src/main.tsx` | 由文件首屏到 React 維持同一套主題偏好，在跟隨系統時訂閱裝置設定變更。 |
| `frontend/src/theme.test.ts`、`frontend/test/user-menu.test.tsx`（新增）、`e2e/dark-mode.spec.ts`、`e2e/user-menu.spec.ts`（新增） | 驗證既有主題回歸、縮寫、選單可及性、三種主題、偏好儲存與登出。 |

## Order of work

### 1. 登入與資料庫

1. 先確立模式選擇。開發和測試固定使用 SQLite，測試模式優先並驗證暫存路徑。正式模式只在明確選擇時啟用，缺少必要設定即停止啟動。沿用本機回送介面與同來源 `/api`。把公開設定限定為 Supabase URL 與 publishable key，連線字串留在伺服器。
2. 建立資料庫升級路徑。以已知的舊版結構為基準驗證既有 SQLite 後升級，保留原有資料、識別碼、關聯及是否已初始化的狀態。新庫以既有範例資料初始化一次。兩種資料庫都儲存新增者與最後修改者的使用者 ID 及 Email，既有本機資料與範例使用虛構身分。Postgres 建表時在同一版 migration 啟用 RLS，撤銷 `anon` 與 `authenticated` 的 CRM 表存取，FastAPI 使用伺服器端的資料庫連線。金額欄位在 Postgres 使用 `BIGINT`，延續現有精確到分的行為。[Supabase RLS 與權限](https://supabase.com/docs/guides/database/postgres/row-level-security#enable-rls-and-set-the-grants)
3. 完成驗證及交易。正式 API 用請求的 Bearer 及 publishable key 呼叫該專案的 Supabase Auth 使用者端點，採用驗證結果中的身分。缺少、無效或逾期皆回 401。Auth 連線失敗時回可重試的服務錯誤，請求不得進入 CRM。開發與測試使用獨立的本機驗證來源及兩位虛構成員。四類紀錄由後端寫入操作人，於同一筆交易保留新增者並更新最後修改者，明確處理系統活動和解除關聯。
4. 接上登入畫面和已登入頁面。登入成功沿用原網址。失效或登出時清除畫面上的 CRM 資料，並讓舊請求的結果無法還原它。詳情和時間軸用完整 Email 標明新增者。共用頁首提供搜尋區域，以及目前帳號與登出動作給後續選單。階段一先用可操作的登出入口驗證流程，階段三接好選單後移入選單。
5. 完成正式啟動。Render 使用免費方案的單一 Python Web Service，建置時以 `npm ci` 和 `npm run build` 編譯前端，並以 `uv sync --locked --no-dev` 安裝後端執行期依賴。本機與 Render 執行同一個應用程式入口 `python -m backend.main --mode production`。本機透過 `uv run --env-file .env` 載入忽略追蹤的設定。正式啟動先升級資料庫，再由 FastAPI 提供建置後的前端和 API。Render 依 `PORT` 綁定，健康檢查沿用 `/api/health`。直接開啟紀錄網址時回前端入口，未知 API 路徑維持 API 404。Blueprint 以 `sync: false` 宣告三個 Supabase 相關環境變數，由 Render 設定實際值。[Render 原生執行環境](https://render.com/docs/native-runtimes) · [Render Web Service](https://render.com/docs/web-services) · [Render Blueprint 環境變數](https://render.com/docs/blueprint-spec#prompting-for-secret-values)

### 2. 全站搜尋

1. 在受保護的 `GET /api/search?q=…` 查公司名稱、聯絡人姓名及商機名稱，只傳回類型、ID 和顯示名稱。去除前後空白，統一英文字母大小寫，再以綁定參數執行片段比對。SQLite 與 Postgres 明確使用一致的比對語意，並將 `%`、`_` 等字元當文字處理。[SQLAlchemy 字面片段比對](https://docs.sqlalchemy.org/en/20/core/metadata.html#sqlalchemy.schema.Column.contains)
2. 建置搜尋元件。取消過時請求或忽略其結果，清空輸入後移除舊結果。使用可聚焦的結果連結和既有詳情路由，提供載入、無結果與失敗重試提示。保留現有列表搜尋。共用入口的負責人接上 API 和頁首後，執行本階段的端對端測試。

### 3. 使用者選單

1. 取 Email 中 `@` 之前帳號部分的前兩個字元產生縮寫，英文字母轉大寫。替選單按鈕保留可及名稱，支援鍵盤操作、選取狀態與關閉後的焦點復原。由共用入口的負責人接上階段一的登出流程，讓選單取代頁首的獨立主題切換及暫用登出入口。
2. 沿用 `accountable-theme` 瀏覽器儲存鍵及原有 `light`、`dark` 值，加入 `system`。首次或無法讀取偏好時用亮色，系統模式依 `prefers-color-scheme` 即時解析，固定主題保持原配色。更新 HTML 首屏及 React 初始化，登入頁、五個區塊和找不到頁面使用同一套配色。按 [品牌規範](../../../.claude/skills/brand/SKILL.md) 驗證登入、搜尋及選單的繁體中文、鍵盤、對比與窄桌機配置。

## Risks

| 風險 | 控制方式 |
| --- | --- |
| 測試設定繼承正式憑證、重設誤指向 Postgres | 開發、測試和正式啟動明確選模式。測試只接受本次暫存路徑，`npm run seed` 拒絕正式模式。以無憑證和有假正式設定兩種環境確認隔離並攔截對外請求。 |
| 以瀏覽器輸入的操作人冒用他人，或從公開資料 API 直接存取 | 以 Supabase Auth 回傳的身分決定操作人，限制公開設定欄位，錯誤及日誌不輸出權杖或連線字串。驗證所有 CRM 路由的授權和 Postgres RLS。 |
| Supabase 驗證成本及暫時中斷 | 服務端重用 HTTP client、設定明確逾時，不在驗證前取得資料庫交易。判別未登入和驗證服務暫時不可用，避免將暫時故障視作使用者登出。 |
| 既有 SQLite 被重填、正式重啟重複初始化、Postgres 精度或鎖定行為不同 | 使用版本化 migration 及初始化標記。測試升級 ID、關聯、空列表和大額金額。沿用單一寫入交易，在 Postgres 使用交易級 advisory lock 協調多連線的 CRM 寫入及初始化，避免看板重排、刪除影響重算與操作人更新互相覆蓋。[PostgreSQL 交易級 advisory lock](https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS) |
| 正式部署接收代理轉送或安靜地回落到本機模式 | 明確配置正式主機、同來源和代理信任範圍。驗證健康檢查、直接開啟 CRM 路徑、未知 API 404、靜態檔案限於建置目錄，以及設定或 migration 失敗時明確退出。 |
| 兩種資料庫的大小寫或萬用字元行為不同，搜尋慢回應覆蓋目前輸入 | 在 SQLAlchemy 查詢中定義英文字母及字面符號的比對規則，比對相同樣本。前端驗證快慢回應顛倒時只呈現目前查詢。 |
| 主題在首屏閃回亮色，選單和搜尋造成頁首擠壓 | 首屏和 React 共用相同的偏好解析規則，測試 JavaScript 專案主程式延遲載入的情況。按品牌規範在窄桌機檢查導覽、搜尋、帳號與鍵盤焦點。 |

## Proof

以下將 [驗收條件](../../specs/acceptance.md) 的第 11 至 16 項對應到測試及手動驗收。改動期間保留現有 CRM 回歸覆蓋。

| 階段 | 單元與 API 測試 | Playwright 端對端 |
| --- | --- | --- |
| 1 · 登入與資料庫（11、12、13、16） | pytest 覆蓋模式選擇與暫存路徑、正式設定缺失、健康檢查及前端路由、無權杖／無效／逾期的 401、認證服務逾時、既有 SQLite 升級與重啟、種子一次性、大額金額及寫入失敗回滾。用兩位成員驗證四類紀錄的新增者和最後修改者、拒絕由請求覆寫操作人、拖放及關聯解除的交易一致性。Vitest 驗證登入、失效和錯誤提示、原網址與新增者完整 Email。 | 用暫存 SQLite，從未登入的首頁及紀錄直連進入登入畫面。成員 A 建立紀錄，B 登入後看到共用資料並編輯，新增者仍顯示 A 的 Email。驗證重新整理、弱網失敗提示、登出後返回或直連仍須登入。原有 MVP 五區塊操作改以虛構帳號執行。 |
| 2 · 全站搜尋（14） | pytest 驗證未登入為 401、各類型查詢、部分文字、大小寫、前後空白、中文字和字面 `%`、`_`、同名不同類型、空白與無結果。Vitest 驗證狀態、鍵盤選取、結果連結、重試和快慢回應顛倒。 | 從共用頂欄查各類型紀錄，改大小寫後結果一致，鍵盤開啟正確詳情。核對清空、無結果、失敗再試，及列表原有搜尋與狀態篩選。 |
| 3 · 使用者選單（15，補齊 12 的選單登出） | Vitest 驗證縮寫、鍵盤開關、焦點、選中提示與登出動作。主題測試涵蓋舊儲存值、無效或禁用儲存、系統設定事件、切回固定模式以及監聽器清理。 | 用系統亮／暗色模擬，驗證首次亮色、三種模式、即時更新、跨頁與重開保存、失效或登出時登入畫面的配色。在窄桌機驗證操作，保留首屏與主題回歸案例，使用實際選單完成登出。 |

- 每階段先執行表中適用的 Vitest、pytest 或 Playwright 檔案，再執行 `npm run check:quick`。以測試報告的個別案例耗時確認單元測試在本機各低於一秒。階段整合後從 repo 根目錄執行完整 `npm run check`，有無正式設定皆以獨立的 SQLite、虛構使用者和本機資源通過。GitHub Actions 沿用快速檢查。
- 正式模式驗收另用經授權的 Supabase 環境。建置前端並用與 Render 相同的入口啟動，核對 migrations、範例初始化、帳密登入及共用資料讀取。用相同樣本核對 SQLite 與 Postgres 的搜尋結果。確認 CRM 表已啟用 RLS，並以匿名及成員身分驗證公開資料 API 無法直接存取 CRM 表。部署後從 Render 網址驗證登入及讀取。這些線上檢查對應課程的正式模式驗收與部署步驟。[執行模式與部署規格](../../specs/runtime.md)
