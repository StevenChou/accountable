import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

const systemColors = '(prefers-color-scheme: dark)'

export function readInitialTheme(): Theme {
  const { themePreference, theme } = document.documentElement.dataset
  if (themePreference === 'system') return 'system'
  return theme === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme: Theme, dark = window.matchMedia?.(systemColors).matches ?? false) {
  const { dataset } = document.documentElement
  dataset.themePreference = theme
  dataset.theme = theme === 'system' ? (dark ? 'dark' : 'light') : theme
}

export function saveTheme(theme: Theme) {
  applyTheme(theme)
  const { dataset } = document.documentElement
  const key = dataset.themeStorageKey
  if (!key) return

  try {
    window.localStorage.setItem(key, theme)
  } catch {
    // The current page can still use the selected theme when storage is unavailable.
  }
}

export function useTheme(initial: Theme) {
  const [theme, setTheme] = useState(initial)
  useEffect(() => {
    if (theme !== 'system') return
    const preference = window.matchMedia?.(systemColors)
    if (!preference) return
    const update = (event: MediaQueryListEvent) => applyTheme('system', event.matches)
    applyTheme('system', preference.matches)
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [theme])

  function change(next: Theme) {
    saveTheme(next)
    setTheme(next)
  }
  return [theme, change] as const
}
