# 專案進度

## 2026-11-27｜Day 5 第 9 步「寫出三階段的實作計畫」完成

- 實作依序分為登入與資料庫、全站搜尋、使用者選單。記錄各階段的檔案範圍與共用入口的整合責任，並為六項成功標準規劃單元測試、端對端測試與正式驗收。[多人版實作計畫](changes/multi-user/plan.md)
- 核對計畫四個章節、檔案分工與驗收對應。以 jsdom 驗證講義顯示完成 9／16 步且勾選可保存。`UV_NO_CACHE=1 npm run check:quick` 通過 53 項既有測試。下一步是[按計畫實作並執行測試](../notes/week1day5-claude-code.html#step-10)。

## 2026-11-27｜Day 5 第 8 步「讓規格描述變更後的產品」完成

- 依確認的多人共用 intent 更新產品摘要與區域規格，涵蓋頁面與 API 的登入保護、完整 Email 的新增者標示、頂欄搜尋與三種主題模式。[產品規格索引](spec.md) · [登入與存取](specs/auth.md)
- 記錄正式模式的 Supabase 和 Render 啟動條件、本機開發與測試的 SQLite 隔離要求，並將六項成功標準寫成第 11 至 16 項驗收情境。[執行模式與部署](specs/runtime.md) · [驗收條件](specs/acceptance.md)
- 核對規格差異與索引連結。以 jsdom 驗證講義顯示完成 8／16 步且可保存勾選。`UV_NO_CACHE=1 npm run check:quick` 通過 53 項測試。下一步是[寫出三階段的實作計畫](../notes/week1day5-claude-code.html#step-9)。

## 2026-11-27｜Day 5 第 7 步「把現有規格拆成索引與區域文件」完成

- 保留產品摘要與選定設計，把五個功能區塊、共用規則、架構與驗收拆成 11 份文件，由索引連入。[產品摘要與規格索引](spec.md)
- 更新專案指引、審查政策、撰寫標準和介面檢查子代理的閱讀方式，並修正講義與進度紀錄中的規格連結。[專案規則](../AGENTS.md) · [審查政策](REVIEW.md)
- 逐行比對確認原有規格內容及 10 項驗收條件完整保留，並驗證索引與搬移後的連結。用 jsdom 確認講義顯示完成 7／16 步且勾選可保存。`UV_NO_CACHE=1 npm run check:quick` 通過 53 項測試。下一步是[讓規格描述變更後的產品](../notes/week1day5-claude-code.html#step-8)。

## 2026-11-27｜Day 5 第 6 步「確認登入、搜尋與選單的 intent」完成

- 確認 Supabase 帳密登入、團隊共用資料、頂欄搜尋及使用者選單的目標、限制、範圍與六項成功標準。[多人共用變更意圖](changes/multi-user/intent.md)
- 使用者確認公司、聯絡人、商機與活動的新增者顯示完整 Email。首次主題沿用亮色，選單新增跟隨系統選項。
- 用 jsdom 驗證講義顯示完成 6／16 步、勾選保存和意圖文件連結。`UV_NO_CACHE=1 npm run check:quick` 通過 53 項測試。下一步是[把現有規格拆成索引與區域文件](../notes/week1day5-claude-code.html#step-7)。

## 2026-11-27｜Day 5 第 5 步「連接唯讀 Supabase MCP」完成

- Supabase MCP 設在 Claude Code 的本機範圍，限定 `accountable` 專案並啟用 `read_only=true`。使用者完成 OAuth 授權後，`claude mcp get supabase` 顯示已連線。
- 依需求在 [`.mcp.json`](../.mcp.json) 加上共用的 `project` scope，指向同一個唯讀 Supabase 專案。兩份設定名稱同為 `supabase`，Claude Code 會優先使用 `local` 設定。協作者使用 `project` 設定時各自完成 OAuth 授權。
- 用 jsdom 驗證講義顯示完成 5／16 步及勾選保存。`UV_NO_CACHE=1 npm run check:quick` 通過 53 項測試。下一步是[確認登入、搜尋與選單的 intent](../notes/week1day5-claude-code.html#step-6)。

## 2026-11-27｜Day 5 第 4 步「建立 multi-user 與 Supabase 專案」完成

- 從本機 `main` 建立 `multi-user`。在既有的 Supabase `accountable` 專案確認已有一位完成 Email 驗證的使用者。
- 使用者修正本機 `.env` 的變數名稱後，課程驗證腳本確認 Session pooler 可連線、Project URL 與資料庫屬於同一專案、Supabase Auth 接受 publishable key，以及自行註冊已關閉。`.env` 由 Git 忽略。
- 在 Chrome 桌面與手機尺寸驗證講義完成 4／16 步及勾選保存。`UV_NO_CACHE=1 npm run check` 通過 69 項測試。下一步是[連接唯讀 Supabase MCP](../notes/week1day5-claude-code.html#step-5)。

## 2026-11-27｜補充可重用的產品規格管理流程

- 在開發流程速查補上規格入口、區域規格、變更紀錄、程式與測試的用途，說明怎麼查閱、更新、拆分和審查規格。以商機階段的成交機率變更示範如何辨認跨功能影響。[產品規格怎麼組織與維護](../notes/project-development-flow.html#spec-structure)
- 將規格路徑、受影響區域、驗收條件及搬移規格的完成判準納入可複製的 Markdown 檢核表。頁首、Design 節點及 Day 5 第 7 步都連到完整說明。
- 在 Chrome 桌面與手機寬度驗證版面、鍵盤導覽、Markdown 複製與手動備援，以及 Day 5 勾選進度保存。`UV_NO_CACHE=1 npm run check` 通過全部 69 項測試。

## 2026-11-27｜開發文件繁體中文化

- 將 [開發防護機制的改善流程](IMPROVE.md) 與 [技術堆疊](TECH_STACK.md) 翻成繁體中文，保留原有步驟、技術版本與指令。

## 2026-11-27｜Day 5 第 3 步「接上快速 CI 並合併 subagents」完成（本機版）

- 建立 [CI workflow](../.github/workflows/ci.yml)。任何分支推送時先用 Gitleaks 掃描 Git 歷史，再用 Node.js 26、Python 3.12 和鎖定的相依套件執行 `npm run check:quick`。Playwright 由本機完整檢查執行。
- 本機 `actionlint` 與 Gitleaks 歷史掃描皆通過，`UV_NO_CACHE=1 npm run check:quick` 通過 53 項測試。以待合併提交的本機完整檢查作為快轉合併依據。
- `subagents` 合併至本機 `main`，已清理本機分支。fork 的 GitHub Actions 驗證待首次推送。講義標記為「完成（本機版）」。[Day 5 第 3 步](../notes/week1day5-claude-code.html#step-3)

## 2026-11-27｜Day 5 第 2 步「建立並試跑兩個子代理」完成

- 建立 `reviewer` 與 `ui-check` 的專案設定。在新開的 Claude Code session 中以 Haiku 委派，兩個子代理都以 Sonnet 執行。`reviewer` 的 hook 只允許唯讀 Git 查詢，已驗證可讀取提交及拒絕寫入、重導向和串接指令。
- 兩份子代理的描述和提示詞改用繁體中文，沿用原有的模型與工具權限設定。
- `reviewer` 依審查政策檢查 `b5cd061`，回報 0 項 Important 和 3 項文件可讀性建議，涉及 Proof 的出處、標準檢查指令及第 2 點的段落結構。
- `ui-check` 用 Playwright MCP 檢查亮色儀表板與商機看板，兩頁均無主控台錯誤或警告。截圖存於 Git 忽略的 `.playwright-mcp/day5-dashboard.png` 與 `.playwright-mcp/day5-pipeline.png`。補查確認近期活動的 10 筆資料皆可捲動查看。試跑服務已停止，暫存 SQLite 已清理。
- `UV_NO_CACHE=1 npm run check` 通過全部 69 項測試。在 Chrome 桌面與手機尺寸確認講義顯示完成 2／16 步，重新整理後保留手動勾選。下一步是[接上快速 CI 並合併 subagents](../notes/week1day5-claude-code.html#step-3)。

## 2026-11-27｜Day 5 第 1 步「確認 Day 4 起點並開分支」完成

- 確認工作區乾淨，且 `main`（`7c0ef09`）包含 Day 4 的深色模式及合併前修正。確認 `fork` 指向 `StevenChou/accountable`，並從自己的 `main` 建立及切換到 `subagents`。
- Gitleaks `8.30.1` 可用。`UV_NO_CACHE=1 npm run check` 通過 69 項測試，`UV_NO_CACHE=1 npm run check:quick` 通過 53 項測試。
- Chrome 在桌面與手機尺寸驗證講義顯示完成 1／16 步，並在重新整理後保留手動勾選。下一步是[建立並試跑兩個子代理](../notes/week1day5-claude-code.html#step-2)。

## 2026-11-27｜將 Day 5 融入專案開發流程

- 加入可複製的 Markdown 檢核表，以本機完整驗收為預設，並列出介面、外部服務、共用 CI 和正式部署適用時的完成判準。[Workflow 檢核表](../notes/project-development-flow.html#workflow-template)
- 在流程圖加入 Day 5 的規格拆分、分段實作、子代理檢查與正式啟動驗收。區分合併前的分支 CI、合併後的主分支 CI 與線上驗收，並連回 Day 5 操作步驟。
- Chrome 驗證桌面與手機版面、鍵盤操作、Markdown 複製與手動備援、本機連結與三種交付路徑。`UV_NO_CACHE=1 npm run check` 通過全部 69 項測試。

## 2026-11-27｜Week 1 Day 5 課程筆記

- 整理子代理、Supabase 登入、共用資料庫、搜尋、使用者選單及 Render 部署的 16 步操作流程，補上從 Day 4 本機版建立 GitHub Actions 的步驟。[Day 5 課程筆記](../notes/week1day5-claude-code.html)
- 沿用 Day 4 的桌面與手機目錄、提示詞與指令複製功能。Day 5 的完成判準從零開始，勾選進度由瀏覽器保存。
- Chrome 驗證桌面與手機版面、鍵盤操作、複製、頁內定位和重新整理後的進度保留。本機連結有效，`UV_NO_CACHE=1 npm run check` 通過全部 69 項測試。

## 2026-11-26｜專案開發流程速查更新

- 將本機完整檢查與 CI 納入同一個提交驗證節點，兩條路徑通過後都核對待合併提交。補上審查問題的重現條件、原計畫的 Proof 與回歸測試的關係。
- 以深色模式補充既有介面的規格差異、變更前畫面比對和合併後的試用觀察。[專案開發流程速查](../notes/project-development-flow.html)
- Chrome 驗證桌面與手機版面、鍵盤展開清單及文件連結。`UV_NO_CACHE=1 npm run check` 通過全部 69 項測試。

## 2026-11-26｜Day 4 第 16 步「試用兩種主題並記下想法」完成

- 從合併後的 `main`（`b5cd061`）以暫存 SQLite 啟動 App，在 1024 px 的 Chrome 視窗分別用亮色與深色操作。從儀表板進入陳思妤的時間軸，新增當日通話跟進，再到儀表板標記完成。兩筆皆從待辦移除，時間軸仍顯示「已完成」。
- 兩種模式都從看板開啟「採購系統第一期」並返回。工作流程中沒有站外請求，Chrome 主控台錯誤為 0。待辦連結定位與看板返回位置的兩項觀察已記入 [Ideas for later](#ideas-for-later)。
- [Day 4 課程筆記](../notes/week1day4-claude-code.html#progress) 顯示 15／16 步完成、1 步略過。

## 2026-11-26｜Day 4 第 15 步「改善 harness、等待 CI 並合併」完成（本機版）

- 回顧第 14 步的兩個驗收缺口。原有檢查是在主程式載入後確認主題，並在 1024 px 檢查導覽，因此漏掉延遲載入時的亮色閃現與更窄視窗的導覽換列。兩個情境都已納入 Playwright 回歸測試。[改善流程](IMPROVE.md)
- 更新改善流程，要求核對 Important 問題的實際觸發條件、原計畫的 Proof 與標準檢查納入的回歸測試。待合併提交 `b5cd061` 的 `UV_NO_CACHE=1 npm run check` 通過全部 69 項測試，其中 16 項是 Chrome 端對端測試。
- 已把 `dark-mode` 快轉合併到本機 `main`，並刪除已合併的本機分支。GitHub Actions 略過，以本機完整檢查作為合併依據。

## 2026-11-26｜Day 4 第 14 步「用獨立 session 審查分支」完成

- 兩個唯讀 session 依審查政策檢查 `dark-mode` 相對 `main` 的差異（`75a4444...653865a`）。撰寫標準審查確認截圖使用範例資料，並指出窄視窗導覽與儲存受限的規格落差。規格審查重現兩項 Important 問題。
- 已修正深色偏好重載時的亮色閃現。HTML 在主程式載入前套用偏好，並明訂瀏覽器禁止儲存時，切換仍在目前頁面生效。Playwright 驗證延遲主程式、無效偏好及拒絕存取的情境。
- 已修正較窄桌機視窗的導覽換列。以精簡按鈕標示目前模式，在 731、780、850 px 驗證五個導覽連結保持單列。
- 修正後 `UV_NO_CACHE=1 npm run check` 通過 69 項測試（Vitest 29、pytest 24、Chrome Playwright 16）。`npm run build` 通過。正式建置在延遲 JavaScript 時首幀即是深色，重新擷取的四張驗收截圖與第 13 步逐位元相同。
- 課程筆記顯示 13／16 步完成、1 步略過。下一步是[改善 harness、等待 CI 並合併](../notes/week1day4-claude-code.html#step-15)。

## 2026-11-26｜Day 4 第 13 步「跑完整檢查並留下四張截圖」完成

- `UV_NO_CACHE=1 npm run check` 通過 66 項測試。使用暫存 SQLite 與獨立 Chrome 設定檔走訪五個區塊、列表及詳情與「找不到頁面」，確認重新整理和重開保留主題，清除網站資料後回到亮色。
- 量測兩種主題中切換控制、圖表刻度與提示、逾期標示、對話框和錯誤訊息。代表性一般文字均達 4.5:1。1024 px 下可使用共用導覽、看板橫向捲動與鍵盤拖曳。
- 四張 Playwright 截圖以同一組範例資料和 1440 × 1000 視窗擷取。亮色與變更前的差異限於新增按鈕。[亮色儀表板](changes/dark-mode/dashboard-light.png) · [深色儀表板](changes/dark-mode/dashboard-dark.png) · [亮色商機看板](changes/dark-mode/pipeline-light.png) · [深色商機看板](changes/dark-mode/pipeline-dark.png)
- 課程筆記顯示 12／16 步完成、1 步略過。下一步是[用獨立 session 審查分支](../notes/week1day4-claude-code.html#step-14)。

## 2026-11-26｜Day 4 第 12 步「依 plan 實作並驗證各階段」完成

- 亮色為預設，頂端的深色模式按鈕可用滑鼠或鍵盤操作。五個功能區塊及「找不到頁面」共用切換入口。以獨立的 Chrome 測試設定檔驗證重新整理及重開瀏覽器後保留選擇，清除網站資料後回到亮色。
- 導覽、表單、對話框、訊息、圖表和商機看板共用亮色與深色色彩變數。亮色儀表板及看板的 1440 × 1000 畫面經像素比對，差異限於切換按鈕。Chrome 驗證 1024 px 寬度的導覽、看板內捲動及鍵盤拖曳外觀，並量測切換控制、深色對話框、表單和錯誤訊息的文字對比。
- `UV_NO_CACHE=1 npm run check` 通過 66 項測試（Vitest 29 項、pytest 24 項、Chrome Playwright 13 項）。`npm run build` 通過。
- 課程筆記顯示 11／16 步完成、1 步略過。下一步是[跑完整檢查並留下四張截圖](../notes/week1day4-claude-code.html#step-13)。

## 2026-11-26｜Day 4 第 11 步「寫分階段的實作計畫」完成

- 依已確認的 Intent 與產品規格，列出主題切換、共用介面、圖表與商機看板的實作順序。計畫涵蓋現有配色比對、瀏覽器偏好、文字對比與四張驗收截圖，並列出 Vitest 和 Playwright 測試。[深色模式實作計畫](changes/dark-mode/plan.md)
- 已逐項核對計畫與驗收條件。`UV_NO_CACHE=1 npm run check` 通過現有的 59 項測試。
- 課程筆記顯示 10／16 步完成、1 步略過。下一步是[依 plan 實作並驗證各階段](../notes/week1day4-claude-code.html#step-12)。

## 2026-11-26｜Day 4 第 10 步「讓 spec 描述變更後的產品」完成

- 依已確認的 Intent 和品牌規範，定義共用的主題切換、跨頁與瀏覽器偏好保存、深色配色及文字對比。驗收涵蓋「找不到頁面」、圖表、對話框、訊息與四張主題截圖。[產品規格](specs/interface.md#亮色與深色模式)
- 已核對規格差異與 Intent，`UV_NO_CACHE=1 npm run check` 通過現有的 59 項測試。
- 課程筆記顯示 9／16 步完成、1 步略過。下一步是[寫分階段的實作計畫](../notes/week1day4-claude-code.html#step-11)。

## 2026-11-26｜Day 4 第 9 步「開深色模式分支並確認 intent」完成

- 從已合入 harness 的 `main` 建立 `dark-mode`，並以繁體中文確認[深色模式變更意圖](changes/dark-mode/intent.md)。首次開啟預設亮色，同一瀏覽器重新整理或重開會保留選擇，清除網站資料後回到亮色。「找不到頁面」也沿用目前主題並提供切換入口。
- `UV_NO_CACHE=1 npm run check` 通過現有的 59 項測試，作為實作前的基線。
- 課程筆記顯示 8／16 步完成、1 步略過。下一步是[讓 spec 描述變更後的產品](../notes/week1day4-claude-code.html#step-10)。

## 2026-11-25｜Day 4 第 8 步「把改善步驟寫入 harness」完成

- 依講義原文建立 [docs/IMPROVE.md](IMPROVE.md)。[AGENTS.md](../AGENTS.md) 指定在 Deploy 階段修正審查發現後、合併前執行改善流程。
- 本機 `npm run check` 通過全部 59 項測試（Vitest 24 項、pytest 24 項、Chrome Playwright 11 項）。`harness` 已快轉合併回本機 `main`，並刪除已合併的本機分支。
- 課程筆記顯示 7／16 步完成、1 步略過。下一步是[開深色模式分支並確認 intent](../notes/week1day4-claude-code.html#step-9)。

## 2026-11-25｜Day 4 第 7 步「用假金鑰驗證兩層防護」完成（本機版）

- 在隔離的 `make-it-fail` 分支暫存含虛構金鑰的 `frontend/src/main.tsx`。pre-commit 的 Gitleaks 以 `generic-api-key` 規則阻擋提交，`HEAD` 維持原提交。
- 將測試檔移出暫存區後，保留工作區中的虛構金鑰再執行 `npm run check`。Gitleaks 在 `check:secrets` 步驟以同一規則攔截，測試尚未開始便結束。GitHub Actions 驗證已略過。
- 已清除測試註解與隔離的演練分支，`npm run check` 恢復通過 59 項測試。課程筆記顯示 6／16 步完成、1 步略過。下一步是[把改善步驟寫入 harness](../notes/week1day4-claude-code.html#step-8)。

## 2026-11-25｜Day 4 第 6 步「把完整檢查接到 GitHub Actions」已略過

- 本次以本機 `npm run check` 驗收。課程筆記顯示 5／16 步完成、1 步略過，下一步是第 7 步的本機秘密掃描演練。[Day 4 課程筆記](../notes/week1day4-claude-code.html#progress)
- 已在 Chrome 桌面與手機版驗證略過計數、下一步連結和勾選保存。本機 `npm run check` 通過全部 59 項測試。

## 2026-11-25｜Day 4 第 5 步「把檢查接到 Git 與 Claude Code」完成

- 已在本機安裝 Lefthook 的 pre-commit。在隔離的 repo 實際提交，確認 Prettier 與 Ruff 格式化並重新暫存要提交的檔案，未暫存的修改仍保留。另用 lint 錯誤、型別錯誤和虛構金鑰分別驗證提交會被攔下。提交時會略過測試。[Lefthook 設定](../lefthook.yml)
- 用實際的 Claude Code 2.1.325 CLI 搭配本機模擬模型回應，確認 Stop hook 在快速檢查通過時正常結束。失敗會回傳錯誤並攔下第一次停止。Claude 呼叫工具嘗試修正後，第二次停止可正常完成，快速檢查只執行一次。[Claude Code 設定](../.claude/settings.json)
- 在隔離的工作副本驗證，Claude Code 嘗試用 `Write` 或直接指向 `.env` 的 `Bash` 命令修改空白測試檔時都被拒絕，`.env.example` 可以寫入。`npm run check` 通過全部 59 項測試，課程筆記顯示 5／16 步完成。[Day 4 課程筆記](../notes/week1day4-claude-code.html#step-5)

## 2026-11-25｜Day 4 第 4 步「加入完整與快速檢查」完成

- 已建立 `npm run check`、`npm run check:quick` 和 `npm run format`。完整與快速檢查共用格式、lint、型別、機密掃描和單元測試，只有完整檢查會執行 Chrome 端對端測試。ESLint 與 Ruff 的函式循環複雜度上限均為 15。[專案指引](../AGENTS.md#測試)
- Gitleaks 掃描本機可見的 Git 歷史、暫存區，以及工作區裡已追蹤或未被 Git 忽略的檔案。已用隔離的暫存 repo 驗證被忽略的 `.env` 可通過，加入 Git 則會掃描，輸出會遮蔽偵測到的金鑰。
- 新增 17 項前端測試，涵蓋儀表板、看板、表單、刪除確認與活動時間軸。前端語句 89.68%、分支 84.09%、函式 84.35%、行 91.42%，後端語句 97.75%，均達到 80% 門檻。Vitest 與覆蓋率套件升至 5.1.1，安裝後 npm 回報 0 個已知漏洞。
- `npm run check` 通過全部 59 項測試，包括 Vitest 24 項、pytest 24 項和 Playwright 11 項。`npm run check:quick` 通過 48 項單元測試。修正後的看板拖放情境另重跑三次，全數通過。[Day 4 課程筆記](../notes/week1day4-claude-code.html#step-4)

## 2026-11-25｜Day 4 第 3 步「寫下自己的 coding standards」完成

- 依 Accountable 的現行做法整理六條繁體中文標準，涵蓋可讀性與變更範圍、規格與 API、型別、錯誤處理與資料保護、介面及測試。[程式撰寫標準](STANDARDS.md)
- [AGENTS.md](../AGENTS.md) 已連到標準。[審查政策](REVIEW.md) 要求對照標準，指出不符合的規則與程式位置。
- `UV_NO_CACHE=1 npm test` 通過全部 42 項測試。已用 Chrome 確認課程筆記顯示 3／16 步完成，下一步是[加入完整與快速檢查](../notes/week1day4-claude-code.html#step-4)。

## 2026-11-25｜Day 4 第 2 步「把 repo 整理成專案記憶」完成

- MVP 的規劃文件已歸檔至 `docs/changes/mvp/`。[產品意圖](changes/mvp/intent.md) · [實作計畫](changes/mvp/plan.md)
- [產品規格](spec.md) 收錄問題背景、目前五個功能區塊與業務規則，補齊刪除前重新確認、跨分頁編輯、拖放回應遺失，以及大額統計精度等現有行為。[AGENTS.md](../AGENTS.md) 規定先讀產品規格，再讀當前分支的變更文件。[審查政策](REVIEW.md) 要求指出規格未涵蓋的程式行為。
- 已將 [AGENTS.md](../AGENTS.md) 改為繁體中文，保留原有規則，並更新課程筆記與進度紀錄指向「測試」章節的連結。
- 已驗證歸檔文件與課程連結，以及從 Day 4 開始前的提交取出四份 Day 3 分享文件的指令。`UV_NO_CACHE=1 npm test` 通過全部 42 項測試。課程筆記顯示 2／16 步完成，下一步是[寫下自己的 coding standards](../notes/week1day4-claude-code.html#step-3)。

## 2026-11-25｜Day 4 第 1 步「準備環境與分支」完成

- 已從本機 `main`（`6b29445`，與 `fork/main` 同步）建立並切換至 `harness`。Homebrew 已安裝 gitleaks，`gitleaks version` 輸出 `8.30.1`。
- 已確認 Node、Python 3.12、uv、Google Chrome 與專案相依套件就緒。`UV_NO_CACHE=1 npm test` 通過全部 42 項測試，包括 Vitest 7 項、pytest 24 項與 Chrome Playwright 11 項。
- [Day 4 課程筆記](../notes/week1day4-claude-code.html#progress) 已標記第 1 步完成。下一步是[把 repo 整理成專案記憶](../notes/week1day4-claude-code.html#step-2)。

## 2026-11-25｜Day 2–4 專案開發流程速查完成

- [專案開發流程速查](../notes/project-development-flow.html) 整合 Day 2 開工與權限設定、Day 3 的 MVP 與驗收，以及 Day 4 的 harness、審查與 CI。流程圖標出首次 MVP 與既有專案的驗收和合併門檻，並附課後文件分享的 PR 步驟。
- 已用 Chrome 離線驗證桌面與手機版、兩種專案路徑、三條修正回路及 Day 2–4 課程連結。`UV_NO_CACHE=1 npm test` 通過全部 42 項測試。

## 2026-11-25｜Day 4 學習筆記完成

- [Day 4 Claude Code 學習筆記](../notes/week1day4-claude-code.html) 沿用 Day 3 版型，分 16 步帶你建立 Harness，並用六個階段實作深色模式。逐字核對講義的 42 個英文提示詞與指令區塊。
- 已用 Chrome 驗證桌面與手機的目錄跳轉、複製按鈕、進度計數與重新整理後保留勾選。Day 4 的學習進度從 0／16 開始。
- `UV_NO_CACHE=1 npm test` 通過全部 42 項測試，包括 Vitest 7 項、pytest 24 項與 Chrome Playwright 11 項。

## 2026-11-24｜第 14 步「記下之後的想法」完成

- Codex 在 Chrome 用暫存 SQLite 新增 `NT$120,000` 的門市耗材合約，將商機從「新商機」拖到「已確認」，並記錄一筆當天的電話跟進。確認成交機率更新為 25%，跟進出現在儀表板的「今天」待辦。
- 依操作過程記下三項改進想法。下一步是用 PR 分享 Day 3 文件。[Day 3 第 15 步](../notes/week1day3-claude-code.html#step-15)
- 第 15 步的流程圖補上三步各自的指令，從建立並提交 `share-day3`，到檢查後推送至 fork，再用 GitHub 或 `gh` 向 Ed 的 `main` 開 PR。[PR 流程圖](../notes/week1day3-claude-code.html#pr-workflow)
- 第 15 步補上分享資料夾的準備說明，包括為何先從自己的 `main` 複製文件、如何建立學員資料夾，以及 README 要寫什麼。[分享資料夾準備](../notes/week1day3-claude-code.html#pr-share-prep)

## Ideas for later

- 商機看板加入公司名稱與商機名稱搜尋，方便在卡片增多時找到剛移到其他階段的商機。
- 商機卡片加上下一次未完成的跟進日期，並分別標示跟進日與結案日，讓業務在看板上就能判斷哪些商機該先聯絡。
- 在儀表板待辦加上快速記錄結果和安排下次跟進的入口，處理每筆待辦時可省去切換詳情頁的操作。
- 從儀表板點開待跟進事項時，將時間軸捲到該筆活動並標示它。試用時連結只定位到整段時間軸，需靠內容找出「確認首批交付項目」。
- 從商機詳情返回看板時，保留欄位的橫向位置。以 1024 px 視窗捲到右側並開啟成交商機後，返回時兩種主題都從 72 px 跳回 0 px。

## 2026-11-24｜第 13 步「merge 回 main」完成

- 合併前重新執行 `UV_NO_CACHE=1 npm test`，Vitest 7 項、pytest 24 項、Chrome Playwright 11 項，共 42 項全數通過。
- 已將本機 `main` 從 `231292a` 快轉至審查修正提交 `50e4fd9`，並以 `git branch -d mvp` 刪除已合併的本機分支。
- 下一步是實際使用 MVP，記下後續改進想法。[Day 3 第 14 步](../notes/week1day3-claude-code.html#step-14)

## 2026-11-24｜第 12 步「審查分支」完成

- 依繁體中文審查政策檢查 `mvp` 相對於 `main` 的變更，修正四項 Important 問題。[審查政策](REVIEW.md)
- 本機資料保護。前端停用跨來源讀取，將檔案服務限制在前端與相依套件目錄。API 驗證本機主機與瀏覽器來源，SQLite 放在前端檔案服務範圍之外。
- 金額精度。超出 JavaScript 安全整數範圍的合計以十進位整數字串傳遞，儀表板及看板精確顯示到分。
- 介面行為。選填欄位的空值在升冪和降冪都排在最後。編輯商機與活動時只提交改動的欄位，保留另一分頁已儲存的階段、機率與跟進日期。
- `npm run build` 通過。`npm test` 通過 42 項，包括 Vitest 7 項、pytest 24 項、Chrome Playwright 11 項。下一步是將 `mvp` 合併回 `main`。[Day 3 第 13 步](../notes/week1day3-claude-code.html#step-13)

## 2026-11-24｜第 11 步「寫審查政策」完成

- 依課程範本建立繁體中文審查政策。分別審查功能與錯誤處理、安全性，以及是否符合規格和實作計畫。Important 問題必須在合併前修正，每次最多列五個小問題（Nits）。[審查政策](REVIEW.md)
- 下一步是依政策審查 `mvp` 相對於 `main` 的變更。[Day 3 第 12 步](../notes/week1day3-claude-code.html#step-12)

## 2026-11-24｜第 10 步「自己檢查」完成

- Codex 在 Mac 執行 `UV_NO_CACHE=1 npm test`，Vitest 6 項、pytest 21 項、Chrome Playwright 9 項全數通過，共 36 項。
- 用獨立的暫存 SQLite 啟動 MVP，在 Chrome 操作五個功能區塊並檢視截圖。確認刪除提示符合實際的關聯變更、重新整理及重啟後保留看板順序、`npm run seed` 恢復範例資料。畫面顯示繁體中文、新臺幣、折線圖、長條圖及六階段統計，1024 px 視窗可在看板區內水平捲動。
- 驗證跟進在今天、第七天和第八天正確分組，完成後移出待辦並保留於時間軸。`NT$100,000` 的商機從提案的 40% 拖到議價後採用 75%，預期營收增加 `NT$35,000`。標為成交後，本月成交金額增加 `NT$100,000`。
- 驗證時以離線模式執行 npm 和 uv，並在 Chrome 封鎖本機服務以外的請求。瀏覽器外部請求及主控台錯誤皆為 0。[驗收條件](specs/acceptance.md)
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

- 已在 [AGENTS.md](../AGENTS.md#測試) 記錄從 repo 根目錄執行 `npm test`、測試順序與暫存資料庫的設定。
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
- 完整或快速檢查需要先安裝 gitleaks，並確認 `gitleaks version` 可執行。[安裝步驟](../notes/week1day4-claude-code.html#step-1)
- `npm ci` 後可用 `npm run hooks:install` 安裝或確認本機 Git pre-commit hook。
- `npm run seed` 會**清除目前選定的資料庫內容**，再填入初始範例。重設完成後重新整理瀏覽器。
- 日常資料預設存於 `data/accountable.sqlite3`。若需要獨立資料庫，可在啟動與重設時皆設定相同的 `ACCOUNTABLE_DB_PATH`。請將資料庫放在 `frontend/` 與 `node_modules/` 之外。

## 2026-11-23｜MVP 實作計畫

- 已依「A · 跟進工作台」撰寫 [MVP 實作計畫](changes/mvp/plan.md)，列出預計變動的檔案、八個建置階段、風險與對應規格的驗收方式。
- 已依審閱結果補齊六項實作與驗收細節，包括測試資料庫隔離、刪除筆數重驗、拖放回應遺失、直接新增已結案商機、讀取重試及跨欄統計。
- 第 6 步的實作計畫已確認並提交至 `b7f8915`。[Day 3 課程筆記](../notes/week1day3-claude-code.html#step-6)

## 2026-11-23｜MVP 設計規格

- 已完成 [MVP 設計規格](spec.md)，涵蓋五個功能區塊、資料關聯、商機與跟進規則，以及八項驗收條件。已確認刪除聯絡人或商機時，會先列出受影響的活動與未完成跟進筆數，再依使用者確認一併刪除。
- 已完成三份儀表板與商機看板設計稿及六張 Playwright 截圖。已選定 [A · 跟進工作台](mockups/1-follow-up.html)，讓使用者從首頁先處理待跟進事項。選擇、理由和版面已記入 [MVP 設計規格](spec.md#選定設計)。
- [Day 3 課程筆記](../notes/week1day3-claude-code.html) 已標記第 5 步完成。Design 文件已提交。

## 2026-11-21｜MVP 規劃

- 已完成使用者訪談並更新 [MVP 產品意圖](changes/mvp/intent.md)。確認第一版給小型企業的老闆兼業務使用，保留五個功能區塊，介面採繁體中文，金額採新臺幣。
- 本機啟動與離線操作將在使用者的 Mac 上驗收，並保留 Mac、Linux 與 Windows 的相容目標。
- [Day 3 課程筆記](../notes/week1day3-claude-code.html) 已標記第 3 步完成，並同步更新驗收清單。
