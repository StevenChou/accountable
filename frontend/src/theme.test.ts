import { afterEach, expect, it, vi } from 'vitest'
import { readTheme, saveTheme } from './theme'

afterEach(() => {
  window.localStorage.removeItem('accountable-theme')
  delete document.documentElement.dataset.theme
})

it('尚未選擇或偏好無效時使用亮色', () => {
  expect(readTheme()).toBe('light')
  window.localStorage.setItem('accountable-theme', 'unknown')
  expect(readTheme()).toBe('light')
})

it.each(['dark', 'light'] as const)('套用並儲存 %s 主題', (theme) => {
  saveTheme(theme)

  expect(document.documentElement.dataset.theme).toBe(theme)
  expect(window.localStorage.getItem('accountable-theme')).toBe(theme)
  expect(readTheme()).toBe(theme)
})

it('瀏覽器拒絕儲存時預設亮色，仍可套用主題', () => {
  const error = new DOMException('Storage unavailable', 'SecurityError')
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw error
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw error
  })

  expect(readTheme()).toBe('light')
  saveTheme('dark')
  expect(document.documentElement.dataset.theme).toBe('dark')
})
