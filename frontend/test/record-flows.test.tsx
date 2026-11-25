import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import { DeleteRecord } from '../src/components/DeleteRecord'
import { RecordForm } from '../src/components/RecordForm'
import { Timeline } from '../src/components/Timeline'
import { RecordDetail } from '../src/pages/RecordDetail'
import { activity, company, contact, deal } from './fixtures'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

it('刪除影響有異動時，必須用新筆數再次確認', async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json({ activities: 0, follow_ups: 0 }))
    .mockResolvedValueOnce(
      Response.json(
        { message: '影響的紀錄已變更，請再次確認。', impact: { activities: 1, follow_ups: 1 } },
        { status: 409 },
      ),
    )
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
  const onDeleted = vi.fn()
  render(<DeleteRecord resource="deals" row={deal} onClose={vi.fn()} onDeleted={onDeleted} />)

  await screen.findByText(/會刪除 0 筆活動/)
  fireEvent.click(screen.getByRole('button', { name: '確認刪除' }))
  await screen.findByText(/會刪除 1 筆活動/)
  expect(onDeleted).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: '確認刪除' }))
  await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce())
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/deals/3?activities=1&follow_ups=1',
    expect.objectContaining({ method: 'DELETE' }),
  )
})

it('既有商機換階段時，只送出使用者實際修改的欄位', async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json([company]))
    .mockResolvedValueOnce(Response.json([contact]))
    .mockResolvedValueOnce(Response.json({ ...deal, stage: 'won' }))
  const onSaved = vi.fn()
  render(<RecordForm resource="deals" row={deal} onClose={vi.fn()} onSaved={onSaved} />)

  await screen.findByRole('option', { name: contact.name })
  fireEvent.change(screen.getByLabelText(/階段/), { target: { value: 'won' } })
  expect(screen.getByLabelText(/實際結案日/)).toHaveProperty('disabled', true)
  expect(screen.getByLabelText(/成交機率/)).toHaveProperty('value', '100')
  fireEvent.click(screen.getByRole('button', { name: '儲存' }))
  await waitFor(() => expect(onSaved).toHaveBeenCalledOnce())
  expect(fetchMock).toHaveBeenLastCalledWith(
    '/api/deals/3',
    expect.objectContaining({ method: 'PATCH', body: '{"stage":"won"}' }),
  )
})

it('已結案商機必須填入有效的金額、機率和結案日', async () => {
  fetchMock.mockResolvedValueOnce(Response.json([])).mockResolvedValueOnce(Response.json([]))
  const onSaved = vi.fn()
  render(<RecordForm resource="deals" onClose={vi.fn()} onSaved={onSaved} initialStage="won" />)

  await waitFor(() => expect(screen.getByLabelText('主要聯絡人')).toHaveProperty('disabled', false))
  fireEvent.change(screen.getByLabelText(/成交機率/), { target: { value: '101' } })
  fireEvent.change(screen.getByLabelText(/實際結案日/), { target: { value: '9999-01-01' } })
  fireEvent.click(screen.getByRole('button', { name: '儲存' }))
  expect(screen.getByText('請輸入非負金額，最多兩位小數。')).toBeTruthy()
  expect(screen.getByText('請輸入 0 至 100 的整數。')).toBeTruthy()
  expect(screen.getByText('請輸入今天或更早的實際結案日。')).toBeTruthy()
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(onSaved).not.toHaveBeenCalled()
})

it('新增待跟進活動時，先驗證內容並保留選定類型與日期', async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json([]))
    .mockResolvedValueOnce(Response.json(activity, { status: 201 }))
    .mockResolvedValueOnce(Response.json([activity]))
  render(<Timeline resource="contacts" id={contact.id} />)

  await screen.findByText('目前沒有活動紀錄。')
  fireEvent.click(screen.getByRole('button', { name: '新增活動' }))
  fireEvent.click(screen.getByRole('button', { name: '儲存' }))
  expect(screen.getByText('請輸入活動內容。')).toBeTruthy()
  fireEvent.change(screen.getByLabelText(/內容/), { target: { value: '  確認交貨日期  ' } })
  fireEvent.change(screen.getByLabelText(/活動類型/), { target: { value: 'call' } })
  fireEvent.change(screen.getByLabelText(/跟進日期/), { target: { value: '2026-01-14' } })
  fireEvent.click(screen.getByRole('button', { name: '儲存' }))
  await screen.findByText(activity.content)
  expect(screen.getByText('待跟進')).toBeTruthy()
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    '/api/contacts/2/activities',
    expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ kind: 'call', content: activity.content, follow_up: '2026-01-14' }),
    }),
  )
})

