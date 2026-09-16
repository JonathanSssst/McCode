import { useEffect, useMemo, useRef, useState } from 'react'
import { useT } from '@/i18n'
import { flattenFiles } from '@/lib/tree'
import { SNIPPETS } from '@/lib/snippets'
import { TEMPLATE_KINDS } from '@/lib/templates'
import { insertSnippet } from '@/monaco/activeEditor'
import { useWorkspace } from '@/store/workspace'

interface PaletteItem {
  id: string
  label: string
  detail?: string
  kind: 'command' | 'file'
  run: () => void
}

export function CommandPalette() {
  const visible = useWorkspace((s) => s.paletteVisible)
  const setPaletteVisible = useWorkspace((s) => s.setPaletteVisible)
  const tree = useWorkspace((s) => s.tree)
  const versions = useWorkspace((s) => s.versions)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const tr = useT()

  const items: PaletteItem[] = (() => {
    const s = useWorkspace.getState()
    const commands: PaletteItem[] = [
      {
        id: 'file.openFolder',
        label: tr('cmd.openFolder'),
        kind: 'command',
        run: () => void s.openFolder(),
      },
      {
        id: 'file.closeFolder',
        label: tr('cmd.closeFolder'),
        kind: 'command',
        run: () => s.closeFolder(),
      },
      {
        id: 'file.refresh',
        label: tr('cmd.refresh'),
        kind: 'command',
        run: () => void s.refreshTree(),
      },
      {
        id: 'file.save',
        label: tr('cmd.save'),
        detail: 'Ctrl+S',
        kind: 'command',
        run: () => void s.saveActive(),
      },
      {
        id: 'file.exportZip',
        label: tr('cmd.exportZip'),
        kind: 'command',
        run: () => void s.exportZip(),
      },
      {
        id: 'datapack.init',
        label: tr('cmd.init'),
        kind: 'command',
        run: () => s.openNewPackDialog(),
      },
      ...TEMPLATE_KINDS.map((kind) => ({
        id: 'new.' + kind,
        label: tr('cmd.new', { kind: tr(`template.${kind}`) }),
        kind: 'command' as const,
        run: () => s.openNewFileDialog(kind),
      })),
      ...SNIPPETS.map((snippet) => ({
        id: 'snippet.' + snippet.id,
        label: tr('cmd.snippet', { title: snippet.title }),
        kind: 'command' as const,
        run: () => insertSnippet(snippet.snippet),
      })),
      {
        id: 'view.toggleSidebar',
        label: tr('cmd.toggleSidebar'),
        detail: 'Ctrl+B',
        kind: 'command',
        run: () => s.toggleSidebar(),
      },
      {
        id: 'view.togglePanel',
        label: tr('cmd.togglePanel'),
        detail: 'Ctrl+J',
        kind: 'command',
        run: () => s.togglePanel(),
      },
      {
        id: 'view.outline',
        label: tr('cmd.showOutline'),
        kind: 'command',
        run: () => s.setActiveView('outline'),
      },
      {
        id: 'view.search',
        label: tr('cmd.showSearch'),
        kind: 'command',
        run: () => s.setActiveView('search'),
      },
      {
        id: 'view.data',
        label: tr('cmd.showData'),
        kind: 'command',
        run: () => s.setActiveView('data'),
      },
      {
        id: 'prefs.settings',
        label: tr('cmd.openSettings'),
        detail: 'Ctrl+,',
        kind: 'command',
        run: () => s.openSettings(),
      },
      {
        id: 'version.auto',
        label: tr('cmd.versionAuto'),
        kind: 'command',
        run: () => void s.setGameVersion('auto'),
      },
      ...versions.map((version) => ({
        id: 'version.' + version,
        label: tr('cmd.version', { version }),
        kind: 'command' as const,
        run: () => void useWorkspace.getState().setGameVersion(version),
      })),
    ]
    const files: PaletteItem[] = flattenFiles(tree).map((node) => ({
      id: 'file:' + node.path,
      label: node.path,
      kind: 'file',
      run: () => void s.openFile(node),
    }))
    return [...commands, ...files]
  })()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^>/, '').trim()
    const source = query.trimStart().startsWith('>')
      ? items.filter((i) => i.kind === 'command')
      : items
    if (!q) return source.slice(0, 60)
    return source.filter((i) => i.label.toLowerCase().includes(q)).slice(0, 60)
  }, [items, query])

  useEffect(() => {
    if (visible) {
      setQuery('')
      setIndex(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [visible])

  useEffect(() => {
    setIndex(0)
  }, [query])

  if (!visible) return null

  const close = () => setPaletteVisible(false)
  const runItem = (item: PaletteItem | undefined) => {
    if (!item) return
    close()
    item.run()
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/30 pt-[6vh]" onClick={close}>
      <div
        className="h-fit w-[600px] max-w-[90vw] overflow-hidden rounded-md border border-[#454545] bg-[#252526] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          placeholder={tr('palette.placeholder')}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') close()
            else if (e.key === 'ArrowDown') {
              e.preventDefault()
              setIndex((i) => Math.min(i + 1, filtered.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setIndex((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter') {
              e.preventDefault()
              runItem(filtered[index])
            }
          }}
          className="w-full bg-transparent px-3 py-2 text-[13px] text-vsc-fg outline-none placeholder:text-vsc-fg-dim"
        />
        <div className="max-h-[45vh] overflow-auto border-t border-[#454545]">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-[12px] text-vsc-fg-dim">{tr('palette.noResults')}</div>
          )}
          {filtered.map((item, i) => (
            <div
              key={item.id}
              onMouseEnter={() => setIndex(i)}
              onClick={() => runItem(item)}
              className={`flex cursor-pointer items-center gap-2 px-3 py-1 text-[13px] ${
                i === index ? 'bg-[#04395e] text-white' : 'text-vsc-fg'
              }`}
            >
              <span className="w-4 text-center text-vsc-fg-dim">
                {item.kind === 'command' ? '›' : '◦'}
              </span>
              <span className="truncate">{item.label}</span>
              {item.detail && (
                <span className="ml-auto text-[11px] text-vsc-fg-dim">{item.detail}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
