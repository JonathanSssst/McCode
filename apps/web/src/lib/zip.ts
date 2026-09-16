import { zipSync } from 'fflate'
import type { TreeNode } from './tree'

async function collect(
  nodes: TreeNode[],
  readFile: (path: string) => Promise<Uint8Array>,
  files: Record<string, Uint8Array>,
): Promise<void> {
  for (const node of nodes) {
    if (node.kind === 'directory') {
      if (node.children) await collect(node.children, readFile, files)
    } else {
      files[node.path] = await readFile(node.path)
    }
  }
}

export async function buildWorkspaceZip(
  tree: TreeNode[],
  readFile: (path: string) => Promise<Uint8Array>,
): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {}
  await collect(tree, readFile, files)
  return zipSync(files, { level: 6 })
}

export function buildZipName(parts: Array<string | number | null | undefined>): string {
  const joined = parts
    .filter((part) => part !== null && part !== undefined && String(part).trim() !== '')
    .map((part) => String(part).trim())
    .join('-')
  const safe = joined
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
  return `${safe || 'datapack'}.zip`
}

export function downloadZip(name: string, data: Uint8Array): void {
  const blob = new Blob([data as BlobPart], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
