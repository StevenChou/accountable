import { expect } from '@playwright/test'
import { test } from './fixtures'

test('頂欄查三種紀錄、從鍵盤開啟詳情並保留列表搜尋', async ({ page, request }) => {
  for (const [resource, data] of [
    ['companies', { name: 'SearchMatch 公司' }],
    ['contacts', { name: 'SearchMatch 聯絡人' }],
    ['deals', { name: 'SearchMatch 商機', stage: 'new', amount_cents: 100, probability: 10 }],
  ] as const) {
    expect((await request.post(`/api/${resource}`, { data })).status()).toBe(201)
  }
  await page.goto('/contacts')
  const search = page.getByRole('searchbox', { name: '全站搜尋' })
  const results = page.getByRole('list', { name: '搜尋結果' })
  for (const name of ['公司', '聯絡人', '商機']) {
    await search.fill(' SEARCHmAtch ')
    await expect(results.getByRole('link')).toHaveCount(3)
    const link = results.getByRole('link', { name: new RegExp(`SearchMatch ${name}`) })
    await link.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: `SearchMatch ${name}` })).toBeVisible()
    await expect(search).toHaveValue('')
  }
  await page.getByRole('navigation').getByRole('link', { name: '聯絡人', exact: true }).click()
  await page.getByRole('main').getByRole('searchbox').fill('SEARCHmatch')
  await expect(page.getByRole('row').filter({ hasText: 'SearchMatch 聯絡人' })).toBeVisible()
  await page.getByLabel('狀態篩選').selectOption('customer')
  await expect(page.getByRole('row').filter({ hasText: 'SearchMatch 聯絡人' })).toHaveCount(0)

  await page.route(
    '**/api/search?*',
    (route) =>
      route.fulfill({
        status: 503,
        json: { message: '搜尋暫時不可用。' },
      }),
    { times: 1 },
  )
  await search.fill('不可能的查詢片段')
  await expect(page.getByRole('alert')).toHaveText('搜尋暫時不可用。')
  await page.getByRole('button', { name: '重試搜尋' }).click()
  await expect(page.getByText('找不到符合的紀錄。')).toBeVisible()
  await search.fill('   ')
  await expect(page.getByText('找不到符合的紀錄。')).toHaveCount(0)
})
