import { expect, test } from '@playwright/test'

// Requires an AI key in the repo root .env (see .env.example).
// Run with: $env:PW_AI_E2E=1; npx playwright test e2e/ai.spec.ts
test.skip(!process.env.PW_AI_E2E, 'set PW_AI_E2E=1 (and VITE_DEEPSEEK_API_KEY in .env) to run')

const FILES: Record<string, string> = {
  'pack.mcmeta': '{"pack":{"pack_format":94,"description":"ai e2e"}}',
  'data/mypack/function/main.mcfunction': '# main\n',
}

const COMPLETION = '\ntellraw @a "hi"'

test('AI inline completion is suggested and accepted with Tab', async ({ page }) => {
  await page.addInitScript((files: Record<string, string>) => {
    const bridge = {
      getRecentFolders: async () => ['mem'],
      openFolderPath: async (path: string) => ({ path }),
      readDir: async (dir: string) => {
        const prefix = dir.endsWith('/') ? dir : `${dir}/`
        const entries = new Map<string, boolean>()
        for (const file of Object.keys(files)) {
          const full = `mem/${file}`
          if (!full.startsWith(prefix)) continue
          const rest = full.slice(prefix.length)
          const parts = rest.split('/')
          entries.set(parts[0], parts.length > 1)
        }
        return [...entries].map(([name, isDirectory]) => ({ name, isDirectory }))
      },
      readFile: async (path: string) =>
        new TextEncoder().encode(files[path.replace(/^mem\//, '')] ?? ''),
      writeFile: async () => {},
      mkdir: async () => {},
      remove: async () => {},
      rename: async () => {},
      copy: async () => {},
      stat: async () => ({ isDirectory: false, isFile: true }),
      reveal: async () => {},
      setDirty: () => {},
      onFilesChanged: () => () => {},
      onWindowMaximized: () => () => {},
      windowMinimize: () => {},
      windowToggleMaximize: () => {},
      windowClose: () => {},
      windowIsMaximized: async () => false,
    }
    ;(window as unknown as Record<string, unknown>).mccodeDesktop = bridge
  }, FILES)

  await page.route('**/chat/completions', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ choices: [{ message: { content: COMPLETION } }] }),
    }),
  )

  await page.addInitScript(() => {
    localStorage.setItem('mccode:settings', JSON.stringify({ language: 'en' }))
  })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'File', exact: true })).toBeVisible({
    timeout: 30000,
  })
  // Vite dev server may reload once after pre-bundling dependencies.
  await page.reload()
  await expect(page.getByRole('button', { name: 'File', exact: true })).toBeVisible({
    timeout: 30000,
  })

  await page.getByRole('button', { name: 'File', exact: true }).click()
  await page.getByText('Open Recent: mem').click()
  await expect(page.getByText('pack.mcmeta')).toBeVisible({ timeout: 20000 })

  await page.keyboard.press('Control+p')
  const palette = page.getByPlaceholder(/search commands or files/i)
  await palette.fill('main.mcfunction')
  await page.keyboard.press('Enter')
  await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 20000 })

  await page.locator('.monaco-editor').click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type('say')
  await page.keyboard.press('Enter')

  const lines = page.locator('.view-lines')
  await expect(lines).toContainText('tellraw @a "hi"', { timeout: 20000 })

  await page.keyboard.press('Tab')
  await expect(page.locator('.monaco-editor [class*="ghost"]')).toHaveCount(0, { timeout: 10000 })
  await expect(lines).toContainText('tellraw @a "hi"')
})
