import { describe, expect, it } from 'vitest'
import type { TreeNode } from './tree'
import { formatBytes, isOldArtifact, joinPath, stripOldArtifacts, syncZipName } from './sync'

describe('isOldArtifact', () => {
  it('matches artifacts of the same pack', () => {
    expect(isOldArtifact('mypack-1.21.11-pack94.zip', 'mypack')).toBe(true)
    expect(isOldArtifact('mypack-1.20.6-pack57.zip', 'mypack')).toBe(true)
    expect(isOldArtifact('MyPack-1.21.11-pack94.ZIP', 'mypack')).toBe(true)
  })

  it('ignores other packs and non-archives', () => {
    expect(isOldArtifact('mypack-extras.zip', 'mypack')).toBe(false)
    expect(isOldArtifact('other-1.21.11-pack94.zip', 'mypack')).toBe(false)
    expect(isOldArtifact('mypack-1.21.11-pack94', 'mypack')).toBe(false)
    expect(isOldArtifact('mypack-1.21.11-pack94.zip', '')).toBe(false)
  })

  it('handles pack names with regex characters', () => {
    expect(isOldArtifact('my.pack-1.21.11-pack94.zip', 'my.pack')).toBe(true)
    expect(isOldArtifact('myxpack-1.21.11-pack94.zip', 'my.pack')).toBe(false)
  })
})

describe('syncZipName', () => {
  it('delegates to the zip name builder', () => {
    expect(syncZipName(['mypack', '1.21.11', 'pack94'])).toBe('mypack-1.21.11-pack94.zip')
  })
})

describe('joinPath', () => {
  it('joins with a forward slash and avoids duplicates', () => {
    expect(joinPath('C:/world/datapacks', 'a.zip')).toBe('C:/world/datapacks/a.zip')
    expect(joinPath('C:/world/datapacks/', 'a.zip')).toBe('C:/world/datapacks/a.zip')
    expect(joinPath('C:\\world\\datapacks\\', 'a.zip')).toBe('C:\\world\\datapacks/a.zip')
  })
})

describe('formatBytes', () => {
  it('formats bytes, kilobytes and megabytes', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(3 * 1024 * 1024)).toBe('3.00 MB')
  })
})

describe('stripOldArtifacts', () => {
  it('removes previous archives at any depth', () => {
    const tree: TreeNode[] = [
      { name: 'pack.mcmeta', path: 'pack.mcmeta', kind: 'file' },
      { name: 'mypack-1.21.11-pack94.zip', path: 'mypack-1.21.11-pack94.zip', kind: 'file' },
      {
        name: 'dist',
        path: 'dist',
        kind: 'directory',
        children: [
          { name: 'mypack-1.20.6-pack57.zip', path: 'dist/x.zip', kind: 'file' },
          { name: 'keep.txt', path: 'dist/keep.txt', kind: 'file' },
        ],
      },
    ]
    const result = stripOldArtifacts(tree, 'mypack')
    expect(result.map((node) => node.name)).toEqual(['pack.mcmeta', 'dist'])
    expect(result[1].children?.map((node) => node.name)).toEqual(['keep.txt'])
  })
})
