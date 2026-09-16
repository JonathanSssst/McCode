import { useState } from 'react'
import { useT } from '@/i18n'
import { useWorkspace } from '@/store/workspace'

type PanelTab = 'problems' | 'output'

export function Panel() {
  const [tab, setTab] = useState<PanelTab>('problems')
  const diagnostics = useWorkspace((s) => s.diagnostics)
  const logs = useWorkspace((s) => s.logs)
  const setActive = useWorkspace((s) => s.setActive)
  const togglePanel = useWorkspace((s) => s.togglePanel)
  const tr = useT()

  const rows = Object.entries(diagnostics).flatMap(([path, list]) =>
    list.map((d) => ({
      path,
      message: d.message,
      severity: d.severity,
      range: d.range,
      suggestion: d.suggestion,
    })),
  )

  return (
    <div className="flex h-48 shrink-0 flex-col border-t border-vsc-border bg-vsc-bg-alt">
      <div className="flex h-[35px] items-center gap-4 border-b border-vsc-border px-4 text-[11px] uppercase tracking-wide">
        <button
          className={`pb-[10px] pt-[10px] ${tab === 'problems' ? 'border-b border-white text-white' : 'text-vsc-fg-dim hover:text-vsc-fg'}`}
          onClick={() => setTab('problems')}
        >
          {tr('panel.problems')}
          {rows.length > 0 ? ` (${rows.length})` : ''}
        </button>
        <button
          className={`pb-[10px] pt-[10px] ${tab === 'output' ? 'border-b border-white text-white' : 'text-vsc-fg-dim hover:text-vsc-fg'}`}
          onClick={() => setTab('output')}
        >
          {tr('panel.output')}
        </button>
        <span className="flex-1" />
        <button
          className="text-vsc-fg-dim hover:text-white"
          onClick={togglePanel}
          title={tr('panel.close')}
        >
          ✕
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2 text-[12px]">
        {tab === 'problems' ? (
          rows.length === 0 ? (
            <div className="p-2 text-vsc-fg-dim">{tr('panel.noProblems')}</div>
          ) : (
            rows.map((row, i) => (
              <div
                key={i}
                onClick={() => setActive(row.path)}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-0.5 hover:bg-[#2a2d2e]"
              >
                <span
                  className={
                    row.severity >= 3
                      ? 'text-[#f48771]'
                      : row.severity === 2
                        ? 'text-[#cca700]'
                        : 'text-[#75beff]'
                  }
                >
                  {row.severity >= 3 ? '⊗' : row.severity === 2 ? '⚠' : 'ℹ'}
                </span>
                <span>{row.message}</span>
                {row.suggestion && (
                  <span className="text-[#4ec9b0]">
                    {tr('panel.suggestion', { suggestion: row.suggestion })}
                  </span>
                )}
                <span className="text-vsc-fg-dim">
                  {row.path}:{row.range.startLine + 1}:{row.range.startChar + 1}
                </span>
              </div>
            ))
          )
        ) : (
          <div className="whitespace-pre-wrap font-mono text-[11px] text-vsc-fg-dim">
            {logs.length === 0 ? tr('panel.noLogs') : logs.join('\n')}
          </div>
        )}
      </div>
    </div>
  )
}
