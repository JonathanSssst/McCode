import type { TreeNode } from './tree'

export interface PackInfo {
  packFormat: number | null
  supportedFormats: number[] | null
  description: string | null
}

const DATA_PACK_FORMAT_TO_VERSION: Record<number, string> = {
  4: '1.13–1.14.4',
  5: '1.15–1.16.1',
  6: '1.16.2–1.16.5',
  7: '1.17–1.17.1',
  8: '1.18–1.18.1',
  9: '1.18.2',
  10: '1.19–1.19.3',
  12: '1.19.4',
  15: '1.20–1.20.1',
  18: '1.20.2',
  26: '1.20.3–1.20.4',
  41: '1.20.5–1.20.6',
  48: '1.21–1.21.1',
  57: '1.21.2–1.21.3',
  61: '1.21.4',
  71: '1.21.5',
  80: '1.21.6',
  88: '1.21.9–1.21.10',
  94: '1.21.11',
}

const DATA_PACK_FORMAT_TO_VERSION_ID: Record<number, string> = {
  48: '1.21.1',
  57: '1.21.3',
  61: '1.21.4',
  71: '1.21.5',
  80: '1.21.6',
  88: '1.21.10',
  94: '1.21.11',
}

export function versionIdForPackFormat(packFormat: number | null): string | undefined {
  if (packFormat === null) return undefined
  return DATA_PACK_FORMAT_TO_VERSION_ID[packFormat]
}

export function versionLabelForPackFormat(packFormat: number | null): string | null {
  if (packFormat === null) return null
  return DATA_PACK_FORMAT_TO_VERSION[packFormat] ?? null
}

export async function detectPackInfo(
  tree: TreeNode[],
  readText: (path: string) => Promise<string>,
): Promise<PackInfo> {
  const meta = tree.find((node) => node.kind === 'file' && node.name === 'pack.mcmeta')
  if (!meta) {
    return { packFormat: null, supportedFormats: null, description: null }
  }
  try {
    const text = await readText(meta.path)
    const parsed = JSON.parse(text) as {
      pack?: {
        pack_format?: number
        min_format?: number
        max_format?: number
        supported_formats?: number[] | { min_inclusive?: number; max_inclusive?: number }
        description?: unknown
      }
    }
    const pack = parsed.pack ?? {}
    const minFormat = typeof pack.min_format === 'number' ? pack.min_format : null
    const maxFormat = typeof pack.max_format === 'number' ? pack.max_format : null
    let supported: number[] | null = null
    const sf = pack.supported_formats
    if (Array.isArray(sf) && sf.every((n) => typeof n === 'number')) {
      supported = sf as number[]
    } else if (sf && typeof sf === 'object') {
      const min = (sf as { min_inclusive?: number }).min_inclusive
      const max = (sf as { max_inclusive?: number }).max_inclusive
      if (typeof min === 'number' && typeof max === 'number') {
        supported = Array.from({ length: max - min + 1 }, (_, i) => min + i)
      }
    } else if (minFormat !== null && maxFormat !== null && maxFormat >= minFormat) {
      supported = Array.from({ length: maxFormat - minFormat + 1 }, (_, i) => minFormat + i)
    }
    const description = typeof pack.description === 'string' ? pack.description : null
    const packFormat =
      typeof pack.pack_format === 'number'
        ? pack.pack_format
        : (minFormat ?? supported?.[0] ?? null)
    return {
      packFormat,
      supportedFormats: supported,
      description,
    }
  } catch {
    return { packFormat: null, supportedFormats: null, description: null }
  }
}

export function makePackMcmeta(packFormat: number, description: string): string {
  const pack: Record<string, unknown> = { pack_format: packFormat }
  // 1.21.9+ (pack_format 88) prefers the explicit min/max range.
  if (packFormat >= 88) {
    pack.min_format = packFormat
    pack.max_format = packFormat
  }
  pack.description = description
  return `${JSON.stringify({ pack }, null, 2)}\n`
}
