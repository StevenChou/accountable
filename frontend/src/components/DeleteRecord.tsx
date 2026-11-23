import { useState } from 'react'
import { ApiError, errorMessage, useResource, write } from '../api'
import { resourceNames, type Named, type Resource } from '../domain'
import { Loading, Modal, Notice } from './Common'

type Impact = Record<string, number>

function describe(resource: Resource, counts: Impact) {
  if (resource === 'companies') return `會解除 ${counts.contacts} 位聯絡人與 ${counts.deals} 筆商機的公司連結，這些紀錄與活動會保留。`
  const activities = `會刪除 ${counts.activities} 筆活動，其中有 ${counts.follow_ups} 筆未完成跟進。`
  if (resource === 'contacts') return `會解除 ${counts.deals} 筆商機的主要聯絡人連結。${activities}`
  return `${activities}關聯公司與主要聯絡人會保留。`
}

export function DeleteRecord({ resource, row, onClose, onDeleted }: {
  resource: Resource; row: Named; onClose: () => void; onDeleted: () => void
}) {
  const impact = useResource<Impact>(`/${resource}/${row.id}/delete-impact`)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>()

  async function confirm() {
    if (!impact.data || busy) return
    setBusy(true)
    setError(undefined)
    const query = new URLSearchParams(Object.entries(impact.data).map(([key, count]) => [key, String(count)]))
    try {
      await write(`/${resource}/${row.id}?${query}`, 'DELETE')
      onDeleted()
    } catch (problem) {
      if (problem instanceof ApiError && problem.status === 409 && problem.details.impact) {
        impact.replace(problem.details.impact)
      }
      setError(problem)
    } finally {
      setBusy(false)
    }
  }

  return <Modal title={`刪除${resourceNames[resource]}`} onClose={onClose} busy={busy}>
    <div className="dialog-form">
      <p>確定要刪除「{row.name}」？</p>
      <Loading {...impact} />
      {impact.data && <p>{describe(resource, impact.data)}</p>}
      {error !== undefined && <Notice>{errorMessage(error)}</Notice>}
      <div className="dialog-actions">
        <button type="button" className="secondary" onClick={onClose} disabled={busy}>取消</button>
        <button type="button" className="danger" onClick={confirm} disabled={busy || impact.busy || !impact.data}>確認刪除</button>
      </div>
    </div>
  </Modal>
}
