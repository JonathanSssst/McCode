/** Returns the final path segment, for both `/` and `\` separated paths. */
export function baseName(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, '')
  const index = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  return index === -1 ? trimmed : trimmed.slice(index + 1)
}

/** Returns the parent path (without a trailing separator). */
export function parentDir(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, '')
  const index = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  return index <= 0 ? '' : trimmed.slice(0, index)
}
