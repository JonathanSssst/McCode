import type { SpyDiagnostic } from './types'

export interface FsCall {
  kind: 'fs'
  id: number
  method: string
  args: unknown[]
}

export type MainToWorker =
  | { kind: 'fs-result'; id: number; ok: true; value: unknown }
  | { kind: 'fs-result'; id: number; ok: false; error: string }
  | { kind: 'init'; gameVersion: string }
  | { kind: 'open'; path: string; language: string; content: string }
  | { kind: 'change'; path: string; content: string }
  | { kind: 'close'; path: string }
  | { kind: 'reset' }
  | { kind: 'call'; id: number; method: string; args: unknown[] }

export type WorkerToMain =
  | FsCall
  | { kind: 'status'; message: string }
  | { kind: 'log'; level: string; message: string }
  | { kind: 'ready' }
  | { kind: 'diagnostics'; uri: string; diagnostics: SpyDiagnostic[] }
  | { kind: 'result'; id: number; ok: true; value: unknown }
  | { kind: 'result'; id: number; ok: false; error: string }
