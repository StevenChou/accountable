import { useId, useRef, useState, type KeyboardEvent } from 'react'
import type { Theme } from '../theme'
import './user-menu.css'

const themes: { value: Theme; label: string }[] = [
  { value: 'light', label: '亮色' },
  { value: 'dark', label: '深色' },
  { value: 'system', label: '跟隨系統' },
]

export function UserMenu({
  email,
  theme,
  changeTheme,
  signOut,
}: {
  email: string
  theme: Theme
  changeTheme: (theme: Theme) => void
  signOut: () => void
}) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const id = useId()
  const initials = Array.from(email.split('@', 1)[0])
    .slice(0, 2)
    .join('')
    .replace(/[a-z]/g, (value) => value.toUpperCase())

  function close() {
    setOpen(false)
    trigger.current?.focus()
  }

  function closeOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      event.stopPropagation()
      close()
    }
  }

  return (
    <div
      className="user-menu"
      role="group"
      aria-label="帳號"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <button
        ref={trigger}
        className="account-trigger"
        type="button"
        aria-label="使用者選單"
        aria-expanded={open}
        aria-controls={id}
        onKeyDown={closeOnEscape}
        onClick={() => setOpen((value) => !value)}
      >
        {initials}
      </button>
      <div className="account-options" id={id} hidden={!open}>
        <p className="account-email">{email}</p>
        <div className="account-themes" role="group" aria-label="主題模式">
          {themes.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={theme === value}
              onKeyDown={closeOnEscape}
              onClick={() => changeTheme(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" onKeyDown={closeOnEscape} onClick={signOut}>
          登出
        </button>
      </div>
    </div>
  )
}
