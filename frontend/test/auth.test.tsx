import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import App from '../src/App'
import { company } from './fixtures'

const supabase = vi.hoisted(() => ({
  getSession: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: supabase }) }))

afterEach(() => window.localStorage.clear())

it.each(['restore', 'signIn'])('Supabase 429 在 %s 時顯示服務錯誤並可重試', async (phase) => {
  window.history.replaceState(null, '', '/missing')
  supabase.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  supabase.getSession.mockResolvedValue({ data: { session: null }, error: null })
  const limited = { data: { session: null }, error: { status: 429 } }
  if (phase === 'restore') supabase.getSession.mockResolvedValueOnce(limited)
  else supabase.signInWithPassword.mockResolvedValueOnce(limited)
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        mode: 'supabase',
        url: 'https://auth.example.test',
        publishableKey: 'sb_publishable_example',
      }),
    ),
  )
  render(<App />)
  if (phase === 'signIn') {
    await screen.findByRole('heading', { name: '登入' })
    fireEvent.change(screen.getByLabelText('電子郵件'), { target: { value: 'member@example.test' } })
    fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'example-password' } })
    fireEvent.click(screen.getByRole('button', { name: '登入' }))
  }
  expect((await screen.findByRole('alert')).textContent).toContain('無法連線到 Accountable')
})

it('帳密通過後若驗證服務暫時失敗，保留工作階段供重試', async () => {
  window.history.replaceState(null, '', '/missing')
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json({ mode: 'local' }))
    .mockResolvedValueOnce(Response.json({ token: 'valid-local-token' }))
    .mockResolvedValueOnce(Response.json({ message: '暫時無法驗證登入，請稍後重試。' }, { status: 503 }))
    .mockResolvedValueOnce(Response.json({ mode: 'local' }))
    .mockResolvedValueOnce(Response.json({ email: 'alex@example.test' }))
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await screen.findByRole('heading', { name: '登入' })
  fireEvent.change(screen.getByLabelText('電子郵件'), { target: { value: 'alex@example.test' } })
  fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'accountable-demo' } })
  fireEvent.click(screen.getByRole('button', { name: '登入' }))
  await screen.findByRole('alert')
  expect(window.localStorage.getItem('accountable-local-session')).toBe('valid-local-token')
  fireEvent.click(screen.getByRole('button', { name: '重試' }))
  expect(await screen.findByText('找不到頁面。')).toBeTruthy()
})

it('登入後保留紀錄網址，失效後移除資料與儲存的工作階段', async () => {
  window.history.replaceState(null, '', '/companies/1')
  const fetchMock = vi.fn<typeof fetch>()
  fetchMock
    .mockResolvedValueOnce(Response.json({ mode: 'local' }))
    .mockResolvedValueOnce(Response.json({ message: '請確認電子郵件與密碼。' }, { status: 401 }))
    .mockResolvedValueOnce(Response.json({ token: 'alex-local-token' }))
    .mockResolvedValueOnce(Response.json({ email: 'alex@example.test' }))
    .mockResolvedValueOnce(
      Response.json({ ...company, created_by_email: 'alex@example.test', contacts: [], deals: [] }),
    )
    .mockResolvedValueOnce(Response.json({}, { status: 401 }))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)

  expect(await screen.findByRole('heading', { name: '登入' })).toBeTruthy()
  fireEvent.change(screen.getByLabelText('電子郵件'), { target: { value: 'alex@example.test' } })
  fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'wrong' } })
  fireEvent.click(screen.getByRole('button', { name: '登入' }))
  expect((await screen.findByRole('alert')).textContent).toContain('請確認電子郵件與密碼。')
  fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'accountable-demo' } })
  fireEvent.click(screen.getByRole('button', { name: '登入' }))
  expect(await screen.findByRole('heading', { name: company.name })).toBeTruthy()
  expect(screen.getByText('新增者')).toBeTruthy()
  expect(within(screen.getByRole('main')).getByText('alex@example.test')).toBeTruthy()
  expect(window.location.pathname).toBe('/companies/1')
  expect(new Headers(fetchMock.mock.calls[4][1]?.headers).get('Authorization')).toBe('Bearer alex-local-token')

  fireEvent.click(screen.getByRole('link', { name: '商機' }))
  expect(await screen.findByRole('heading', { name: '登入' })).toBeTruthy()
  expect(screen.queryByRole('navigation')).toBeNull()
  expect(window.localStorage.getItem('accountable-local-session')).toBeNull()
})

