import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { UserMenu } from '../src/components/UserMenu'
import { useTheme } from '../src/theme'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.themePreference
  delete document.documentElement.dataset.themeStorageKey
})

it('鍵盤可操作選單、復原焦點並登出', async () => {
  const user = userEvent.setup()
  const signOut = vi.fn()
  render(<UserMenu email="a@example.test" theme="light" changeTheme={vi.fn()} signOut={signOut} />)
  const trigger = screen.getByRole('button', { name: '使用者選單' })
  expect(trigger.textContent).toBe('A')
  trigger.focus()
  await user.keyboard('{Enter}')
  expect(screen.getByRole('button', { name: '亮色', pressed: true })).toBeTruthy()
  await user.tab()
  await user.keyboard('{Escape}')
  expect(trigger.getAttribute('aria-expanded')).toBe('false')
  expect(document.activeElement).toBe(trigger)
  await user.keyboard(' ')
  await user.click(screen.getByRole('button', { name: '登出' }))
  expect(signOut).toHaveBeenCalledTimes(1)
})

it('系統模式訂閱配色變化，改為固定模式即移除監聽', async () => {
  let listener: ((event: MediaQueryListEvent) => void) | undefined
  const remove = vi.fn()
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: (_type: string, handler: typeof listener) => (listener = handler),
      removeEventListener: remove,
    })),
  )
  document.documentElement.dataset.themeStorageKey = 'accountable-theme'
  function TestMenu() {
    const [theme, changeTheme] = useTheme('light')
    return <UserMenu email="alex@example.test" theme={theme} changeTheme={changeTheme} signOut={vi.fn()} />
  }
  const user = userEvent.setup()
  render(<TestMenu />)
  await user.click(screen.getByRole('button', { name: '使用者選單' }))
  await user.click(screen.getByRole('button', { name: '跟隨系統' }))
  expect(localStorage.getItem('accountable-theme')).toBe('system')
  expect(document.documentElement.dataset.theme).toBe('light')
  act(() => listener?.(Object.assign(new Event('change'), { matches: true }) as MediaQueryListEvent))
  expect(document.documentElement.dataset.theme).toBe('dark')
  await user.click(screen.getByRole('button', { name: '亮色' }))
  expect(remove).toHaveBeenCalledWith('change', listener)
  expect(localStorage.getItem('accountable-theme')).toBe('light')
  expect(document.documentElement.dataset.theme).toBe('light')
})
