export type Theme = 'light' | 'dark'

export function readInitialTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function saveTheme(theme: Theme) {
  const { dataset } = document.documentElement
  dataset.theme = theme
  const key = dataset.themeStorageKey
  if (!key) return

  try {
    window.localStorage.setItem(key, theme)
  } catch {
    // The current page can still use the selected theme when storage is unavailable.
  }
}
