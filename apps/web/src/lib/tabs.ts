export interface TabLike {
  path: string
  preview: boolean
}

export function pinTab<T extends TabLike>(files: T[], path: string): void {
  const file = files.find((item) => item.path === path)
  if (file) file.preview = false
}

/**
 * Inserts (or promotes) a tab, enforcing the single preview tab invariant.
 * Returns the tab that got replaced by a new preview, if any (caller should dispose it).
 * Mutates `files` so it works with both plain arrays and immer drafts.
 */
export function upsertTab<T extends TabLike>(
  files: T[],
  path: string,
  preview: boolean,
  create: () => T,
): T | null {
  const existing = files.find((item) => item.path === path)
  if (existing) {
    if (!preview) existing.preview = false
    return null
  }
  const tab = create()
  if (preview) {
    const index = files.findIndex((item) => item.preview)
    if (index >= 0) {
      const replaced = files[index]
      files.splice(index, 1, tab)
      return replaced
    }
  }
  files.push(tab)
  return null
}
