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

test('window controls sit flush in the top-right corner', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as unknown as Record<string, unknown>).mccodeDesktop = {
      windowMinimize: () => {},
      windowToggleMaximize: () => {},
      windowClose: () => {},
      windowIsMaximized: async () => false,
      onWindowMaximized: () => () => {},
    }
  })
  await page.reload()
  const close = page.locator('button[title="Close"]')
  await expect(close).toBeVisible()
  const box = await close.boundingBox()
  const viewport = page.viewportSize()
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  expect(Math.abs(box!.x + box!.width - viewport!.width)).toBeLessThanOrEqual(1)
  expect(box!.y).toBeLessThanOrEqual(0.5)
})

async function drag(
  page: import('@playwright/test').Page,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(to.x, to.y, { steps: 8 })
  await page.mouse.up()
}

test('dragging the sidebar splitter resizes the sidebar', async ({ page }) => {
  const splitter = page.getByRole('separator', { name: 'Resize Sidebar' })
  const before = await splitter.boundingBox()
  expect(before).not.toBeNull()
  const y = before!.y + before!.height / 2
  await drag(page, { x: before!.x + 2, y }, { x: before!.x + 82, y })
  const after = await splitter.boundingBox()
  expect(after!.x).toBeGreaterThan(before!.x + 40)
})

test('dragging the panel splitter resizes the bottom panel', async ({ page }) => {
  await page.keyboard.press('Control+J')
  const splitter = page.getByRole('separator', { name: 'Resize Panel' })
  await expect(splitter).toBeVisible()
  const before = await splitter.boundingBox()
  expect(before).not.toBeNull()
  const x = before!.x + 40
  await drag(page, { x, y: before!.y + 2 }, { x, y: before!.y - 58 })
  const after = await splitter.boundingBox()
  expect(after!.y).toBeLessThan(before!.y - 30)
})
