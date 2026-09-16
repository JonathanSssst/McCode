import { kindForCode, type GitFileChange, type GitLogEntry, type GitStatus } from './types'

export function emptyStatus(): GitStatus {
  return { branch: null, detached: false, upstream: null, ahead: 0, behind: 0, files: [] }
}

function applyBranchHeader(header: string, status: GitStatus): void {
  if (header.startsWith('branch.head ')) {
    const value = header.slice('branch.head '.length).trim()
    if (value === '(detached)') {
      status.detached = true
      status.branch = null
    } else {
      status.branch = value
    }
    return
  }
  if (header.startsWith('branch.upstream ')) {
    status.upstream = header.slice('branch.upstream '.length).trim() || null
    return
  }
  if (header.startsWith('branch.ab ')) {
    const match = /\+(\d+)\s+-(\d+)/.exec(header)
    if (match) {
      status.ahead = Number(match[1])
      status.behind = Number(match[2])
    }
  }
}

function makeChange(path: string, xy: string, origPath: string | null): GitFileChange {
  const index = xy[0] ?? '.'
  const worktree = xy[1] ?? '.'
  const code = index !== '.' && index !== '?' ? index : worktree
  return { path, origPath, index, worktree, kind: kindForCode(code) }
}

/** Parses `git status --porcelain=v2 --branch -z`. */
export function parseGitStatus(raw: string): GitStatus {
  const status = emptyStatus()
  const tokens = raw.split('\0')
  for (let index = 0; index < tokens.length; index += 1) {
    const record = tokens[index]
    if (!record) continue
    if (record.startsWith('# ')) {
      applyBranchHeader(record.slice(2), status)
      continue
    }
    const type = record[0]
    const xy = record.slice(2, 4)
    if (type === '1') {
      status.files.push(makeChange(record.split(' ').slice(8).join(' '), xy, null))
    } else if (type === '2') {
      const path = record.split(' ').slice(9).join(' ')
      const origPath = tokens[index + 1] ?? null
      index += 1
      status.files.push(makeChange(path, xy, origPath || null))
    } else if (type === 'u') {
      status.files.push(makeChange(record.split(' ').slice(10).join(' '), xy, null))
    } else if (type === '?') {
      status.files.push({
        path: record.slice(2),
        origPath: null,
        index: '?',
        worktree: '?',
        kind: 'untracked',
      })
    }
  }
  return status
}

const LOG_FIELD = '\u001f'
const LOG_RECORD = '\u001e'

export function parseGitLog(raw: string): GitLogEntry[] {
  return raw
    .split(LOG_RECORD)
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash = '', shortHash = '', author = '', date = '', subject = ''] =
        record.split(LOG_FIELD)
      return { hash, shortHash, author, date, subject }
    })
}

export function parseBranchList(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}
