import { useT } from '@/i18n'
import { isStaged, isUnstaged, type GitChangeKind, type GitFileChange } from '@/lib/git/types'
import { findNode } from '@/lib/tree'
import { useWorkspace } from '@/store/workspace'

const LETTER: Record<GitChangeKind, string> = {
  modified: 'M',
  added: 'A',
  deleted: 'D',
  renamed: 'R',
  copied: 'C',
  typechange: 'T',
  unmerged: 'U',
  untracked: 'U',
  unknown: '?',
}

const TINT: Record<GitChangeKind, string> = {
  modified: 'text-[#e2c08d]',
  added: 'text-[#73c991]',
  deleted: 'text-[#f48771]',
  renamed: 'text-[#73c991]',
  copied: 'text-[#73c991]',
  typechange: 'text-[#e2c08d]',
  unmerged: 'text-[#f48771]',
  untracked: 'text-[#73c991]',
  unknown: 'text-vsc-fg-dim',
}

function baseName(path: string): string {
  const index = path.lastIndexOf('/')
  return index === -1 ? path : path.slice(index + 1)
}

function dirName(path: string): string {
  const index = path.lastIndexOf('/')
  return index === -1 ? '' : path.slice(0, index + 1)
}

function Row({
  change,
  onOpen,
  primary,
  secondary,
}: {
  change: GitFileChange
  onOpen: () => void
  primary?: { title: string; glyph: string; run: () => void }
  secondary?: { title: string; glyph: string; run: () => void }
}) {
  return (
    <div
      onClick={onOpen}
      title={change.origPath ? `${change.origPath} → ${change.path}` : change.path}
      className="group flex h-[22px] cursor-pointer items-center gap-2 px-3 text-[13px] text-vsc-fg hover:bg-[#2a2d2e]"
    >
      <span className={`w-3 shrink-0 text-center ${TINT[change.kind]}`}>{LETTER[change.kind]}</span>
      <span className="truncate">
        <span className="text-vsc-fg-dim">{dirName(change.path)}</span>
        {baseName(change.path)}
      </span>
      <span className="ml-auto flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
        {secondary && (
          <button
            title={secondary.title}
            className="px-1 text-vsc-fg-dim hover:text-white"
            onClick={(event) => {
              event.stopPropagation()
              secondary.run()
            }}
          >
            {secondary.glyph}
          </button>
        )}
        {primary && (
          <button
            title={primary.title}
            className="px-1 text-vsc-fg-dim hover:text-white"
            onClick={(event) => {
              event.stopPropagation()
              primary.run()
            }}
          >
            {primary.glyph}
          </button>
        )}
      </span>
    </div>
  )
}

