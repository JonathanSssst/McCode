import * as core from '@spyglassmc/core'
import * as je from '@spyglassmc/java-edition'
import * as mcdoc from '@spyglassmc/mcdoc'
import type { Externals } from '@spyglassmc/core'
import { CACHE_ROOT, VIRTUAL_ROOT, fromSpyUri, toSpyUri } from './uri'
import { SimpleFileWatcher } from './fileWatcher'
import type {
  SpyCodeAction,
  SpyColorToken,
  SpyCompletion,
  SpyDiagnostic,
  SpyHover,
  SpyLocation,
  SpyRange,
  SpySymbol,
  SpyTextEdit,
} from './types'

export type {
  SpyCodeAction,
  SpyColorToken,
  SpyCompletion,
  SpyDiagnostic,
  SpyEdit,
  SpyHover,
  SpyLocation,
  SpyRange,
  SpySymbol,
  SpyTextEdit,
} from './types'

const SUPPORTED_LANGUAGES = new Set(['mcfunction', 'json', 'snbt', 'mcdoc'])

let logSink: ((level: string, message: string) => void) | null = null

function formatLog(data: unknown, args: unknown[]): string {
  const parts = [data, ...args].map((value) =>
    typeof value === 'string' ? value : value instanceof Error ? value.message : safeString(value),
  )
  return parts.join(' ')
}

