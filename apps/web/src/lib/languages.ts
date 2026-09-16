export function languageForPath(path: string): string {
  const name = path.split('/').pop()?.toLowerCase() ?? ''
  if (name.endsWith('.mcfunction')) return 'mcfunction'
  if (name.endsWith('.mcdoc')) return 'mcdoc'
  if (name.endsWith('.snbt')) return 'snbt'
  if (name.endsWith('.mcmeta')) return 'json'
  if (name.endsWith('.json') || name.endsWith('.jsonc')) return 'json'
  if (name.endsWith('.md')) return 'markdown'
  if (name.endsWith('.yml') || name.endsWith('.yaml')) return 'yaml'
  return 'plaintext'
}

export function fileName(path: string): string {
  return path.split('/').pop() ?? path
}

export function dirName(path: string): string {
  const parts = path.split('/')
  parts.pop()
  return parts.join('/')
}

const BINARY_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'tga',
  'webp',
  'ico',
  'ttf',
  'otf',
  'woff',
  'woff2',
  'fsh',
  'vsh',
  'ogg',
  'oga',
  'mp3',
  'wav',
  'flac',
  'zip',
  'jar',
  'gz',
  'tar',
  'nbt',
  'mca',
  'mcr',
  'lock',
])

export function isBinaryPath(path: string): boolean {
  const name = path.split('/').pop()?.toLowerCase() ?? ''
  const dot = name.lastIndexOf('.')
  if (dot <= 0) return false
  return BINARY_EXTENSIONS.has(name.slice(dot + 1))
}
