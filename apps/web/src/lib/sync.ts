import type { TreeNode } from './tree'
import { buildZipName } from './zip'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Matches zip artifacts previously produced for the same pack, e.g. `mypack-1.21.11-pack94.zip`. */
export function isOldArtifact(fileName: string, packName: string): boolean {
  const name = fileName.trim()
  const pack = packName.trim()
  if (!pack || !/\.zip$/i.test(name)) return false
  const pattern = new RegExp(`^${escapeRegExp(pack)}-\\d+(?:\\.\\d+)*-pack\\d+\\.zip$`, 'i')
  return pattern.test(name)
}

export function syncZipName(parts: Array<string | number | null | undefined>): string {
  return buildZipName(parts)
}

export function joinPath(directory: string, name: string): string {
  return `${directory.replace(/[\\/]+$/, '')}/${name}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/** Keeps previously produced archives out of the tree before packaging. */
export function stripOldArtifacts(nodes: TreeNode[], packName: string): TreeNode[] {
  return nodes
    .filter((node) => node.kind !== 'file' || !isOldArtifact(node.name, packName))
    .map((node) =>
      node.kind === 'directory' && node.children
        ? { ...node, children: stripOldArtifacts(node.children, packName) }
        : node,
    )
}
