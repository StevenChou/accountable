import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { stripVTControlCharacters } from 'node:util'

const { stop_hook_active: alreadyContinued } = JSON.parse(readFileSync(0, 'utf8'))

if (!alreadyContinued) {
  const check = spawnSync('npm', ['run', 'check:quick'], {
    cwd: new URL('../', import.meta.url),
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })

  if (check.status !== 0) {
    const output = stripVTControlCharacters(
      [check.stdout, check.stderr, check.error?.message].filter(Boolean).join('\n'),
    ).trim()
    const details = output.length > 7800 ? `${output.slice(0, 5800)}\n…\n${output.slice(-1800)}` : output
    const reason = ['`npm run check:quick` 失敗。請依輸出修正問題，再重新執行檢查。', details]
      .filter(Boolean)
      .join('\n\n')
    console.log(JSON.stringify({ decision: 'block', reason }))
  }
}
