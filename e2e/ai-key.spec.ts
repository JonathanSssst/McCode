import { expect, test } from '@playwright/test'

interface AiCall {
  name: string
  key?: string
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const state = { configured: false, calls: [] as AiCall[] }
    ;(window as unknown as Record<string, unknown>).__aiCalls = state.calls
    ;(window as unknown as Record<string, unknown>).mccodeDesktop = {
      getRecentFolders: async () => [],
      onWindowMaximized: () => () => {},
      setDirty: () => {},
      windowMinimize: () => {},
      windowToggleMaximize: () => {},
      windowClose: () => {},
      windowIsMaximized: async () => false,
      aiStatus: async () => ({
        encryption: true,
        configured: state.configured,
        baseUrl: 'https://api.deepseek.com',
        model: 'deepseek-chat',
      }),
      aiSetKey: async (key: string) => {
        state.calls.push({ name: 'set', key })
        state.configured = Boolean(key.trim())
        return { ok: true, configured: state.configured }
      },
      aiClearKey: async () => {
        state.calls.push({ name: 'clear' })
        state.configured = false
        return { ok: true, configured: false }
      },
      aiComplete: async () => ({ ok: true, content: '' }),
      aiCancel: async () => true,
    }
    localStorage.setItem('mccode:settings', JSON.stringify({ language: 'en' }))
  })

  await page.goto('/')
  await expect(page.getByRole('button', { name: 'File', exact: true })).toBeVisible({
    timeout: 30000,
  })
  await page.reload()
  await expect(page.getByRole('button', { name: 'File', exact: true })).toBeVisible({
    timeout: 30000,
  })
})

test('AI key goes through the main process and is never persisted in the browser', async ({
  page,
}) => {
  await page.keyboard.press('Control+,')
  const input = page.getByPlaceholder('Paste API key')
  await expect(input).toBeVisible()

  await input.fill('sk-secret-test-key')
  await page.getByRole('button', { name: 'Save', exact: true }).click()

  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { __aiCalls: AiCall[] }).__aiCalls.length),
    )
    .toBeGreaterThan(0)

  const calls = await page.evaluate(() => (window as unknown as { __aiCalls: AiCall[] }).__aiCalls)
  expect(calls.some((call) => call.name === 'set' && call.key === 'sk-secret-test-key')).toBe(true)
  await expect(page.getByText('Saved (OS credential store)')).toBeVisible()

  const storage = await page.evaluate(() => JSON.stringify(localStorage))
  expect(storage).not.toContain('sk-secret-test-key')
})