it('驗證服務暫時不可用時保留工作階段並可以重試', async () => {
  window.localStorage.setItem('accountable-local-session', 'alex-local-token')
  window.history.replaceState(null, '', '/missing')
  vi.stubGlobal(
    'fetch',
    vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ mode: 'local' }))
      .mockResolvedValueOnce(Response.json({ message: '稍後重試。' }, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ mode: 'local' }))
      .mockResolvedValueOnce(Response.json({ email: 'alex@example.test' })),
  )
  render(<App />)
  expect((await screen.findByRole('alert')).textContent).toBe('稍後重試。')
  expect(window.localStorage.getItem('accountable-local-session')).toBe('alex-local-token')
  fireEvent.click(screen.getByRole('button', { name: '重試' }))
  expect(await screen.findByText('找不到頁面。')).toBeTruthy()
})

it('正式登入透過 Supabase，刷新權杖與登出都更新 API 身分', async () => {
  window.history.replaceState(null, '', '/missing')
  let onChange: (event: string, session: { access_token: string } | null) => void = () => undefined
  const unsubscribe = vi.fn()
  supabase.onAuthStateChange.mockImplementation((callback: typeof onChange) => {
    onChange = callback
    return { data: { subscription: { unsubscribe } } }
  })
  supabase.getSession.mockResolvedValue({ data: { session: null }, error: null })
  supabase.signInWithPassword.mockResolvedValue({ data: { session: { access_token: 'formal-member' } }, error: null })
  supabase.signOut.mockResolvedValue({})
  const fetchMock = vi.fn<typeof fetch>()
  fetchMock
    .mockResolvedValueOnce(
      Response.json({
        mode: 'supabase',
        url: 'https://auth.example.test',
        publishableKey: 'sb_publishable_example',
      }),
    )
    .mockResolvedValueOnce(Response.json({ email: 'member@example.test' }))
    .mockResolvedValueOnce(Response.json({ email: 'member@example.test' }))
    .mockResolvedValueOnce(Response.json([]))
  vi.stubGlobal('fetch', fetchMock)
  const { unmount } = render(<App />)
  expect(await screen.findByRole('heading', { name: '登入' })).toBeTruthy()
  expect(screen.queryByText(/本機帳號/)).toBeNull()
  fireEvent.change(screen.getByLabelText('電子郵件'), { target: { value: 'member@example.test' } })
  fireEvent.change(screen.getByLabelText('密碼'), { target: { value: 'example-password' } })
  fireEvent.click(screen.getByRole('button', { name: '登入' }))
  expect(await screen.findByText('找不到頁面。')).toBeTruthy()
  expect(supabase.signInWithPassword).toHaveBeenCalledWith({
    email: 'member@example.test',
    password: 'example-password',
  })
  await act(async () => onChange('TOKEN_REFRESHED', { access_token: 'refreshed-member' }))
  fireEvent.click(screen.getByRole('link', { name: '公司' }))
  expect(await screen.findByRole('heading', { name: '公司' })).toBeTruthy()
  expect(new Headers(fetchMock.mock.calls[3][1]?.headers).get('Authorization')).toBe('Bearer refreshed-member')
  fireEvent.click(screen.getByRole('button', { name: '使用者選單' }))
  fireEvent.click(screen.getByRole('button', { name: '登出' }))
  expect(await screen.findByRole('heading', { name: '登入' })).toBeTruthy()
  expect(supabase.signOut).toHaveBeenCalledWith({ scope: 'local' })
  unmount()
  expect(unsubscribe).toHaveBeenCalledOnce()
})
