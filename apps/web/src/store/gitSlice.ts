import { t } from '@/i18n'
import { checkGit, getGitRunner } from '@/lib/git/client'
import {
  addRemote as addRemoteCommand,
  commit as gitCommit,
  createBranch as createBranchCommand,
  discardPaths as gitDiscard,
  fetchAll,
  initRepository,
  isRepository,
  pull as pullCommand,
  push as pushCommand,
  pushSetUpstream,
  readBranches,
  readRemotes,
  readStatus,
  showFileAtRef,
  stageAll as gitStageAll,
  stagePaths as gitStage,
  switchBranch as switchBranchCommand,
  unstageAll as gitUnstageAll,
  unstagePaths as gitUnstage,
} from '@/lib/git/commands'
import type { GitBranchRef, GitRemote } from '@/lib/git/parse'
import type { GitFileChange } from '@/lib/git/types'
import { getProvider } from '@/lib/provider'
import { getModel } from '@/monaco/models'
import type { WorkspaceState } from './workspace'

type ImmerSet = (recipe: (draft: WorkspaceState) => void) => void
type ImmerGet = () => WorkspaceState

export interface GitDiffState {
  path: string
  original: string
  working: string
  loading: boolean
}

export interface GitState {
  gitAvailable: boolean
  gitVersion: string
  gitRepo: boolean
  gitBranch: string | null
  gitUpstream: string | null
  gitDetached: boolean
  gitAhead: number
  gitBehind: number
  gitFiles: GitFileChange[]
  gitBranches: GitBranchRef[]
  gitRemotes: GitRemote[]
  gitLoading: boolean
  gitAction: string
  gitError: string
  gitCommitMessage: string
  gitDiff: GitDiffState | null
}

export interface GitActions {
  checkGitAvailability: () => Promise<void>
  refreshGit: () => Promise<void>
  initGit: () => Promise<void>
  stageGitPaths: (paths: string[]) => Promise<void>
  unstageGitPaths: (paths: string[]) => Promise<void>
  discardGitPaths: (paths: string[]) => Promise<void>
  stageAllGit: () => Promise<void>
  unstageAllGit: () => Promise<void>
  commitGit: () => Promise<void>
  setGitCommitMessage: (message: string) => void
  fetchGit: () => Promise<void>
  pullGit: () => Promise<void>
  pushGit: () => Promise<void>
  switchGitBranch: (name: string) => Promise<void>
  createGitBranch: (name: string) => Promise<void>
  addGitRemote: (input: string) => Promise<void>
  openGitDiff: (path: string) => Promise<void>
  closeGitDiff: () => void
}

export const initialGitState: GitState = {
  gitAvailable: false,
  gitVersion: '',
  gitRepo: false,
  gitBranch: null,
  gitUpstream: null,
  gitDetached: false,
  gitAhead: 0,
  gitBehind: 0,
  gitFiles: [],
  gitBranches: [],
  gitRemotes: [],
  gitLoading: false,
  gitAction: '',
  gitError: '',
  gitCommitMessage: '',
  gitDiff: null,
}

function resetRepoState(s: WorkspaceState): void {
  s.gitRepo = false
  s.gitBranch = null
  s.gitUpstream = null
  s.gitDetached = false
  s.gitAhead = 0
  s.gitBehind = 0
  s.gitFiles = []
  s.gitBranches = []
  s.gitRemotes = []
}

