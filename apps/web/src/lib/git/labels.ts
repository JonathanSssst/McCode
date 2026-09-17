import type { GitChangeKind } from './types'

export const GIT_LETTER: Record<GitChangeKind, string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  renamed: 'R',
  copied: 'C',
  typechange: 'T',
  unmerged: 'U',
  untracked: 'U',
  unknown: '?',
}

export const GIT_TINT: Record<GitChangeKind, string> = {
  modified: 'text-[#e2c08d]',
  added: 'text-[#73c991]',
  deleted: 'text-[#f48771]',
  renamed: 'text-[#73c991]',
  copied: 'text-[#73c991]',
  typechange: 'text-[#e2c08d]',
  unmerged: 'text-[#f48771]',
  untracked: 'text-[#73c991]',
  unknown: 'text-vsc-fg-dim',
}
