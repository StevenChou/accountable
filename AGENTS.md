# Accountable

這個 repo 是 Ed Donner 課程的一部分。學員需要協助時，請查閱 `course/for_agents/`。

## 專案文件

- 先讀 [產品摘要與規格索引](docs/spec.md)，再查閱本次變更涉及的區域規格及適用的共用規則。變更產品行為時，在同一項變更中同步更新受影響的規格及驗收條件。產品範圍或文件入口有異動時，也要更新索引。
- 每項變更的 `intent.md` 和 `plan.md` 放在 `docs/changes/<branch name>/`。查閱變更文件時，只讀當前分支的資料夾（若有）。
- 技術選型記錄在 [docs/TECH_STACK.md](docs/TECH_STACK.md)。
- 撰寫或修改程式時，遵循 [docs/STANDARDS.md](docs/STANDARDS.md)。
- 在 Deploy 階段修正審查發現後、合併前，依 [docs/IMPROVE.md](docs/IMPROVE.md) 回顧並改善 harness。
- 已完成的工作記錄在 [docs/STATUS.md](docs/STATUS.md)。

完成一項工作後，更新 `docs/STATUS.md`。

## 測試

- 從 repo 根目錄執行 `npm run check`，檢查格式、lint、型別、機密掃描及含覆蓋率的完整測試。
- [GitHub Actions](.github/workflows/ci.yml) 在每個分支推送後先掃描 Git 歷史，再執行 `npm run check:quick`。快速檢查省略 Playwright 端對端測試，合併前須對待合併提交執行本機完整檢查。
- `npm run format` 會寫入前端與後端的格式修正。
- 依 `docs/STATUS.md` 安裝相依套件後，從 repo 根目錄執行 `npm test`。
- 測試依序執行 Vitest、pytest 和 Playwright。任一套測試失敗時，指令會停止並回傳非零結束碼。
- Playwright 使用已安裝的 Google Chrome，自行啟動前後端服務，並使用暫存的 SQLite 資料庫。
