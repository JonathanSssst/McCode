export interface SearchOptions {
  caseSensitive: boolean
  regex: boolean
}

export interface SearchMatch {
  line: number
  column: number
  endColumn: number
  text: string
}

export interface SearchFileResult {
  path: string
  matches: SearchMatch[]
}

export interface SearchProvider {
  readFile(path: string): Promise<Uint8Array>
}

export interface SearchLimits {
  maxFiles?: number
  maxMatchesPerFile?: number
  maxResultFiles?: number
  signal?: AbortSignal
  include?: string
  exclude?: string
  onProgress?: (scanned: number, total: number, hits: number) => void
}

export interface SearchOutcome {
  results: SearchFileResult[]
  scanned: number
  truncated: boolean
  cancelled: boolean
}

const DEFAULT_MAX_FILES = 3000
const DEFAULT_MAX_MATCHES_PER_FILE = 100
const DEFAULT_MAX_RESULT_FILES = 200

const SEARCHABLE = /\.(mcfunction|json|jsonc|mcmeta|mcdoc|snbt|txt|md|yml|yaml)$/i

export function isSearchable(path: string): boolean {
  return SEARCHABLE.test(path)
}

export function matchGlob(pattern: string, path: string): boolean {
  if (!pattern) return true
  let re = ''
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i]
    if (char === '*') {
      if (pattern[i + 1] === '*') {
        if (pattern[i + 2] === '/') {
          re += '(?:.*/)?'
          i += 2
        } else {
          re += '.*'
          i += 1
        }
      } else {
        re += '[^/]*'
      }
    } else if (char === '?') {
      re += '[^/]'
    } else {
      re += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
  }
  try {
    return new RegExp(`^${re}$`).test(path)
  } catch {
    return true
  }
}

export function buildSearchRegex(query: string, options: SearchOptions): RegExp {
  const source = options.regex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(source, options.caseSensitive ? 'g' : 'gi')
}

export function matchText(text: string, regex: RegExp, maxMatches: number): SearchMatch[] {
  const out: SearchMatch[] = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length && out.length < maxMatches; i += 1) {
    regex.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = regex.exec(lines[i])) !== null) {
      if (match[0].length === 0) {
        regex.lastIndex += 1
        continue
      }
      out.push({
        line: i + 1,
        column: match.index + 1,
        endColumn: match.index + match[0].length + 1,
        text: lines[i],
      })
      if (out.length >= maxMatches) break
    }
  }
  return out
}

export async function searchFiles(
  provider: SearchProvider,
  paths: string[],
  query: string,
  options: SearchOptions,
  limits: SearchLimits = {},
): Promise<SearchOutcome> {
  const maxFiles = limits.maxFiles ?? DEFAULT_MAX_FILES
  const maxMatchesPerFile = limits.maxMatchesPerFile ?? DEFAULT_MAX_MATCHES_PER_FILE
  const maxResultFiles = limits.maxResultFiles ?? DEFAULT_MAX_RESULT_FILES
  const regex = buildSearchRegex(query, options)
  const target = paths
    .filter(isSearchable)
    .filter(
      (path) =>
        (!limits.include || matchGlob(limits.include, path)) &&
        !(limits.exclude && matchGlob(limits.exclude, path)),
    )
    .slice(0, maxFiles)
  const results: SearchFileResult[] = []
  let scanned = 0
  for (const path of target) {
    if (limits.signal?.aborted) {
      return { results, scanned, truncated: false, cancelled: true }
    }
    if (results.length >= maxResultFiles) {
      return { results, scanned, truncated: true, cancelled: false }
    }
    scanned += 1
    try {
      const text = new TextDecoder().decode(await provider.readFile(path))
      const matches = matchText(text, regex, maxMatchesPerFile)
      if (matches.length > 0) results.push({ path, matches })
    } catch {
      // skip unreadable files
    }
    limits.onProgress?.(scanned, target.length, results.length)
  }
  return { results, scanned, truncated: scanned < target.length, cancelled: false }
}
