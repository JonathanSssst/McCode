export const VIRTUAL_ROOT = 'file:///mccode/'
export const CACHE_ROOT = 'file:///mccode-cache/'

export function toSpyUri(path: string): string {
  return VIRTUAL_ROOT + path.replace(/^\/+/, '')
}

export function fromSpyUri(uri: string): string | undefined {
  if (!uri.startsWith(VIRTUAL_ROOT)) return undefined
  try {
    return decodeURIComponent(uri.slice(VIRTUAL_ROOT.length))
  } catch {
    return uri.slice(VIRTUAL_ROOT.length)
  }
}
