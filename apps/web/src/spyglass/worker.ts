import type { Externals } from '@spyglassmc/core'
import { decompressBall } from './archive'
import * as engine from './engine'
import type { MainToWorker, WorkerToMain } from './protocol'
import type { SpyRange } from './types'

const scope = self as unknown as {
  postMessage(message: WorkerToMain): void
  onmessage: ((event: MessageEvent<MainToWorker>) => void) | null
  caches: CacheStorage
}

function post(message: WorkerToMain): void {
  scope.postMessage(message)
}

let nextFsId = 1
const fsPending = new Map<
  number,
  { resolve: (value: unknown) => void; reject: (error: Error) => void }
>()

function fsRequest(method: string, args: unknown[]): Promise<unknown> {
  const id = nextFsId++
  return new Promise((resolve, reject) => {
    fsPending.set(id, { resolve, reject })
    post({ kind: 'fs', id, method, args })
  })
}

const externals: Externals = {
  archive: { decompressBall },
  error: {
    createKind: (kind, message) => new Error(`${kind}: ${message}`),
    isKind: (error, kind) => error instanceof Error && error.message.startsWith(kind),
  },
  fs: {
    async chmod(location, mode) {
      await fsRequest('chmod', [String(location), mode])
    },
    async mkdir(location, options) {
      await fsRequest('mkdir', [String(location), options])
    },
    async readdir(location) {
      const entries = (await fsRequest('readdir', [String(location)])) as {
        name: string
        isDirectory: boolean
      }[]
      return entries.map((entry) => ({
        name: entry.name,
        isDirectory: () => entry.isDirectory,
        isFile: () => !entry.isDirectory,
        isSymbolicLink: () => false,
      }))
    },
    async readFile(location) {
      const result = (await fsRequest('readFile', [String(location)])) as { data: Uint8Array }
      return new Uint8Array(result.data) as Uint8Array<ArrayBuffer>
    },
    async rm(location, options) {
      await fsRequest('rm', [String(location), options])
    },
    async showFile() {
      throw new Error('showFile is not supported in a worker')
    },
    async stat(location) {
      const result = (await fsRequest('stat', [String(location)])) as {
        isDirectory: boolean
        isFile: boolean
      }
      return {
        isDirectory: () => result.isDirectory,
        isFile: () => result.isFile,
        isSymbolicLink: () => false,
      }
    },
    async unlink(location) {
      await fsRequest('unlink', [String(location)])
    },
    async writeFile(location, data, options) {
      await fsRequest('writeFile', [String(location), data, options])
    },
  },
  web: {
    getCache: () => scope.caches.open('spyglassmc'),
  },
}

type Position = { lineNumber: number; column: number }

async function dispatch(method: string, args: unknown[]): Promise<unknown> {
  switch (method) {
    case 'complete':
      return engine.completeAt(
        args[0] as string,
        args[1] as string,
        args[2] as Position,
        args[3] as string | undefined,
      )
    case 'hover':
      return engine.hoverAt(args[0] as string, args[1] as string, args[2] as Position)
    case 'definition':
      return engine.definitionAt(args[0] as string, args[1] as string, args[2] as Position)
    case 'prepareRename':
      return engine.prepareRenameAt(args[0] as string, args[1] as string, args[2] as Position)
    case 'rename':
      return engine.renameAt(
        args[0] as string,
        args[1] as string,
        args[2] as Position,
        args[3] as string,
      )
    case 'codeActions':
      return engine.codeActionsAt(args[0] as string, args[1] as string, args[2] as SpyRange)
    case 'documentSymbols':
      return engine.documentSymbolsAt(args[0] as string, args[1] as string)
    case 'format':
      return engine.formatDocument(
        args[0] as string,
        args[1] as string,
        args[2] as number,
        args[3] as boolean,
      )
    case 'colorize':
      return engine.colorizeDocument(args[0] as string, args[1] as string)
    case 'resolvedVersion':
      return engine.getResolvedVersion()
    case 'refreshProject':
      return engine.refreshProject(args[0] as string[] | undefined)
    default:
      throw new Error(`Unknown method: ${method}`)
  }
}

async function handleMessage(message: MainToWorker): Promise<void> {
  switch (message.kind) {
    case 'init':
      await engine.initSpyglass({
        externals,
        gameVersion: message.gameVersion,
        onDiagnostics: (uri, diagnostics) => post({ kind: 'diagnostics', uri, diagnostics }),
        onStatus: (status) => post({ kind: 'status', message: status }),
        onLog: (level, message) => post({ kind: 'log', level, message }),
      })
      post({ kind: 'ready' })
      return
    case 'open':
      await engine.openDocument(message.path, message.language, message.content)
      return
    case 'change':
      await engine.changeDocument(message.path, message.content)
      return
    case 'close':
      engine.closeDocument(message.path)
      return
    case 'reset':
      engine.resetSpyglass()
      return
    case 'call':
      try {
        const value = await dispatch(message.method, message.args)
        post({ kind: 'result', id: message.id, ok: true, value })
      } catch (error) {
        post({
          kind: 'result',
          id: message.id,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }
      return
    default:
      return
  }
}

let chain: Promise<void> = Promise.resolve()

scope.onmessage = (event: MessageEvent<MainToWorker>): void => {
  const message = event.data
  if (message.kind === 'fs-result') {
    const pending = fsPending.get(message.id)
    if (!pending) return
    fsPending.delete(message.id)
    if (message.ok) pending.resolve(message.value)
    else pending.reject(new Error(message.error))
    return
  }
  chain = chain
    .then(() => handleMessage(message))
    .catch((error) => {
      console.error('[mccode spyglass worker]', error)
    })
}
