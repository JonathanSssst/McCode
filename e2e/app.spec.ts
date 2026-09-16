import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mccode:settings', JSON.stringify({ language: 'en' }))
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'File' })).toBeVisible({
    timeout: 30000,
  })
})

test('shell renders with the MCCode title bar', async ({ page }) => {
  await expect(page.getByText('MCCode').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'File' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'View' })).toBeVisible()
})

test('command palette opens with Ctrl+Shift+P and closes on Escape', async ({ page }) => {
  await page.keyboard.press('Control+Shift+P')
  const input = page.getByPlaceholder(/search commands or files/i)
  await expect(input).toBeVisible()
  await input.fill('settings')
  await page.keyboard.press('Escape')
  await expect(input).toBeHidden()
})

test('settings dialog opens with Ctrl+,', async ({ page }) => {
  await page.keyboard.press('Control+,')
  await expect(page.getByText('Settings').first()).toBeVisible()
  await expect(page.getByText('Font Size')).toBeVisible()
})

test('switching language updates the UI live', async ({ page }) => {
  await page.keyboard.press('Control+,')
  const language = page.locator('select').first()
  await language.selectOption('zh')
  await expect(page.getByRole('button', { name: '文件', exact: true })).toBeVisible()
  await language.selectOption('en')
  await expect(page.getByRole('button', { name: 'File', exact: true })).toBeVisible()
})