it('編輯、完成及刪除待跟進活動會更新時間軸', async () => {
  const updated = { ...activity, content: '更新交貨日期' }
  const done = { ...updated, completed: true }
  const system = { ...activity, id: 5, kind: 'stage', follow_up: null, content: '從提案移至議價' }
  fetchMock
    .mockResolvedValueOnce(Response.json([system, activity]))
    .mockResolvedValueOnce(Response.json(updated))
    .mockResolvedValueOnce(Response.json([system, updated]))
    .mockResolvedValueOnce(Response.json(done))
    .mockResolvedValueOnce(Response.json([system, done]))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(Response.json([system]))
  render(<Timeline resource="deals" id={deal.id} />)

  await screen.findByText(activity.content)
  expect(screen.getAllByRole('button', { name: '編輯' })).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: '編輯' }))
  fireEvent.change(screen.getByLabelText(/內容/), { target: { value: updated.content } })
  fireEvent.click(screen.getByRole('button', { name: '儲存' }))
  await screen.findByText(updated.content)
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    '/api/activities/4',
    expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ content: updated.content }),
    }),
  )

  fireEvent.click(screen.getByRole('button', { name: '標記完成' }))
  await screen.findByText('已完成')
  fireEvent.click(screen.getByRole('button', { name: '刪除' }))
  const dialog = screen.getByRole('dialog', { name: '刪除活動' })
  fireEvent.click(within(dialog).getByRole('button', { name: '確認刪除' }))
  await waitFor(() => expect(screen.queryByText(updated.content)).toBeNull())
  expect(screen.getByText(system.content)).toBeTruthy()
  expect(fetchMock).toHaveBeenNthCalledWith(6, '/api/activities/4', expect.objectContaining({ method: 'DELETE' }))
})

it('公司詳情可開啟聯絡人及商機，商機詳情會載入時間軸', async () => {
  fetchMock
    .mockResolvedValueOnce(Response.json({ ...company, contacts: [contact], deals: [deal] }))
    .mockResolvedValueOnce(Response.json(deal))
    .mockResolvedValueOnce(Response.json([activity]))
  render(
    <MemoryRouter initialEntries={['/companies/1']}>
      <Routes>
        <Route path="/companies/:id" element={<RecordDetail key="companies" resource="companies" />} />
        <Route path="/deals/:id" element={<RecordDetail key="deals" resource="deals" />} />
      </Routes>
    </MemoryRouter>,
  )

  expect((await screen.findByRole('link', { name: contact.name })).getAttribute('href')).toBe('/contacts/2')
  fireEvent.click(screen.getByRole('link', { name: deal.name }))
  await screen.findByText(activity.content)
  expect(screen.getByRole('heading', { name: deal.name })).toBeTruthy()
  expect(screen.getByText('逾期')).toBeTruthy()
  expect(screen.getByRole('link', { name: company.name }).getAttribute('href')).toBe('/companies/1')
})

it('找不到已刪除的紀錄時可返回原列表', async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ message: '找不到這筆紀錄。' }, { status: 404 }))
  render(
    <MemoryRouter initialEntries={['/contacts/99']}>
      <Routes>
        <Route path="/contacts/:id" element={<RecordDetail resource="contacts" />} />
      </Routes>
    </MemoryRouter>,
  )

  await screen.findByText('找不到這筆紀錄，可能已刪除。')
  expect(screen.getByRole('link', { name: /返回聯絡人列表/ }).getAttribute('href')).toBe('/contacts')
  expect(screen.queryByRole('button', { name: '編輯聯絡人' })).toBeNull()
})

it('在公司詳情編輯名稱，儲存後會重新讀取紀錄', async () => {
  const initial = { ...company, contacts: [], deals: [] }
  const updated = { ...initial, name: '青禾工業' }
  fetchMock
    .mockResolvedValueOnce(Response.json(initial))
    .mockResolvedValueOnce(Response.json(updated))
    .mockResolvedValueOnce(Response.json(updated))
  render(
    <MemoryRouter initialEntries={['/companies/1']}>
      <Routes>
        <Route path="/companies/:id" element={<RecordDetail resource="companies" />} />
      </Routes>
    </MemoryRouter>,
  )

  fireEvent.click(await screen.findByRole('button', { name: '編輯公司' }))
  fireEvent.change(screen.getByLabelText(/名稱/), { target: { value: updated.name } })
  fireEvent.click(screen.getByRole('button', { name: '儲存' }))
  expect(await screen.findByRole('heading', { name: updated.name })).toBeTruthy()
  expect(fetchMock).toHaveBeenNthCalledWith(
    2,
    '/api/companies/1',
    expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ name: updated.name }),
    }),
  )
})

it('新增聯絡人時驗證姓名，並以識別碼送出選定的公司', async () => {
  fetchMock.mockResolvedValueOnce(Response.json([company])).mockResolvedValueOnce(Response.json(contact))
  const onSaved = vi.fn()
  render(<RecordForm resource="contacts" onClose={vi.fn()} onSaved={onSaved} />)

  await screen.findByRole('option', { name: company.name })
  fireEvent.click(screen.getByRole('button', { name: '儲存' }))
  expect(screen.getByText('請輸入姓名。')).toBeTruthy()
  fireEvent.change(screen.getByLabelText(/姓名/), { target: { value: contact.name } })
  fireEvent.change(screen.getByLabelText('所屬公司'), { target: { value: String(company.id) } })
  fireEvent.change(screen.getByLabelText(/狀態/), { target: { value: 'qualified' } })
  fireEvent.click(screen.getByRole('button', { name: '儲存' }))
  await waitFor(() => expect(onSaved).toHaveBeenCalledOnce())
  expect(fetchMock).toHaveBeenLastCalledWith('/api/contacts', expect.objectContaining({ method: 'POST' }))
  expect(JSON.parse(String(fetchMock.mock.lastCall?.[1]?.body))).toMatchObject({
    name: contact.name,
    company_id: company.id,
    status: 'qualified',
  })
})
