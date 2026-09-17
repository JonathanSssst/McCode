import { describe, expect, it } from 'vitest'
import { baseName, parentDir } from './paths'

describe('baseName', () => {
  it('handles forward slashes', () => {
    expect(baseName('E:/Minecraft/saves/dt/datapacks')).toBe('datapacks')
    expect(baseName('a/b')).toBe('b')
    expect(baseName('single')).toBe('single')
  })

  it('handles Windows backslashes', () => {
    expect(baseName('E:\\Users\\Admin\\Desktop\\dtk\\DTkiller')).toBe('DTkiller')
    expect(baseName('C:\\world\\datapacks\\')).toBe('datapacks')
  })

  it('handles trailing separators and empty input', () => {
    expect(baseName('E:/a/b/')).toBe('b')
    expect(baseName('')).toBe('')
  })
})

describe('parentDir', () => {
  it('returns the parent of both separator styles', () => {
    expect(parentDir('E:/a/b')).toBe('E:/a')
    expect(parentDir('E:\\a\\b')).toBe('E:\\a')
  })

  it('returns an empty string at the root', () => {
    expect(parentDir('b')).toBe('')
    expect(parentDir('E:/a/')).toBe('E:')
  })
})
