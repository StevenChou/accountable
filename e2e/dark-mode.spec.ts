import { expect, test } from '@playwright/test'

test('預設亮色，跨頁與重新整理後保留選擇，找不到頁面也能切換', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  const toggle = page.getByRole('button', { name: '深色模式' })
  const html = page.locator('html')
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect(html).toHaveCSS('background-color', 'rgb(240, 244, 245)')

  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(html).toHaveCSS('background-color', 'rgb(4, 35, 46)')
  await expect(page.getByRole('heading', { name: '儀表板', exact: true })).toBeVisible()

  const navigation = page.getByRole('navigation')
  for (const name of ['公司', '聯絡人', '商機', '商機看板']) {
    await navigation.getByRole('link', { name, exact: true }).click()
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  }
  await page.reload()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(html).toHaveCSS('background-color', 'rgb(4, 35, 46)')

  await page.goto('/missing')
  await expect(page.getByText('找不到頁面。')).toBeVisible()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await toggle.focus()
  await page.keyboard.press('Space')
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect(page).toHaveURL(/\/missing$/)
  await page.reload()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await expect(html).toHaveCSS('background-color', 'rgb(240, 244, 245)')
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
    if (theme.dark) await page.getByRole('button', { name: '深色模式' }).click()

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
