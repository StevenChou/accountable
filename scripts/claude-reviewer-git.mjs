import { readFileSync } from 'node:fs'

const { tool_input: input = {} } = JSON.parse(readFileSync(0, 'utf8'))
const command = input.command ?? ''
const [git, subcommand, ...args] = command.trim().split(/[ \t]+/)
const subcommands = new Set(['diff', 'log', 'show'])
const flags = new Set([
  '--',
  '--stat',
  '--name-only',
  '--name-status',
  '--oneline',
  '--patch',
  '--first-parent',
  '--no-merges',
])

const validArgs = args.every((arg) => flags.has(arg) || /^-\d+$/.test(arg) || /^[\w./][\w./^~-]*$/.test(arg))
const allowed = !/[^\w./^~ \t-]/.test(command) && git === 'git' && subcommands.has(subcommand) && validArgs

const output = allowed
  ? {
      permissionDecision: 'allow',
      updatedInput: {
        ...input,
        command: [
          'git --no-pager -c core.fsmonitor=false -c diff.autoRefreshIndex=false',
          subcommand,
          '--no-ext-diff --no-textconv',
          ...args,
        ].join(' '),
      },
    }
  : {
      permissionDecision: 'deny',
      permissionDecisionReason:
        'Reviewer Bash allows a single git diff, git log, or git show with read-only arguments. Use Read, Grep, or Glob for file inspection.',
    }

console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', ...output } }))
