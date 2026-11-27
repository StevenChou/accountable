import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { readInitialTheme, saveTheme } from './theme'

beforeEach(() => {
  document.documentElement.dataset.themeStorageKey = 'accountable-theme'
})

afterEach(() => {
  window.localStorage.removeItem('accountable-theme')
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.themePreference
  delete document.documentElement.dataset.themeStorageKey
})

it('文件尚未套用有效主題時使用亮色', () => {
  expect(readInitialTheme()).toBe('light')
  document.documentElement.dataset.theme = 'unknown'
  expect(readInitialTheme()).toBe('light')
})

it.each(['dark', 'light'] as const)('套用並儲存 %s 主題', (theme) => {
  saveTheme(theme)

  expect(document.documentElement.dataset.theme).toBe(theme)
  expect(window.localStorage.getItem('accountable-theme')).toBe(theme)
  expect(readInitialTheme()).toBe(theme)
})

it('瀏覽器拒絕儲存時仍可套用主題', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage unavailable', 'SecurityError')
  })

  saveTheme('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(window.localStorage.getItem('accountable-theme')).toBeNull()
})

it('系統偏好與解析後的首屏配色各自保留', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  saveTheme('system')
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(window.localStorage.getItem('accountable-theme')).toBe('system')
  expect(readInitialTheme()).toBe('system')
})
