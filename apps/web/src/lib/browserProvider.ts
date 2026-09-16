import {
  type FsDirectoryHandle,
  copyDirectory,
  createDirectoryAtPath,
  createFileAtPath,
  createFileBytesAtPath,
  getDirectoryByPath,
  pickDirectory,
  removeEntryAtPath,
} from './fsa'
import type { DirEntry, WorkspaceProvider } from './provider'
import type { TreeNode } from './tree'
import { t } from '@/i18n'

const IGNORED = new Set(['.git', 'node_modules', '.DS_Store', 'Thumbs.db'])

function parentOf(path: string): string {
  const index = path.lastIndexOf('/')
  return index === -1 ? '' : path.slice(0, index)
}

function baseOf(path: string): string {
  const index = path.lastIndexOf('/')
  return index === -1 ? path : path.slice(index + 1)
}

export function createBrowserProvider(): WorkspaceProvider {
  let root: FsDirectoryHandle | null = null

  const requireRoot = (): FsDirectoryHandle => {
    if (!root) throw new Error('ENOENT: workspace is not open')
    return root
  }

  const walk = async (dir: FsDirectoryHandle, prefix: string): Promise<TreeNode[]> => {
    const nodes: TreeNode[] = []
    for await (const handle of dir.values()) {
      if (IGNORED.has(handle.name)) continue
      const path = prefix ? `${prefix}/${handle.name}` : handle.name
      if (handle.kind === 'directory') {
        nodes.push({
          name: handle.name,
          path,
          kind: 'directory',
          children: await walk(handle as FsDirectoryHandle, path),
        })
      } else {
        nodes.push({ name: handle.name, path, kind: 'file' })
      }
    }
    nodes.sort((a, b) =>
      a.kind !== b.kind
        ? a.kind === 'directory'
          ? -1
          : 1
        : a.name.localeCompare(b.name, undefined, { numeric: true }),
    )
    return nodes
  }

  const readFile = async (path: string): Promise<Uint8Array> => {
    const dir = await getDirectoryByPath(requireRoot(), parentOf(path))
    const handle = await dir.getFileHandle(baseOf(path))
    return new Uint8Array(await (await handle.getFile()).arrayBuffer())
  }

  const stat = async (path: string): Promise<{ isDirectory: boolean; isFile: boolean }> => {
    if (!root) throw new Error('ENOENT: workspace is not open')
    if (path === '') return { isDirectory: true, isFile: false }
    try {
      await getDirectoryByPath(requireRoot(), path)
      return { isDirectory: true, isFile: false }
    } catch {
      // fall through to file check
    }
    try {
      const dir = await getDirectoryByPath(requireRoot(), parentOf(path))
      await dir.getFileHandle(baseOf(path))
      return { isDirectory: false, isFile: true }
    } catch {
      throw new Error(`ENOENT: ${path}`)
    }
  }

  return {
    kind: 'browser',
    canReveal: false,

    async pickFolder() {
      const handle = await pickDirectory()
      root = handle
      return handle.name
    },

    async readTree() {
      if (!root) return []
      return walk(root, '')
    },

    readFile,

    async writeFile(path, data) {
      if (typeof data === 'string') await createFileAtPath(requireRoot(), path, data)
      else await createFileBytesAtPath(requireRoot(), path, data)
    },

    async createDirectory(path) {
      await createDirectoryAtPath(requireRoot(), path)
    },

    async remove(path, recursive) {
      await removeEntryAtPath(requireRoot(), path, recursive)
    },

    async rename(oldPath, newName) {
      const target = requireRoot()
      const dir = parentOf(oldPath)
      const info = await stat(oldPath)
      if (info.isDirectory) {
        const source = await getDirectoryByPath(target, oldPath)
        const targetDir = dir ? await getDirectoryByPath(target, dir) : target
        await copyDirectory(source, targetDir, newName)
        await removeEntryAtPath(target, oldPath, true)
      } else {
        const bytes = await readFile(oldPath)
        const newPath = dir ? `${dir}/${newName}` : newName
        await createFileBytesAtPath(target, newPath, bytes)
        await removeEntryAtPath(target, oldPath, false)
      }
    },

    async copy(sourcePath, targetDir, newName) {
      const target = requireRoot()
      const info = await stat(sourcePath)
      if (info.isDirectory) {
        const source = await getDirectoryByPath(target, sourcePath)
        const dir = targetDir ? await getDirectoryByPath(target, targetDir) : target
        await copyDirectory(source, dir, newName)
      } else {
        const bytes = await readFile(sourcePath)
        const dest = targetDir ? `${targetDir}/${newName}` : newName
        await createFileBytesAtPath(target, dest, bytes)
      }
    },

    async list(path) {
      if (!root) return []
      const dir = path ? await getDirectoryByPath(root, path) : root
      const entries: DirEntry[] = []
      for await (const handle of dir.values()) {
        entries.push({ name: handle.name, isDirectory: handle.kind === 'directory' })
      }
      return entries
    },

    stat,

    async reveal() {
      throw new Error(t('error.revealDesktopOnly'))
    },

    watch(onChange) {
      const Observer = (
        window as unknown as {
          FileSystemObserver?: new (cb: (records: unknown[]) => void) => {
            observe(handle: FsDirectoryHandle, options?: { recursive?: boolean }): Promise<void>
            disconnect(): void
          }
        }
      ).FileSystemObserver
      if (!Observer || !root) return () => {}
      const observer = new Observer((records) => {
        const paths: string[] = []
        for (const record of records) {
          const parts = (record as { relativePathComponents?: string[] })?.relativePathComponents
          if (Array.isArray(parts) && parts.length > 0) paths.push(parts.join('/'))
        }
        onChange(paths.length > 0 ? paths : undefined)
      })
      observer.observe(root, { recursive: true }).catch(() => {})
      return () => {
        try {
          observer.disconnect()
        } catch {
          // ignore
        }
      }
    },
  }
}
