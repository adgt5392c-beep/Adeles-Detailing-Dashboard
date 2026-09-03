import { expect, test } from '@playwright/test'

test('navigates to the anonymized bookings ledger', async ({ page }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Bookings and revenue' })).toBeVisible()
  const menu = page.getByRole('button', { name: 'Open navigation' })
  if (await menu.isVisible()) await menu.click()
  await page.getByRole('link', { name: 'Bookings' }).click()
  await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible()
  await expect(page.getByText('85 records')).toBeVisible()
})
