import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

function scan(mode, ...args) {
  const result = spawnSync(
    'gitleaks',
    [mode, '--redact=100', '--no-banner', '--ignore-gitleaks-allow', '--verbose', ...args],
    {
      stdio: 'inherit',
    },
  )
  if (result.error?.code === 'ENOENT') {
    throw new Error('請先安裝 gitleaks（https://github.com/gitleaks/gitleaks#installing）。')
  }
  if (result.error) throw result.error
  return result.status ?? 1
}

function scanWorkingTree() {
  const root = realpathSync('.')
  // Include tracked files even if they now match an ignore rule. Skip local Git-ignored files such as .env.
  const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean)
  const snapshot = mkdtempSync(join(tmpdir(), 'accountable-gitleaks-'))
  try {
    for (const file of new Set(files)) {
      const source = join(root, file)
      // Deleted files are scanned in Git history. Never follow symlinks into local files outside this scan.
      if (!statSync(source, { throwIfNoEntry: false })?.isFile() || realpathSync(source) !== source) continue
      const destination = join(snapshot, file)
      mkdirSync(dirname(destination), { recursive: true })
      copyFileSync(source, destination)
    }
    return scan('dir', snapshot)
  } finally {
    rmSync(snapshot, { recursive: true, force: true })
  }
}

try {
  process.exitCode = scan('git', '--log-opts=--all', '.') || scan('git', '--staged', '.') || scanWorkingTree()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
