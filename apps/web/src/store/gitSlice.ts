import { checkGit, getGitRunner } from '@/lib/git/client'
import {
  commit as gitCommit,
  discardPaths as gitDiscard,
  initRepository,
  isRepository,
  readStatus,
  stageAll as gitStageAll,
  stagePaths as gitStage,
  unstageAll as gitUnstageAll,
  unstagePaths as gitUnstage,
} from '@/lib/git/commands'
import type { GitFileChange } from '@/lib/git/types'
import { getProvider } from '@/lib/provider'
import type { WorkspaceState } from './workspace'

type ImmerSet = (recipe: (draft: WorkspaceState) => void) => void
type ImmerGet = () => WorkspaceState

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
  gitLoading: boolean
  gitError: string
  gitCommitMessage: string
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
  gitLoading: false,
  gitError: '',
  gitCommitMessage: '',
}

export function createGitActions(set: ImmerSet, get: ImmerGet): GitActions {
  const refresh = async () => {
    const runner = getGitRunner()
    if (!runner.available || !get().rootName) {
      set((s) => {
        s.gitRepo = false
        s.gitBranch = null
        s.gitUpstream = null
        s.gitDetached = false
        s.gitAhead = 0
        s.gitBehind = 0
        s.gitFiles = []
      })
      return
    }
    if (!(await isRepository(runner))) {
      set((s) => {
        s.gitRepo = false
        s.gitBranch = null
        s.gitUpstream = null
        s.gitDetached = false
        s.gitAhead = 0
        s.gitBehind = 0
        s.gitFiles = []
      })
      return
    }
    const status = await readStatus(runner)
    set((s) => {
      s.gitRepo = true
      s.gitBranch = status.branch
      s.gitUpstream = status.upstream
      s.gitDetached = status.detached
      s.gitAhead = status.ahead
      s.gitBehind = status.behind
      s.gitFiles = status.files
    })
  }

  const run = async (action: () => Promise<{ ok: boolean; error: string }>) => {
    set((s) => {
      s.gitLoading = true
      s.gitError = ''
    })
    const outcome = await action()
    set((s) => {
      s.gitLoading = false
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
        s.gitError = ''
      })
      const outcome = await initRepository(getGitRunner())
      set((s) => {
        s.gitLoading = false
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

    stageGitPaths: (paths) => run(() => gitStage(getGitRunner(), paths)),

    unstageGitPaths: (paths) => run(() => gitUnstage(getGitRunner(), paths)),

    discardGitPaths: async (paths) => {
      const files = get().gitFiles
      const untracked = paths.filter((path) =>
        files.some((file) => file.path === path && file.kind === 'untracked'),
      )
      const tracked = paths.filter((path) => !untracked.includes(path))
      await run(async () => {
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

    stageAllGit: () => run(() => gitStageAll(getGitRunner())),

    unstageAllGit: () => run(() => gitUnstageAll(getGitRunner())),

    commitGit: async () => {
      await run(() => gitCommit(getGitRunner(), get().gitCommitMessage))
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
  }
}
