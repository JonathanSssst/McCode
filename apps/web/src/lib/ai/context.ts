export function namespaceOf(path: string): string | null {
  const match = /^data\/([^/]+)\//.exec(path)
  return match ? match[1] : null
}

function directoryOf(path: string): string {
  const index = path.lastIndexOf('/')
  return index === -1 ? '' : path.slice(0, index)
}

const INTERESTING = /\.(mcfunction|json|mcmeta)$/

function score(path: string, activePath: string, activeNamespace: string | null): number {
  let value = 0
  if (activeNamespace && namespaceOf(path) === activeNamespace) value += 4
  if (directoryOf(path) === directoryOf(activePath)) value += 3
  if (path.endsWith('.mcfunction')) value += 1
  value -= path.split('/').length * 0.01
  return value
}

export function selectRelatedPaths(paths: string[], activePath: string, limit: number): string[] {
  if (limit <= 0) return []
  const activeNamespace = namespaceOf(activePath)
  return paths
    .filter((path) => path !== activePath && INTERESTING.test(path))
    .map((path) => ({ path, score: score(path, activePath, activeNamespace) }))
    .sort((a, b) => (b.score === a.score ? a.path.localeCompare(b.path) : b.score - a.score))
    .slice(0, limit)
    .map((entry) => entry.path)
}

export function tailWithin(text: string, maxChars: number): string {
  if (maxChars <= 0) return ''
  if (text.length <= maxChars) return text
  const tail = text.slice(text.length - maxChars)
  const newline = tail.indexOf('\n')
  return newline === -1 ? tail : `…\n${tail.slice(newline + 1)}`
}

export function headWithin(text: string, maxChars: number): string {
  if (maxChars <= 0) return ''
  if (text.length <= maxChars) return text
  return `${text.slice(0, maxChars)}\n…`
}
