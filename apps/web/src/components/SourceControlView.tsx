import { useT } from '@/i18n'
import { GIT_LETTER, GIT_TINT } from '@/lib/git/labels'
import { isStaged, isUnstaged, type GitFileChange } from '@/lib/git/types'
import { findNode } from '@/lib/tree'
import { useWorkspace } from '@/store/workspace'

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
  onContextMenu,
  primary,
  secondary,
}: {
  change: GitFileChange
  onOpen: () => void
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void
  primary?: { title: string; glyph: string; run: () => void }
  secondary?: { title: string; glyph: string; run: () => void }
}) {
  return (
    <div
      onClick={onOpen}
      onContextMenu={onContextMenu}
      title={change.origPath ? `${change.origPath} → ${change.path}` : change.path}
      className="group flex h-[22px] cursor-pointer items-center gap-2 px-3 text-[13px] text-vsc-fg hover:bg-[#2a2d2e]"
    >
      <span className={`w-3 shrink-0 text-center ${GIT_TINT[change.kind]}`}>
        {GIT_LETTER[change.kind]}
      </span>
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
  const branches = useWorkspace((s) => s.gitBranches)
  const remotes = useWorkspace((s) => s.gitRemotes)
  const loading = useWorkspace((s) => s.gitLoading)
  const action = useWorkspace((s) => s.gitAction)
  const error = useWorkspace((s) => s.gitError)
  const message = useWorkspace((s) => s.gitCommitMessage)
  const tree = useWorkspace((s) => s.tree)
  const files = useWorkspace((s) => s.gitFiles)

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
  const fetchGit = useWorkspace((s) => s.fetchGit)
  const pullGit = useWorkspace((s) => s.pullGit)
  const pushGit = useWorkspace((s) => s.pushGit)
  const switchGitBranch = useWorkspace((s) => s.switchGitBranch)
  const createGitBranch = useWorkspace((s) => s.createGitBranch)
  const addGitRemote = useWorkspace((s) => s.addGitRemote)
  const openContextMenu = useWorkspace((s) => s.openContextMenu)
  const openPrompt = useWorkspace((s) => s.openPrompt)
  const openGitDiff = useWorkspace((s) => s.openGitDiff)
  const copyPath = useWorkspace((s) => s.copyPath)

  const open = (path: string) => {
    void openGitDiff(path)
  }

  const openInEditor = (path: string) => {
    const node = findNode(tree, path)
    if (node) void openFile(node, { preview: false })
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

  const rowMenu = (event: React.MouseEvent<HTMLDivElement>, change: GitFileChange) => {
    event.preventDefault()
    event.stopPropagation()
    const isChangeStaged = isStaged(change)
    openContextMenu(event.clientX, event.clientY, [
      { label: tr('scm.openDiff'), run: () => open(change.path) },
      { label: tr('scm.openFile'), run: () => openInEditor(change.path) },
      { separator: true },
      isChangeStaged
        ? { label: tr('scm.unstage'), run: () => void unstage([change.path]) }
        : { label: tr('scm.stage'), run: () => void stage([change.path]) },
      ...(isChangeStaged
        ? []
        : [
            {
              label: tr('scm.discard'),
              danger: true,
              run: () => discardWithConfirm(change.path),
            },
          ]),
      { separator: true },
      { label: tr('ctx.copyPath'), run: () => void copyPath(change.path) },
    ])
  }

  const openMoreMenu = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    openContextMenu(rect.left, rect.bottom + 2, [
      { label: tr('scm.fetch'), run: () => void fetchGit() },
      { label: tr('scm.pull'), run: () => void pullGit() },
      { label: tr('scm.push'), run: () => void pushGit() },
      { separator: true },
      ...branches.slice(0, 15).map((item) => ({
        label: `${item.current ? '✓ ' : '  '}${item.name}`,
        run: () => void switchGitBranch(item.name),
      })),
      { separator: true },
      {
        label: tr('scm.newBranch'),
        run: () =>
          openPrompt({
            title: tr('scm.newBranch'),
            hint: tr('scm.newBranchHint'),
            onConfirm: (value) => void createGitBranch(value),
          }),
      },
      {
        label: tr('scm.addRemote'),
        run: () =>
          openPrompt({
            title: tr('scm.addRemote'),
            hint: tr('scm.addRemoteHint'),
            value: remotes.length === 0 ? 'origin ' : '',
            onConfirm: (value) => void addGitRemote(value),
          }),
      },
      { separator: true },
      { label: tr('scm.refresh'), run: () => void refresh() },
    ])
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
            ⟳
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
              ⑂ {detached ? tr('scm.detached') : branch}
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
            <span className="ml-auto flex shrink-0 items-center gap-0.5 text-vsc-fg-dim">
              <button
                title={tr('scm.fetch')}
                className="px-1 hover:text-white"
                onClick={() => void fetchGit()}
              >
                ⟳
              </button>
              <button
                title={tr('scm.pull')}
                className="px-1 hover:text-white"
                onClick={() => void pullGit()}
              >
                ↓
              </button>
              <button
                title={tr('scm.push')}
                className="px-1 hover:text-white"
                onClick={() => void pushGit()}
              >
                ↑
              </button>
              <button
                title={tr('scm.more')}
                className="px-1 hover:text-white"
                onClick={openMoreMenu}
              >
                ⋯
              </button>
            </span>
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
              {error || (action ? tr('scm.running', { action }) : tr('scm.loading'))}
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
                    onContextMenu={(event) => rowMenu(event, change)}
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
                    onContextMenu={(event) => rowMenu(event, change)}
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
