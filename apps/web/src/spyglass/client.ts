import type { MainToWorker, WorkerToMain } from './protocol'
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
import { VIRTUAL_ROOT } from './uri'
import { getProvider } from '@/lib/provider'
import SpyglassWorker from './worker?worker'

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

interface Position {
  lineNumber: number
  column: number
}

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void }

let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, Pending>()
let onDiagnostics: ((uri: string, diagnostics: SpyDiagnostic[]) => void) | null = null
let onStatus: ((message: string) => void) | null = null
let onLog: ((level: string, message: string) => void) | null = null
let readyResolve: (() => void) | null = null

const memFiles = new Map<string, Uint8Array>()
const memDirs = new Set<string>()

function relFromUri(uri: string): string | undefined {
  if (!uri.startsWith(VIRTUAL_ROOT)) return undefined
  return uri.slice(VIRTUAL_ROOT.length).replace(/\/+$/, '')
}

async function handleFs(message: Extract<WorkerToMain, { kind: 'fs' }>): Promise<void> {
  const respond = (ok: boolean, valueOrError: unknown): void => {
    if (ok) send({ kind: 'fs-result', id: message.id, ok: true, value: valueOrError })
    else send({ kind: 'fs-result', id: message.id, ok: false, error: String(valueOrError) })
  }
  try {
    const location = String(message.args[0])
    const rel = relFromUri(location)
    if (rel === undefined) {
      respond(true, await memoryFs(message.method, location, message.args))
      return
    }
    const provider = getProvider()
    switch (message.method) {
      case 'readFile': {
        respond(true, { data: await provider.readFile(rel) })
        return
      }
      case 'readdir': {
        respond(true, await provider.list(rel))
        return
      }
      case 'stat': {
        respond(true, await provider.stat(rel))
        return
      }
      case 'writeFile': {
        const data = message.args[1]
        await provider.writeFile(rel, data as string | Uint8Array)
        respond(true, undefined)
        return
      }
      case 'mkdir': {
        await provider.createDirectory(rel)
        respond(true, undefined)
        return
      }
      case 'rm': {
        const recursive = Boolean(
          message.args[1] && (message.args[1] as { recursive?: boolean }).recursive,
        )
        await provider.remove(rel, recursive)
        respond(true, undefined)
        return
      }
      case 'chmod':
      case 'unlink': {
        respond(true, undefined)
        return
      }
      default:
        throw new Error(`Unsupported fs method: ${message.method}`)
    }
  } catch (error) {
    respond(false, error instanceof Error ? error.message : String(error))
  }
}

async function memoryFs(method: string, location: string, args: unknown[]): Promise<unknown> {
  switch (method) {
    case 'readFile': {
      const data = memFiles.get(location)
      if (!data) throw new Error(`ENOENT: ${location}`)
      return { data }
    }
    case 'writeFile': {
      const raw = args[1]
      const data = typeof raw === 'string' ? new TextEncoder().encode(raw) : (raw as Uint8Array)
      memFiles.set(location, data)
      const idx = location.lastIndexOf('/')
      if (idx > 0) memDirs.add(location.slice(0, idx + 1))
      return undefined
    }
    case 'mkdir': {
      memDirs.add(location.endsWith('/') ? location : location + '/')
      return undefined
    }
    case 'stat': {
      if (memFiles.has(location)) return { isDirectory: false, isFile: true }
      if (memDirs.has(location) || memDirs.has(location + '/'))
        return { isDirectory: true, isFile: false }
      throw new Error(`ENOENT: ${location}`)
    }
    case 'readdir': {
      const prefix = location.endsWith('/') ? location : location + '/'
      const names = new Set<string>()
      for (const key of memFiles.keys()) {
        if (key.startsWith(prefix)) names.add(key.slice(prefix.length).split('/')[0])
      }
      for (const key of memDirs) {
        if (key.startsWith(prefix)) names.add(key.slice(prefix.length).split('/')[0])
      }
      return [...names]
        .filter(Boolean)
        .map((name) => ({ name, isDirectory: memDirs.has(`${prefix}${name}/`) }))
    }
    case 'rm':
    case 'unlink': {
      memFiles.delete(location)
      memDirs.delete(location)
      return undefined
    }
    case 'chmod': {
      return undefined
    }
    default:
      throw new Error(`Unsupported fs method: ${method}`)
  }
}

function send(message: MainToWorker): void {
  ensureWorker().postMessage(message)
}

