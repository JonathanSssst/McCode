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
      if (sub === 'for-each-ref') {
        return { code: 0, stdout: 'main origin/main *\nfeature/x\n', stderr: '' }
      }
      if (sub === 'show') {
        return { code: 0, stdout: 'say original\n', stderr: '' }
      }
      if (sub === 'remote') {
        return {
          code: 0,
          stdout:
            'origin\thttps://example.com/repo.git (fetch)\norigin\thttps://example.com/repo.git (push)\n',
          stderr: '',
        }
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
  // The branch also appears in the status bar, so scope to the first match (sidebar).
  await expect(page.getByText('⑂ main').first()).toBeVisible()
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

test('clicking a changed file opens the diff view', async ({ page }) => {
  const calls = () =>
    page.evaluate(() => (window as unknown as { __gitCalls: string[][] }).__gitCalls)

  const scm = page.locator('button[title^="Source Control"]')
  await expect(scm).toContainText('2', { timeout: 20000 })
  await scm.click()

  await page.getByText('main.mcfunction').click()
  await expect
    .poll(async () =>
      (await calls()).some(
        (args) => args[0] === 'show' && args[1] === 'HEAD:data/mypack/function/main.mcfunction',
      ),
    )
    .toBe(true)

  const diff = page.locator('.monaco-diff-editor')
  await expect(diff).toBeVisible({ timeout: 20000 })
  await expect(diff).toContainText('say original')
  await expect(diff).toContainText('say hello')

  await page.locator('button[title="Close Diff"]').click()
  await expect(diff).toHaveCount(0)
})

test('push, fetch and branch switching are wired', async ({ page }) => {
  const calls = () =>
    page.evaluate(() => (window as unknown as { __gitCalls: string[][] }).__gitCalls)

  const scm = page.locator('button[title^="Source Control"]')
  await expect(scm).toContainText('2', { timeout: 20000 })
  await scm.click()

  await page.locator('button[title="Push"]').click()
  await expect.poll(async () => (await calls()).some((args) => args[0] === 'push')).toBe(true)

  await page.locator('button[title="Fetch Remote Changes"]').click()
  await expect.poll(async () => (await calls()).some((args) => args[0] === 'fetch')).toBe(true)

  await page.locator('button[title="More Actions"]').click()
  await page.getByRole('button', { name: /feature\/x/ }).click()
  await expect
    .poll(async () =>
      (await calls()).some((args) => args[0] === 'switch' && args[1] === 'feature/x'),
    )
    .toBe(true)
})