export function SourceControlView() {
  const tr = useT()
  const rootName = useWorkspace((s) => s.rootName)
  const available = useWorkspace((s) => s.gitAvailable)
  const repo = useWorkspace((s) => s.gitRepo)
  const branch = useWorkspace((s) => s.gitBranch)
  const detached = useWorkspace((s) => s.gitDetached)
  const upstream = useWorkspace((s) => s.gitUpstream)
  const ahead = useWorkspace((s) => s.gitAhead)
  const behind = useWorkspace((s) => s.gitBehind)
  const files = useWorkspace((s) => s.gitFiles)
  const loading = useWorkspace((s) => s.gitLoading)
  const error = useWorkspace((s) => s.gitError)
  const message = useWorkspace((s) => s.gitCommitMessage)
  const tree = useWorkspace((s) => s.tree)

  const setMessage = useWorkspace((s) => s.setGitCommitMessage)
  const refresh = useWorkspace((s) => s.refreshGit)
  const init = useWorkspace((s) => s.initGit)
  const stage = useWorkspace((s) => s.stageGitPaths)
  const unstage = useWorkspace((s) => s.unstageGitPaths)
  const discard = useWorkspace((s) => s.discardGitPaths)
  const stageAll = useWorkspace((s) => s.stageAllGit)
  const unstageAll = useWorkspace((s) => s.unstageAllGit)
  const commit = useWorkspace((s) => s.commitGit)
  const openFile = useWorkspace((s) => s.openFile)

  const open = (path: string) => {
    const node = findNode(tree, path)
    if (node) void openFile(node, { preview: true })
  }

  const staged = files.filter(isStaged)
  const unstaged = files.filter(
    (file) => !isStaged(file) && (isUnstaged(file) || file.kind === 'untracked'),
  )

  const discardWithConfirm = (path: string) => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(tr('scm.discardConfirm', { name: baseName(path) }))
    ) {
      return
    }
    void discard([path])
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-vsc-fg-dim">
        <span>{tr('scm.title')}</span>
        {repo && (
          <button
            title={tr('scm.refresh')}
            onClick={() => void refresh()}
            className="hover:text-white"
          >
            ↻
          </button>
        )}
      </div>

      {!rootName ? (
        <div className="p-3 text-[12px] text-vsc-fg-dim">{tr('scm.noFolder')}</div>
      ) : !available ? (
        <div className="p-3 text-[12px] text-vsc-fg-dim">{tr('scm.unavailable')}</div>
      ) : !repo ? (
        <div className="flex flex-col items-start gap-3 p-3 text-[12px] text-vsc-fg-dim">
          <p>{tr('scm.notRepo')}</p>
          <button
            className="rounded bg-vsc-accent px-3 py-1 text-white hover:brightness-110 disabled:opacity-50"
            disabled={loading}
            onClick={() => void init()}
          >
            {tr('scm.init')}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 px-3 pb-2 text-[12px] text-vsc-fg">
            <span
              className="truncate"
              title={detached ? tr('status.detachedTitle') : (branch ?? '')}
            >
              {detached ? tr('scm.detached') : branch}
            </span>
            {upstream && (
              <span
                className="shrink-0 text-[11px] text-vsc-fg-dim"
                title={tr('scm.upstream', { name: upstream })}
              >
                {ahead > 0 ? `↑${ahead}` : ''}
                {behind > 0 ? `↓${behind}` : ''}
              </span>
            )}
          </div>

          <textarea
            value={message}
            spellCheck={false}
            placeholder={tr('scm.commitPlaceholder')}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                void commit()
              }
            }}
            className="mx-2 mb-1 h-16 resize-none rounded border border-[#454545] bg-[#1e1e1e] px-2 py-1 text-[12px] text-vsc-fg outline-none placeholder:text-vsc-fg-dim"
          />
          <div className="mb-1 px-2">
            <button
              className="w-full rounded bg-vsc-accent px-3 py-1 text-[12px] text-white hover:brightness-110 disabled:opacity-40"
              disabled={staged.length === 0 || !message.trim() || loading}
              onClick={() => void commit()}
            >
              {tr('scm.commit')}
            </button>
          </div>

          {(loading || error) && (
            <div
              className={`px-3 pb-1 text-[11px] ${error ? 'text-[#f48771]' : 'text-vsc-fg-dim'}`}
            >
              {error || tr('scm.loading')}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-auto pb-4">
            {staged.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-vsc-fg-dim">
                  <span>{tr('scm.staged')}</span>
                  <span>{staged.length}</span>
                  <button
                    title={tr('scm.unstageAll')}
                    className="ml-auto hover:text-white"
                    onClick={() => void unstageAll()}
                  >
                    −
                  </button>
                </div>
                {staged.map((change) => (
                  <Row
                    key={`s-${change.path}`}
                    change={change}
                    onOpen={() => open(change.path)}
                    primary={{
                      title: tr('scm.unstage'),
                      glyph: '−',
                      run: () => void unstage([change.path]),
                    }}
                  />
                ))}
              </>
            )}

            {unstaged.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-vsc-fg-dim">
                  <span>{tr('scm.changes')}</span>
                  <span>{unstaged.length}</span>
                  <button
                    title={tr('scm.stageAll')}
                    className="ml-auto hover:text-white"
                    onClick={() => void stageAll()}
                  >
                    +
                  </button>
                </div>
                {unstaged.map((change) => (
                  <Row
                    key={`w-${change.path}`}
                    change={change}
                    onOpen={() => open(change.path)}
                    primary={{
                      title: tr('scm.stage'),
                      glyph: '+',
                      run: () => void stage([change.path]),
                    }}
                    secondary={{
                      title: tr('scm.discard'),
                      glyph: '↩',
                      run: () => discardWithConfirm(change.path),
                    }}
                  />
                ))}
              </>
            )}

            {files.length === 0 && (
              <div className="px-3 py-2 text-[12px] text-vsc-fg-dim">{tr('scm.noChanges')}</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
