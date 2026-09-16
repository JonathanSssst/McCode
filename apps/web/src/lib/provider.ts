import { createBrowserProvider } from './browserProvider'
import { createNativeProvider } from './nativeProvider'
import type { TreeNode } from './tree'

export interface DirEntry {
  name: string
  isDirectory: boolean
}

export interface WorkspaceProvider {
  readonly kind: 'browser' | 'desktop'
  readonly canReveal: boolean
  pickFolder(path?: string): Promise<string | null>
  readTree(): Promise<TreeNode[]>
  readFile(path: string): Promise<Uint8Array>
  writeFile(path: string, data: string | Uint8Array): Promise<void>
  createDirectory(path: string): Promise<void>
  remove(path: string, recursive: boolean): Promise<void>
  rename(oldPath: string, newName: string): Promise<void>
  copy(sourcePath: string, targetDir: string, newName: string): Promise<void>
  list(path: string): Promise<DirEntry[]>
  stat(path: string): Promise<{ isDirectory: boolean; isFile: boolean }>
  reveal(path: string): Promise<void>
  watch?(onChange: (paths?: string[]) => void): () => void
}

function isDesktop(): boolean {
  return (
    typeof window !== 'undefined' &&
    Boolean((window as unknown as { mccodeDesktop?: unknown }).mccodeDesktop)
  )
}

let instance: WorkspaceProvider | null = null

export function getProvider(): WorkspaceProvider {
  if (!instance) {
    instance = isDesktop() ? createNativeProvider() : createBrowserProvider()
  }
  return instance
}

export function isDesktopProvider(): boolean {
  return instance?.kind === 'desktop'
}
