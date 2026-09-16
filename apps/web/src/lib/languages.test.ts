import { describe, expect, it } from 'vitest'
import { isBinaryPath, languageForPath } from './languages'

describe('languages', () => {
  it('maps known extensions to languages', () => {
    expect(languageForPath('data/mccode/function/a.mcfunction')).toBe('mcfunction')
    expect(languageForPath('data/mccode/advancement/a.json')).toBe('json')
    expect(languageForPath('pack.mcmeta')).toBe('json')
    expect(languageForPath('data/mccode/foo.mcdoc')).toBe('mcdoc')
    expect(languageForPath('data/mccode/foo.snbt')).toBe('snbt')
    expect(languageForPath('unknown')).toBe('plaintext')
  })

  it('detects binary paths', () => {
    expect(isBinaryPath('assets/minecraft/textures/block/x.png')).toBe(true)
    expect(isBinaryPath('data/mccode/structure/y.nbt')).toBe(true)
    expect(isBinaryPath('assets/minecraft/sounds/a.ogg')).toBe(true)
    expect(isBinaryPath('data/mccode/font/f.ttf')).toBe(true)
    expect(isBinaryPath('data/mccode/function/a.mcfunction')).toBe(false)
    expect(isBinaryPath('assets/minecraft/textures/block/x.png.mcmeta')).toBe(false)
    expect(isBinaryPath('noext')).toBe(false)
  })
})