function safeString(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function emitLog(level: string, data: unknown, args: unknown[]): void {
  const message = formatLog(data, args)
  if (logSink) logSink(level, message)
  else if (level === 'error') console.error('[spyglass]', message)
  else if (level === 'warn') console.warn('[spyglass]', message)
  else console.debug('[spyglass]', message)
}

const logger: core.Logger = {
  error: (data: unknown, ...args: unknown[]) => emitLog('error', data, args),
  info: (data: unknown, ...args: unknown[]) => emitLog('info', data, args),
  log: (data: unknown, ...args: unknown[]) => emitLog('log', data, args),
  warn: (data: unknown, ...args: unknown[]) => emitLog('warn', data, args),
}

let service: core.Service | null = null
let ready = false
let versionCounter = 0
let fileWatcher: SimpleFileWatcher | null = null
const lastContent = new Map<string, string>()
const syncing = new Map<string, Promise<void>>()
const syncTimers = new Map<string, ReturnType<typeof setTimeout>>()

let onDiagnostics: ((uri: string, diagnostics: SpyDiagnostic[]) => void) | null = null

export function isSpyglassReady(): boolean {
  return ready
}

export function getResolvedVersion(): string | undefined {
  const value = service?.project.ctx?.['loadedVersion']
  return typeof value === 'string' ? value : undefined
}

export function resetSpyglass(): void {
  service = null
  ready = false
  fileWatcher = null
  lastContent.clear()
  syncing.clear()
  for (const timer of syncTimers.values()) clearTimeout(timer)
  syncTimers.clear()
}

export async function initSpyglass(options: {
  externals: Externals
  gameVersion?: string
  onDiagnostics?: (uri: string, diagnostics: SpyDiagnostic[]) => void
  onStatus?: (status: string) => void
  onLog?: (level: string, message: string) => void
}): Promise<void> {
  onDiagnostics = options.onDiagnostics ?? null
  logSink = options.onLog ?? null
  ready = false
  versionCounter = 0
  lastContent.clear()
  syncing.clear()

  const gameVersion = options.gameVersion ?? 'auto'
  const externals: Externals = options.externals
  const instance = new core.Service({
    logger,
    project: {
      cacheRoot: CACHE_ROOT,
      defaultConfig: core.ConfigService.merge(core.VanillaConfig, {
        env: { dependencies: ['@vanilla-mcdoc'], gameVersion },
      }),
      externals,
      initializers: [mcdoc.initialize, je.initialize],
      projectRoots: [VIRTUAL_ROOT],
    },
  })
  service = instance

  instance.project.on('documentErrored', ({ errors, uri }) => {
    onDiagnostics?.(
      uri,
      errors.map((e) => ({
        message: e.message,
        severity: e.severity,
        range: {
          startLine: e.posRange.start.line,
          startChar: e.posRange.start.character,
          endLine: e.posRange.end.line,
          endChar: e.posRange.end.character,
        },
      })),
    )
  })

  options.onStatus?.('Spyglass: initializing…')
  await instance.project.init()
  fileWatcher = new SimpleFileWatcher(externals, [VIRTUAL_ROOT], logger)
  options.onStatus?.('Spyglass: analyzing project…')
  await instance.project.ready({ projectRootsWatcher: fileWatcher })
  ready = true
  options.onStatus?.('Spyglass: ready')
}

export async function openDocument(path: string, language: string, content: string): Promise<void> {
  if (!service) return
  if (!SUPPORTED_LANGUAGES.has(language)) return
  const uri = toSpyUri(path)
  lastContent.set(path, content)
  await service.project.onDidOpen(uri, language, ++versionCounter, content)
}

export function closeDocument(path: string): void {
  if (!service) return
  service.project.onDidClose(toSpyUri(path))
  lastContent.delete(path)
}

async function syncDocument(path: string, content: string): Promise<void> {
  if (!service) return
  const previous = syncing.get(path) ?? Promise.resolve()
  const next = previous.then(async () => {
    if (lastContent.get(path) === content) return
    await service!.project.onDidChange(toSpyUri(path), [{ text: content }], ++versionCounter)
    lastContent.set(path, content)
  })
  syncing.set(
    path,
    next.catch(() => {}),
  )
  await next
}

export function changeDocument(path: string, content: string): Promise<void> {
  return syncDocument(path, content)
}

export async function refreshProject(paths?: string[]): Promise<void> {
  if (!service) return
  try {
    if (paths && paths.length > 0) {
      await fileWatcher?.handleChanges(paths)
      return
    }
    if (fileWatcher) await fileWatcher.refresh(true)
    await service.project.analyzeProject()
  } catch {
    // ignore analysis errors
  }
}

export function scheduleDocumentSync(path: string, content: string): void {
  const existing = syncTimers.get(path)
  if (existing) clearTimeout(existing)
  syncTimers.set(
    path,
    setTimeout(() => {
      syncTimers.delete(path)
      void syncDocument(path, content)
    }, 200),
  )
}

function offsetRange(
  doc: { positionAt(offset: number): { line: number; character: number } },
  range: {
    start: number
    end: number
  },
): SpyRange {
  const start = doc.positionAt(range.start)
  const end = doc.positionAt(range.end)
  return {
    startLine: start.line,
    startChar: start.character,
    endLine: end.line,
    endChar: end.character,
  }
}

function posRangeToSpy(range: {
  start: { line: number; character: number }
  end: { line: number; character: number }
}): SpyRange {
  return {
    startLine: range.start.line,
    startChar: range.start.character,
    endLine: range.end.line,
    endChar: range.end.character,
  }
}

function offsetFromMonaco(
  doc: { offsetAt(position: { line: number; character: number }): number },
  position: { lineNumber: number; column: number },
): number {
  return doc.offsetAt({ line: position.lineNumber - 1, character: position.column - 1 })
}

export async function completeAt(
  path: string,
  content: string,
  position: { lineNumber: number; column: number },
  triggerCharacter?: string,
): Promise<SpyCompletion[]> {
  if (!service) return []
  await syncDocument(path, content)
  const dn = await service.project.ensureClientManagedChecked(toSpyUri(path))
  if (!dn) return []
  const offset = offsetFromMonaco(dn.doc, position)
  const items = service.complete(dn.node, dn.doc, offset, triggerCharacter)
  return items.map((item) => ({
    label: item.label,
    kind: item.kind,
    detail: item.detail,
    documentation: item.documentation,
    insertText: item.insertText,
    sortText: item.sortText,
    filterText: item.filterText,
    deprecated: item.deprecated,
    range: offsetRange(dn.doc, item.range),
  }))
}

export async function hoverAt(
  path: string,
  content: string,
  position: { lineNumber: number; column: number },
): Promise<SpyHover | undefined> {
  if (!service) return undefined
  await syncDocument(path, content)
  const dn = await service.project.ensureClientManagedChecked(toSpyUri(path))
  if (!dn) return undefined
  const hover = service.getHover(dn.node, dn.doc, offsetFromMonaco(dn.doc, position))
  if (!hover) return undefined
  return { markdown: hover.markdown, range: offsetRange(dn.doc, hover.range) }
}

export async function definitionAt(
  path: string,
  content: string,
  position: { lineNumber: number; column: number },
): Promise<SpyLocation[]> {
  if (!service) return []
  await syncDocument(path, content)
  const uri = toSpyUri(path)
  const dn = await service.project.ensureClientManagedChecked(uri)
  if (!dn) return []
  const locations = await service.getSymbolLocations(
    dn.node,
    dn.doc,
    offsetFromMonaco(dn.doc, position),
    ['definition', 'declaration', 'implementation', 'typeDefinition'],
  )
  if (!locations?.locations) return []
  const result: SpyLocation[] = []
  for (const location of locations.locations) {
    const targetPath = fromSpyUri(location.uri)
    if (targetPath === undefined || !location.posRange) continue
    result.push({ path: targetPath, range: posRangeToSpy(location.posRange) })
  }
  return result
}

export async function formatDocument(
  path: string,
  content: string,
  tabSize: number,
  insertSpaces: boolean,
): Promise<string | undefined> {
  if (!service) return undefined
  await syncDocument(path, content)
  const dn = await service.project.ensureClientManagedChecked(toSpyUri(path))
  if (!dn || dn.node.parserErrors.length !== 0) return undefined
  return service.format(dn.node, dn.doc, tabSize, insertSpaces)
}

export async function colorizeDocument(path: string, content: string): Promise<SpyColorToken[]> {
  if (!service) return []
  await syncDocument(path, content)
  const dn = await service.project.ensureClientManagedChecked(toSpyUri(path))
  if (!dn) return []
  return service.colorize(dn.node, dn.doc).map((token) => ({
    start: token.range.start,
    end: token.range.end,
    type: token.type,
    modifiers: token.modifiers ?? [],
  }))
}

export async function prepareRenameAt(
  path: string,
  content: string,
  position: { lineNumber: number; column: number },
): Promise<SpyRange | undefined> {
  if (!service) return undefined
  await syncDocument(path, content)
  const dn = await service.project.ensureClientManagedChecked(toSpyUri(path))
  if (!dn) return undefined
  const locations = await service.getSymbolLocations(
    dn.node,
    dn.doc,
    offsetFromMonaco(dn.doc, position),
  )
  if (!locations?.range) return undefined
  return offsetRange(dn.doc, locations.range)
}

export async function renameAt(
  path: string,
  content: string,
  position: { lineNumber: number; column: number },
  newName: string,
): Promise<SpyTextEdit[] | undefined> {
  if (!service) return undefined
  await syncDocument(path, content)
  const uri = toSpyUri(path)
  const dn = await service.project.ensureClientManagedChecked(uri)
  if (!dn) return undefined
  const locations = await service.getSymbolLocations(
    dn.node,
    dn.doc,
    offsetFromMonaco(dn.doc, position),
  )
  if (!locations) return undefined

  const edits: SpyTextEdit[] = []
  if (locations.range) {
    const targetPath = fromSpyUri(uri)
    if (targetPath !== undefined) {
      edits.push({ path: targetPath, range: offsetRange(dn.doc, locations.range), text: newName })
    }
  }
  for (const location of locations.locations ?? []) {
    if (location.skipRenaming || !location.posRange) continue
    const targetPath = fromSpyUri(location.uri)
    if (targetPath === undefined) continue
    edits.push({ path: targetPath, range: posRangeToSpy(location.posRange), text: newName })
  }

  const seen = new Set<string>()
  return edits.filter((edit) => {
    const key = `${edit.path}:${edit.range.startLine}:${edit.range.startChar}:${edit.range.endLine}:${edit.range.endChar}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function codeActionsAt(
  path: string,
  content: string,
  range: SpyRange,
): Promise<SpyCodeAction[]> {
  if (!service) return []
  await syncDocument(path, content)
  const dn = await service.project.ensureClientManagedChecked(toSpyUri(path))
  if (!dn) return []
  const coreRange = {
    start: dn.doc.offsetAt({ line: range.startLine, character: range.startChar }),
    end: dn.doc.offsetAt({ line: range.endLine, character: range.endChar }),
  }
  const actions = service.getCodeActions(dn.node, dn.doc, coreRange)
  return actions.map((action) => ({
    title: action.title,
    isPreferred: action.isPreferred,
    edits: (action.changes ?? [])
      .filter(
        (change): change is { type: 'edit'; range: { start: number; end: number }; text: string } =>
          change.type === 'edit',
      )
      .map((change) => ({ path, range: offsetRange(dn.doc, change.range), text: change.text })),
  }))
}

function symbolKindNumber(category: string, subcategory?: string): number {
  if (category === 'mcdoc') {
    const map: Record<string, number> = { enum: 10, compound: 23, module: 2 }
    return map[subcategory ?? ''] ?? 13
  }
  const map: Record<string, number> = {
    function: 12,
    objective: 13,
    score_holder: 5,
    tag: 15,
    team: 18,
  }
  return map[category] ?? 13
}

export async function documentSymbolsAt(path: string, content: string): Promise<SpySymbol[]> {
  if (!service) return []
  await syncDocument(path, content)
  const uri = toSpyUri(path)
  const dn = await service.project.ensureClientManagedChecked(uri)
  if (!dn) return []

  const out: SpySymbol[] = []
  const collect = (map: Record<string, unknown>): void => {
    for (const value of Object.values(map)) {
      const symbol = value as {
        identifier?: string
        category: string
        subcategory?: string
        declaration?: { uri: string; posRange?: unknown; fullPosRange?: unknown }[]
        definition?: { uri: string; posRange?: unknown; fullPosRange?: unknown }[]
        implementation?: { uri: string; posRange?: unknown; fullPosRange?: unknown }[]
        typeDefinition?: { uri: string; posRange?: unknown; fullPosRange?: unknown }[]
        members?: Record<string, unknown>
      }
      const candidates = [
        ...(symbol.declaration ?? []),
        ...(symbol.definition ?? []),
        ...(symbol.implementation ?? []),
        ...(symbol.typeDefinition ?? []),
      ]
      const loc = candidates.find((candidate) => candidate.uri === uri)
      if (loc && symbol.identifier) {
        const full = loc.fullPosRange ?? loc.posRange
        const selection = loc.posRange ?? full
        if (full && selection) {
          out.push({
            name: symbol.identifier,
            kind: symbolKindNumber(symbol.category, symbol.subcategory),
            range: posRangeToSpy(full as Parameters<typeof posRangeToSpy>[0]),
            selectionRange: posRangeToSpy(selection as Parameters<typeof posRangeToSpy>[0]),
          })
        }
      }
      if (symbol.members) collect(symbol.members)
    }
  }

  const tables: Record<string, Record<string, unknown>>[] = [
    service.project.symbols.global as unknown as Record<string, Record<string, unknown>>,
    ...(core.AstNode.getLocalsToLeaves(dn.node) as unknown as Record<
      string,
      Record<string, unknown>
    >[]),
  ]
  for (const table of tables) {
    for (const map of Object.values(table)) collect(map)
  }
  return out
}
