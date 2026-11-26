export const stages = {
  new: { label: '新商機', probability: 10 },
  qualified: { label: '已確認', probability: 25 },
  proposal: { label: '提案', probability: 50 },
  negotiation: { label: '議價', probability: 75 },
  won: { label: '成交', probability: 100 },
  lost: { label: '失單', probability: 0 },
} as const

export const statuses = { lead: '潛在客戶', qualified: '已確認', customer: '既有客戶' } as const
export const activityKinds = { note: '備註', call: '通話', email: '電子郵件', stage: '階段變更' } as const
export const followUpGroups = { late: '逾期', today: '今天', soon: '七天內', later: '稍後' } as const
export const resourceNames = { companies: '公司', contacts: '聯絡人', deals: '商機' } as const

export type Stage = keyof typeof stages
export type Status = keyof typeof statuses
export type Resource = keyof typeof resourceNames
export type Named = { id: number; name: string }
export type Company = Named & { website: string | null; industry: string | null; notes: string | null }
export type Contact = Named & {
  company_id: number | null
  company_name: string | null
  title: string | null
  email: string | null
  phone: string | null
  status: Status
}
export type Deal = Named & {
  company_id: number | null
  company_name: string | null
  contact_id: number | null
  contact_name: string | null
  stage: Stage
  amount_cents: number
  probability: number
  overdue: boolean
  expected_close: string | null
  actual_close: string | null
  close_date: string | null
}
export type Rows = { companies: Company; contacts: Contact; deals: Deal }
export type Activity = {
  id: number
  kind: keyof typeof activityKinds
  content: string
  occurred_at: string
  follow_up: string | null
  completed: boolean
  owner_id: number
  owner_name: string
  owner_type: 'contacts' | 'deals'
}
type Cents = number | string
export type Totals = { count: number; amount_cents: Cents; expected_cents: Cents }
export type Lane = { stage: Stage; cards: Deal[]; count: number; totals: Totals }
export type Pipeline = { lanes: Lane[]; totals: Totals }
type Monthly = { month: string; count: number; amount_cents: Cents }
export type Dashboard = {
  today: string
  won: Monthly
  open: Totals
  months: Monthly[]
  stage_amounts: { stage: Stage; amount_cents: Cents }[]
  recent: Activity[]
  follow_ups: (Activity & { group: keyof typeof followUpGroups })[]
}

export function isClosed(stage: Stage) {
  return stage === 'won' || stage === 'lost'
}

const currency = new Intl.NumberFormat('zh-TW')
const dateTime = new Intl.DateTimeFormat('zh-TW', { dateStyle: 'short', timeStyle: 'short' })

export function money(cents: Cents) {
  return `NT$${formatCents(cents, true)}`
}

export function formatCents(cents: Cents, group = false) {
  const amount = BigInt(cents)
  const magnitude = amount < 0n ? -amount : amount
  const whole = magnitude / 100n
  const decimal = String(magnitude % 100n)
    .padStart(2, '0')
    .replace(/0+$/, '')
  return `${amount < 0n ? '-' : ''}${group ? currency.format(whole) : whole}${decimal ? `.${decimal}` : ''}`
}

export function parseMoney(value: string): number | null {
  const trimmed = value.trim()
  if (!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(trimmed)) return null
  const [whole, fraction = ''] = trimmed.split('.')
  const cents = Number(whole + fraction.padEnd(2, '0'))
  return Number.isSafeInteger(cents) ? cents : null
}

export function localDate(value = new Date()) {
  const fields = [value.getFullYear(), value.getMonth() + 1, value.getDate()]
  return fields.map((field) => String(field).padStart(2, '0')).join('-')
}

export function localDateTime(value: Date) {
  const time = [value.getHours(), value.getMinutes()].map((field) => String(field).padStart(2, '0')).join(':')
  return `${localDate(value)}T${time}`
}

export function displayTime(value: string) {
  return dateTime.format(new Date(value))
}

export function matchesSearch(query: string, values: (string | null)[]) {
  const term = query.trim().toLowerCase()
  return !term || values.some((value) => value?.toLowerCase().includes(term))
}
