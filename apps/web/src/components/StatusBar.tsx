import { useT } from '@/i18n'
import { fileName } from '@/lib/languages'
import { versionLabelForPackFormat } from '@/lib/pack'
import { useWorkspace } from '@/store/workspace'

export function StatusBar() {
  const tr = useT()
  const rootName = useWorkspace((s) => s.rootName)
  const pack = useWorkspace((s) => s.pack)
  const resolvedVersion = useWorkspace((s) => s.resolvedVersion)
  const gameVersion = useWorkspace((s) => s.gameVersion)
  const cursor = useWorkspace((s) => s.cursor)
  const activePath = useWorkspace((s) => s.activePath)
  const diagnostics = useWorkspace((s) => s.diagnostics)
  const togglePanel = useWorkspace((s) => s.togglePanel)

  const versionLabel = versionLabelForPackFormat(pack.packFormat)
  let errors = 0
  let warnings = 0
  for (const list of Object.values(diagnostics)) {
    for (const d of list) {
      if (d.severity >= 3) errors += 1
      else if (d.severity === 2) warnings += 1
    }
  }

  return (
    <div className="flex h-[22px] shrink-0 items-center gap-3 bg-[#007acc] px-3 text-[12px] text-white">
      <span className="truncate" title={rootName ?? ''}>
        {rootName ?? tr('status.noWorkspace')}
      </span>
      {pack.packFormat !== null && (
        <span className="opacity-90">
          pack_format {pack.packFormat}
          {resolvedVersion
            ? ` · MC ${resolvedVersion}`
            : versionLabel
              ? ` (MC ${versionLabel})`
              : ''}
          {gameVersion !== 'auto' ? ` · ${tr('status.pinned')}` : ''}
        </span>
      )}
      <span className="flex-1" />
      {activePath && (
        <span className="opacity-90">
          {tr('status.lineCol', { line: cursor.line, col: cursor.column })}
          {cursor.selectionLength > 0
            ? ` (${tr('status.selected', { count: cursor.selectionLength })})`
            : ''}
        </span>
      )}
      <span className="opacity-90">{activePath ? fileName(activePath) : ''}</span>
      <button onClick={togglePanel} className="flex items-center gap-2 hover:bg-white/15">
        <span>⊗ {errors}</span>
        <span>⚠ {warnings}</span>
      </button>
    </div>
  )
}
