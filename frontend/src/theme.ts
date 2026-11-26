export type Theme = 'light' | 'dark'

const themePreference = 'accountable-theme'

export function readTheme(): Theme {
  try {
    return window.localStorage.getItem(themePreference) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

export function saveTheme(theme: Theme) {
  applyTheme(theme)
  try {
    window.localStorage.setItem(themePreference, theme)
  } catch {
    // The current page can still use the selected theme when storage is unavailable.
  }
}
