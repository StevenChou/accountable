import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = await mkdtemp(join(tmpdir(), 'accountable-e2e-'))
const cli = fileURLToPath(import.meta.resolve('@playwright/test/cli'))
const env = { ...process.env, ACCOUNTABLE_PLAYWRIGHT_ROOT: root }
delete env.FORCE_COLOR

try {
  const child = spawn(process.execPath, [cli, 'test', ...process.argv.slice(2)], { env, stdio: 'inherit' })
  const terminate = signal => child.kill(signal)
  process.on('SIGTERM', terminate)
  process.on('SIGINT', terminate)
  process.exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => resolve(code ?? (signal === 'SIGINT' ? 130 : 1)))
  })
} finally {
  await rm(root, { recursive: true, force: true })
}
