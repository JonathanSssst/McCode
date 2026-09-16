import { describe, expect, it } from 'vitest'
import { cleanCompletion, stripCodeFences } from './validate'

describe('stripCodeFences', () => {
  it('unwraps fenced blocks', () => {
    expect(stripCodeFences('```mcfunction\nsay hi\n```')).toBe('say hi')
    expect(stripCodeFences('```\nsay hi\n```')).toBe('say hi')
  })

  it('trims plain text', () => {
    expect(stripCodeFences('  say hi  ')).toBe('say hi')
  })
})

describe('cleanCompletion', () => {
  it('strips fences and trailing blank lines', () => {
    expect(cleanCompletion('```\nsay hi\n\n```', 'mcfunction')).toBe('say hi')
  })

  it('drops the echoed current line when more lines follow', () => {
    expect(
      cleanCompletion('say hi\ntell @a ok', 'mcfunction', { currentLinePrefix: 'say hi' }),
    ).toBe('tell @a ok')
  })

  it('keeps the echoed line when it is the only line', () => {
    expect(cleanCompletion('say hi', 'mcfunction', { currentLinePrefix: 'say hi' })).toBe('say hi')
  })

  it('filters prose lines for mcfunction', () => {
    const raw = 'Here is the command:\nsay hi\nNote: done'
    expect(cleanCompletion(raw, 'mcfunction')).toBe('say hi')
  })

  it('does not filter prose lines for json', () => {
    const raw = 'This is fine\n{"a": 1}'
    expect(cleanCompletion(raw, 'json')).toBe(raw)
  })

  it('limits the number of lines', () => {
    const raw = ['a', 'b', 'c', 'd'].join('\n')
    expect(cleanCompletion(raw, 'mcfunction', { maxLines: 2 })).toBe('a\nb')
  })

  it('returns an empty string for blank input', () => {
    expect(cleanCompletion('   \n  ', 'mcfunction')).toBe('')
  })
})
