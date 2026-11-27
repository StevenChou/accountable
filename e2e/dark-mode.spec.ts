import { expect } from '@playwright/test'
import { accountMenu, chooseTheme, test } from './fixtures'

test('預設亮色，跨頁與重新整理後保留選擇，找不到頁面也能切換', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  const menu = accountMenu(page)
  const html = page.locator('html')
  await expect(menu).toBeVisible()
  await expect(html).toHaveCSS('background-color', 'rgb(240, 244, 245)')
  await chooseTheme(page, '深色')
  await expect(html).toHaveCSS('background-color', 'rgb(4, 35, 46)')

  const navigation = page.getByRole('navigation')
  for (const name of ['公司', '聯絡人', '商機', '商機看板']) {
    await navigation.getByRole('link', { name, exact: true }).click()
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    await expect(html).toHaveAttribute('data-theme', 'dark')
  }
  await page.reload()
  await expect(menu).toBeVisible()
  await expect(html).toHaveCSS('background-color', 'rgb(4, 35, 46)')

  await page.goto('/missing')
  await expect(page.getByText('找不到頁面。')).toBeVisible()
  await menu.focus()
  await page.keyboard.press('Space')
  const light = page.getByRole('button', { name: '亮色', exact: true })
  await light.focus()
  await page.keyboard.press('Space')
  await expect(light).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(html).toHaveCSS('background-color', 'rgb(240, 244, 245)')
})

test('主程式尚未載入時，重新整理已套用已儲存的系統配色', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/missing')
  await chooseTheme(page, '跟隨系統')

  const mainRequested = Promise.withResolvers<void>()
  const resumeMain = Promise.withResolvers<void>()
  await page.route(
    '**/src/main.tsx',
    async (route) => {
      mainRequested.resolve()
      await resumeMain.promise
      await route.continue()
    },
    { times: 1 },
  )

  try {
    await page.reload({ waitUntil: 'commit' })
    await mainRequested.promise
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(4, 35, 46)')
    await expect(accountMenu(page)).toHaveCount(0)
  } finally {
    resumeMain.resolve()
  }
  await expect(accountMenu(page)).toBeVisible()
})

test('無效或無法存取的主題偏好使用亮色，仍能切換', async ({ page }) => {
  await page.goto('/missing')
  await page.evaluate(() => localStorage.setItem('accountable-theme', 'unknown'))
  await page.reload()
  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', 'light')

  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem
    const setItem = Storage.prototype.setItem
    Storage.prototype.getItem = function (key) {
      if (key === 'accountable-theme') throw new DOMException('Storage unavailable', 'SecurityError')
      return getItem.call(this, key)
    }
    Storage.prototype.setItem = function (key, value) {
      if (key === 'accountable-theme') throw new DOMException('Storage unavailable', 'SecurityError')
      setItem.call(this, key, value)
    }
  })
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'light')
  await chooseTheme(page, '深色')
  await expect(html).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'light')
})

test('較窄的桌機視窗保留單列導覽、搜尋和選單', async ({ page }) => {
  await page.goto('/missing')
  const navigation = page.getByRole('navigation')
  await expect(navigation.getByRole('link')).toHaveCount(5)
  await page.evaluate(() => document.fonts.ready)
  for (const width of [731, 780, 850, 1024]) {
    await page.setViewportSize({ width, height: 768 })
    const rows = await navigation
      .getByRole('link')
      .evaluateAll((links) => new Set(links.map((link) => link.getBoundingClientRect().top)).size)
    expect(rows).toBe(1)
    await expect(page.getByRole('searchbox', { name: '全站搜尋' })).toBeInViewport()
    await expect(accountMenu(page)).toBeInViewport()
  }
  await chooseTheme(page, '深色')
  await expect(page.getByRole('button', { name: '深色', pressed: true })).toBeVisible()
})

test('圖表、階段標記、對話框與錯誤訊息使用目前主題', async ({ page }) => {
  await page.route('**/api/companies', (route) => {
    if (route.request().method() !== 'POST') return route.continue()
    return route.fulfill({ status: 503, json: { message: '請稍後重試。' } })
  })

  const themes = [
    {
      dark: false,
      paper: 'rgb(255, 255, 255)',
      chartTick: 'rgb(81, 107, 116)',
      tooltipItem: 'rgb(0, 126, 98)',
      wonMarker: 'rgb(7, 59, 76)',
      notice: 'rgb(252, 236, 241)',
      noticeText: 'rgb(137, 24, 54)',
    },
    {
      dark: true,
      paper: 'rgb(0, 0, 0)',
      chartTick: 'rgb(167, 189, 196)',
      tooltipItem: 'rgb(121, 228, 196)',
      wonMarker: 'rgb(139, 174, 194)',
      notice: 'rgb(56, 22, 34)',
      noticeText: 'rgb(255, 196, 211)',
    },
  ]

  for (const theme of themes) {
    await page.goto('/')
    if (theme.dark) await chooseTheme(page, '深色')

    const chart = page.getByRole('img', { name: /每月成交金額折線圖/ })
    await expect(chart.locator('.recharts-cartesian-axis-tick-value').first()).toHaveCSS('fill', theme.chartTick)
    await chart.locator('circle').first().hover()
    const tooltip = chart.locator('.recharts-default-tooltip')
    await expect(tooltip).toHaveCSS('background-color', theme.paper)
    await expect(tooltip.locator('.recharts-tooltip-item')).toHaveCSS('color', theme.tooltipItem)
    await expect(tooltip).toContainText('成交金額')
    await expect(tooltip).toContainText('NT$')
    await expect(page.locator('.stage-amounts [data-stage="won"] .stage-title i')).toHaveCSS(
      'background-color',
      theme.wonMarker,
    )

    await page.getByRole('navigation').getByRole('link', { name: '商機看板' }).click()
    const won = page.getByRole('region', { name: '成交', exact: true })
    await expect(won.getByRole('heading', { name: '成交' })).toBeVisible()
    await expect(won.locator('.lane-title i')).toHaveCSS('background-color', theme.wonMarker)

    await page.getByRole('navigation').getByRole('link', { name: '公司', exact: true }).click()
    await page.getByRole('button', { name: '新增公司' }).click()
    const dialog = page.getByRole('dialog', { name: '新增公司' })
    await expect(dialog).toHaveCSS('background-color', theme.paper)
    await dialog.getByLabel(/名稱/).fill('測試公司')
    await dialog.getByRole('button', { name: '儲存' }).click()
    const alert = dialog.getByRole('alert')
    await expect(alert).toHaveText('請稍後重試。')
    await expect(alert).toHaveCSS('background-color', theme.notice)
    await expect(alert).toHaveCSS('color', theme.noticeText)
  }
})
