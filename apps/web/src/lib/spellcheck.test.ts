import { describe, expect, it } from 'vitest'
import {
  type DiagnosticLike,
  editDistance,
  enrichDiagnostics,
  extractCandidates,
  suggestFromMessage,
} from './spellcheck'

describe('spellcheck', () => {
  it('extracts candidates from curly quotes', () => {
    expect(extractCandidates('Expected “add” “list” or “remove”')).toEqual([
      'add',
      'list',
      'remove',
    ])
  })

  it('computes edit distance', () => {
    expect(editDistance('adf', 'add')).toBe(1)
    expect(editDistance('give', 'give')).toBe(0)
    expect(editDistance('', 'abc')).toBe(3)
  })

  it('suggests close candidates', () => {
    expect(suggestFromMessage('Expected “add” “list”', 'adf')).toBe('add')
    expect(suggestFromMessage('Expected “give” “time”', 'gibe')).toBe('give')
    expect(suggestFromMessage('Expected “advancement” “attribute” “give”', 'gibee')).toBe('give')
  })

  it('does not suggest exact matches or distant words', () => {
    expect(suggestFromMessage('Expected “add” “list”', 'add')).toBeUndefined()
    expect(suggestFromMessage('Expected “add” “list”', 'xyz')).toBeUndefined()
    expect(suggestFromMessage('no quotes here', 'adf')).toBeUndefined()
  })

  it('enriches diagnostics using model offsets', () => {
    const text = 'scoreboard objectives adf obj dummy'
    const model = {
      getValue: () => text,
      getOffsetAt: (position: { column: number }) => position.column - 1,
    }
    const diagnostic: DiagnosticLike = {
      message: 'Expected “add” “list”',
      range: { startLine: 0, startChar: 22, endLine: 0, endChar: 25 },
    }
    const enriched = enrichDiagnostics(model, [diagnostic])
    expect(enriched[0].suggestion).toBe('add')
    expect(enrichDiagnostics(null, [diagnostic])[0].suggestion).toBeUndefined()
  })
})
