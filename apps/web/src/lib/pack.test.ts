import { describe, expect, it } from 'vitest'
import { detectPackInfo, makePackMcmeta, parsePackVersion, versionIdForPackFormat } from './pack'
import type { TreeNode } from './tree'

const tree: TreeNode[] = [{ name: 'pack.mcmeta', path: 'pack.mcmeta', kind: 'file' }]

const read = (content: string) => async () => content

describe('detectPackInfo', () => {
  it('reads the legacy pack_format field', async () => {
    const info = await detectPackInfo(tree, read('{"pack":{"pack_format":94,"description":"x"}}'))
    expect(info.packFormat).toBe(94)
    expect(info.description).toBe('x')
  })

  it('falls back to min_format/max_format', async () => {
    const info = await detectPackInfo(
      tree,
      read('{"pack":{"min_format":94,"max_format":94,"description":"x"}}'),
    )
    expect(info.packFormat).toBe(94)
    expect(info.supportedFormats).toEqual([94])
  })

  it('reads a min/max range and derives the lowest format', async () => {
    const info = await detectPackInfo(tree, read('{"pack":{"min_format":88,"max_format":90}}'))
    expect(info.packFormat).toBe(88)
    expect(info.supportedFormats).toEqual([88, 89, 90])
  })

  it('prefers pack_format when both are present', async () => {
    const info = await detectPackInfo(
      tree,
      read('{"pack":{"pack_format":57,"min_format":94,"max_format":94}}'),
    )
    expect(info.packFormat).toBe(57)
  })

  it('returns an empty result without pack.mcmeta or on invalid json', async () => {
    expect((await detectPackInfo([], read('{}'))).packFormat).toBeNull()
    expect((await detectPackInfo(tree, read('not json'))).packFormat).toBeNull()
  })

  it('parses the datapack version from the description', async () => {
    const info = await detectPackInfo(
      tree,
      read('{"pack":{"min_format":94,"max_format":94,"description":"DTkiller v1.30 - campus"}}'),
    )
    expect(info.version).toBe('1.30')
    expect((await detectPackInfo(tree, read('{"pack":{"pack_format":94}}'))).version).toBeNull()
  })
})

describe('parsePackVersion', () => {
  it('extracts a v-prefixed version', () => {
    expect(parsePackVersion('DTkiller v1.30 - 校园行政楼')).toBe('1.30')
    expect(parsePackVersion('pack V1.2.3')).toBe('1.2.3')
  })

  it('returns null when there is none', () => {
    expect(parsePackVersion('DTkiller 1.30')).toBeNull()
    expect(parsePackVersion(null)).toBeNull()
    expect(parsePackVersion('')).toBeNull()
  })
})

describe('makePackMcmeta', () => {
  it('writes pack_format for older formats', () => {
    expect(JSON.parse(makePackMcmeta(57, 'x')).pack).toEqual({
      pack_format: 57,
      description: 'x',
    })
  })

  it('adds the min/max range for 1.21.9+', () => {
    expect(JSON.parse(makePackMcmeta(94, 'x')).pack).toEqual({
      pack_format: 94,
      min_format: 94,
      max_format: 94,
      description: 'x',
    })
  })
})

describe('versionIdForPackFormat', () => {
  it('maps known formats', () => {
    expect(versionIdForPackFormat(94)).toBe('1.21.11')
    expect(versionIdForPackFormat(null)).toBeUndefined()
  })
})
