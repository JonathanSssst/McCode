import { desktopAi, envKeyConfigured } from '@/lib/ai/config'
import type { WorkspaceState } from './workspace'

type ImmerSet = (recipe: (draft: WorkspaceState) => void) => void
type ImmerGet = () => WorkspaceState

export interface AiKeyState {
  aiKeyConfigured: boolean
  aiKeyEncryption: boolean
  aiKeyError: string
}

export interface AiKeyActions {
  refreshAiKeyStatus: () => Promise<void>
  saveAiKey: (key: string) => Promise<void>
  clearAiKey: () => Promise<void>
}

export const initialAiKeyState: AiKeyState = {
  aiKeyConfigured: false,
  aiKeyEncryption: false,
  aiKeyError: '',
}

export function createAiKeyActions(set: ImmerSet, get: ImmerGet): AiKeyActions {
  return {
    refreshAiKeyStatus: async () => {
      const bridge = desktopAi()
      if (!bridge?.aiStatus) {
        set((s) => {
          s.aiKeyConfigured = envKeyConfigured()
          s.aiKeyEncryption = false
          s.aiKeyError = ''
        })
        return
      }
      try {
        const status = await bridge.aiStatus()
        set((s) => {
          s.aiKeyConfigured = status.configured
          s.aiKeyEncryption = status.encryption
          s.aiKeyError = ''
        })
      } catch (error) {
        set((s) => {
          s.aiKeyError = String(error)
        })
      }
    },

    saveAiKey: async (key) => {
      const bridge = desktopAi()
      if (!bridge?.aiSetKey) return
      const result = await bridge.aiSetKey(key)
      set((s) => {
        s.aiKeyConfigured = Boolean(result.configured)
        s.aiKeyError = result.ok ? '' : (result.error ?? '')
      })
      await get().refreshAiKeyStatus()
    },

    clearAiKey: async () => {
      const bridge = desktopAi()
      if (!bridge?.aiClearKey) return
      const result = await bridge.aiClearKey()
      set((s) => {
        s.aiKeyConfigured = Boolean(result.configured)
        s.aiKeyError = result.ok ? '' : (result.error ?? '')
      })
      await get().refreshAiKeyStatus()
    },
  }
}
