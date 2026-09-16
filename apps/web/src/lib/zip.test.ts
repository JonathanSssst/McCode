import { describe, expect, it } from 'vitest'
import { buildZipName } from './zip'

describe('buildZipName', () => {
  it('joins parts with dashes', () => {
    expect(buildZipName(['mypack', '1.21.11', 'pack94'])).toBe('mypack-1.21.11-pack94.zip')
  })

  it('sanitizes invalid filename characters', () => {
    expect(buildZipName(['a/b', 'x:y'])).toBe('a-b-x-y.zip')
  })

  it('skips empty parts and falls back', () => {
    expect(buildZipName(['pack', null, undefined, ''])).toBe('pack.zip')
    expect(buildZipName([])).toBe('datapack.zip')
  })
})
