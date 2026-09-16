import { gunzipSync } from 'fflate'

export interface DecompressedEntry {
  path: string
  data: Uint8Array<ArrayBuffer>
  mode: number
  mtime: string
  type: 'file' | 'directory'
}

function parseTar(buffer: Uint8Array<ArrayBuffer>, stripLevel: number): DecompressedEntry[] {
  const decoder = new TextDecoder()
  const entries: DecompressedEntry[] = []
  let offset = 0
  let pendingName: string | undefined

  const readString = (start: number, length: number): string => {
    let end = start
    while (end < start + length && buffer[end] !== 0) end += 1
    return decoder.decode(buffer.subarray(start, end))
  }
  const readOctal = (start: number, length: number): number => {
    const text = readString(start, length).trim()
    return text ? parseInt(text, 8) : 0
  }

  while (offset + 512 <= buffer.length) {
    let allZero = true
    for (let i = 0; i < 512; i += 1) {
      if (buffer[offset + i] !== 0) {
        allZero = false
        break
      }
    }
    if (allZero) break

    const name = readString(offset, 100)
    const prefix = readString(offset + 345, 155)
    const size = readOctal(offset + 124, 12)
    const mode = readOctal(offset + 100, 8)
    const mtime = readString(offset + 136, 12)
    const typeflag = String.fromCharCode(buffer[offset + 156])
    const dataStart = offset + 512
    const dataEnd = dataStart + size

    const resolve = (): string => {
      if (pendingName !== undefined) {
        const value = pendingName
        pendingName = undefined
        return value
      }
      return prefix ? `${prefix}/${name}` : name
    }

    if (typeflag === 'L') {
      pendingName = decoder.decode(buffer.subarray(dataStart, dataEnd)).replace(/\0.*$/s, '')
    } else if (typeflag === 'x' || typeflag === 'g') {
      const text = decoder.decode(buffer.subarray(dataStart, dataEnd))
      const match = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(text)
      if (match) pendingName = match[1]
    } else if (typeflag === '0' || typeflag === '\0' || typeflag === '') {
      entries.push({
        path: resolve(),
        data: buffer.subarray(dataStart, dataEnd),
        mode,
        mtime,
        type: 'file',
      })
    } else if (typeflag === '5') {
      entries.push({ path: resolve(), data: new Uint8Array(0), mode, mtime, type: 'directory' })
    }

    offset = dataStart + Math.ceil(size / 512) * 512
  }

  if (stripLevel <= 0) return entries
  return entries
    .map((entry) => ({ ...entry, path: entry.path.split('/').slice(stripLevel).join('/') }))
    .filter((entry) => entry.path)
}

export async function decompressBall(
  buffer: Uint8Array<ArrayBuffer>,
  options?: { stripLevel?: number },
): Promise<DecompressedEntry[]> {
  const magic = buffer[0] === 0x1f && buffer[1] === 0x8b
  const tarBuffer = magic ? (gunzipSync(buffer) as Uint8Array<ArrayBuffer>) : buffer
  return parseTar(tarBuffer, options?.stripLevel ?? 0)
}
