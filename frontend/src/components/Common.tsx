import { useEffect, useRef, type ReactNode } from 'react'
import { ApiError, errorMessage } from '../api'

export function PageHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="page-heading">
      <h1>{title}</h1>
      {children}
    </div>
  )
}

const weekday = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' })

export function CalendarDay({ date }: { date: string }) {
  const [year, month, day] = date.split('-').map(Number)
  return (
    <time dateTime={date}>
      {year} 年 {month} 月 {day} 日{'\u3000'}
      {weekday.format(new Date(year, month - 1, day))}
    </time>
  )
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="notice" role="alert">
      {children}
    </p>
  )
}

export function Loading({ busy, error, reload }: { busy: boolean; error?: unknown; reload: () => unknown }) {
  if (error)
    return (
      <div className="load-error" role="alert">
        <span>{errorMessage(error)}</span>
        <button type="button" className="secondary" onClick={reload}>
          重試
        </button>
      </div>
    )
  if (busy)
    return (
      <p className="loading" role="status">
        載入中…
      </p>
    )
  return null
}

export function Modal({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  busy?: boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    return () => element?.close()
  }, [])
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      aria-label={title}
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button type="button" className="icon-button" onClick={onClose} disabled={busy} aria-label="關閉">
          ×
        </button>
      </div>
      {children}
    </dialog>
  )
}

export function FieldProblem({ error, field }: { error: unknown; field: string }) {
  const message = error instanceof ApiError ? error.details.fields?.[field] : undefined
  return message ? (
    <span className="field-error" role="alert">
      {message}
    </span>
  ) : null
}

export function Overdue({ overdue }: { overdue: boolean }) {
  return overdue ? <span className="badge late">逾期</span> : null
}
