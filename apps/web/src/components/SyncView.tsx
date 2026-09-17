import { useT } from '@/i18n'
import { versionIdForPackFormat } from '@/lib/pack'
import { formatBytes } from '@/lib/sync'
import { flattenFiles } from '@/lib/tree'
import { useWorkspace } from '@/store/workspace'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-3 py-[2px] text-[12px]">
      <span className="shrink-0 text-vsc-fg-dim">{label}</span>
      <span className="truncate text-vsc-fg" title={value}>
        {value}
      </span>
    </div>
  )
}

export function SyncView() {
  const tr = useT()
  const rootName = useWorkspace((s) => s.rootName)
  const tree = useWorkspace((s) => s.tree)
  const pack = useWorkspace((s) => s.pack)
  const resolvedVersion = useWorkspace((s) => s.resolvedVersion)
  const settings = useWorkspace((s) => s.settings)
  const update = useWorkspace((s) => s.updateSettings)
  const running = useWorkspace((s) => s.syncRunning)
  const error = useWorkspace((s) => s.syncError)
  const result = useWorkspace((s) => s.syncResult)
  const chooseSyncDir = useWorkspace((s) => s.chooseSyncDir)
  const runSync = useWorkspace((s) => s.runSync)

  const desktop = typeof window !== 'undefined' && Boolean(window.mccodeDesktop?.writeFile)
  const target = settings.sync.targetDir
  const fileCount = flattenFiles(tree).length
  const version = resolvedVersion ?? versionIdForPackFormat(pack.packFormat)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-vsc-fg-dim">
        {tr('sync.title')}
      </div>

      {!desktop ? (
        <div className="p-3 text-[12px] text-vsc-fg-dim">{tr('sync.unavailable')}</div>
      ) : !rootName ? (
        <div className="p-3 text-[12px] text-vsc-fg-dim">{tr('sync.noFolder')}</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-vsc-fg-dim">
            {tr('sync.pack')}
          </div>
          <InfoRow label={tr('sync.name')} value={rootName} />
          <InfoRow label={tr('sync.version')} value={version ?? tr('sync.unknown')} />
          <InfoRow
            label={tr('sync.format')}
            value={pack.packFormat === null ? tr('sync.unknown') : String(pack.packFormat)}
          />
          <InfoRow label={tr('sync.files')} value={String(fileCount)} />

          <div className="mb-1 mt-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-vsc-fg-dim">
            {tr('sync.target')}
          </div>
          <div className="px-3 text-[12px] text-vsc-fg">
            <div className="truncate text-vsc-fg-dim" title={target}>
              {target || tr('sync.noTargetPath')}
            </div>
            <button
              className="mt-1 rounded bg-[#3c3c3c] px-2 py-1 text-[12px] text-vsc-fg hover:bg-[#4a4a4a]"
              onClick={() => void chooseSyncDir()}
            >
              {tr('sync.choose')}
            </button>
            <div className="mt-1 text-[11px] text-vsc-fg-dim">{tr('sync.targetHint')}</div>
            <label className="mt-2 flex items-center gap-2 text-[12px] text-vsc-fg">
              <input
                type="checkbox"
                checked={settings.sync.cleanOld}
                onChange={(e) => update({ sync: { cleanOld: e.target.checked } })}
              />
              {tr('sync.cleanOld')}
            </label>
            <div className="text-[11px] text-vsc-fg-dim">{tr('sync.cleanOldHint')}</div>
          </div>

          <div className="mt-4 px-3">
            <button
              className="w-full rounded bg-vsc-accent px-3 py-1 text-[12px] text-white hover:brightness-110 disabled:opacity-40"
              disabled={running || !target || fileCount === 0}
              onClick={() => void runSync()}
            >
              {running ? tr('sync.running') : tr('sync.run')}
            </button>
          </div>

          {(error || result) && (
            <div className="mt-3 px-3 text-[11px]">
              {error ? (
                <div className="text-[#f48771]">{error}</div>
              ) : (
                result && (
                  <>
                    <div className="text-[#73c991]">
                      {tr('sync.result', {
                        file: result.fileName,
                        size: formatBytes(result.bytes),
                      })}
                    </div>
                    {result.removed.length > 0 && (
                      <div className="text-vsc-fg-dim">
                        {tr('sync.removed', { count: result.removed.length })}
                      </div>
                    )}
                    <div className="text-vsc-fg-dim">
                      {tr('sync.last', { time: new Date(result.at).toLocaleTimeString() })}
                    </div>
                  </>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
