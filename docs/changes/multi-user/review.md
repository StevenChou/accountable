# multi-user 分支審查與修正紀錄

2026-11-28。固定比較為 `git diff fff728cfa5a21d35d33203f70124f934d39832a5...eec904ba56f3eb4901c747457e74f47a9c58117c`，涵蓋本分支相對 main 的變更。依 [審查政策](../../REVIEW.md)、[標準](../../STANDARDS.md)、[變更意圖](intent.md) 和 [實作計畫](plan.md) 審查。

Claude 專案 reviewer 審查功能、錯誤處理、安全性與規格。另由兩個 Codex 子代理獨立檢查 Standards 與 Spec。作者複核回報及修正。原始 Claude 輸出保存在本機 `.playwright-mcp/day5-review/`。

## Standards

原始結果為 Important 0 項、Nits 1 項。確認 migrations 未納入既有格式、lint 和型別檢查。已擴充 npm 檢查及格式修正指令、pre-commit 的 Ruff 範圍。歷史 migration 的結構定義保留為版本紀錄。

## Spec

原始結果為 Important 2 項，Claude 複核另找到 1 項限流問題，共 3 項已修正。

| 發現與觸發 | 修正與證據 |
| --- | --- |
| `frontend/src/auth.ts` 的登入成功後驗證遇到 503，會清掉有效工作階段。 | 只有 401 會清除該工作階段，暫時錯誤提供重試。回歸測試修正前因權杖變成 null 而失敗，修正後驗證保留權杖及重試成功。 |
| `render.yaml` 缺少團隊時區與鄰近資料庫的服務區域。 | 設定 `TZ=Asia/Taipei` 及 `region: singapore`。已核對 Supabase pooler 位於 ap-southeast-1，並保留 Python 3.12、main、`checksPass` 和環境變數名稱。 |
| Supabase 登入或還原工作階段遇到 429，前端會顯示帳密錯誤或回到登入畫面。 | 429 改成服務暫時不可用。登入與還原兩條流程各有修正前失敗、修正後通過的測試。後端另補 403 → 401、429 → 503 的測試。 |

## 回報的複核

- 後端將上游限流或服務錯誤回傳 503，明確的 401 和 403 才視為未授權，符合本次錯誤處理要求。
- 前端測試格式問題發生於作者正在加入回歸測試時。格式已修正，最終完整檢查重新確認。
- 共用 Supabase MCP 設定與課程筆記的修改來自本次使用者明確要求。受影響的執行規格與計畫已同步更新。
- 本階段保留前一步 Security Advisor 的外洩密碼防護警告紀錄。線上資料庫的唯讀檢查結果記錄在專案進度。

## 驗證與 harness

登入錯誤處理的回歸測試由標準 Vitest 指令執行。Ruff 與型別檢查現在同時涵蓋 backend 和 migrations。審查政策補上登入、還原、刷新權杖及部署時區的檢核。改善過程依 [IMPROVE](../../IMPROVE.md) 記錄。

最終執行 `ACCOUNTABLE_E2E_BROWSER=chromium npm run check`，使用隔離的 Chromium Headless Shell、虛構使用者與暫存 SQLite。通過後的結果記錄於 [專案進度](../../STATUS.md)。