function ensureWorker(): Worker {
  if (worker) return worker
  worker = new SpyglassWorker()
  worker.onmessage = (event: MessageEvent<WorkerToMain>) => {
    const message = event.data
    switch (message.kind) {
      case 'result': {
        const entry = pending.get(message.id)
        if (!entry) return
        pending.delete(message.id)
        if (message.ok) entry.resolve(message.value)
        else entry.reject(new Error(message.error))
        return
      }
      case 'diagnostics':
        onDiagnostics?.(message.uri, message.diagnostics)
        return
      case 'status':
        onStatus?.(message.message)
        return
      case 'log':
        onLog?.(message.level, message.message)
        return
      case 'ready':
        readyResolve?.()
        return
      case 'fs':
        void handleFs(message)
        return
      default:
        return
    }
  }
  return worker
}

function request(method: string, args: unknown[]): Promise<unknown> {
  const id = nextId++
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject })
    send({ kind: 'call', id, method, args })
  })
}

export async function initSpyglass(options: {
  gameVersion?: string
  onDiagnostics?: (uri: string, diagnostics: SpyDiagnostic[]) => void
  onStatus?: (status: string) => void
  onLog?: (level: string, message: string) => void
}): Promise<void> {
  onDiagnostics = options.onDiagnostics ?? null
  onStatus = options.onStatus ?? null
  onLog = options.onLog ?? null
  const ready = new Promise<void>((resolve) => {
    readyResolve = resolve
  })
  send({ kind: 'init', gameVersion: options.gameVersion ?? 'auto' })
  await ready
}

export function resetSpyglass(): void {
  if (!worker) return
  send({ kind: 'reset' })
}

export function openDocument(path: string, language: string, content: string): Promise<void> {
  send({ kind: 'open', path, language, content })
  return Promise.resolve()
}

export function closeDocument(path: string): void {
  if (!worker) return
  send({ kind: 'close', path })
}

const syncTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function scheduleDocumentSync(path: string, content: string): void {
  const existing = syncTimers.get(path)
  if (existing) clearTimeout(existing)
  syncTimers.set(
    path,
    setTimeout(() => {
      syncTimers.delete(path)
      if (worker) send({ kind: 'change', path, content })
    }, 200),
  )
}

export function getResolvedVersion(): Promise<string | undefined> {
  return request('resolvedVersion', []) as Promise<string | undefined>
}

export function refreshProject(paths?: string[]): Promise<void> {
  return request('refreshProject', [paths]) as Promise<void>
}

export function completeAt(
  path: string,
  content: string,
  position: Position,
  triggerCharacter?: string,
): Promise<SpyCompletion[]> {
  return request('complete', [path, content, position, triggerCharacter]) as Promise<
    SpyCompletion[]
  >
}

export function hoverAt(
  path: string,
  content: string,
  position: Position,
): Promise<SpyHover | undefined> {
  return request('hover', [path, content, position]) as Promise<SpyHover | undefined>
}

export function definitionAt(
  path: string,
  content: string,
  position: Position,
): Promise<SpyLocation[]> {
  return request('definition', [path, content, position]) as Promise<SpyLocation[]>
}

export function prepareRenameAt(
  path: string,
  content: string,
  position: Position,
): Promise<SpyRange | undefined> {
  return request('prepareRename', [path, content, position]) as Promise<SpyRange | undefined>
}

export function renameAt(
  path: string,
  content: string,
  position: Position,
  newName: string,
): Promise<SpyTextEdit[] | undefined> {
  return request('rename', [path, content, position, newName]) as Promise<SpyTextEdit[] | undefined>
}

export function codeActionsAt(
  path: string,
  content: string,
  range: SpyRange,
): Promise<SpyCodeAction[]> {
  return request('codeActions', [path, content, range]) as Promise<SpyCodeAction[]>
}

export function documentSymbolsAt(path: string, content: string): Promise<SpySymbol[]> {
  return request('documentSymbols', [path, content]) as Promise<SpySymbol[]>
}

export function formatDocument(
  path: string,
  content: string,
  tabSize: number,
  insertSpaces: boolean,
): Promise<string | undefined> {
  return request('format', [path, content, tabSize, insertSpaces]) as Promise<string | undefined>
}

export function colorizeDocument(path: string, content: string): Promise<SpyColorToken[]> {
  return request('colorize', [path, content]) as Promise<SpyColorToken[]>
}
