import { expect } from '@playwright/test'
import { accountMenu, signIn, test } from './fixtures'

test.use({ member: null })

test('未登入受保護，兩位成員可共用及編輯資料，登出後仍須登入', async ({ page, request }) => {
  for (const path of ['/', '/pipeline', '/companies', '/companies/1', '/contacts/1', '/deals/1', '/missing']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: '登入' })).toBeVisible()
    await expect(page.getByRole('navigation')).toHaveCount(0)
  }
  expect((await request.get('/api/companies')).status()).toBe(401)
  expect((await request.post('/api/companies', { data: { name: '未驗證寫入' } })).status()).toBe(401)
  expect((await request.get('/api/search?q=crm')).status()).toBe(401)

  await page.goto('/companies/1')
  await signIn(page)
  await expect(page).toHaveURL(/\/companies\/1$/)
  await page.getByRole('navigation').getByRole('link', { name: '公司', exact: true }).click()
  await page.getByRole('button', { name: '新增公司' }).click()
  await page.getByRole('dialog').getByLabel(/名稱/).fill('多人共享測試公司')
  await page.getByRole('button', { name: '儲存', exact: true }).click()
  await page.getByRole('link', { name: '多人共享測試公司' }).click()
  await expect(page.getByRole('main').getByText('alex@example.test', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: '多人共享測試公司' })).toBeVisible()

  await accountMenu(page).click()
  await page.getByRole('button', { name: '登出' }).click()
  await expect(page.getByRole('heading', { name: '登入' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: '登入' })).toBeVisible()
  await signIn(page, 'sam@example.test')
  await page.getByRole('button', { name: '編輯公司' }).click()
  await page.getByRole('dialog').getByLabel(/名稱/).fill('由 Sam 更新的共享公司')
  await page.getByRole('button', { name: '儲存', exact: true }).click()
  await expect(page.getByRole('heading', { name: '由 Sam 更新的共享公司' })).toBeVisible()
  await expect(page.getByRole('main').getByText('alex@example.test', { exact: true })).toBeVisible()
})

test('登入驗證暫時中斷後可重試', async ({ page }) => {
  await page.route(
    '**/api/auth/config',
    (route) =>
      route.fulfill({
        status: 503,
        json: { message: '暫時無法驗證登入，請稍後重試。' },
      }),
    { times: 1 },
  )
  await page.goto('/companies/1')
  await expect(page.getByRole('alert')).toContainText('暫時無法驗證登入')
  await page.getByRole('button', { name: '重試' }).click()
  await signIn(page)
  await expect(page).toHaveURL(/\/companies\/1$/)
})
