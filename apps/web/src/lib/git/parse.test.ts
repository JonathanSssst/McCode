import { describe, expect, it } from 'vitest'
import {
  parseBranchList,
  parseBranchRefs,
  parseGitLog,
  parseGitStatus,
  parseRemotes,
} from './parse'
import { isStaged, isUnstaged, kindForCode } from './types'

const NUL = '\0'

function porcelain(records: string[]): string {
  return records.join(NUL) + NUL
}

describe('parseGitStatus', () => {
  it('parses the branch headers', () => {
    const status = parseGitStatus(
      porcelain([
        '# branch.oid 1234abcd',
        '# branch.head main',
        '# branch.upstream origin/main',
        '# branch.ab +2 -1',
      ]),
    )
    expect(status.branch).toBe('main')
    expect(status.upstream).toBe('origin/main')
    expect(status.ahead).toBe(2)
    expect(status.behind).toBe(1)
    expect(status.detached).toBe(false)
    expect(status.files).toEqual([])
  })

  it('marks a detached head', () => {
    const status = parseGitStatus(porcelain(['# branch.head (detached)']))
    expect(status.detached).toBe(true)
    expect(status.branch).toBeNull()
  })

  it('parses staged, unstaged and untracked entries', () => {
    const status = parseGitStatus(
      porcelain([
        '1 M. N... 100644 100644 100644 aaa bbb src/app.ts',
        '1 .M N... 100644 100644 100644 aaa aaa README.md',
        '1 A. N... 000000 100644 100644 0000 ccc new/file.txt',
        '? untracked.txt',
      ]),
    )
    expect(status.files.map((file) => file.path)).toEqual([
      'src/app.ts',
      'README.md',
      'new/file.txt',
      'untracked.txt',
    ])
    const [staged, unstaged, added, untracked] = status.files
    expect(isStaged(staged)).toBe(true)
    expect(isUnstaged(staged)).toBe(false)
    expect(staged.kind).toBe('modified')
    expect(isStaged(unstaged)).toBe(false)
    expect(isUnstaged(unstaged)).toBe(true)
    expect(added.kind).toBe('added')
    expect(untracked.kind).toBe('untracked')
    expect(isStaged(untracked)).toBe(false)
    expect(isUnstaged(untracked)).toBe(false)
  })

  it('parses renames including the original path token', () => {
    const status = parseGitStatus(
      porcelain(['2 R. N... 100644 100644 100644 aaa bbb R100 new-name.ts', 'old-name.ts']),
    )
    expect(status.files).toHaveLength(1)
    expect(status.files[0].path).toBe('new-name.ts')
    expect(status.files[0].origPath).toBe('old-name.ts')
    expect(status.files[0].kind).toBe('renamed')
  })

  it('parses unmerged entries', () => {
    const status = parseGitStatus(
      porcelain(['u UU N... 100644 100644 100644 100644 aaa bbb ccc conflict.txt']),
    )
    expect(status.files[0]).toMatchObject({ path: 'conflict.txt', kind: 'unmerged' })
  })

  it('keeps paths that contain spaces', () => {
    const status = parseGitStatus(porcelain(['1 M. N... 100644 100644 100644 aaa bbb my file.txt']))
    expect(status.files[0].path).toBe('my file.txt')
  })

  it('returns an empty status for empty output', () => {
    expect(parseGitStatus('')).toEqual({
      branch: null,
      detached: false,
      upstream: null,
      ahead: 0,
      behind: 0,
      files: [],
    })
  })
})

describe('parseGitLog', () => {
  it('parses records separated by the record separator', () => {
    const raw = [
      'aaa\u001fa1b2c3\u001fAlice\u001f2026-01-02T03:04:05+00:00\u001fFirst commit',
      'bbb\u001fd4e5f6\u001fBob\u001f2026-01-01T00:00:00+00:00\u001fSecond commit',
    ].join('\u001e')
    const entries = parseGitLog(raw)
    expect(entries).toHaveLength(2)
    expect(entries[0]).toEqual({
      hash: 'aaa',
      shortHash: 'a1b2c3',
      author: 'Alice',
      date: '2026-01-02T03:04:05+00:00',
      subject: 'First commit',
    })
    expect(entries[1].subject).toBe('Second commit')
  })

  it('returns an empty list for empty output', () => {
    expect(parseGitLog('')).toEqual([])
  })
})

describe('parseBranchList', () => {
  it('splits and trims lines', () => {
    expect(parseBranchList('main\nfeature/x\n\n')).toEqual(['main', 'feature/x'])
  })
})

describe('parseRemotes', () => {
  it('deduplicates the fetch and push entries', () => {
    const raw = [
      'origin\thttps://github.com/user/repo.git (fetch)',
      'origin\thttps://github.com/user/repo.git (push)',
      'upstream\tgit@github.com:other/repo.git (fetch)',
      'upstream\tgit@github.com:other/repo.git (push)',
    ].join('\n')
    expect(parseRemotes(raw)).toEqual([
      { name: 'origin', url: 'https://github.com/user/repo.git' },
      { name: 'upstream', url: 'git@github.com:other/repo.git' },
    ])
  })

  it('returns an empty list for empty output', () => {
    expect(parseRemotes('')).toEqual([])
  })
})

describe('parseBranchRefs', () => {
  it('parses name, upstream and current marker and puts the current branch first', () => {
    const raw = ['main origin/main *', 'feature/x', 'wip origin/wip'].join('\n')
    expect(parseBranchRefs(raw)).toEqual([
      { name: 'main', upstream: 'origin/main', current: true },
      { name: 'feature/x', upstream: null, current: false },
      { name: 'wip', upstream: 'origin/wip', current: false },
    ])
  })

  it('ignores blank lines', () => {
    expect(parseBranchRefs('\n\n')).toEqual([])
  })
})

describe('kindForCode', () => {
  it('maps known codes and falls back to unknown', () => {
    expect(kindForCode('M')).toBe('modified')
    expect(kindForCode('R')).toBe('renamed')
    expect(kindForCode('X')).toBe('unknown')
  })
})
