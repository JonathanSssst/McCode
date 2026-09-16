import type { MouseEvent } from 'react'
import { useT } from '@/i18n'
import { dirName } from '@/lib/languages'
import { getProvider } from '@/lib/provider'
import { useWorkspace } from '@/store/workspace'
import type { TreeNode } from '@/lib/tree'
import { IconChevron, IconFile } from './icons'

function fileTint(name: string): string {
  if (name.endsWith('.mcfunction')) return 'text-[#dcdcaa]'
  if (name.endsWith('.json') || name.endsWith('.mcmeta')) return 'text-[#cbcb41]'
  if (name.endsWith('.mcdoc')) return 'text-[#4ec9b0]'
  if (name.endsWith('.snbt')) return 'text-[#ce9178]'
  return 'text-vsc-fg-dim'
}

function Row({
  depth,
  label,
  selected,
  dirty,
  isDir,
  open,
  onClick,
  onContextMenu,
}: {
  depth: number
  label: string
  selected: boolean
  dirty: boolean
  isDir: boolean
  open: boolean
  onClick: () => void
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      title={label}
      className={`flex h-[22px] cursor-pointer select-none items-center gap-1 whitespace-nowrap pr-2 text-[13px] ${
        selected ? 'bg-[#04395e] text-white' : 'hover:bg-[#2a2d2e] text-vsc-fg'
      }`}
      style={{ paddingLeft: 6 + depth * 12 }}
    >
      <span className="flex w-3 shrink-0 justify-center text-vsc-fg-dim">
        {isDir ? <IconChevron open={open} /> : null}
      </span>
      {!isDir && <span className={fileTint(label)}>{<IconFile />}</span>}
      <span className="truncate">{label}</span>
      {dirty && <span className="ml-auto text-[#c6c6c6]">●</span>}
    </div>
  )
}

function NodeView({ node, depth }: { node: TreeNode; depth: number }) {
  const expanded = useWorkspace((s) => Boolean(s.expanded[node.path]))
  const activePath = useWorkspace((s) => s.activePath)
  const openFile = useWorkspace((s) => s.openFile)
  const toggleDirectory = useWorkspace((s) => s.toggleDirectory)
  const dirty = useWorkspace((s) => s.openFiles.find((f) => f.path === node.path)?.dirty ?? false)
  const openContextMenu = useWorkspace((s) => s.openContextMenu)
  const openNewFileDialog = useWorkspace((s) => s.openNewFileDialog)
  const openRenameDialog = useWorkspace((s) => s.openRenameDialog)
  const openNewFolderDialog = useWorkspace((s) => s.openNewFolderDialog)
  const deleteEntry = useWorkspace((s) => s.deleteEntry)
  const copyPath = useWorkspace((s) => s.copyPath)
  const copyEntry = useWorkspace((s) => s.copyEntry)
  const pasteEntry = useWorkspace((s) => s.pasteEntry)
  const revealEntry = useWorkspace((s) => s.revealEntry)
  const hasClipboard = useWorkspace((s) => Boolean(s.fileClipboard))
  const canReveal = getProvider().canReveal
  const tr = useT()

  const isDir = node.kind === 'directory'
  const onClick = () => {
    if (isDir) toggleDirectory(node.path)
    else void openFile(node)
  }

  const onContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const targetDir = isDir ? node.path : dirName(node.path)
    openContextMenu(event.clientX, event.clientY, [
      { label: tr('ctx.newFunction'), run: () => openNewFileDialog('function') },
      { label: tr('ctx.newAdvancement'), run: () => openNewFileDialog('advancement') },
      ...(isDir ? [{ label: tr('ctx.newFolder'), run: () => openNewFolderDialog(node.path) }] : []),
      { separator: true },
      ...(hasClipboard ? [{ label: tr('ctx.paste'), run: () => void pasteEntry(targetDir) }] : []),
      { label: tr('ctx.copy'), run: () => copyEntry(node.path) },
      { label: tr('ctx.rename'), run: () => openRenameDialog(node.path) },
      { label: tr('ctx.delete'), danger: true, run: () => void deleteEntry(node.path) },
      { separator: true },
      { label: tr('ctx.copyPath'), run: () => void copyPath(node.path) },
      ...(canReveal ? [{ label: tr('ctx.reveal'), run: () => void revealEntry(node.path) }] : []),
    ])
  }

  return (
    <>
      <Row
        depth={depth}
        label={node.name}
        selected={!isDir && activePath === node.path}
        dirty={dirty}
        isDir={isDir}
        open={expanded}
        onClick={onClick}
        onContextMenu={onContextMenu}
      />
      {isDir &&
        expanded &&
        node.children?.map((child) => <NodeView key={child.path} node={child} depth={depth + 1} />)}
    </>
  )
}

export function FileExplorer() {
  const rootName = useWorkspace((s) => s.rootName)
  const tree = useWorkspace((s) => s.tree)
  const openFolder = useWorkspace((s) => s.openFolder)
  const refreshTree = useWorkspace((s) => s.refreshTree)
  const openContextMenu = useWorkspace((s) => s.openContextMenu)
  const openNewFileDialog = useWorkspace((s) => s.openNewFileDialog)
  const openNewFolderDialog = useWorkspace((s) => s.openNewFolderDialog)
  const pasteEntry = useWorkspace((s) => s.pasteEntry)
  const hasClipboard = useWorkspace((s) => Boolean(s.fileClipboard))
  const tr = useT()

  if (!rootName) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center text-xs text-vsc-fg-dim">
        <p>{tr('explorer.noFolder')}</p>
        <button
          className="rounded bg-vsc-accent px-3 py-1 text-white hover:brightness-110"
          onClick={() => void openFolder()}
        >
          {tr('explorer.openFolder')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-vsc-fg-dim">
        <span>{tr('explorer.title')}</span>
        <button
          title={tr('explorer.refresh')}
          onClick={() => void refreshTree()}
          className="hover:text-white"
        >
          ↻
        </button>
      </div>
      <div
        className="truncate px-3 pb-1 text-[11px] font-bold uppercase text-vsc-fg"
        title={rootName}
      >
        {rootName}
      </div>
      <div
        className="min-h-0 flex-1 overflow-auto pb-4"
        onContextMenu={(event) => {
          if (event.target !== event.currentTarget) return
          event.preventDefault()
          openContextMenu(event.clientX, event.clientY, [
            { label: tr('ctx.newFunction'), run: () => openNewFileDialog('function') },
            { label: tr('ctx.newAdvancement'), run: () => openNewFileDialog('advancement') },
            { label: tr('ctx.newFolder'), run: () => openNewFolderDialog('') },
            { separator: true },
            ...(hasClipboard ? [{ label: tr('ctx.paste'), run: () => void pasteEntry('') }] : []),
            { label: tr('explorer.refresh'), run: () => void refreshTree() },
          ])
        }}
      >
        {tree.map((node) => (
          <NodeView key={node.path} node={node} depth={0} />
        ))}
      </div>
    </div>
  )
}
