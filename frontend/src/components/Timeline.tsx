import { useState, type FormEvent } from 'react'
import { ApiError, errorMessage, useResource, write } from '../api'
import { activityKinds, displayTime, localDateTime, type Activity } from '../domain'
import { FieldProblem, Loading, Modal, Notice } from './Common'

type Owner = 'contacts' | 'deals'

function activityValidation(content: string, occurred: Date) {
  const fields: Record<string, string> = {}
  if (!content) fields.content = '請輸入活動內容。'
  if (Number.isNaN(occurred.getTime())) fields.occurred_at = '請輸入有效的活動時間。'
  return fields
}

function ActivityForm({
  resource,
  id,
  previous,
  close,
  done,
}: {
  resource: Owner
  id: number
  previous?: Activity
  close: () => void
  done: () => void
}) {
  const [kind, setKind] = useState(previous?.kind ?? 'note')
  const [content, setContent] = useState(previous?.content ?? '')
  const [initialTime] = useState(() => localDateTime(previous ? new Date(previous.occurred_at) : new Date()))
  const [occurred, setOccurred] = useState(initialTime)
  const [due, setDue] = useState(previous?.follow_up ?? '')
  const [error, setError] = useState<unknown>()
  const [busy, setBusy] = useState(false)

  async function save(event: FormEvent) {
    event.preventDefault()
    if (busy) return
    const text = content.trim()
    const timestamp = new Date(occurred)
    const fields = activityValidation(text, timestamp)
    if (Object.keys(fields).length) {
      setError(new ApiError(422, { message: '請檢查標示的欄位。', fields }))
      return
    }
    setBusy(true)
    setError(undefined)
    try {
      const followUp = due || null
      await write(
        previous ? `/activities/${previous.id}` : `/${resource}/${id}/activities`,
        previous ? 'PATCH' : 'POST',
        {
          ...(!previous || kind !== previous.kind ? { kind } : {}),
          ...(!previous || text !== previous.content ? { content: text } : {}),
          ...(!previous || followUp !== previous.follow_up ? { follow_up: followUp } : {}),
          ...(occurred === initialTime ? {} : { occurred_at: timestamp.toISOString() }),
        },
      )
      done()
    } catch (problem) {
      setError(problem)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={previous ? '編輯活動' : '新增活動'} onClose={close} busy={busy}>
      <form className="dialog-form" noValidate onSubmit={save}>
        {error !== undefined && <Notice>{errorMessage(error)}</Notice>}
        <fieldset disabled={busy}>
          <div className="field">
            <label htmlFor="activity-kind">活動類型（必填）</label>
            <select
              id="activity-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as Activity['kind'])}
            >
              {(['note', 'call', 'email'] as const).map((value) => (
                <option key={value} value={value}>
                  {activityKinds[value]}
                </option>
              ))}
            </select>
            <FieldProblem error={error} field="kind" />
          </div>
          <div className="field">
            <label htmlFor="activity-content">內容（必填）</label>
            <textarea
              id="activity-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              required
            />
            <FieldProblem error={error} field="content" />
          </div>
          <div className="field">
            <label htmlFor="activity-time">發生時間（必填）</label>
            <input
              id="activity-time"
              type="datetime-local"
              value={occurred}
              onChange={(event) => setOccurred(event.target.value)}
              required
            />
            <FieldProblem error={error} field="occurred_at" />
          </div>
          <div className="field">
            <label htmlFor="activity-due">跟進日期</label>
            <input id="activity-due" type="date" value={due} onChange={(event) => setDue(event.target.value)} />
            <FieldProblem error={error} field="follow_up" />
          </div>
        </fieldset>
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={close} disabled={busy}>
            取消
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {busy ? '儲存中…' : '儲存'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

type Action = { type: 'new' } | { type: 'edit' | 'delete'; entry: Activity }

export function Timeline({ resource, id }: { resource: Owner; id: number }) {
  const query = useResource<Activity[]>(`/${resource}/${id}/activities`)
  const [action, setAction] = useState<Action>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>()

  function close() {
    setAction(undefined)
    setError(undefined)
  }

  function open(next: Action) {
    setError(undefined)
    setAction(next)
  }

  function changed() {
    close()
    void query.reload()
  }

  async function change(entry: Activity, deleting = false) {
    if (busy) return
    setBusy(true)
    setError(undefined)
    try {
      await write(`/activities/${entry.id}`, deleting ? 'DELETE' : 'PATCH', deleting ? undefined : { completed: true })
      changed()
    } catch (problem) {
      setError(problem)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel" id="timeline" aria-labelledby="timeline-title">
      <div className="panel-heading">
        <h2 id="timeline-title">活動時間軸</h2>
        <button type="button" className="primary" onClick={() => open({ type: 'new' })}>
          新增活動
        </button>
      </div>
      <Loading {...query} />
      {error !== undefined && action?.type !== 'delete' && <Notice>{errorMessage(error)}</Notice>}
      {query.data?.length === 0 && <p className="empty">目前沒有活動紀錄。</p>}
      <ol className="timeline">
        {query.data?.map((entry) => (
          <li key={entry.id} data-activity-id={entry.id}>
            <div className="timeline-meta">
              <span className={`badge kind-${entry.kind}`}>{activityKinds[entry.kind]}</span>
              <time className="num" dateTime={entry.occurred_at}>
                {displayTime(entry.occurred_at)}
              </time>
            </div>
            <div className="timeline-text">
              <p>{entry.content}</p>
              <p className="muted">新增者 {entry.created_by_email}</p>
              {entry.follow_up && (
                <p className="muted">
                  跟進日期 <time className="num">{entry.follow_up}</time>
                  <span className={`badge ${entry.completed ? 'done' : 'today'}`}>
                    {entry.completed ? '已完成' : '待跟進'}
                  </span>
                </p>
              )}
            </div>
            {entry.kind !== 'stage' && (
              <div className="row-actions">
                {entry.follow_up && !entry.completed && (
                  <button type="button" className="text-button" onClick={() => void change(entry)} disabled={busy}>
                    標記完成
                  </button>
                )}
                <button type="button" className="text-button" onClick={() => open({ type: 'edit', entry })}>
                  編輯
                </button>
                <button
                  type="button"
                  className="text-button destructive-text"
                  onClick={() => open({ type: 'delete', entry })}
                >
                  刪除
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>
      {action && action.type !== 'delete' && (
        <ActivityForm
          resource={resource}
          id={id}
          previous={action.type === 'edit' ? action.entry : undefined}
          close={close}
          done={changed}
        />
      )}
      {action?.type === 'delete' && (
        <Modal title="刪除活動" onClose={close} busy={busy}>
          <div className="dialog-form">
            <p>確定要刪除這筆活動「{action.entry.content}」？</p>
            {action.entry.follow_up && !action.entry.completed && <p>未完成的跟進也會從儀表板的待辦清單移除。</p>}
            {error !== undefined && <Notice>{errorMessage(error)}</Notice>}
            <div className="dialog-actions">
              <button type="button" className="secondary" onClick={close} disabled={busy}>
                取消
              </button>
              <button type="button" className="danger" onClick={() => void change(action.entry, true)} disabled={busy}>
                確認刪除
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  )
}
