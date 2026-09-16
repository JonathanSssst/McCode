import { useT } from '@/i18n'
import { isConfigured } from '@/lib/ai/config'
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
  const aiStatus = useWorkspace((s) => s.aiStatus)
  const aiMessage = useWorkspace((s) => s.aiMessage)
  const aiEnabled = useWorkspace((s) => s.settings.ai.enabled)
  const openSettings = useWorkspace((s) => s.openSettings)
  const aiConfigured = isConfigured()
  const gitRepo = useWorkspace((s) => s.gitRepo)
  const gitBranch = useWorkspace((s) => s.gitBranch)
  const gitDetached = useWorkspace((s) => s.gitDetached)
  const gitAhead = useWorkspace((s) => s.gitAhead)
  const gitBehind = useWorkspace((s) => s.gitBehind)
  const setActiveView = useWorkspace((s) => s.setActiveView)

  const gitTitle = gitDetached
    ? tr('status.detachedTitle')
    : tr('status.branchTitle', { name: gitBranch ?? '' }) +
      (gitAhead > 0 || gitBehind > 0
        ? ` · ${tr('status.aheadBehind', { ahead: gitAhead, behind: gitBehind })}`
        : '')

  const aiTitle = !aiConfigured
    ? tr('status.aiNoKey')
    : !aiEnabled
      ? tr('status.aiOff')
      : aiStatus === 'loading'
        ? tr('status.aiLoading')
        : aiStatus === 'error'
          ? tr('status.aiError', { message: aiMessage })
          : tr('status.aiIdle')
  const aiColor =
    aiStatus === 'error'
      ? 'text-[#ffd0c7]'
      : aiStatus === 'loading'
        ? 'text-[#bcd8ff]'
        : 'opacity-90'

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
      {gitRepo && (
        <button
          onClick={() => setActiveView('scm')}
          title={gitTitle}
          className="flex items-center gap-1 hover:bg-white/15"
        >
          <span>⑂ {gitDetached ? tr('status.detachedTitle') : gitBranch}</span>
          {(gitAhead > 0 || gitBehind > 0) && (
            <span className="opacity-80">
              {gitAhead > 0 ? `↑${gitAhead}` : ''}
              {gitBehind > 0 ? `↓${gitBehind}` : ''}
            </span>
          )}
        </button>
      )}
      <button
        onClick={openSettings}
        title={aiTitle}
        className="flex items-center gap-1 hover:bg-white/15"
      >
        <span className={aiColor}>✦ AI</span>
      </button>
      <button onClick={togglePanel} className="flex items-center gap-2 hover:bg-white/15">
        <span>⊗ {errors}</span>
        <span>⚠ {warnings}</span>
      </button>
    </div>
  )
}
