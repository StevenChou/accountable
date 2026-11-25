import { useState, type FormEvent, type ReactNode } from 'react'
import { ApiError, errorMessage, useResource, write } from '../api'
import {
  formatCents,
  isClosed,
  localDate,
  parseMoney,
  resourceNames,
  stages,
  statuses,
  type Company,
  type Contact,
  type Deal,
  type Named,
  type Resource,
  type Stage,
} from '../domain'
import { FieldProblem, Loading, Modal, Notice } from './Common'

type RecordRow = Company | Contact | Deal
type Values = Record<string, string>
type RecordBody = Record<string, string | number | null>

function companyValues(company?: Company): Values {
  return {
    name: company?.name ?? '',
    website: company?.website ?? '',
    industry: company?.industry ?? '',
    notes: company?.notes ?? '',
  }
}

function contactValues(contact?: Contact): Values {
  return {
    name: contact?.name ?? '',
    company_id: String(contact?.company_id ?? ''),
    status: contact?.status ?? 'lead',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    title: contact?.title ?? '',
  }
}

function initialValues(resource: Resource, row?: RecordRow, initialStage: Stage = 'new'): Values {
  if (resource === 'companies') return companyValues(row as Company | undefined)
  if (resource === 'contacts') return contactValues(row as Contact | undefined)
  const defaultClose = isClosed(initialStage) ? localDate() : ''
  const deal = row as Deal | undefined
  if (!deal) {
    return {
      name: '',
      stage: initialStage,
      amount_cents: '',
      probability: String(stages[initialStage].probability),
      company_id: '',
      contact_id: '',
      expected_close: '',
      actual_close: defaultClose,
    }
  }
  return {
    name: deal.name,
    stage: deal.stage,
    amount_cents: formatCents(deal.amount_cents),
    probability: String(deal.probability),
    company_id: String(deal.company_id ?? ''),
    contact_id: String(deal.contact_id ?? ''),
    expected_close: deal.expected_close ?? '',
    actual_close: deal.actual_close ?? defaultClose,
  }
}

function formBody(resource: Resource, values: Values) {
  const body: RecordBody = Object.fromEntries(
    Object.entries(values).map(([field, value]) => [field, value.trim() || null]),
  )
  if (resource === 'deals') {
    body.amount_cents = parseMoney(values.amount_cents)
    body.probability = Number(values.probability)
  }
  for (const reference of ['company_id', 'contact_id']) {
    if (body[reference]) body[reference] = Number(body[reference])
  }
  return body
}

function validateForm(resource: Resource, values: Values, body: RecordBody, changingStage: boolean) {
  const fields: Record<string, string> = {}
  if (!body.name) fields.name = resource === 'contacts' ? '請輸入姓名。' : '請輸入名稱。'
  if (resource !== 'deals') return fields
  if (body.amount_cents === null) fields.amount_cents = '請輸入非負金額，最多兩位小數。'
  if (!/^\d+$/.test(values.probability) || Number(values.probability) > 100) {
    fields.probability = '請輸入 0 至 100 的整數。'
  }
  if (
    isClosed(values.stage as Stage) &&
    !changingStage &&
    (!values.actual_close || values.actual_close > localDate())
  ) {
    fields.actual_close = '請輸入今天或更早的實際結案日。'
  }
  return fields
}

function RelationSelect({
  field,
  label,
  resource,
  value,
  change,
}: {
  field: string
  label: string
  resource: 'companies' | 'contacts'
  value: string
  change: (value: string) => void
}) {
  const options = useResource<Named[]>(`/${resource}`)
  return (
    <>
      <select
        id={field}
        aria-label={label}
        value={value}
        onChange={(event) => change(event.target.value)}
        disabled={!options.data}
      >
        <option value="">未指定</option>
        {!options.data && value && <option value={value}>載入目前選擇中…</option>}
        {options.data?.map((record) => (
          <option key={record.id} value={record.id}>
            {record.name}
          </option>
        ))}
      </select>
      <Loading {...options} />
    </>
  )
}

