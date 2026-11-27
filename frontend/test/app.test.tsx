import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from '../src/App'
import type { Dashboard } from '../src/domain'
import { activity, company, contact } from './fixtures'

vi.mock('../src/auth', () => ({
  useAuth: () => ({ state: { status: 'signed-in', member: { email: 'alex@example.test' } } }),
}))

const fetchMock = vi.fn<typeof fetch>()
const months = ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01'].map((month) => ({
  month,
  count: Number(month === '2026-01'),
  amount_cents: month === '2026-01' ? 123456 : 0,
}))
const dashboard: Dashboard = {
  today: '2026-01-14',
  months,
  won: months[5],
  open: { count: 1, amount_cents: 120000, expected_cents: 48000 },
  stage_amounts: [{ stage: 'proposal', amount_cents: 120000 }],
  recent: [activity],
  follow_ups: [{ ...activity, group: 'today' }],
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  window.localStorage.removeItem('accountable-theme')
  delete document.documentElement.dataset.theme
})

it('首頁顯示成交圖表，更新跟進失敗時保留待辦供重試', async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json(dashboard))
    .mockResolvedValueOnce(Response.json({ message: '稍後重試。' }, { status: 409 }))
    .mockResolvedValueOnce(Response.json({ ...activity, completed: true }))
    .mockResolvedValueOnce(Response.json({ ...dashboard, follow_ups: [] }))
  render(<App />)

  expect(await screen.findByRole('img', { name: /每月成交金額折線圖.*NT\$1,234\.56/ })).toBeTruthy()
  expect(screen.getByRole('img', { name: /每月成交筆數長條圖.*1月 1 筆/ })).toBeTruthy()
  expect(screen.getByRole('link', { name: '開啟看板' }).getAttribute('href')).toBe('/pipeline')
  fireEvent.click(screen.getByRole('button', { name: '標記完成' }))
  await screen.findByText('稍後重試。')
  fireEvent.click(screen.getByRole('button', { name: '標記完成' }))
  await screen.findByText('目前沒有待跟進事項。')
  expect(screen.getByText(activity.content)).toBeTruthy()
  expect(fetchMock).toHaveBeenNthCalledWith(
    3,
    '/api/activities/4',
    expect.objectContaining({
      method: 'PATCH',
      body: '{"completed":true}',
    }),
  )
})

it('可由近期活動開啟聯絡人的時間軸', async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json(dashboard))
    .mockResolvedValueOnce(Response.json(contact))
    .mockResolvedValueOnce(Response.json([activity]))
  render(<App />)

  const link = (await screen.findAllByRole('link', { name: contact.name }))[0]
  expect(link.getAttribute('href')).toBe('/contacts/2#timeline')
  fireEvent.click(link)
  expect(await screen.findByRole('heading', { name: contact.name })).toBeTruthy()
  const timeline = await screen.findByRole('region', { name: '活動時間軸' })
  expect(await within(timeline).findByText(activity.content)).toBeTruthy()
  expect(screen.getByRole('link', { name: company.name }).getAttribute('href')).toBe('/companies/1')
})

it('找不到頁面時可返回儀表板', async () => {
  window.history.replaceState(null, '', '/missing')
  fetchMock.mockResolvedValueOnce(Response.json({ ...dashboard, recent: [], follow_ups: [] }))
  render(<App />)

  fireEvent.click(screen.getByRole('link', { name: '返回儀表板' }))
  expect(await screen.findByText('目前沒有近期活動。')).toBeTruthy()
})

it('共用頁首可用鍵盤切換，跨頁仍維持選擇', async () => {
  window.history.replaceState(null, '', '/missing')
  fetchMock.mockResolvedValueOnce(Response.json([company]))
  const user = userEvent.setup()
  render(<App />)

  const menu = screen.getByRole('button', { name: '使用者選單' })
  menu.focus()
  await user.keyboard('{Enter}')
  const dark = screen.getByRole('button', { name: '深色' })
  dark.focus()
  await user.keyboard(' ')
  expect(dark.getAttribute('aria-pressed')).toBe('true')
  expect(document.documentElement.dataset.theme).toBe('dark')

  await user.click(screen.getByRole('link', { name: '公司' }))
  expect(await screen.findByRole('link', { name: company.name })).toBeTruthy()
  expect(document.documentElement.dataset.theme).toBe('dark')

  window.history.back()
  expect(await screen.findByText('找不到頁面。')).toBeTruthy()
  await user.click(menu)
  expect(screen.getByRole('button', { name: '深色', pressed: true })).toBeTruthy()
  await user.click(screen.getByRole('button', { name: '亮色' }))
  expect(document.documentElement.dataset.theme).toBe('light')
})
