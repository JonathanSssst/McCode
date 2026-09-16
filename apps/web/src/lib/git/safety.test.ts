import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { validateGitArgs } = require('../../../../../apps/desktop/gitSafety.cjs') as {
  validateGitArgs: (args: unknown, root: string) => void
}

const ROOT = process.platform === 'win32' ? 'C:\\ws' : '/ws'

function allows(args: unknown): boolean {
  try {
    validateGitArgs(args, ROOT)
    return true
  } catch {
    return false
  }
}

describe('validateGitArgs', () => {
  it('allows the subcommands the app uses', () => {
    expect(allows(['status', '--porcelain=v2', '--branch', '-z'])).toBe(true)
    expect(allows(['add', '--', 'data/mypack/function/a.mcfunction'])).toBe(true)
    expect(allows(['reset', '-q'])).toBe(true)
    expect(allows(['commit', '-m', 'message'])).toBe(true)
    expect(allows(['rev-parse', '--is-inside-work-tree'])).toBe(true)
    expect(allows(['show', 'HEAD:data/mypack/function/a.mcfunction'])).toBe(true)
  })

  it('rejects empty or non-array arguments', () => {
    expect(allows([])).toBe(false)
    expect(allows('status')).toBe(false)
    expect(allows(undefined)).toBe(false)
  })

  it('rejects subcommands outside the allow list', () => {
    expect(allows(['!sh', '-c', 'echo hi'])).toBe(false)
    expect(allows(['config', 'user.name', 'x'])).toBe(false)
    expect(allows(['filter-branch'])).toBe(false)
  })

  it('rejects dangerous flags', () => {
    expect(allows(['fetch', '--upload-pack=calc.exe'])).toBe(false)
    expect(allows(['status', '-c', 'core.pager=calc'])).toBe(false)
    expect(allows(['status', '--exec-path=/tmp'])).toBe(false)
    expect(allows(['status', '--git-dir=/tmp/x'])).toBe(false)
  })

  it('rejects paths that escape the workspace', () => {
    expect(allows(['add', '--', '../outside.txt'])).toBe(false)
    expect(allows(['add', '--', 'data/../../outside.txt'])).toBe(false)
    expect(allows(['show', 'HEAD:../outside.txt'])).toBe(false)
  })

  it('rejects NUL bytes and non-string arguments', () => {
    expect(allows(['add', '--', 'a\0b'])).toBe(false)
    expect(allows(['add', '--', 42])).toBe(false)
  })
})
