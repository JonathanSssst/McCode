import { t } from '@/i18n'
import { versionIdForPackFormat } from '@/lib/pack'
import { getProvider } from '@/lib/provider'
import {
  formatBytes,
  isOldArtifact,
  joinPath,
  packArchiveName,
  stripOldArtifacts,
} from '@/lib/sync'
import { buildWorkspaceZip } from '@/lib/zip'
import type { WorkspaceState } from './workspace'

type ImmerSet = (recipe: (draft: WorkspaceState) => void) => void
type ImmerGet = () => WorkspaceState

export interface SyncResult {
  fileName: string
  bytes: number
  removed: string[]
  at: number
}

export interface SyncState {
  syncRunning: boolean
  syncError: string
  syncResult: SyncResult | null
}

export interface SyncActions {
  chooseSyncDir: () => Promise<void>
  runSync: () => Promise<void>
}

export const initialSyncState: SyncState = {
  syncRunning: false,
  syncError: '',
  syncResult: null,
}

export function createSyncActions(set: ImmerSet, get: ImmerGet): SyncActions {
  return {
    chooseSyncDir: async () => {
      const bridge = typeof window === 'undefined' ? undefined : window.mccodeDesktop
      if (!bridge?.pickDirectory) {
        set((s) => {
          s.syncError = t('sync.unavailable')
        })
        return
      }
      const directory = await bridge.pickDirectory()
      if (!directory) return
      get().updateSettings({ sync: { targetDir: directory } })
      set((s) => {
        s.syncError = ''
      })
    },

    runSync: async () => {
      const { rootName, tree, pack, resolvedVersion, settings } = get()
      const bridge = typeof window === 'undefined' ? undefined : window.mccodeDesktop
      if (!bridge?.writeFile || !bridge.readDir || !bridge.remove) {
        set((s) => {
          s.syncError = t('sync.unavailable')
        })
        return
      }
      if (!rootName || tree.length === 0) {
        set((s) => {
          s.syncError = t('sync.noPack')
        })
        return
      }
      const target = settings.sync.targetDir
      if (!target) {
        set((s) => {
          s.syncError = t('sync.noTarget')
        })
        return
      }

      set((s) => {
        s.syncRunning = true
        s.syncError = ''
      })
      try {
        const mcVersion = resolvedVersion ?? versionIdForPackFormat(pack.packFormat)
        const fileName = packArchiveName({
          name: rootName,
          mcVersion,
          packVersion: pack.version,
        })
        const data = await buildWorkspaceZip(stripOldArtifacts(tree, rootName), (path) =>
          getProvider().readFile(path),
        )

        await bridge.mkdir(target)
        await bridge.writeFile(joinPath(target, fileName), data)

        const removed: string[] = []
        if (settings.sync.cleanOld) {
          const entries = await bridge.readDir(target)
          for (const entry of entries) {
            if (entry.isDirectory || entry.name === fileName) continue
            if (!isOldArtifact(entry.name, rootName)) continue
            await bridge.remove(joinPath(target, entry.name), false)
            removed.push(entry.name)
          }
        }

        set((s) => {
          s.syncRunning = false
          s.syncError = ''
          s.syncResult = { fileName, bytes: data.length, removed, at: Date.now() }
          s.statusMessage = t('sync.result', { file: fileName, size: formatBytes(data.length) })
        })
      } catch (error) {
        set((s) => {
          s.syncRunning = false
          s.syncError = error instanceof Error ? error.message : String(error)
        })
      }
    },
  }
}
