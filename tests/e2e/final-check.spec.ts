import { expect, test, type Page } from '@playwright/test'

async function navigate(page: Page, name: string) {
  const menu = page.getByRole('button', { name: 'Open navigation' })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('navigation').getByRole('link', { name, exact: true }).click()
}

test('revenue chart tooltip shows the selected month and amount', async ({ page, isMobile }) => {
  await page.goto('./#/growth')
  const bar = page.locator('.recharts-bar-rectangle path').first()
  await expect(bar).toBeVisible()
  if (isMobile) await bar.tap()
  else await bar.hover()
  const tooltip = page.locator('.recharts-tooltip-wrapper')
  await expect(tooltip).toBeVisible()
  await expect(tooltip).toContainText('Jan')
  await expect(tooltip).toContainText('$355')
})

test('all pages, navigation, charts, assets and responsive layouts', async ({ page }, info) => {
  const failures: string[] = []
  page.on('pageerror', (error) => failures.push(error.message))
  page.on('response', (r) => { if (r.url().includes('127.0.0.1') && r.status() >= 400) failures.push(r.url()) })
  await page.goto('./')
  const routes = [
    ['Overview', 'Bookings and revenue'], ['Growth', 'Monthly growth'], ['Bookings', 'Bookings'],
    ['Calendar', 'Booking calendar'], ['Customers', 'Repeat customers'], ['Efficiency', 'Revenue and labor'],
    ['Inventory', 'Inventory'], ['Business model', "How I run Adele's Mobile Detailing"],
  ]
  for (const [name, title] of routes) {
    await navigate(page, name)
    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/NaN|undefined|synthetic|modeled|—/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    for (const chart of await page.locator('.chart-wrap').all()) {
      await expect(chart.locator('svg').first()).toBeVisible()
      await expect(chart.locator('.recharts-pie-sector path, .recharts-area-area, .recharts-bar-rectangle path, .recharts-line-curve').first()).toBeVisible()
    }
    await page.screenshot({ path: info.outputPath(`${name.replaceAll(' ', '-')}.png`), fullPage: true, animations: 'disabled' })
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: title, exact: true })).toBeVisible()
  }
  await navigate(page, 'Overview')
  await page.getByRole('link', { name: 'How I run the business' }).click()
  await expect(page).toHaveURL(/#\/methodology$/)
  await navigate(page, 'Overview')
  await page.getByRole('link', { name: 'View revenue and labor' }).click()
  await expect(page).toHaveURL(/#\/efficiency$/)
  expect(failures).toEqual([])
})

test('booking search, all filters and chronological order', async ({ page }) => {
  await page.goto('./#/bookings')
  const rows = page.locator('tbody tr')
  await expect(rows).toHaveCount(85)
  await expect(rows.first()).toContainText('Jan')
  for (const [status, count] of [['completed', 59], ['planned', 26], ['all', 85]] as const) {
    await page.getByLabel('Filter by status').selectOption(status)
    await expect(rows).toHaveCount(count)
  }
  const filter = page.getByLabel('Filter by service')
  for (const value of await filter.locator('option').evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value))) {
    await filter.selectOption(value)
    expect(await rows.count()).toBeGreaterThan(0)
    if (value !== 'all') for (const cell of await rows.locator('td:nth-child(3)').allTextContents()) expect(cell.includes('Hydroseal')).toBe(value.includes('Hydroseal'))
  }
  await filter.selectOption('all')
  await page.getByLabel('Search bookings').fill('  avery brooks  ')
  expect(await rows.count()).toBeGreaterThan(0)
  for (const row of await rows.all()) await expect(row).toContainText('Avery Brooks')
  await page.getByLabel('Search bookings').fill('no-match')
  await expect(page.getByText('No bookings match')).toBeVisible()
  await page.getByLabel('Search bookings').fill('')
  await expect(rows).toHaveCount(85)
})

test('calendar controls cover all months and all bookings', async ({ page }) => {
  await page.goto('./#/calendar')
  await expect(page.getByRole('button', { name: 'Previous month' })).toBeDisabled()
  let count = 0
  for (let month = 0; month < 11; month++) {
    const name = new Date(2026, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
    count += await page.locator('.calendar-booking').count()
    if (month < 10) await page.getByRole('button', { name: 'Next month' }).click()
  }
  expect(count).toBe(85)
  await expect(page.getByRole('button', { name: 'Next month' })).toBeDisabled()
  for (let i = 0; i < 10; i++) await page.getByRole('button', { name: 'Previous month' }).click()
  await expect(page.getByRole('heading', { name: 'January 2026' })).toBeVisible()
})

test('inventory filters, empty state, usage estimates and all product link targets', async ({ page }) => {
  await page.goto('./#/inventory')
  const rows = page.locator('tbody tr')
  await expect(rows).toHaveCount(46)
  const links = page.locator('tbody a')
  await expect(links).toHaveCount(6)
  for (const link of await links.all()) {
    expect(new URL((await link.getAttribute('href'))!).protocol).toBe('https:')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  }
  await expect(rows.filter({ hasText: 'P&S Xpress Interior Cleaner' })).toContainText('144 cars per full container')
  await expect(rows.filter({ hasText: 'P&S Brake Buster' })).toContainText('6 oz per car')
  const filter = page.getByLabel('Filter inventory by category')
  for (const value of await filter.locator('option').evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value))) {
    await filter.selectOption(value)
    expect(await rows.count()).toBeGreaterThan(0)
    if (value !== 'all') for (const cell of await rows.locator('td:nth-child(2)').allTextContents()) expect(cell).toBe(value)
  }
  await filter.selectOption('all')
  await page.getByLabel('Search inventory').fill('running low')
  await expect(rows).toHaveCount(4)
  await page.getByLabel('Search inventory').fill('no-match')
  await expect(page.getByText('No inventory matches')).toBeVisible()
  await page.getByLabel('Search inventory').fill('')
  await expect(rows).toHaveCount(46)
})

test('mobile menu keyboard, close button and backdrop', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'Mobile drawer only')
  await page.goto('./')
  const opener = page.getByRole('button', { name: 'Open navigation' })
  await expect(page.locator('.mobile-brand')).toBeVisible()
  await expect(page.locator('.mobile-brand')).toHaveText("Adele's Mobile Detailing")
  await opener.focus()
  await page.keyboard.press('Enter')
  const close = page.getByRole('button', { name: 'Close navigation', exact: true })
  await expect(close).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Business model' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(opener).toBeFocused()
  await expect(opener).toHaveAttribute('aria-expanded', 'false')
  await opener.click()
  await close.click()
  await expect(opener).toHaveAttribute('aria-expanded', 'false')
  await opener.click()
  await page.getByRole('button', { name: 'Close menu backdrop' }).click({ position: { x: page.viewportSize()!.width - 10, y: 300 } })
  await expect(opener).toHaveAttribute('aria-expanded', 'false')
})
