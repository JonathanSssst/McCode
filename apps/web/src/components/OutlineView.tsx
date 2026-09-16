import { useEffect, useState } from 'react'
import { useT } from '@/i18n'
import { getActiveEditor } from '@/monaco/activeEditor'
import { getModel } from '@/monaco/models'
import type { SpySymbol } from '@/spyglass/client'
import { useWorkspace } from '@/store/workspace'

function kindLabel(kind: number): string {
  switch (kind) {
    case 12:
      return 'ƒ'
    case 5:
      return 'C'
    case 10:
      return 'E'
    case 18:
      return '[]'
    case 23:
      return 'S'
    case 2:
      return 'M'
    case 15:
      return '#'
    default:
      return '•'
  }
}

function toMonacoRange(symbol: SpySymbol) {
  const range = symbol.selectionRange
  return {
    startLineNumber: range.startLine + 1,
    startColumn: range.startChar + 1,
    endLineNumber: range.endLine + 1,
    endColumn: range.endChar + 1,
  }
}

export function OutlineView() {
  const activePath = useWorkspace((s) => s.activePath)
  const [symbols, setSymbols] = useState<SpySymbol[]>([])
  const tr = useT()

  useEffect(() => {
    if (!activePath) {
      setSymbols([])
      return
    }
    let disposed = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let retry: ReturnType<typeof setTimeout> | null = null
    let sub: { dispose(): void } | null = null

    const load = async () => {
      const model = getModel(activePath)
      if (!model) {
        retry = setTimeout(() => void load(), 150)
        return
      }
      const client = await import('@/spyglass/client')
      const result = await client.documentSymbolsAt(activePath, model.getValue())
      if (!disposed) setSymbols(result)
    }

    const attach = () => {
      const model = getModel(activePath)
      if (!model) {
        retry = setTimeout(attach, 150)
        return
      }
      void load()
      sub = model.onDidChangeContent(() => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => void load(), 600)
      })
    }
    attach()

    return () => {
      disposed = true
      if (timer) clearTimeout(timer)
      if (retry) clearTimeout(retry)
      sub?.dispose()
    }
  }, [activePath])

  const goto = (symbol: SpySymbol) => {
    const editor = getActiveEditor()
    if (!editor) return
    const range = toMonacoRange(symbol)
    editor.setSelection(range)
    editor.revealRangeInCenter(range)
    editor.focus()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-vsc-fg-dim">
        {tr('outline.title')}
      </div>
      <div className="min-h-0 flex-1 overflow-auto pb-4">
        {symbols.length === 0 && (
          <div className="px-3 py-2 text-[12px] text-vsc-fg-dim">
            {activePath ? tr('outline.noSymbols') : tr('outline.openFile')}
          </div>
        )}
        {symbols.map((symbol, index) => (
          <div
            key={index}
            title={`${symbol.name} (${symbol.range.startLine + 1}:${symbol.range.startChar + 1})`}
            onClick={() => goto(symbol)}
            className="flex cursor-pointer items-center gap-2 truncate px-3 py-[2px] text-[12px] text-vsc-fg hover:bg-[#2a2d2e]"
          >
            <span className="w-4 shrink-0 text-center text-vsc-fg-dim">
              {kindLabel(symbol.kind)}
            </span>
            <span className="truncate">{symbol.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
