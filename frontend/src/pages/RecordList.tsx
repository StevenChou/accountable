import { useMemo, useState } from 'react'
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable, type ColumnDef, type SortingState } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useResource } from '../api'
import { Loading, Overdue, PageHeading } from '../components/Common'
import { DeleteRecord } from '../components/DeleteRecord'
import { RecordForm } from '../components/RecordForm'
import { matchesSearch, money, resourceNames, stages, statuses, type Company, type Contact, type Deal, type Resource } from '../domain'

type RecordRow = Company | Contact | Deal
type Dialog = { kind: 'edit' | 'delete'; row: RecordRow } | { kind: 'new' }

const nameColumn = (resource: Resource): ColumnDef<RecordRow> => ({
  accessorKey: 'name',
  header: resource === 'contacts' ? '姓名' : '名稱',
  cell: ({ row }) => <Link className="record-link" to={`/${resource}/${row.original.id}`}>{row.original.name}</Link>,
})

const companyColumn: ColumnDef<RecordRow> = { accessorKey: 'company_name', header: '所屬公司' }
const columns: Record<Resource, ColumnDef<RecordRow>[]> = {
  companies: [nameColumn('companies'), { accessorKey: 'website', header: '網站' }, { accessorKey: 'industry', header: '產業' }],
  contacts: [
    nameColumn('contacts'), companyColumn, { accessorKey: 'title', header: '職稱' },
    { accessorKey: 'email', header: '電子郵件' }, { accessorKey: 'phone', header: '電話' },
    { id: 'status', header: '狀態', accessorFn: row => statuses[(row as Contact).status] },
  ],
  deals: [
    nameColumn('deals'), companyColumn, { accessorKey: 'contact_name', header: '主要聯絡人' },
    { id: 'stage', header: '階段', accessorFn: row => stages[(row as Deal).stage].label },
    { accessorKey: 'amount_cents', header: '金額', cell: ({ row }) => <span className="num">{money((row.original as Deal).amount_cents)}</span> },
    { accessorKey: 'probability', header: '成交機率', cell: ({ row }) => <span className="num">{(row.original as Deal).probability}%</span> },
    { accessorKey: 'close_date', header: '結案日', cell: ({ row }) => <span className="date-cell">
      <span className="num">{(row.original as Deal).close_date ?? '—'}</span> <Overdue overdue={(row.original as Deal).overdue} />
    </span> },
  ],
}

function searchable(resource: Resource, row: RecordRow) {
  if (resource === 'companies') return [row.name, (row as Company).industry]
  if (resource === 'contacts') {
    const contact = row as Contact
    return [row.name, contact.company_name, contact.email, contact.phone]
  }
  const deal = row as Deal
  return [row.name, deal.company_name, deal.contact_name]
}

const noRows: RecordRow[] = []

export function RecordList({ resource }: { resource: Resource }) {
  const query = useResource<RecordRow[]>(`/${resource}`)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [sort, setSort] = useState<SortingState>([{ id: 'name', desc: false }])
  const [dialog, setDialog] = useState<Dialog>()
  const rows = query.data ?? noRows
  const filtered = useMemo(() => rows.filter(row =>
    matchesSearch(search, searchable(resource, row)) && (!status || (row as Contact).status === status)
  ), [rows, search, status, resource])
  const actions = useMemo<ColumnDef<RecordRow>[]>(() => [...columns[resource], {
    id: 'actions', header: '操作', enableSorting: false,
    cell: ({ row }) => <div className="row-actions">
      <button type="button" className="text-button" onClick={() => setDialog({ kind: 'edit', row: row.original })}>編輯</button>
      <button type="button" className="text-button destructive-text" onClick={() => setDialog({ kind: 'delete', row: row.original })}>刪除</button>
    </div>,
  }], [resource])
  const table = useReactTable({
    data: filtered, columns: actions, state: { sorting: sort }, onSortingChange: setSort,
    enableSortingRemoval: false, getRowId: row => String(row.id),
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
  })
  const label = resourceNames[resource]

  function changed() {
    setDialog(undefined)
    void query.reload()
  }

  return <>
    <PageHeading title={label}>
      <button type="button" className="primary" onClick={() => setDialog({ kind: 'new' })}>新增{label}</button>
    </PageHeading>
    <section className="panel">
      <div className="list-tools">
        <input type="search" aria-label={`搜尋${label}`} placeholder={`搜尋${label}`} value={search}
          onChange={event => setSearch(event.target.value)} />
        {resource === 'contacts' && <select aria-label="狀態篩選" value={status} onChange={event => setStatus(event.target.value)}>
          <option value="">全部狀態</option>
          {Object.entries(statuses).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
        </select>}
      </div>
      <Loading {...query} />
      {query.data && (filtered.length ? <div className="table-wrap">
        <table>
          <thead>{table.getHeaderGroups().map(group => <tr key={group.id}>{group.headers.map(header => {
            const direction = header.column.getIsSorted()
            return <th key={header.id} scope="col" aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : undefined}>
              {header.column.getCanSort() ? <button type="button" onClick={header.column.getToggleSortingHandler()}>
                {flexRender(header.column.columnDef.header, header.getContext())} {direction && <span aria-hidden="true">{direction === 'asc' ? '↑' : '↓'}</span>}
              </button> : flexRender(header.column.columnDef.header, header.getContext())}
            </th>
          })}</tr>)}</thead>
          <tbody>{table.getRowModel().rows.map(row => <tr key={row.id}>{row.getVisibleCells().map(cell =>
            <td key={cell.id}>{cell.column.columnDef.cell
              ? flexRender(cell.column.columnDef.cell, cell.getContext())
              : String(cell.getValue() ?? '—')}</td>
          )}</tr>)}</tbody>
        </table>
      </div> : <p className="empty">{rows.length ? '沒有符合條件的紀錄。' : `目前沒有${label}紀錄。`}</p>)}
    </section>
    {dialog?.kind === 'delete' && <DeleteRecord resource={resource} row={dialog.row} onClose={() => setDialog(undefined)} onDeleted={changed} />}
    {dialog && dialog.kind !== 'delete' && <RecordForm resource={resource}
      row={dialog.kind === 'edit' ? dialog.row : undefined} onClose={() => setDialog(undefined)} onSaved={changed} />}
  </>
}
