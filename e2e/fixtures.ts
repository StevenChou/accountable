import { expect, test as base, type Page } from '@playwright/test'

type Fixtures = {
  member: string | null
  sessionToken: string | null
}

export const test = base.extend<Fixtures>({
  member: ['alex@example.test', { option: true }],
  sessionToken: async ({ playwright, baseURL, member }, use) => {
    if (!member) {
      await use(null)
      return
    }
    const request = await playwright.request.newContext({ baseURL })
    try {
      const response = await request.post('/api/auth/login', {
        data: { email: member, password: 'accountable-demo' },
      })
      expect(response.status()).toBe(200)
      await use((await response.json()).token)
    } finally {
      await request.dispose()
    }
  },
  page: async ({ page, baseURL, sessionToken }, use) => {
    if (sessionToken) {
      await page.addInitScript(
        ({ url, token }) => {
          if (location.origin === url && !sessionStorage.getItem('accountable-test-signed-in')) {
            localStorage.setItem('accountable-local-session', token)
            sessionStorage.setItem('accountable-test-signed-in', '1')
          }
        },
        { url: baseURL, token: sessionToken },
      )
    }
    await use(page)
  },
  request: async ({ playwright, baseURL, sessionToken }, use) => {
    const request = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
    })
    try {
      await use(request)
    } finally {
      await request.dispose()
    }
  },
})

export async function signIn(page: Page, email = 'alex@example.test') {
  await page.getByLabel('電子郵件').fill(email)
  await page.getByLabel('密碼').fill('accountable-demo')
  await page.getByRole('button', { name: '登入', exact: true }).click()
  await expect(page.getByRole('navigation')).toBeVisible()
}

export function accountMenu(page: Page) {
  return page.getByRole('button', { name: '使用者選單' })
}

export async function chooseTheme(page: Page, name: '亮色' | '深色' | '跟隨系統') {
  const menu = accountMenu(page)
  if ((await menu.getAttribute('aria-expanded')) !== 'true') await menu.click()
  await page.getByRole('button', { name, exact: true }).click()
}
