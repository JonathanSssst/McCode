export type GitChangeKind =
  | 'modified'
  | 'added'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'typechange'
  | 'unmerged'
  | 'untracked'
  | 'unknown'

export interface GitFileChange {
  path: string
  origPath: string | null
  /** Index (staged) status character, '.' when unchanged. */
  index: string
  /** Worktree status character, '.' when unchanged. */
  worktree: string
  kind: GitChangeKind
}

export interface GitStatus {
  branch: string | null
  detached: boolean
  upstream: string | null
  ahead: number
  behind: number
  files: GitFileChange[]
}

export interface GitLogEntry {
  hash: string
  shortHash: string
  author: string
  date: string
  subject: string
}

export interface GitRunResult {
  code: number
  stdout: string
  stderr: string
}

const KIND_BY_CODE: Record<string, GitChangeKind> = {
  M: 'modified',
  A: 'added',
  D: 'deleted',
  R: 'renamed',
  C: 'copied',
  T: 'typechange',
  U: 'unmerged',
  '?': 'untracked',
}

export function kindForCode(code: string): GitChangeKind {
  return KIND_BY_CODE[code] ?? 'unknown'
}

export function isStaged(change: GitFileChange): boolean {
  return change.index !== '.' && change.index !== '?' && change.index !== ' '
}

export function isUnstaged(change: GitFileChange): boolean {
  return change.worktree !== '.' && change.worktree !== ' ' && change.worktree !== '?'
}
