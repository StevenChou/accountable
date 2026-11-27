import { defineConfig } from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const identity = 'ACCOUNTABLE_PLAYWRIGHT_ROOT'
const root = process.env[identity] ?? mkdtempSync(join(tmpdir(), 'accountable-e2e-'))
process.env[identity] = root

const port = 5189
const baseURL = `http://127.0.0.1:${port}`
const testEnv = {
  ACCOUNTABLE_TEST_MODE: '1',
  ACCOUNTABLE_TEST_ROOT: root,
  ACCOUNTABLE_DB_PATH: join(root, 'test.sqlite3'),
  ACCOUNTABLE_WEB_PORT: String(port),
  ACCOUNTABLE_API_PORT: '8189',
  ACCOUNTABLE_RUN_ID: root.split(/[/\\]/).at(-1)!,
}
Object.assign(process.env, testEnv)

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  use: {
    baseURL,
    channel: process.env.ACCOUNTABLE_E2E_BROWSER === 'chromium' ? undefined : 'chrome',
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node e2e/server.mjs',
    url: `${baseURL}/api/health?run_id=${testEnv.ACCOUNTABLE_RUN_ID}`,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
    env: testEnv,
  },
})
