import { describe, expect, it } from 'vitest'
import { headWithin, namespaceOf, selectRelatedPaths, tailWithin } from './context'

describe('namespaceOf', () => {
  it('extracts the namespace of datapack files', () => {
    expect(namespaceOf('data/mypack/function/a.mcfunction')).toBe('mypack')
  })

  it('returns null for other paths', () => {
    expect(namespaceOf('pack.mcmeta')).toBeNull()
    expect(namespaceOf('data/mypack')).toBeNull()
  })
})

describe('selectRelatedPaths', () => {
  const active = 'data/mypack/function/main.mcfunction'
  const paths = [
    active,
    'data/mypack/function/helper.mcfunction',
    'data/mypack/advancement/root.json',
    'data/other/function/x.mcfunction',
    'assets/logo.png',
    'pack.mcmeta',
  ]

  it('excludes the active file and non-code files, and respects the limit', () => {
    const result = selectRelatedPaths(paths, active, 2)
    expect(result).toHaveLength(2)
    expect(result).not.toContain(active)
    expect(result).not.toContain('assets/logo.png')
  })

  it('prefers files in the same directory', () => {
    expect(selectRelatedPaths(paths, active, 1)).toEqual(['data/mypack/function/helper.mcfunction'])
  })

  it('prefers the same namespace over others', () => {
    const result = selectRelatedPaths(paths, active, 2)
    expect(result).toContain('data/mypack/function/helper.mcfunction')
    expect(result).not.toContain('data/other/function/x.mcfunction')
  })

  it('returns nothing when the limit is zero', () => {
    expect(selectRelatedPaths(paths, active, 0)).toEqual([])
  })
})

describe('budget helpers', () => {
  it('tailWithin keeps the end of long text', () => {
    expect(tailWithin('aaaa\nbbbb\ncccc', 9)).toContain('cccc')
    expect(tailWithin('short', 100)).toBe('short')
  })

  it('headWithin keeps the start of long text', () => {
    expect(headWithin('aaaa\nbbbb\ncccc', 4)).toBe('aaaa\n…')
    expect(headWithin('short', 100)).toBe('short')
  })

  it('returns empty strings for a non-positive budget', () => {
    expect(tailWithin('abc', 0)).toBe('')
    expect(headWithin('abc', 0)).toBe('')
  })
})
