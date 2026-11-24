import { execFileSync } from 'node:child_process'
import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { localDate } from '../frontend/src/domain'

test.beforeEach(() => {
  execFileSync('uv', ['run', '--no-sync', 'python', '-m', 'backend.seed'], { stdio: 'pipe' })
})

async function create(request: APIRequestContext, route: string, data: object) {
  const response = await request.post(`/api/${route}`, { data })
  expect(response.status(), await response.text()).toBe(201)
  return await response.json()
}

async function removeDeals(request: APIRequestContext) {
  const all = await (await request.get('/api/deals')).json()
  for (const deal of all) {
    const path = `/api/deals/${deal.id}`
    const params = await (await request.get(`${path}/delete-impact`)).json()
    expect((await request.delete(path, { params })).status()).toBe(204)
  }
}

async function drag(page: Page, name: string, slot: string) {
  const handle = page.getByRole('button', { name: `拖曳 ${name}`, exact: true })
  const target = page.getByTestId(slot)
  await handle.scrollIntoViewIfNeeded()
  await target.scrollIntoViewIfNeeded()
  const origin = await handle.boundingBox()
  const destination = await target.boundingBox()
  if (!origin || !destination) throw new Error('找不到拖曳位置')
  await page.mouse.move(origin.x + origin.width / 2, origin.y + origin.height / 2)
  await page.mouse.down()
  await page.mouse.move(origin.x + origin.width / 2 - 6, origin.y + origin.height / 2, { steps: 3 })
  await page.mouse.move(destination.x + destination.width / 2, destination.y + destination.height / 2, { steps: 14 })
  await page.mouse.up()
}

test('本機資源載入與五個功能區塊、連結及瀏覽器歷史', async ({ page, context, baseURL }) => {
  const blocked: string[] = []
  const consoleErrors: string[] = []
  page.on('pageerror', error => consoleErrors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  await context.route('**/*', route => {
    if (new URL(route.request().url()).origin === baseURL) return route.continue()
    blocked.push(route.request().url())
    return route.abort()
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '待跟進事項' })).toBeVisible()
  await expect(page.getByRole('img', { name: /成交金額折線圖/ })).toBeVisible()
  await expect(page.getByRole('img', { name: /成交筆數長條圖/ })).toBeVisible()
  const nav = page.getByRole('navigation')
  for (const [name, item] of [
    ['公司', '青禾製造'],
    ['聯絡人', '陳思妤'],
    ['商機', '產線稽核系統'],
    ['商機看板', '年度保養方案'],
  ]) {
    await nav.getByRole('link', { name, exact: true }).click()
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: item, exact: true })).toBeVisible()
  }
  await nav.getByRole('link', { name: '公司', exact: true }).click()
  await page.getByRole('link', { name: '青禾製造', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('heading', { name: '青禾製造' })).toBeVisible()
  await page.getByRole('link', { name: '陳思妤', exact: true }).click()
  await expect(page.getByRole('heading', { name: '陳思妤' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: '青禾製造' })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('heading', { name: '陳思妤' })).toBeVisible()
  expect(blocked).toEqual([])
  expect(consoleErrors).toEqual([])
})

for (const sample of [
  { path: 'companies', label: '公司', nameField: '名稱', sort: '產業' },
  { path: 'contacts', label: '聯絡人', nameField: '姓名', sort: '狀態' },
  { path: 'deals', label: '商機', nameField: '名稱', sort: '金額' },
]) {
  test(`${sample.label}新增、查找、排序、編輯與確認刪除`, async ({ page }) => {
    const { path, label, nameField, sort } = sample
    await page.goto(`/${path}`)
    await page.getByRole('button', { name: `新增${label}` }).click()
    let dialog = page.getByRole('dialog')
    await dialog.getByLabel(new RegExp(nameField)).fill('Acme 測試紀錄')
    if (path === 'deals') await dialog.getByLabel(/金額（新臺幣）/).fill('1234.56')
    await dialog.getByRole('button', { name: '儲存' }).click()
    const search = page.getByRole('searchbox')
    await search.fill('  ACME  ')
    const row = page.getByRole('row').filter({ hasText: 'Acme 測試紀錄' })
    await expect(row).toBeVisible()
    await page.getByRole('button', { name: sort, exact: true }).click()
    await expect(page.getByRole('columnheader', { name: sort, exact: true })).toHaveAttribute('aria-sort', /ascending|descending/)
    if (path === 'contacts') {
      await page.getByLabel('狀態篩選').selectOption('qualified')
      await expect(row).toHaveCount(0)
      await page.getByLabel('狀態篩選').selectOption('customer')
      await expect(row).toHaveCount(0)
      await page.getByLabel('狀態篩選').selectOption('lead')
      await expect(row).toBeVisible()
    }
    await row.getByRole('button', { name: '編輯' }).click()
    dialog = page.getByRole('dialog')
    await dialog.getByLabel(new RegExp(nameField)).fill('Acme 已更新')
    await dialog.getByRole('button', { name: '儲存' }).click()
    await page.reload()
    await search.fill('acme')
    const updated = page.getByRole('row').filter({ hasText: 'Acme 已更新' })
    await expect(updated).toBeVisible()
    await updated.getByRole('button', { name: '刪除' }).click()
    dialog = page.getByRole('dialog')
    await expect(dialog.getByText(path === 'companies' ? /0 位聯絡人/ : /0 筆活動/)).toBeVisible()
    await dialog.getByRole('button', { name: '取消' }).click()
    await expect(updated).toBeVisible()
    await updated.getByRole('button', { name: '刪除' }).click()
    await dialog.getByRole('button', { name: '確認刪除' }).click()
    await expect(updated).toHaveCount(0)
  })
}

