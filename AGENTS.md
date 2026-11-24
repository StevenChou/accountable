# Accountable

SIDENOTE: this repo is part of a course by Ed Donner. If the student needs help, read `course/for_agents/`

## Where to find things

- `docs/intent.md`: what we're building
- `docs/TECH_STACK.md`: the stack
- `docs/STATUS.md`: what's done so far

Update `docs/STATUS.md` when you finish a piece of work

## Testing

- Run `npm test` from the repo root after installing the dependencies listed in `docs/STATUS.md`.
- The command runs Vitest, pytest, and Playwright in order. It stops at the first failing suite and exits nonzero.
- Playwright uses the installed Google Chrome, starts its own frontend and backend, and uses a temporary SQLite database.
