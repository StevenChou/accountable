# 專案進度

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
