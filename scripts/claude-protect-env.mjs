import { readFileSync } from 'node:fs'

const { tool_name: tool, tool_input: input = {} } = JSON.parse(readFileSync(0, 'utf8'))
const isShell = tool === 'Bash' || tool === 'PowerShell'
const blocked = isShell
  ? /(?<![\w.-])\.env(?![\w.-])/i.test(input.command ?? '')
  : /(?:^|[\\/])\.env$/i.test(input.file_path ?? input.notebook_path ?? '')

if (blocked) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: '請由使用者自行管理 .env。Claude Code 的檔案編輯工具與直接指向 .env 的命令已停用。',
      },
    }),
  )
}
