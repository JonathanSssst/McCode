import { getModel } from '@/monaco/models'
import { getProvider } from '@/lib/provider'
import { enrichDiagnostics } from '@/lib/spellcheck'
import type { SpyDiagnostic } from '@/spyglass/client'
import { fromSpyUri } from '@/spyglass/uri'

let spyglassModule: Promise<typeof import('@/spyglass/client')> | null = null
export function loadSpyglass(): Promise<typeof import('@/spyglass/client')> {
  spyglassModule ??= import('@/spyglass/client')
  return spyglassModule
}

let stopWatcher: (() => void) | null = null

export function startWatching(
  provider: ReturnType<typeof getProvider>,
  onChange: (paths?: string[]) => void,
): void {
  stopWatching()
  if (!provider.watch) return
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: string[] = []
  let unknown = false
  stopWatcher = provider.watch((paths) => {
    if (paths === undefined) unknown = true
    else pending.push(...paths)
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      const result = unknown ? undefined : pending
      unknown = false
      pending = []
      onChange(result)
    }, 400)
  })
}

export function stopWatching(): void {
  stopWatcher?.()
  stopWatcher = null
}

export function uniqueChildName(existing: Set<string>, name: string): string {
  if (!existing.has(name)) return name
  const dot = name.lastIndexOf('.')
  const base = dot > 0 ? name.slice(0, dot) : name
  const ext = dot > 0 ? name.slice(dot) : ''
  for (let i = 1; ; i += 1) {
    const candidate = i === 1 ? `${base} copy${ext}` : `${base} copy ${i}${ext}`
    if (!existing.has(candidate)) return candidate
  }
}

export function handleDiagnostics(
  uri: string,
  diagnostics: SpyDiagnostic[],
  setDiagnostics: (path: string, diagnostics: SpyDiagnostic[]) => void,
): void {
  const path = fromSpyUri(uri)
  if (path === undefined) return
  const enriched = enrichDiagnostics(getModel(path), diagnostics)
  setDiagnostics(path, enriched)
  void import('@/spyglass/monaco').then((m) => m.applyDiagnosticsToPath(path, enriched))
}
