import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { parseGitStatus } from './parse'
import { isStaged, isUnstaged } from './types'

function gitAvailable(): boolean {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const available = gitAvailable()
const describeIfGit = available ? describe : describe.skip

let repo = ''

function git(args: string[]): string {
  return execFileSync('git', ['-c', 'core.quotepath=false', ...args], {
    cwd: repo,
    encoding: 'utf8',
  })
}

describeIfGit('git status integration', () => {
  beforeAll(() => {
    repo = fs.mkdtempSync(path.join(os.tmpdir(), 'mccode-git-'))
    git(['init'])
    git(['config', 'user.name', 'MCCode Test'])
    git(['config', 'user.email', 'test@example.com'])
    fs.mkdirSync(path.join(repo, 'data/mypack/function'), { recursive: true })
    fs.writeFileSync(path.join(repo, 'data/mypack/function/main.mcfunction'), 'say hello\n')
    fs.writeFileSync(path.join(repo, 'readme with space.txt'), 'hello\n')
    git(['add', '-A'])
    git(['commit', '-m', 'initial commit'])
  })

  afterAll(() => {
    if (repo) fs.rmSync(repo, { recursive: true, force: true })
  })

  it('reports a clean tree right after committing', () => {
    const status = parseGitStatus(git(['status', '--porcelain=v2', '--branch', '-z']))
    const expectedBranch = git(['rev-parse', '--abbrev-ref', 'HEAD']).trim()
    expect(status.branch).toBe(expectedBranch)
    expect(status.detached).toBe(false)
    expect(status.files).toEqual([])
  })

  it('parses unstaged modifications, untracked files and renames', () => {
    fs.writeFileSync(
      path.join(repo, 'data/mypack/function/main.mcfunction'),
      'say hello\nsay world\n',
    )
    fs.writeFileSync(path.join(repo, 'brand new.txt'), 'new\n')
    git(['mv', 'readme with space.txt', 'renamed file.txt'])

    const status = parseGitStatus(git(['status', '--porcelain=v2', '--branch', '-z']))
    const byPath = new Map(status.files.map((file) => [file.path, file]))

    const modified = byPath.get('data/mypack/function/main.mcfunction')
    expect(modified?.kind).toBe('modified')
    expect(isUnstaged(modified!)).toBe(true)
    expect(isStaged(modified!)).toBe(false)

    const untracked = byPath.get('brand new.txt')
    expect(untracked?.kind).toBe('untracked')

    const renamed = byPath.get('renamed file.txt')
    expect(renamed?.kind).toBe('renamed')
    expect(renamed?.origPath).toBe('readme with space.txt')
  })

  it('tracks staged state after git add', () => {
    git(['add', '--', 'data/mypack/function/main.mcfunction'])
    const status = parseGitStatus(git(['status', '--porcelain=v2', '--branch', '-z']))
    const modified = status.files.find(
      (file) => file.path === 'data/mypack/function/main.mcfunction',
    )
    expect(modified).toBeDefined()
    expect(isStaged(modified!)).toBe(true)
    expect(isUnstaged(modified!)).toBe(false)
  })
})
