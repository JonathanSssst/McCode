import { describe, expect, it } from 'vitest'
import { applyTextEdits } from './textEdits'

describe('applyTextEdits', () => {
  it('applies a single edit by line/char', () => {
    const text = 'line0\nline1\nabc utils def\n'
    const out = applyTextEdits(text, [
      { range: { startLine: 2, startChar: 4, endLine: 2, endChar: 9 }, text: 'helpers' },
    ])
    expect(out).toBe('line0\nline1\nabc helpers def\n')
  })

  it('applies multiple edits without shifting earlier offsets', () => {
    const out = applyTextEdits('a obj b obj', [
      { range: { startLine: 0, startChar: 2, endLine: 0, endChar: 5 }, text: 'score' },
      { range: { startLine: 0, startChar: 8, endLine: 0, endChar: 11 }, text: 'score' },
    ])
    expect(out).toBe('a score b score')
  })

  it('returns the original text when there are no edits', () => {
    expect(applyTextEdits('abc', [])).toBe('abc')
  })
})
