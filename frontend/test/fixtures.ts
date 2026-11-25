import type { Activity, Company, Contact, Deal } from '../src/domain'

export const company: Company = {
  id: 1,
  name: '青禾製造',
  website: null,
  industry: '製造',
  notes: null,
}

export const contact: Contact = {
  id: 2,
  name: '林先生',
  company_id: company.id,
  company_name: company.name,
  title: null,
  email: null,
  phone: null,
  status: 'lead',
}

export const deal: Deal = {
  id: 3,
  name: '耗材採購',
  company_id: company.id,
  company_name: company.name,
  contact_id: contact.id,
  contact_name: contact.name,
  stage: 'proposal',
  amount_cents: 120000,
  probability: 40,
  overdue: true,
  expected_close: '2026-01-15',
  actual_close: null,
  close_date: '2026-01-15',
}

export const activity: Activity = {
  id: 4,
  kind: 'call',
  content: '確認交貨日期',
  occurred_at: '2026-01-12T08:00:00Z',
  follow_up: '2026-01-14',
  completed: false,
  owner_id: contact.id,
  owner_name: contact.name,
  owner_type: 'contacts',
}
