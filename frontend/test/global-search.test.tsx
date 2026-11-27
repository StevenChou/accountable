import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { expect, it, vi } from 'vitest'
import { GlobalSearch } from '../src/components/GlobalSearch'

function renderSearch() {
  render(
    <MemoryRouter>
      <GlobalSearch />
      <Routes>
        <Route path="/contacts/2" element={<h1>聯絡人詳情</h1>} />
      </Routes>
    </MemoryRouter>,
  )
  return screen.getByRole('searchbox', { name: '全站搜尋' })
}

it('較舊的搜尋回應不覆蓋目前結果，並能用鍵盤開啟詳情', async () => {
  let completeFirst: (response: Response) => void = () => undefined
  const first = new Promise<Response>((resolve) => (completeFirst = resolve))
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockReturnValueOnce(first)
    .mockResolvedValueOnce(Response.json([{ resource: 'contacts', id: 2, name: '目前結果' }]))
  vi.stubGlobal('fetch', fetchMock)
  const input = renderSearch()

  fireEvent.change(input, { target: { value: '前一筆' } })
  expect(await screen.findByText('搜尋中…')).toBeTruthy()
  fireEvent.change(input, { target: { value: '  目前  ' } })
  const result = await screen.findByRole('link', { name: /目前結果/ })
  expect(fetchMock.mock.calls[1][0]).toBe('/api/search?q=%E7%9B%AE%E5%89%8D')
  expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true)
  await act(async () => completeFirst(Response.json([{ resource: 'deals', id: 3, name: '前一筆結果' }])))
  expect(screen.queryByText('前一筆結果')).toBeNull()

  const user = userEvent.setup()
  input.focus()
  await user.tab()
  expect(document.activeElement).toBe(result)
  await user.keyboard('{Enter}')
  expect(await screen.findByRole('heading', { name: '聯絡人詳情' })).toBeTruthy()
  expect((input as HTMLInputElement).value).toBe('')
})

it('搜尋失敗時可重試，清空輸入移除無結果提示', async () => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ message: '搜尋失敗，請重試。' }, { status: 503 }))
      .mockResolvedValueOnce(Response.json([])),
  )
  const input = renderSearch()
  fireEvent.change(input, { target: { value: '測試' } })
  expect(await screen.findByRole('alert')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: '重試搜尋' }))
  expect(await screen.findByText('找不到符合的紀錄。')).toBeTruthy()
  fireEvent.change(input, { target: { value: ' ' } })
  expect(screen.queryByText('找不到符合的紀錄。')).toBeNull()
})
