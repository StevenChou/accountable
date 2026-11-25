import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ApiError, useResource } from '../api'
import { Loading, Overdue, PageHeading } from '../components/Common'
import { DeleteRecord } from '../components/DeleteRecord'
import { RecordForm } from '../components/RecordForm'
import { Timeline } from '../components/Timeline'
import {
  isClosed,
  money,
  resourceNames,
  stages,
  statuses,
  type Company,
  type Contact,
  type Deal,
  type Named,
  type Resource,
} from '../domain'

type CompanyDetail = Company & { contacts: Named[]; deals: Named[] }
type Detail = CompanyDetail | Contact | Deal

function Relation({ resource, id, name }: { resource: Resource; id: number | null; name: string | null }) {
  return id ? (
    <Link className="record-link" to={`/${resource}/${id}`}>
      {name}
    </Link>
  ) : (
    '—'
  )
}

function Fields({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="detail-fields">
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value || '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

function Details({ resource, row }: { resource: Resource; row: Detail }) {
  if (resource === 'companies') {
    const company = row as CompanyDetail
    return (
      <>
        <Fields
          rows={[
            ['名稱', company.name],
            ['網站', company.website],
            ['產業', company.industry],
            ['備註', company.notes],
          ]}
        />
        <div className="related">
          {(['contacts', 'deals'] as const).map((group) => (
            <div key={group}>
              <h3>{resourceNames[group]}</h3>
              {company[group].length ? (
                <ul>
                  {company[group].map((record) => (
                    <li key={record.id}>
                      <Relation resource={group} id={record.id} name={record.name} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">目前沒有關聯紀錄。</p>
              )}
            </div>
          ))}
        </div>
      </>
    )
  }
  if (resource === 'contacts') {
    const contact = row as Contact
    return (
      <Fields
        rows={[
          ['姓名', contact.name],
          ['所屬公司', <Relation resource="companies" id={contact.company_id} name={contact.company_name} />],
          ['狀態', statuses[contact.status]],
          ['職稱', contact.title],
          ['電子郵件', contact.email],
          ['電話', contact.phone],
        ]}
      />
    )
  }
  const deal = row as Deal
  return (
    <Fields
      rows={[
        ['名稱', deal.name],
        ['所屬公司', <Relation resource="companies" id={deal.company_id} name={deal.company_name} />],
        ['主要聯絡人', <Relation resource="contacts" id={deal.contact_id} name={deal.contact_name} />],
        ['階段', stages[deal.stage].label],
        ['金額', <span className="num">{money(deal.amount_cents)}</span>],
        ['成交機率', <span className="num">{deal.probability}%</span>],
        [
          isClosed(deal.stage) ? '實際結案日' : '預計結案日',
          <span className="date-cell">
            <time className="num">{deal.close_date ?? '—'}</time> <Overdue overdue={deal.overdue} />
          </span>,
        ],
      ]}
    />
  )
}

export function RecordDetail({ resource }: { resource: Resource }) {
  const { id } = useParams()
  return <DetailPage key={id} resource={resource} id={id ?? ''} />
}

function DetailPage({ resource, id }: { resource: Resource; id: string }) {
  const query = useResource<Detail>(`/${resource}/${encodeURIComponent(id)}`)
  const navigate = useNavigate()
  const location = useLocation()
  const [dialog, setDialog] = useState<'edit' | 'delete'>()
  const [timelineVersion, setTimelineVersion] = useState(0)
  const exists = !!query.data
  const missing = query.error instanceof ApiError && query.error.status === 404
  const label = resourceNames[resource]

  useEffect(() => {
    if (exists && location.hash === '#timeline') document.getElementById('timeline')?.scrollIntoView()
  }, [exists, location.hash])

  return (
    <>
      <Link className="back-link" to={`/${resource}`}>
        ‹ 返回{label}列表
      </Link>
      <PageHeading title={query.data?.name ?? `${label}詳情`}>
        {query.data && (
          <div className="row-actions">
            <button type="button" className="secondary" onClick={() => setDialog('edit')}>
              編輯{label}
            </button>
            <button type="button" className="secondary destructive-text" onClick={() => setDialog('delete')}>
              刪除{label}
            </button>
          </div>
        )}
      </PageHeading>
      {missing ? <p className="panel empty">找不到這筆紀錄，可能已刪除。</p> : <Loading {...query} />}
      {query.data && !missing && (
        <>
          <section className="panel record-details">
            <Details resource={resource} row={query.data} />
          </section>
          {resource !== 'companies' && <Timeline key={timelineVersion} resource={resource} id={Number(id)} />}
          {dialog === 'edit' && (
            <RecordForm
              resource={resource}
              row={query.data}
              onClose={() => setDialog(undefined)}
              onSaved={() => {
                setDialog(undefined)
                void query.reload()
                setTimelineVersion((version) => version + 1)
              }}
            />
          )}
          {dialog === 'delete' && (
            <DeleteRecord
              resource={resource}
              row={query.data}
              onClose={() => setDialog(undefined)}
              onDeleted={() => {
                void navigate(`/${resource}`)
              }}
            />
          )}
        </>
      )}
    </>
  )
}
