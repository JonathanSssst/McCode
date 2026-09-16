import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { _electron as electron, expect, test } from '@playwright/test'

// Requires a desktop environment with Electron available.
// Run with: $env:PW_ELECTRON_E2E=1; npx playwright test e2e/electron-git.spec.ts
test.skip(!process.env.PW_ELECTRON_E2E, 'set PW_ELECTRON_E2E=1 to run the Electron git IPC test')

interface GitResult {
  code: number
  stdout: string
  stderr: string
}

test('main process git IPC runs against a real repository', async () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'mccode-ipc-'))
  execFileSync('git', ['init'], { cwd: repo })
  execFileSync('git', ['config', 'user.name', 'MCCode'], { cwd: repo })
  execFileSync('git', ['config', 'user.email', 'mccode@example.com'], { cwd: repo })
  fs.writeFileSync(path.join(repo, 'a.mcfunction'), 'say hi\n')

  const app = await electron.launch({
    args: [path.resolve(process.cwd(), 'apps/desktop/main.cjs')],
    cwd: process.cwd(),
  })
  try {
    const page = await app.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    const result = await page.evaluate(async (dir: string) => {
      const bridge = (window as unknown as Record<string, unknown>).mccodeDesktop as {
        openFolderPath(dir: string): Promise<{ path: string } | null>
        gitCheck(): Promise<{ available: boolean; version: string }>
        gitRun(args: string[]): Promise<GitResult>
      }
      const opened = await bridge.openFolderPath(dir)
      const check = await bridge.gitCheck()
      const status = await bridge.gitRun(['status', '--porcelain=v2', '--branch', '-z'])
      const blockedFlag = await bridge.gitRun(['status', '--upload-pack=calc'])
      const blockedEscape = await bridge.gitRun(['add', '--', '../outside.txt'])
      const blockedCommand = await bridge.gitRun(['!sh', '-c', 'echo hi'])
      return { opened, check, status, blockedFlag, blockedEscape, blockedCommand }
    }, repo)

    expect(result.opened?.path).toBe(repo)
    expect(result.check.available).toBe(true)
    expect(result.status.code).toBe(0)
    expect(result.status.stdout).toContain('a.mcfunction')
    expect(result.status.stdout).toContain('# branch.')

    expect(result.blockedFlag.code).toBe(-1)
    expect(result.blockedFlag.stderr).toContain('not allowed')
    expect(result.blockedEscape.code).toBe(-1)
    expect(result.blockedEscape.stderr).toContain('outside workspace')
    expect(result.blockedCommand.code).toBe(-1)
    expect(result.blockedCommand.stderr).toContain('subcommand not allowed')
  } finally {
    await app.close()
    fs.rmSync(repo, { recursive: true, force: true })
  }
})