export function createGitActions(set: ImmerSet, get: ImmerGet): GitActions {
  const refresh = async () => {
    const runner = getGitRunner()
    if (!runner.available || !get().rootName) {
      set(resetRepoState)
      return
    }
    if (!(await isRepository(runner))) {
      set(resetRepoState)
      return
    }
    const [status, branches, remotes] = await Promise.all([
      readStatus(runner),
      readBranches(runner),
      readRemotes(runner),
    ])
    set((s) => {
      s.gitRepo = true
      s.gitBranch = status.branch
      s.gitUpstream = status.upstream
      s.gitDetached = status.detached
      s.gitAhead = status.ahead
      s.gitBehind = status.behind
      s.gitFiles = status.files
      s.gitBranches = branches
      s.gitRemotes = remotes
    })
  }

  const run = async (label: string, action: () => Promise<{ ok: boolean; error: string }>) => {
    set((s) => {
      s.gitLoading = true
      s.gitAction = label
      s.gitError = ''
    })
    const outcome = await action()
    set((s) => {
      s.gitLoading = false
      s.gitAction = ''
      if (!outcome.ok) s.gitError = outcome.error
    })
    await refresh()
  }

  return {
    checkGitAvailability: async () => {
      const info = await checkGit()
      set((s) => {
        s.gitAvailable = info.available
        s.gitVersion = info.version
      })
      if (info.available) await refresh()
    },

    refreshGit: refresh,

    initGit: async () => {
      set((s) => {
        s.gitLoading = true
        s.gitAction = 'init'
        s.gitError = ''
      })
      const outcome = await initRepository(getGitRunner())
      set((s) => {
        s.gitLoading = false
        s.gitAction = ''
        if (!outcome.ok) s.gitError = outcome.error
      })
      if (outcome.ok) {
        set((s) => {
          s.tree = []
        })
        await get().refreshTree()
      }
      await refresh()
    },

    stageGitPaths: (paths) => run('stage', () => gitStage(getGitRunner(), paths)),

    unstageGitPaths: (paths) => run('unstage', () => gitUnstage(getGitRunner(), paths)),

    discardGitPaths: async (paths) => {
      const files = get().gitFiles
      const untracked = paths.filter((path) =>
        files.some((file) => file.path === path && file.kind === 'untracked'),
      )
      const tracked = paths.filter((path) => !untracked.includes(path))
      await run('discard', async () => {
        if (tracked.length > 0) {
          const outcome = await gitDiscard(getGitRunner(), tracked)
          if (!outcome.ok) return outcome
        }
        for (const path of untracked) {
          try {
            await getProvider().remove(path, false)
          } catch (error) {
            return { ok: false, error: String(error) }
          }
        }
        return { ok: true, error: '' }
      })
      for (const path of untracked) {
        if (get().openFiles.some((file) => file.path === path)) get().closeFile(path)
      }
      if (untracked.length > 0) await get().refreshTree()
    },

    stageAllGit: () => run('stage', () => gitStageAll(getGitRunner())),

    unstageAllGit: () => run('unstage', () => gitUnstageAll(getGitRunner())),

    commitGit: async () => {
      await run('commit', () => gitCommit(getGitRunner(), get().gitCommitMessage))
      if (!get().gitError) {
        set((s) => {
          s.gitCommitMessage = ''
        })
      }
    },

    setGitCommitMessage: (message) => {
      set((s) => {
        s.gitCommitMessage = message
      })
    },

    fetchGit: () => run('fetch', () => fetchAll(getGitRunner())),

    pullGit: () => run('pull', () => pullCommand(getGitRunner())),

    pushGit: async () => {
      const { gitBranch, gitUpstream, gitRemotes } = get()
      if (!gitBranch) {
        set((s) => {
          s.gitError = t('scm.detached')
        })
        return
      }
      if (gitUpstream) {
        await run('push', () => pushCommand(getGitRunner()))
        return
      }
      const remote = gitRemotes.find((item) => item.name === 'origin') ?? gitRemotes[0]
      if (!remote) {
        set((s) => {
          s.gitError = t('scm.noRemote')
        })
        return
      }
      await run('push', () => pushSetUpstream(getGitRunner(), remote.name, gitBranch))
    },

    switchGitBranch: (name) => run('switch', () => switchBranchCommand(getGitRunner(), name)),

    createGitBranch: (name) => run('branch', () => createBranchCommand(getGitRunner(), name)),

    addGitRemote: async (input) => {
      const parts = input.trim().split(/\s+/)
      let name = 'origin'
      let url = input.trim()
      if (parts.length > 1) {
        name = parts[0]
        url = parts.slice(1).join(' ')
      }
      if (!/^(https?:\/\/|ssh:\/\/|git@|\/|[A-Za-z]:[\\/])/.test(url)) {
        set((s) => {
          s.gitError = t('scm.invalidRemote')
        })
        return
      }
      await run('remote', () => addRemoteCommand(getGitRunner(), name, url))
    },

    openGitDiff: async (path) => {
      const runner = getGitRunner()
      if (!runner.available) return
      set((s) => {
        s.gitDiff = { path, original: '', working: '', loading: true }
      })
      const original = (await showFileAtRef(runner, 'HEAD', path)) ?? ''
      let working = ''
      const model = getModel(path)
      if (model) {
        working = model.getValue()
      } else {
        try {
          working = new TextDecoder().decode(await getProvider().readFile(path))
        } catch {
          working = ''
        }
      }
      set((s) => {
        if (s.gitDiff?.path !== path) return
        s.gitDiff = { path, original, working, loading: false }
      })
    },

    closeGitDiff: () => {
      set((s) => {
        s.gitDiff = null
      })
    },
  }
}
