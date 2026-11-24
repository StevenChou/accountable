import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { RecordList } from '../pages/RecordList'
import { RecordForm } from './RecordForm'
import { Overdue } from './Common'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  HTMLDialogElement.prototype.showModal ??= function () { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close ??= function () { this.removeAttribute('open') }
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

it('狀態篩選及搜尋可同時使用', async () => {
  fetchMock.mockResolvedValueOnce(Response.json([
    { id: 1, name: 'Amy', email: 'alpha@example.com', status: 'lead' },
    { id: 2, name: 'Aaron', email: 'alpha@example.com', status: 'customer' },
    { id: 3, name: 'Bella', email: 'beta@example.com', status: 'lead' },
  ]))
  render(<MemoryRouter><RecordList resource="contacts" /></MemoryRouter>)
  await screen.findByRole('link', { name: 'Amy' })
  fireEvent.change(screen.getByLabelText('狀態篩選'), { target: { value: 'lead' } })
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '  ALPHA  ' } })
  expect(screen.getByRole('link', { name: 'Amy' })).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Bella' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Aaron' })).toBeNull()
})

it('商機金額依數值排序並沿用伺服器的逾期標示', async () => {
  fetchMock.mockResolvedValueOnce(Response.json([
    { id: 1, name: '低價', stage: 'new', amount_cents: 90000, probability: 10, overdue: true },
    { id: 2, name: '高價', stage: 'proposal', amount_cents: 1000000, probability: 50, overdue: false },
  ]))
  render(<MemoryRouter><RecordList resource="deals" /></MemoryRouter>)
  await screen.findByText('NT$10,000')
  fireEvent.click(screen.getByRole('button', { name: '金額' }))
  fireEvent.click(screen.getByRole('button', { name: '金額' }))
  const rows = screen.getAllByRole('row').slice(1)
  expect(within(rows[0]).getByText('NT$900')).toBeTruthy()
  expect(within(rows[0]).getByText('逾期')).toBeTruthy()
  expect(within(rows[1]).queryByText('逾期')).toBeNull()
  const tag = render(<Overdue overdue />)
  expect(within(tag.container).getByText('逾期')).toBeTruthy()
})

it('必填驗證及儲存失敗保留輸入', async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ message: '無法儲存，請重試。' }, { status: 500 }))
  const onSaved = vi.fn()
  render(<RecordForm resource="companies" onSaved={onSaved} onClose={vi.fn()} />)
  fireEvent.click(screen.getByRole('button', { name: '儲存' }))
  expect(screen.getByText('請輸入名稱。')).toBeTruthy()
  expect(fetchMock).not.toHaveBeenCalled()
  const name = screen.getByLabelText(/名稱/)
  fireEvent.change(name, { target: { value: '測試公司' } })
  fireEvent.click(screen.getByRole('button', { name: '儲存' }))
  await screen.findByText('無法儲存，請重試。')
  expect((name as HTMLInputElement).value).toBe('測試公司')
  expect(onSaved).not.toHaveBeenCalled()
})

it('排序選填結案日時，空白日期在升冪與降冪都排在最後', async () => {
  const dates = ['2026-05-01', null, '2026-08-01', '2026-02-01', null]
  fetchMock.mockResolvedValueOnce(Response.json(dates.map((date, index) => ({
    id: index + 1, name: `商機 ${index}`, stage: 'new', amount_cents: 100, probability: 10, close_date: date,
  }))))
  render(<MemoryRouter><RecordList resource="deals" /></MemoryRouter>)
  await screen.findByText('2026-05-01')
  const sort = screen.getByRole('button', { name: '結案日' })
  const cells = () => screen.getAllByRole('row').slice(1).map(row => within(row).getAllByRole('cell')[6].textContent?.trim())
  fireEvent.click(sort)
  expect(cells()).toEqual(['2026-02-01', '2026-05-01', '2026-08-01', '—', '—'])
  fireEvent.click(sort)
  expect(cells()).toEqual(['2026-08-01', '2026-05-01', '2026-02-01', '—', '—'])
})
