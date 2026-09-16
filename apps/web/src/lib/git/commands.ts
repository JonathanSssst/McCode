import type { GitRunner } from './client'
import { emptyStatus, parseBranchList, parseGitLog, parseGitStatus } from './parse'
import type { GitLogEntry, GitRunResult, GitStatus } from './types'

export interface GitOutcome {
  ok: boolean
  error: string
}

function toOutcome(result: GitRunResult): GitOutcome {
  if (result.code === 0) return { ok: true, error: '' }
  return { ok: false, error: result.stderr.trim() || `git exited with code ${result.code}` }
}

export async function isRepository(runner: GitRunner): Promise<boolean> {
  const result = await runner.run(['rev-parse', '--is-inside-work-tree'])
  return result.code === 0 && result.stdout.trim() === 'true'
}

export async function readStatus(runner: GitRunner): Promise<GitStatus> {
  const result = await runner.run(['status', '--porcelain=v2', '--branch', '-z'])
  if (result.code !== 0) return emptyStatus()
  return parseGitStatus(result.stdout)
}

export async function initRepository(runner: GitRunner): Promise<GitOutcome> {
  return toOutcome(await runner.run(['init']))
}

export async function stagePaths(runner: GitRunner, paths: string[]): Promise<GitOutcome> {
  if (paths.length === 0) return { ok: true, error: '' }
  return toOutcome(await runner.run(['add', '--', ...paths]))
}

export async function stageAll(runner: GitRunner): Promise<GitOutcome> {
  return toOutcome(await runner.run(['add', '-A']))
}

export async function unstagePaths(runner: GitRunner, paths: string[]): Promise<GitOutcome> {
  if (paths.length === 0) return { ok: true, error: '' }
  return toOutcome(await runner.run(['reset', '-q', '--', ...paths]))
}

export async function unstageAll(runner: GitRunner): Promise<GitOutcome> {
  return toOutcome(await runner.run(['reset', '-q']))
}

export async function discardPaths(runner: GitRunner, paths: string[]): Promise<GitOutcome> {
  if (paths.length === 0) return { ok: true, error: '' }
  return toOutcome(await runner.run(['restore', '--', ...paths]))
}

export async function commit(runner: GitRunner, message: string): Promise<GitOutcome> {
  const trimmed = message.trim()
  if (!trimmed) return { ok: false, error: 'Commit message is empty' }
  return toOutcome(await runner.run(['commit', '-m', trimmed]))
}

export async function readLog(runner: GitRunner, limit = 30): Promise<GitLogEntry[]> {
  const result = await runner.run([
    'log',
    `-n${limit}`,
    '--pretty=format:%H\x1f%h\x1f%an\x1f%aI\x1f%s\x1e',
  ])
  if (result.code !== 0) return []
  return parseGitLog(result.stdout)
}

export async function readBranches(runner: GitRunner): Promise<string[]> {
  const result = await runner.run(['for-each-ref', '--format=%(refname:short)', 'refs/heads'])
  if (result.code !== 0) return []
  return parseBranchList(result.stdout)
}

export async function switchBranch(runner: GitRunner, name: string): Promise<GitOutcome> {
  return toOutcome(await runner.run(['switch', name]))
}

export async function showFileAtRef(
  runner: GitRunner,
  ref: string,
  path: string,
): Promise<string | null> {
  const result = await runner.run(['show', `${ref}:${path}`])
  return result.code === 0 ? result.stdout : null
}
