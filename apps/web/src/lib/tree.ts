export interface TreeNode {
  name: string
  path: string
  kind: 'file' | 'directory'
  children?: TreeNode[]
}

export function findNode(nodes: TreeNode[], path: string): TreeNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node
    if (node.children) {
      const hit = findNode(node.children, path)
      if (hit) return hit
    }
  }
  return undefined
}

export function flattenFiles(nodes: TreeNode[]): TreeNode[] {
  const out: TreeNode[] = []
  for (const node of nodes) {
    if (node.kind === 'file') out.push(node)
    if (node.children) out.push(...flattenFiles(node.children))
  }
  return out
}
