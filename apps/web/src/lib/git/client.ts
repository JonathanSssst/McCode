import type { GitRunResult } from './types'

export interface GitRunner {
  readonly available: boolean
  run(args: string[]): Promise<GitRunResult>
}

const UNSUPPORTED: GitRunResult = {
  code: -1,
  stdout: '',
  stderr: 'Git is only available in the desktop app',
}

function bridge(): MccodeDesktopBridge | undefined {
  return typeof window === 'undefined' ? undefined : window.mccodeDesktop
}

export function createGitRunner(): GitRunner {
  const desktop = bridge()
  if (!desktop?.gitRun) {
    return { available: false, run: async () => UNSUPPORTED }
  }
  return { available: true, run: (args) => desktop.gitRun(args) }
}

let instance: GitRunner | null = null

export function getGitRunner(): GitRunner {
  if (!instance) instance = createGitRunner()
  return instance
}

export async function checkGit(): Promise<{ available: boolean; version: string }> {
  const desktop = bridge()
  if (!desktop?.gitCheck) return { available: false, version: '' }
  return desktop.gitCheck()
}
