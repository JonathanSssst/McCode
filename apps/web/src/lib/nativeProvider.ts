import { baseName, parentDir } from './paths'
import type { DirEntry, WorkspaceProvider } from './provider'
import type { TreeNode } from './tree'

export function createNativeProvider(): WorkspaceProvider {
  const bridge = window.mccodeDesktop
  if (!bridge) throw new Error('Desktop bridge unavailable')

  let rootPath = ''
  const abs = (rel: string): string => (rel ? `${rootPath}/${rel}` : rootPath)

  const walk = async (rel: string): Promise<TreeNode[]> => {
    const entries = await bridge.readDir(abs(rel))
    const nodes: TreeNode[] = []
    for (const entry of entries) {
      const path = rel ? `${rel}/${entry.name}` : entry.name
      if (entry.isDirectory) {
        nodes.push({ name: entry.name, path, kind: 'directory', children: await walk(path) })
      } else {
        nodes.push({ name: entry.name, path, kind: 'file' })
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

  return {
    kind: 'desktop',
    canReveal: true,

    async pickFolder(path) {
      const result = path ? await bridge.openFolderPath(path) : await bridge.openFolder()
      if (!result) return null
      rootPath = result.path
      return baseName(result.path) || result.path
    },

    async readTree() {
      return walk('')
    },

    readFile(rel) {
      return bridge.readFile(abs(rel))
    },

    writeFile(rel, data) {
      return bridge.writeFile(abs(rel), data)
    },

    createDirectory(rel) {
      return bridge.mkdir(abs(rel))
    },

    remove(rel, recursive) {
      return bridge.remove(abs(rel), recursive)
    },

    rename(oldRel, newName) {
      const parent = parentDir(oldRel)
      const newRel = parent ? `${parent}/${newName}` : newName
      return bridge.rename(abs(oldRel), abs(newRel))
    },

    copy(sourceRel, targetDir, newName) {
      const destRel = targetDir ? `${targetDir}/${newName}` : newName
      return bridge.copy(abs(sourceRel), abs(destRel))
    },

    async list(rel): Promise<DirEntry[]> {
      return bridge.readDir(abs(rel))
    },

    stat(rel) {
      return bridge.stat(abs(rel))
    },

    reveal(rel) {
      return bridge.reveal(abs(rel))
    },

    watch(onChange) {
      if (!bridge.onFilesChanged) return () => {}
      const rootPrefix = rootPath.replace(/\\/g, '/').replace(/\/?$/, '/')
      return bridge.onFilesChanged((absPaths) => {
        const relative = absPaths
          .map((item) => item.replace(/\\/g, '/'))
          .filter((item) => item.startsWith(rootPrefix))
          .map((item) => item.slice(rootPrefix.length))
          .filter(Boolean)
        onChange(relative.length > 0 ? relative : undefined)
      })
    },
  }
}