test('刪除視窗以最新跟進筆數重新確認', async ({ page, context, request }) => {
  const item = await create(request, 'deals', { name: '有異動的商機', stage: 'new', amount_cents: 100, probability: 10 })
  await page.goto(`/deals/${item.id}`)
  await page.getByRole('button', { name: '刪除商機' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByText(/0 筆未完成跟進/)).toBeVisible()
  const other = await context.newPage()
  await other.goto(`/deals/${item.id}`)
  await other.getByRole('button', { name: '新增活動' }).click()
  await other.getByLabel(/內容/).fill('確認後新增的待辦')
  await other.getByLabel('跟進日期').fill(localDate())
  await other.getByRole('button', { name: '儲存' }).click()
  await expect(other.getByText('確認後新增的待辦')).toBeVisible()
  await dialog.getByRole('button', { name: '確認刪除' }).click()
  await expect(dialog.getByText(/1 筆未完成跟進/)).toBeVisible()
  await expect(dialog.getByText('影響的紀錄已變更，請再次確認。')).toBeVisible()
  await expect(page).toHaveURL(`/deals/${item.id}`)
  await dialog.getByRole('button', { name: '確認刪除' }).click()
  await expect(page).toHaveURL('/deals')
})

test('編輯表單保留另一分頁剛儲存的階段和跟進日期', async ({ page, context, request }) => {
  const deal = await create(request, 'deals', { name: '跨分頁商機', stage: 'proposal', amount_cents: 10000, probability: 40 })
  const url = `/deals/${deal.id}`
  await create(request, `deals/${deal.id}/activities`, { kind: 'note', content: '跨分頁跟進', follow_up: '2026-01-04' })
  const other = await context.newPage()
  await Promise.all([page.goto(url), other.goto(url)])

  await page.getByRole('button', { name: '編輯商機' }).click()
  await other.getByRole('button', { name: '編輯商機' }).click()
  await other.getByLabel(/階段/).selectOption('negotiation')
  await other.getByRole('button', { name: '儲存' }).click()
  await expect(other.getByText('從提案移至議價')).toBeVisible()
  await page.getByLabel(/名稱/).fill('跨分頁已改名')
  await page.getByRole('button', { name: '儲存' }).click()
  await expect(page.getByRole('heading', { name: '跨分頁已改名' })).toBeVisible()
  await expect(page.getByText('75%', { exact: true })).toBeVisible()
  await expect(page.getByText('從提案移至議價')).toHaveCount(1)
  await expect(page.getByText('從議價移至提案')).toHaveCount(0)

  const activity = (tab: Page) => tab.locator('.timeline li').filter({ hasText: '跨分頁跟進' })
  await activity(page).getByRole('button', { name: '編輯' }).click()
  await activity(other).getByRole('button', { name: '編輯' }).click()
  await other.getByLabel('跟進日期').fill('2026-01-05')
  await other.getByRole('button', { name: '儲存' }).click()
  await expect(activity(other).getByText('2026-01-05')).toBeVisible()
  await page.getByLabel(/內容/).fill('跨分頁跟進已改內容')
  await page.getByRole('button', { name: '儲存' }).click()
  await expect(activity(page).getByText('跨分頁跟進已改內容')).toBeVisible()
  await expect(activity(page).getByText('2026-01-05')).toBeVisible()
})

test('看板和儀表板精確顯示大額合計', async ({ page, request }) => {
  await removeDeals(request)
  for (const stage of ['new', 'won']) {
    await create(request, 'deals', { name: '大額商機', stage, amount_cents: Number.MAX_SAFE_INTEGER, probability: 100 })
    await create(request, 'deals', { name: '小額商機', stage, amount_cents: 2, probability: 100 })
  }
  const total = 'NT$90,071,992,547,409.93'
  await page.goto('/pipeline')
  await expect(page.getByTestId('board-amount')).toHaveText(total)
  await expect(page.getByTestId('board-expected')).toHaveText(total)
  await page.getByRole('navigation').getByRole('link', { name: '儀表板' }).click()
  const chart = page.getByRole('img', { name: /每月成交金額折線圖/ })
  await expect(chart.locator('svg')).toBeVisible()
  await expect(chart).toHaveAttribute('aria-label', new RegExp(total.replace(/[$.]/g, '\\$&')))
  await expect(page.getByText('本月成交', { exact: true }).locator('..').locator('dd')).toHaveText(total)
})

test('首次讀取失敗後可以重試', async ({ page }) => {
  await page.route('**/api/companies', route => route.fulfill({
    status: 503, json: { message: '本機資料暫時無法讀取。' },
  }), { times: 1 })
  await page.goto('/companies')
  await expect(page.getByText('本機資料暫時無法讀取。')).toBeVisible()
  await page.getByRole('button', { name: '重試' }).click()
  await expect(page.getByRole('link', { name: '青禾製造' })).toBeVisible()
  await expect(page.getByText('本機資料暫時無法讀取。')).toHaveCount(0)
})

test('跨欄更新成交機率和精確統計，並保留各種落點', async ({ page, request }) => {
  await removeDeals(request)
  const item = await create(request, 'deals', {
    name: '精確案例', stage: 'proposal', amount_cents: 10_000_000, probability: 40, expected_close: '2025-01-01',
  })
  const last = await create(request, 'deals', { name: '議價後方', stage: 'negotiation', amount_cents: 10_000_000, probability: 75 })
  const first = await create(request, 'deals', { name: '議價前方', stage: 'negotiation', amount_cents: 10_000_000, probability: 75 })
  await page.goto('/pipeline')
  await expect(page.getByTestId('board-expected')).toHaveText('NT$190,000')
  await drag(page, '精確案例', `drop-negotiation-${last.id}`)
  await expect(page.getByTestId('board-expected')).toHaveText('NT$225,000')
  await expect(page.getByTestId('board-amount')).toHaveText('NT$300,000')
  await expect(page.getByTestId('proposal-amount')).toHaveText('NT$0')
  await expect(page.getByTestId('proposal-expected')).toHaveText('NT$0')
  await expect(page.getByTestId('negotiation-amount')).toHaveText('NT$300,000')
  await expect(page.getByTestId('negotiation-expected')).toHaveText('NT$225,000')
  const lane = page.getByRole('region', { name: '議價', exact: true })
  const links = lane.locator('.deal-card .record-link')
  await expect(links).toHaveText(['議價前方', '精確案例', '議價後方'])
  await drag(page, '精確案例', `drop-negotiation-${first.id}`)
  await expect(links).toHaveText(['精確案例', '議價前方', '議價後方'])
  await drag(page, '精確案例', 'drop-negotiation-end')
  await expect(links).toHaveText(['議價前方', '議價後方', '精確案例'])
  await drag(page, '精確案例', `drop-negotiation-${last.id}`)
  await expect(links).toHaveText(['議價前方', '精確案例', '議價後方'])
  await page.reload()
  await expect(links).toHaveText(['議價前方', '精確案例', '議價後方'])
  await expect(lane.getByText('逾期', { exact: true })).toBeVisible()
  await page.getByRole('navigation').getByRole('link', { name: '商機', exact: true }).click()
  const row = page.getByRole('row').filter({ hasText: '精確案例' })
  await expect(row.getByText('75%')).toBeVisible()
  await expect(row.getByText('逾期')).toBeVisible()
  await row.getByRole('link', { name: '精確案例' }).click()
  await expect(page.getByText('從提案移至議價')).toHaveCount(1)
  await page.goto('/pipeline')
  await drag(page, '精確案例', 'drop-proposal-end')
  await expect(page.getByRole('region', { name: '提案', exact: true }).getByRole('link', { name: '精確案例' })).toBeVisible()
  const saved = await (await request.get(`/api/deals/${item.id}`)).json()
  expect(saved.stage).toBe('proposal')
  await page.getByRole('button', { name: '在成交新增商機' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel(/實際結案日/)).toHaveValue(localDate())
  await expect(dialog.getByLabel(/成交機率/)).toHaveValue('100')
  await dialog.getByLabel(/名稱/).fill('直接成交')
  await dialog.getByLabel(/金額（新臺幣）/).fill('100')
  await dialog.getByRole('button', { name: '儲存' }).click()
  await expect(page.getByRole('region', { name: '成交', exact: true }).getByRole('link', { name: '直接成交' })).toBeVisible()
})

test('拖放遭拒或已寫入後回應失去時保持正確狀態', async ({ page, request }) => {
  await removeDeals(request)
  const item = await create(request, 'deals', { name: '移動確認', stage: 'proposal', amount_cents: 100_000, probability: 40 })
  const movePath = `**/api/deals/${item.id}/move`
  await page.goto('/pipeline')
  await page.route(movePath, route => route.fulfill({ status: 422, json: { message: '目標位置已變更。' } }), { times: 1 })
  await drag(page, '移動確認', 'drop-negotiation-end')
  await expect(page.getByText('目標位置已變更。')).toBeVisible()
  await expect(page.getByRole('region', { name: '提案', exact: true }).getByRole('link', { name: '移動確認' })).toBeVisible()
  let writes = 0
  await page.route(movePath, async route => {
    writes++
    const response = await route.fetch()
    expect(response.ok()).toBe(true)
    await route.abort('failed')
  })
  await drag(page, '移動確認', 'drop-negotiation-end')
  await expect(page.getByText(/看板已重新讀取/)).toBeVisible()
  await expect(page.getByRole('region', { name: '議價', exact: true }).getByRole('link', { name: '移動確認' })).toBeVisible()
  await expect(page.getByTestId('board-expected')).toHaveText('NT$750')
  expect(writes).toBe(1)
})

test('從儀表板到時間軸安排跟進，再成交更新統計', async ({ page }) => {
  await page.goto('/')
  const todo = page.getByRole('heading', { name: '待跟進事項' }).locator('..').locator('..')
  await todo.getByRole('link', { name: '陳思妤' }).click()
  await expect(page).toHaveURL(/\/contacts\/\d+#timeline/)
  await page.getByRole('button', { name: '新增活動' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel(/內容/).fill('安排下一次會議')
  await dialog.getByLabel('跟進日期').fill(localDate())
  await dialog.getByRole('button', { name: '儲存' }).click()
  await expect(page.getByText('安排下一次會議')).toBeVisible()
  await page.getByRole('navigation').getByRole('link', { name: '儀表板' }).click()
  const task = todo.locator('li').filter({ hasText: '安排下一次會議' })
  await expect(task.getByText('今天', { exact: true })).toBeVisible()
  await task.getByRole('button', { name: '標記完成' }).click()
  await expect(task).toHaveCount(0)

  await page.getByRole('navigation').getByRole('link', { name: '商機', exact: true }).click()
  await page.getByRole('table').getByRole('link', { name: '產線稽核系統' }).click()
  await page.getByRole('button', { name: '新增活動' }).click()
  await dialog.getByLabel(/內容/).fill('核對合約條款')
  await dialog.getByLabel('跟進日期').fill(localDate())
  await dialog.getByRole('button', { name: '儲存' }).click()
  const activity = page.locator('.timeline li').filter({ hasText: '核對合約條款' })
  await activity.getByRole('button', { name: '編輯' }).click()
  await dialog.getByLabel(/內容/).fill('已核對合約條款')
  await dialog.getByRole('button', { name: '儲存' }).click()
  const updated = page.locator('.timeline li').filter({ hasText: '已核對合約條款' })
  await updated.getByRole('button', { name: '刪除' }).click()
  await expect(dialog.getByText(/從儀表板/)).toBeVisible()
  await dialog.getByRole('button', { name: '確認刪除' }).click()
  await expect(updated).toHaveCount(0)

  await page.getByRole('button', { name: '編輯商機' }).click()
  await dialog.getByLabel(/階段/).selectOption('won')
  await dialog.getByRole('button', { name: '儲存' }).click()
  await expect(page.getByText('從提案移至成交')).toHaveCount(1)
  await page.getByRole('navigation').getByRole('link', { name: '儀表板' }).click()
  await expect(page.getByText('4 筆成交')).toBeVisible()
  await expect(page.getByText('NT$1,105,000', { exact: true })).toBeVisible()
  await expect(page.locator('.recent').getByText('從提案移至成交')).toBeVisible()
  await page.getByRole('navigation').getByRole('link', { name: '聯絡人' }).click()
  await page.getByRole('table').getByRole('link', { name: '陳思妤' }).click()
  const completed = page.locator('.timeline li').filter({ hasText: '安排下一次會議' })
  await expect(completed.getByText('已完成')).toBeVisible()
})
