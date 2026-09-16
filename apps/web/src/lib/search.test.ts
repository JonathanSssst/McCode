import { describe, expect, it } from 'vitest'
import { buildSearchRegex, isSearchable, matchGlob, matchText, searchFiles } from './search'

function provider(files: Record<string, string>) {
  return {
    readFile: async (path: string) => new TextEncoder().encode(files[path] ?? ''),
  }
}

describe('search', () => {
  it('filters searchable files', () => {
    expect(isSearchable('a.mcfunction')).toBe(true)
    expect(isSearchable('a.json')).toBe(true)
    expect(isSearchable('a.png')).toBe(false)
    expect(isSearchable('a.nbt')).toBe(false)
  })

  it('finds line and column of matches', () => {
    const regex = buildSearchRegex('hello', { caseSensitive: false, regex: false })
    const matches = matchText('say hello\n# Hello', regex, 100)
    expect(matches).toHaveLength(2)
    expect(matches[0]).toMatchObject({ line: 1, column: 5, endColumn: 10 })
    expect(matches[1]).toMatchObject({ line: 2, column: 3 })
  })

  it('honours case sensitivity', () => {
    const regex = buildSearchRegex('hello', { caseSensitive: true, regex: false })
    expect(matchText('say hello\n# Hello', regex, 100)).toHaveLength(1)
  })

  it('supports regex queries', () => {
    const regex = buildSearchRegex('say\\s+\\w+', { caseSensitive: false, regex: true })
    expect(matchText('say hello\nsay bye', regex, 100)).toHaveLength(2)
  })

  it('searches files and skips binaries', async () => {
    const files = {
      'a.mcfunction': 'say hello',
      'b.mcfunction': 'say bye',
      'c.png': 'hello',
    }
    const outcome = await searchFiles(provider(files), Object.keys(files), 'hello', {
      caseSensitive: false,
      regex: false,
    })
    expect(outcome.results.map((r) => r.path)).toEqual(['a.mcfunction'])
    expect(outcome.results[0].matches[0]).toMatchObject({ line: 1, column: 5 })
  })

  it('matches include/exclude globs', () => {
    expect(matchGlob('**/*.mcfunction', 'data/a/b.mcfunction')).toBe(true)
    expect(matchGlob('*.json', 'a.json')).toBe(true)
    expect(matchGlob('*.json', 'dir/a.json')).toBe(false)
    expect(matchGlob('**/tags/**', 'data/x/tags/y.json')).toBe(true)
    expect(matchGlob('', 'anything')).toBe(true)
  })

  it('filters by include/exclude and supports cancellation', async () => {
    const files = {
      'a.mcfunction': 'hello',
      'tags/t.json': 'hello',
    }
    const filtered = await searchFiles(
      provider(files),
      Object.keys(files),
      'hello',
      { caseSensitive: false, regex: false },
      { include: '**/*.mcfunction' },
    )
    expect(filtered.results.map((r) => r.path)).toEqual(['a.mcfunction'])

    const controller = new AbortController()
    controller.abort()
    const cancelled = await searchFiles(
      provider(files),
      Object.keys(files),
      'hello',
      { caseSensitive: false, regex: false },
      { signal: controller.signal },
    )
    expect(cancelled.cancelled).toBe(true)
  })
})
