import { expect, test } from '@playwright/test'

const FILES: Record<string, string> = {
  'pack.mcmeta': '{"pack":{"pack_format":94,"description":"git e2e"}}',
  'data/mypack/function/main.mcfunction': 'say hello\n',
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((files: Record<string, string>) => {
    const calls: string[][] = []
    const state = { staged: false }
    const record = (args: string[]) => {
      calls.push(args)
      const sub = args[0]
      if (sub === 'rev-parse') return { code: 0, stdout: 'true\n', stderr: '' }
      if (sub === 'status') {
        const records = [
          '# branch.oid abcdef',
          '# branch.head main',
          '# branch.upstream origin/main',
          '# branch.ab +1 -0',
          state.staged
            ? '1 M. N... 100644 100644 100644 aaa bbb data/mypack/function/main.mcfunction'
            : '1 .M N... 100644 100644 100644 aaa aaa data/mypack/function/main.mcfunction',
          '? data/mypack/function/extra.mcfunction',
        ]
        return { code: 0, stdout: records.join('\0') + '\0', stderr: '' }
      }
      if (sub === 'add') {
        state.staged = true
        return { code: 0, stdout: '', stderr: '' }
      }
      if (sub === 'reset') {
        state.staged = false
        return { code: 0, stdout: '', stderr: '' }
      }
      return { code: 0, stdout: '', stderr: '' }
    }
    const bridge = {
      getRecentFolders: async () => ['mem'],
      openFolderPath: async (path: string) => ({ path }),
      readDir: async (dir: string) => {
        const prefix = dir.endsWith('/') ? dir : `${dir}/`
        const entries = new Map<string, boolean>()
        for (const file of Object.keys(files)) {
          const full = `mem/${file}`
          if (!full.startsWith(prefix)) continue
          const parts = full.slice(prefix.length).split('/')
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
      gitCheck: async () => ({ available: true, version: 'git version 2.55.0' }),
      gitRun: async (args: string[]) => record(args),
    }
    ;(window as unknown as Record<string, unknown>).mccodeDesktop = bridge
    ;(window as unknown as Record<string, unknown>).__gitCalls = calls
    localStorage.setItem('mccode:settings', JSON.stringify({ language: 'en' }))
  }, FILES)

  await page.goto('/')
  await expect(page.getByRole('button', { name: 'File', exact: true })).toBeVisible({
    timeout: 30000,
  })
  await page.reload()
  await expect(page.getByRole('button', { name: 'File', exact: true })).toBeVisible({
    timeout: 30000,
  })
  await page.getByRole('button', { name: 'File', exact: true }).click()
  await page.getByText('Open Recent: mem').click()
  await expect(page.getByText('pack.mcmeta')).toBeVisible({ timeout: 20000 })
})

test('source control lists changes, stages and commits', async ({ page }) => {
  const scm = page.locator('button[title^="Source Control"]')
  await expect(scm).toContainText('2', { timeout: 20000 })

  await scm.click()
  await expect(page.getByText('main', { exact: true })).toBeVisible()
  await expect(page.getByText('main.mcfunction')).toBeVisible()
  await expect(page.getByText('extra.mcfunction')).toBeVisible()
  await expect(page.getByText('Changes', { exact: true })).toBeVisible()

  await page.locator('button[title="Stage Changes"]').first().click()
  await expect(page.getByText('Staged Changes', { exact: true })).toBeVisible({ timeout: 10000 })

  const calls = await page.evaluate(
    () => (window as unknown as { __gitCalls: string[][] }).__gitCalls,
  )
  expect(
    calls.some((args) => args[0] === 'add' && args[2] === 'data/mypack/function/main.mcfunction'),
  ).toBe(true)

  await page.getByPlaceholder(/Commit message/).fill('first commit')
  await page.getByRole('button', { name: 'Commit', exact: true }).click()
  await expect
    .poll(async () =>
      page.evaluate(() =>
        (window as unknown as { __gitCalls: string[][] }).__gitCalls.some(
          (args) => args[0] === 'commit' && args[2] === 'first commit',
        ),
      ),
    )
    .toBe(true)
})

test('status bar shows the current branch', async ({ page }) => {
  await expect(page.locator('button[title^="Git branch"]')).toContainText('main', {
    timeout: 20000,
  })
})
