import { expect, test } from '@playwright/test'

const FILES: Record<string, string> = {
  'pack.mcmeta': '{"pack":{"pack_format":94,"description":"sync e2e v1.30"}}',
  'data/mypack/function/main.mcfunction': 'say hello\n',
}

const TARGET_DIR = 'C:/world/datapacks'

interface SyncCalls {
  written: { path: string; size: number }[]
  removed: string[]
  madeDirs: string[]
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ files, targetDir }: { files: Record<string, string>; targetDir: string }) => {
      const calls: SyncCalls = { written: [], removed: [], madeDirs: [] }
      const targetEntries = [
        { name: 'mempack-1.20.6-pack57.zip', isDirectory: false },
        { name: 'mempack-1.21.11-pack94.zip', isDirectory: false },
        { name: 'notes.txt', isDirectory: false },
        { name: 'other-pack', isDirectory: true },
      ]
      const bridge = {
        getRecentFolders: async () => ['mempack'],
        openFolderPath: async (path: string) => ({ path }),
        readDir: async (dir: string) => {
          if (dir.replace(/\\/g, '/').startsWith(targetDir)) return targetEntries
          const prefix = dir.endsWith('/') ? dir : `${dir}/`
          const entries = new Map<string, boolean>()
          for (const file of Object.keys(files)) {
            const full = `mempack/${file}`
            if (!full.startsWith(prefix)) continue
            const parts = full.slice(prefix.length).split('/')
            entries.set(parts[0], parts.length > 1)
          }
          return [...entries].map(([name, isDirectory]) => ({ name, isDirectory }))
        },
        readFile: async (path: string) =>
          new TextEncoder().encode(files[path.replace(/^mempack\//, '')] ?? ''),
        writeFile: async (path: string, data: Uint8Array) => {
          calls.written.push({ path, size: data?.length ?? 0 })
        },
        mkdir: async (path: string) => {
          calls.madeDirs.push(path)
        },
        remove: async (path: string) => {
          calls.removed.push(path)
        },
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
        pickDirectory: async () => targetDir,
        gitCheck: async () => ({ available: false, version: '' }),
        gitRun: async () => ({ code: -1, stdout: '', stderr: 'unsupported' }),
        aiStatus: async () => ({
          encryption: true,
          configured: false,
          baseUrl: '',
          model: '',
        }),
        aiComplete: async () => ({ ok: true, content: '' }),
      }
      ;(window as unknown as Record<string, unknown>).mccodeDesktop = bridge
      ;(window as unknown as Record<string, unknown>).__syncCalls = calls
      localStorage.setItem('mccode:settings', JSON.stringify({ language: 'en' }))
    },
    { files: FILES, targetDir: TARGET_DIR },
  )

  await page.goto('/')
  await expect(page.getByRole('button', { name: 'File', exact: true })).toBeVisible({
    timeout: 30000,
  })
  await page.reload()
  await expect(page.getByRole('button', { name: 'File', exact: true })).toBeVisible({
    timeout: 30000,
  })
  await page.getByRole('button', { name: 'File', exact: true }).click()
  await page.getByText('Open Recent: mempack').click()
  await expect(page.getByText('pack.mcmeta')).toBeVisible({ timeout: 20000 })
})

test('sync packages the datapack and prunes older artifacts', async ({ page }) => {
  const calls = () =>
    page.evaluate(() => (window as unknown as { __syncCalls: SyncCalls }).__syncCalls)

  await page.locator('button[title^="Sync"]').click()
  await page.getByRole('button', { name: 'Choose Folder…' }).click()
  await expect(page.getByText(TARGET_DIR)).toBeVisible()

  await page.getByRole('button', { name: 'Sync (package as zip)' }).click()
  await expect.poll(async () => (await calls()).written.length).toBe(1)

  const result = await calls()
  const written = result.written[0]
  expect(written.path.startsWith(`${TARGET_DIR}/`)).toBe(true)
  expect(written.path).toMatch(/\/mempack-mc[^/]*-v1\.30\.zip$/)
  expect(written.size).toBeGreaterThan(0)

  // Legacy and current archives of the same pack are pruned.
  expect(result.removed).toContain(`${TARGET_DIR}/mempack-1.20.6-pack57.zip`)
  expect(result.removed).not.toContain(`${TARGET_DIR}/notes.txt`)
  expect(result.removed).not.toContain(`${TARGET_DIR}/other-pack`)

  await expect(page.getByText(/Wrote mempack-/)).toBeVisible()
})
