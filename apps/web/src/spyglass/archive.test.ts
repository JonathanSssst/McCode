import { gzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { decompressBall } from './archive'

function buildTar(entries: Array<{ name: string; content: string; type?: string }>): Uint8Array {
  const encoder = new TextEncoder()
  const blocks: Uint8Array[] = []
  const writeStr = (header: Uint8Array, offset: number, value: string) => {
    header.set(encoder.encode(value), offset)
  }
  const writeOctal = (header: Uint8Array, offset: number, length: number, value: number) => {
    header.set(encoder.encode(value.toString(8).padStart(length - 1, '0') + '\0'), offset)
  }

  for (const entry of entries) {
    const data = encoder.encode(entry.content)
    const header = new Uint8Array(512)
    writeStr(header, 0, entry.name)
    writeOctal(header, 100, 8, 0o644)
    writeOctal(header, 108, 8, 0)
    writeOctal(header, 116, 8, 0)
    writeOctal(header, 124, 12, data.length)
    writeOctal(header, 136, 12, 0)
    header[156] = (entry.type ?? '0').charCodeAt(0)
    writeStr(header, 257, 'ustar')
    for (let i = 148; i < 156; i += 1) header[i] = 32
    let sum = 0
    for (let i = 0; i < 512; i += 1) sum += header[i]
    writeStr(header, 148, sum.toString(8).padStart(6, '0') + '\0 ')
    blocks.push(header)
    const padded = Math.ceil(data.length / 512) * 512
    const contentBlock = new Uint8Array(padded)
    contentBlock.set(data)
    blocks.push(contentBlock)
  }
  blocks.push(new Uint8Array(1024))

  const total = blocks.reduce((n, b) => n + b.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const block of blocks) {
    out.set(block, offset)
    offset += block.length
  }
  return out
}

describe('decompressBall', () => {
  it('extracts a gzipped tar', async () => {
    const tar = buildTar([{ name: 'data/a.mcfunction', content: 'say hi' }])
    const gz = gzipSync(tar) as Uint8Array<ArrayBuffer>
    const entries = await decompressBall(gz)
    expect(entries).toHaveLength(1)
    expect(entries[0].path).toBe('data/a.mcfunction')
    expect(entries[0].type).toBe('file')
    expect(new TextDecoder().decode(entries[0].data)).toBe('say hi')
  })

  it('applies strip level', async () => {
    const tar = buildTar([{ name: 'root/data/a.json', content: '{}' }])
    const gz = gzipSync(tar) as Uint8Array<ArrayBuffer>
    const entries = await decompressBall(gz, { stripLevel: 1 })
    expect(entries[0].path).toBe('data/a.json')
  })

  it('handles directories', async () => {
    const tar = buildTar([
      { name: 'dir/', content: '', type: '5' },
      { name: 'dir/a.txt', content: 'x' },
    ])
    const gz = gzipSync(tar) as Uint8Array<ArrayBuffer>
    const entries = await decompressBall(gz)
    expect(entries.map((e) => e.type)).toEqual(['directory', 'file'])
  })
})