export function RecordForm({
  resource,
  row,
  initialStage,
  onClose,
  onSaved,
}: {
  resource: Resource
  row?: RecordRow
  initialStage?: Stage
  onClose: () => void
  onSaved: () => void
}) {
  const [values, setValues] = useState(() => initialValues(resource, row, initialStage))
  const [error, setError] = useState<unknown>()
  const [busy, setBusy] = useState(false)
  const title = `${row ? '編輯' : '新增'}${resourceNames[resource]}`
  const stage = (values.stage || 'new') as Stage
  const oldStage = (row as Deal | undefined)?.stage
  const changingStage = !!oldStage && oldStage !== stage
  const setValue = (field: string, value: string) => setValues((previous) => ({ ...previous, [field]: value }))

  function selectStage(target: Stage) {
    setValues((previous) => ({
      ...previous,
      stage: target,
      probability: String(target === oldStage ? (row as Deal).probability : stages[target].probability),
      actual_close: isClosed(target) ? ((row as Deal | undefined)?.actual_close ?? localDate()) : '',
    }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError(undefined)
    const body = formBody(resource, values)
    const fields = validateForm(resource, values, body, changingStage)
    if (Object.keys(fields).length) {
      setError(new ApiError(422, { message: '請檢查標示的欄位。', fields }))
      return
    }
    if (row) {
      const previous = formBody(resource, initialValues(resource, row))
      for (const field of Object.keys(body)) {
        if (body[field] === previous[field]) delete body[field]
      }
      if (changingStage) {
        delete body.probability
        delete body.actual_close
      }
      if (Object.keys(body).length === 0) {
        onSaved()
        return
      }
    }
    setBusy(true)
    try {
      const path = row ? `/${resource}/${row.id}` : `/${resource}`
      await write(path, row ? 'PATCH' : 'POST', body)
      onSaved()
    } catch (problem) {
      setError(problem)
    } finally {
      setBusy(false)
    }
  }

  function field(name: string, label: string, input: ReactNode, required = false) {
    return (
      <div className="field">
        <label htmlFor={name}>
          {label}
          {required && <span className="required">（必填）</span>}
        </label>
        {input}
        <FieldProblem error={error} field={name} />
      </div>
    )
  }

  function text(
    name: string,
    label: string,
    options: { required?: boolean; type?: string; max?: string; disabled?: boolean } = {},
  ) {
    return field(
      name,
      label,
      <input
        id={name}
        name={name}
        type={options.type || 'text'}
        value={values[name]}
        onChange={(event) => setValue(name, event.target.value)}
        required={options.required}
        disabled={options.disabled}
        max={options.max}
        inputMode={name === 'amount_cents' ? 'decimal' : name === 'probability' ? 'numeric' : undefined}
      />,
      options.required,
    )
  }

  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <form noValidate onSubmit={submit} className="dialog-form">
        {error !== undefined && <Notice>{errorMessage(error)}</Notice>}
        <fieldset disabled={busy}>
          {text('name', resource === 'contacts' ? '姓名' : '名稱', { required: true })}
          {resource === 'companies' && (
            <>
              {text('website', '網站')}
              {text('industry', '產業')}
              {field(
                'notes',
                '備註',
                <textarea
                  id="notes"
                  value={values.notes}
                  onChange={(event) => setValue('notes', event.target.value)}
                />,
              )}
            </>
          )}
          {resource !== 'companies' &&
            field(
              'company_id',
              '所屬公司',
              <RelationSelect
                field="company_id"
                label="所屬公司"
                resource="companies"
                value={values.company_id}
                change={(value) => setValue('company_id', value)}
              />,
            )}
          {resource === 'contacts' && (
            <>
              {text('title', '職稱')}
              {text('email', '電子郵件', { type: 'email' })}
              {text('phone', '電話', { type: 'tel' })}
              {field(
                'status',
                '狀態',
                <select id="status" value={values.status} onChange={(event) => setValue('status', event.target.value)}>
                  {Object.entries(statuses).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>,
                true,
              )}
            </>
          )}
          {resource === 'deals' && (
            <>
              {field(
                'contact_id',
                '主要聯絡人',
                <RelationSelect
                  field="contact_id"
                  label="主要聯絡人"
                  resource="contacts"
                  value={values.contact_id}
                  change={(value) => setValue('contact_id', value)}
                />,
              )}
              {field(
                'stage',
                '階段',
                <select id="stage" value={stage} onChange={(event) => selectStage(event.target.value as Stage)}>
                  {Object.entries(stages).map(([value, definition]) => (
                    <option key={value} value={value}>
                      {definition.label}
                    </option>
                  ))}
                </select>,
                true,
              )}
              <div className="form-pair">
                {text('amount_cents', '金額（新臺幣）', { required: true })}
                {text('probability', '成交機率（%）', { required: true, disabled: changingStage })}
              </div>
              {changingStage && <p className="field-hint">儲存後會套用新階段的預設成交機率。</p>}
              {isClosed(stage)
                ? text('actual_close', '實際結案日', {
                    required: true,
                    type: 'date',
                    max: localDate(),
                    disabled: changingStage,
                  })
                : text('expected_close', '預計結案日', { type: 'date' })}
            </>
          )}
        </fieldset>
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={onClose} disabled={busy}>
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
