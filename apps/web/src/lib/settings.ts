import { DEFAULT_AI_SETTINGS, type AiSettings } from './ai/types'

export interface EditorSettings {
  theme: 'dark' | 'light'
  fontSize: number
  fontFamily: string
  tabSize: number
  insertSpaces: boolean
  wordWrap: 'off' | 'on'
  minimap: boolean
  stickyScroll: boolean
  renderWhitespace: 'none' | 'selection' | 'all'
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid'
  smoothScrolling: boolean
}

export interface AppSettings {
  editor: EditorSettings
  ai: AiSettings
  confirmDelete: boolean
  autoSave: 'off' | 'afterDelay'
  language: 'zh' | 'en'
}

export const DEFAULT_SETTINGS: AppSettings = {
  editor: {
    theme: 'dark',
    fontSize: 13,
    fontFamily: 'Consolas, "Cascadia Mono", Menlo, Monaco, monospace',
    tabSize: 4,
    insertSpaces: false,
    wordWrap: 'off',
    minimap: true,
    stickyScroll: true,
    renderWhitespace: 'selection',
    cursorBlinking: 'smooth',
    smoothScrolling: true,
  },
  confirmDelete: true,
  autoSave: 'off',
  language: 'zh',
  ai: { ...DEFAULT_AI_SETTINGS },
}

const STORAGE_KEY = 'mccode:settings'

function cloneDefaults(): AppSettings {
  return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) as AppSettings
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneDefaults()
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      editor: { ...DEFAULT_SETTINGS.editor, ...(parsed.editor ?? {}) },
      ai: { ...DEFAULT_SETTINGS.ai, ...(parsed.ai ?? {}) },
    }
  } catch {
    return cloneDefaults()
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}
