import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { _electron as electron, expect, test } from '@playwright/test'

// Exercises the real Electron main process: safeStorage-backed key handling and
// the AI proxy. Run with: $env:PW_ELECTRON_E2E=1; npx playwright test e2e/electron-ai.spec.ts
test.skip(!process.env.PW_ELECTRON_E2E, 'set PW_ELECTRON_E2E=1 to run the Electron AI test')

test('the AI key is stored in the main process and never exposed to the renderer', async () => {
  const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'mccode-ai-userdata-'))
  const app = await electron.launch({
    // A private user-data dir keeps the real key store untouched.
    args: [path.resolve(process.cwd(), 'apps/desktop/main.cjs'), `--user-data-dir=${userData}`],
    cwd: process.cwd(),
  })
  try {
    const page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    const result = await page.evaluate(async () => {
      const bridge = (window as unknown as Record<string, unknown>).mccodeDesktop as {
        aiStatus(): Promise<Record<string, unknown>>
        aiSetKey(key: string): Promise<{ ok: boolean; configured?: boolean; error?: string }>
        aiClearKey(): Promise<{ ok: boolean; configured?: boolean }>
        aiComplete(request: Record<string, unknown>): Promise<{ ok: boolean; error?: string }>
      }
      const initial = await bridge.aiStatus()
      const keys = Object.keys(initial)
      const saved = await bridge.aiSetKey('sk-electron-test-key')
      const afterSave = await bridge.aiStatus()
      const unreachable = await bridge.aiComplete({
        id: 'test-1',
        baseUrl: 'http://127.0.0.1:9',
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'hi' }],
        maxTokens: 8,
      })
      const afterClear = await bridge.aiClearKey()
      return { keys, initial, saved, afterSave, unreachable, afterClear }
    })

    expect(result.keys).not.toContain('key')
    expect(result.keys).not.toContain('apiKey')
    expect(result.initial.configured).toBe(false)
    expect(result.saved.ok).toBe(true)
    expect(result.afterSave.configured).toBe(true)
    expect(result.afterClear.configured).toBe(false)
    // The proxy fails cleanly when the endpoint is unreachable.
    expect(result.unreachable.ok).toBe(false)
    expect(typeof result.unreachable.error).toBe('string')
  } finally {
    await app.close()
    fs.rmSync(userData, { recursive: true, force: true })
  }
})
