import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { t } from '@/i18n'
import { languageForPath, fileName, isBinaryPath } from '@/lib/languages'
import { detectPackInfo, versionIdForPackFormat, type PackInfo } from '@/lib/pack'
import { getProvider } from '@/lib/provider'
import { datapackDirs, datapackFiles } from '@/lib/datapack'
import { loadSettings, saveSettings, type AppSettings, type EditorSettings } from '@/lib/settings'
import type { AiSettings, AiStatus } from '@/lib/ai/types'
import { clampPanel, clampSidebar, loadLayout, saveLayout } from '@/lib/layout'
import { pinTab, upsertTab } from '@/lib/tabs'
import type { TemplateKind } from '@/lib/templates'
import { findNode, type TreeNode } from '@/lib/tree'
import { loadCommandTree } from '@/mcdata/commands'
import { fetchRegistries } from '@/mcdata/registries'
import { fetchReleaseVersions } from '@/mcdata/versions'
import { disposeAllModels, disposeModel, getModel } from '@/monaco/models'
import { applyTextEdits } from '@/lib/textEdits'
import type { SpyDiagnostic, SpyRange, SpyTextEdit } from '@/spyglass/client'
import { createFileActions } from './fileActions'
import { createGitActions, initialGitState, type GitActions, type GitState } from './gitSlice'
import {
  createAiKeyActions,
  initialAiKeyState,
  type AiKeyActions,
  type AiKeyState,
} from './aiKeySlice'
import { handleDiagnostics, loadSpyglass, startWatching, stopWatching } from './helpers'

let providersRegistered = false

export interface OpenFile {
  path: string
  name: string
  language: string
  savedContent: string
  dirty: boolean
  preview: boolean
}

export interface CursorInfo {
  line: number
  column: number
  selectionLength: number
}

export interface ContextMenuItem {
  label?: string
  separator?: boolean
  danger?: boolean
  run?: () => void
}

export interface PromptConfig {
  title: string
  value?: string
  hint?: string
  confirmLabel?: string
  onConfirm: (value: string) => void
}

export interface PromptDialogState {
  title: string
  value: string
  hint: string
  confirmLabel: string
  onConfirm: (value: string) => void
}

const emptyPack: PackInfo = { packFormat: null, supportedFormats: null, description: null }

export interface WorkspaceState extends GitState, GitActions, AiKeyState, AiKeyActions {
  rootName: string | null
  pack: PackInfo
  tree: TreeNode[]
  expanded: Record<string, boolean>
  openFiles: OpenFile[]
  activePath: string | null
  sidebarVisible: boolean
  panelVisible: boolean
  sidebarWidth: number
  panelHeight: number
  paletteVisible: boolean
  settingsVisible: boolean
  settings: AppSettings
  activeView: 'explorer' | 'data' | 'search' | 'outline' | 'scm'
  registries: Record<string, string[]>
  gameVersion: string
  resolvedVersion: string | null
  versions: string[]
  recentFolders: string[]
  diagnostics: Record<string, SpyDiagnostic[]>
  logs: string[]
  newFileDialog: { kind: TemplateKind; path: string } | null
  renameDialog: { path: string; name: string } | null
  newFolderDialog: { path: string } | null
  newPackDialog: { namespace: string; packFormat: number; description: string } | null
  promptDialog: PromptDialogState | null
  fileClipboard: { path: string } | null
  contextMenu: { x: number; y: number; items: ContextMenuItem[] } | null
  pendingReveal: { path: string; range: SpyRange } | null
  statusMessage: string
  aiStatus: AiStatus
  aiMessage: string
  cursor: CursorInfo

  openFolder: (path?: string) => Promise<void>
  closeFolder: () => void
  loadRecentFolders: () => Promise<void>
  refreshTree: (paths?: string[]) => Promise<void>
  toggleDirectory: (path: string) => void
  openFile: (node: TreeNode, options?: { preview?: boolean }) => Promise<void>
  closeFile: (path: string) => void
  setActive: (path: string) => void
  setDirty: (path: string, dirty: boolean) => void
  save: (path: string) => Promise<void>
  saveActive: () => Promise<void>
  applyRenameEdits: (edits: SpyTextEdit[]) => Promise<void>
  createFileAt: (path: string, content: string) => Promise<void>
  openNewPackDialog: () => void
  closeNewPackDialog: () => void
  openPrompt: (config: PromptConfig) => void
  setPromptValue: (value: string) => void
  closePrompt: () => void
  confirmPrompt: () => void
  setNewPackField: (
    patch: Partial<{ namespace: string; packFormat: number; description: string }>,
  ) => void
  confirmNewPack: () => Promise<void>
  toggleSidebar: () => void
  togglePanel: () => void
  setSidebarWidth: (width: number) => void
  setPanelHeight: (height: number) => void
  persistLayout: () => void
  setActiveView: (view: 'explorer' | 'data' | 'search' | 'outline' | 'scm') => void
  loadRegistries: (version: string) => Promise<void>
  setGameVersion: (version: string) => Promise<void>
  setPaletteVisible: (value: boolean) => void
  openSettings: () => void
  closeSettings: () => void
  updateSettings: (patch: {
    editor?: Partial<EditorSettings>
    ai?: Partial<AiSettings>
    confirmDelete?: boolean
    autoSave?: AppSettings['autoSave']
    language?: AppSettings['language']
  }) => void
  importSettings: (settings: AppSettings) => void
  setStatusMessage: (message: string) => void
  setAiStatus: (status: AiStatus, message?: string) => void
  setCursor: (cursor: CursorInfo) => void
  setDiagnostics: (path: string, diagnostics: SpyDiagnostic[]) => void
  appendLog: (level: string, message: string) => void
  openNewFileDialog: (kind: TemplateKind) => void
  closeNewFileDialog: () => void
  setNewFilePath: (path: string) => void
  confirmNewFile: () => Promise<void>
  openRenameDialog: (path: string) => void
  closeRenameDialog: () => void
  setRenameName: (name: string) => void
  confirmRename: () => Promise<void>
  openNewFolderDialog: (basePath: string) => void
  closeNewFolderDialog: () => void
  setNewFolderPath: (path: string) => void
  confirmNewFolder: () => Promise<void>
  copyEntry: (path: string) => void
  pasteEntry: (targetDir: string) => Promise<void>
  deleteEntry: (path: string) => Promise<void>
  revealEntry: (path: string) => Promise<void>
  copyPath: (path: string) => Promise<void>
  openContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void
  closeContextMenu: () => void
  exportZip: () => Promise<void>
  reveal: (path: string, range: SpyRange) => Promise<void>
  clearPendingReveal: () => void
}

export const useWorkspace = create<WorkspaceState>()(
  immer((set, get) => ({
    rootName: null,
    pack: emptyPack,
    tree: [],
    expanded: {},
    openFiles: [],
    activePath: null,
    sidebarVisible: true,
    panelVisible: false,
    ...loadLayout(),
    paletteVisible: false,
    settingsVisible: false,
    settings: loadSettings(),
    activeView: 'explorer',
    registries: {},
    gameVersion: 'auto',
    resolvedVersion: null,
    versions: [],
    recentFolders: [],
    diagnostics: {},
    logs: [],
    newFileDialog: null,
    renameDialog: null,
    newFolderDialog: null,
    newPackDialog: null,
    promptDialog: null,
    fileClipboard: null,
    contextMenu: null,
    pendingReveal: null,
    statusMessage: 'Ready',
    ...initialGitState,
    ...initialAiKeyState,
    aiStatus: 'idle',
    aiMessage: '',
    cursor: { line: 1, column: 1, selectionLength: 0 },

    ...createFileActions(set, get),
    ...createGitActions(set, get),
    ...createAiKeyActions(set, get),

    openFolder: async (path) => {
      const provider = getProvider()
      set((s) => {
        s.statusMessage = t('status.loadingWorkspace')
      })
      const rootName = await provider.pickFolder(path)
      if (!rootName) {
        set((s) => {
          s.statusMessage = t('status.ready')
        })
        return
      }
      const tree = await provider.readTree()
      const pack = await detectPackInfo(tree, async (path) =>
        new TextDecoder().decode(await provider.readFile(path)),
      )
      disposeAllModels()
      void loadSpyglass().then((m) => m.resetSpyglass())
      set((s) => {
        s.rootName = rootName
        s.tree = tree
        s.pack = pack
        s.expanded = {}
        s.openFiles = []
        s.activePath = null
        s.diagnostics = {}
        s.statusMessage = t('status.opened', { name: rootName })
      })
      void get().refreshGit()
      const spy = await loadSpyglass()
      await spy.initSpyglass({
        gameVersion: get().gameVersion,
        onDiagnostics: (uri, diagnostics) =>
          handleDiagnostics(uri, diagnostics, (path, diags) => get().setDiagnostics(path, diags)),
        onStatus: (message) => {
          get().setStatusMessage(message)
        },
        onLog: (level, message) => get().appendLog(level, message),
      })
      const resolved =
        (await spy.getResolvedVersion()) ?? versionIdForPackFormat(pack.packFormat) ?? '1.21.11'
      set((s) => {
        s.resolvedVersion = resolved
      })
      void loadCommandTree(resolved)
      void get().loadRegistries(resolved)
      void fetchReleaseVersions().then((versions) => {
        set((s) => {
          s.versions = versions
        })
      })
      const features = await import('@/spyglass/monaco')
      if (!providersRegistered) {
        features.registerSpyglassFeatures()
        providersRegistered = true
      }
      startWatching(provider, (paths) => {
        void get().refreshTree(paths)
      })
      void get().loadRecentFolders()
      void get().refreshGit()
    },

    closeFolder: () => {
      if (
        get().openFiles.some((file) => file.dirty) &&
        typeof window !== 'undefined' &&
        !window.confirm(t('confirm.dirtyCloseFolder'))
      ) {
        return
      }
      stopWatching()
      disposeAllModels()
      void loadSpyglass().then((m) => m.resetSpyglass())
      set((s) => {
        s.rootName = null
        s.tree = []
        s.pack = emptyPack
        s.expanded = {}
        s.openFiles = []
        s.activePath = null
        s.diagnostics = {}
        s.statusMessage = t('status.workspaceClosed')
      })
    },

    refreshTree: async (paths) => {
      if (!get().rootName) return
      const provider = getProvider()
      const tree = await provider.readTree()
      const pack = await detectPackInfo(tree, async (path) =>
        new TextDecoder().decode(await provider.readFile(path)),
      )
      set((s) => {
        s.tree = tree
        s.pack = pack
        s.statusMessage = t('status.refreshed')
      })
      void loadSpyglass().then((m) => m.refreshProject(paths))
      void get().refreshGit()
    },

    toggleDirectory: (path) => {
      set((s) => {
        s.expanded[path] = !s.expanded[path]
      })
    },

    openFile: async (node, options) => {
      if (node.kind !== 'file') return
      if (isBinaryPath(node.path)) {
        set((s) => {
          s.statusMessage = t('status.binaryFile', { name: node.name })
        })
        return
      }
      const preview = options?.preview ?? false
      const existing = get().openFiles.find((f) => f.path === node.path)
      if (existing) {
        set((s) => {
          s.activePath = node.path
          s.gitDiff = null
          if (!preview) pinTab(s.openFiles, node.path)
        })
        return
      }
      const content = new TextDecoder().decode(await getProvider().readFile(node.path))
      const file: OpenFile = {
        path: node.path,
        name: node.name,
        language: languageForPath(node.path),
        savedContent: content,
        dirty: false,
        preview,
      }
      const replaced: { path: string | null } = { path: null }
      set((s) => {
        const target = upsertTab(s.openFiles, node.path, preview, () => file)
        if (target) {
          replaced.path = target.path
          delete s.diagnostics[target.path]
        }
        s.activePath = node.path
        s.gitDiff = null
      })
      if (replaced.path) {
        const replacedPath = replaced.path
        void loadSpyglass().then((m) => m.closeDocument(replacedPath))
        disposeModel(replacedPath)
      }
      await (await loadSpyglass()).openDocument(file.path, file.language, content)
    },

    closeFile: (path) => {
      const file = get().openFiles.find((f) => f.path === path)
      if (
        file?.dirty &&
        typeof window !== 'undefined' &&
        !window.confirm(t('confirm.dirtyCloseFile', { name: file.name }))
      ) {
        return
      }
      void loadSpyglass().then((m) => m.closeDocument(path))
      disposeModel(path)
      set((s) => {
        const index = s.openFiles.findIndex((f) => f.path === path)
        if (index === -1) return
        s.openFiles.splice(index, 1)
        delete s.diagnostics[path]
        if (s.activePath === path) {
          const next = s.openFiles[index] ?? s.openFiles[index - 1] ?? null
          s.activePath = next ? next.path : null
        }
      })
    },

    setActive: (path) => {
      set((s) => {
        s.activePath = path
        s.gitDiff = null
      })
    },

    setDirty: (path, dirty) => {
      set((s) => {
        const file = s.openFiles.find((f) => f.path === path)
        if (file) {
          file.dirty = dirty
          if (dirty) file.preview = false
        }
      })
    },

    save: async (path) => {
      if (isBinaryPath(path)) return
      const file = get().openFiles.find((f) => f.path === path)
      if (!file) return
      const model = getModel(path)
      const content = model ? model.getValue() : file.savedContent
      await getProvider().writeFile(path, content)
      if (model && model.getValue() !== content) {
        model.setValue(content)
      }
      set((s) => {
        const target = s.openFiles.find((f) => f.path === path)
        if (target) {
          target.savedContent = content
          target.dirty = false
        }
        s.statusMessage = t('status.saved', { name: fileName(path) })
      })
    },

    saveActive: async () => {
      const path = get().activePath
      if (path) await get().save(path)
    },

    applyRenameEdits: async (edits) => {
      const byPath = new Map<string, SpyTextEdit[]>()
      for (const edit of edits) {
        const list = byPath.get(edit.path)
        if (list) list.push(edit)
        else byPath.set(edit.path, [edit])
      }
      for (const [path, list] of byPath) {
        const model = getModel(path)
        if (model) {
          model.applyEdits(
            list.map((edit) => ({
              range: {
                startLineNumber: edit.range.startLine + 1,
                startColumn: edit.range.startChar + 1,
                endLineNumber: edit.range.endLine + 1,
                endColumn: edit.range.endChar + 1,
              },
              text: edit.text,
            })),
          )
          const file = get().openFiles.find((f) => f.path === path)
          if (file) get().setDirty(path, model.getValue() !== file.savedContent)
        } else {
          const current = new TextDecoder().decode(await getProvider().readFile(path))
          const updated = applyTextEdits(current, list)
          if (updated !== current) await getProvider().writeFile(path, updated)
        }
      }
      void loadSpyglass().then((m) => m.refreshProject())
    },

    createFileAt: async (path, content) => {
      await getProvider().writeFile(path, content)
      set((s) => {
        s.statusMessage = t('status.created', { name: fileName(path) })
      })
      await get().refreshTree()
      const node = findNode(get().tree, path)
      if (node && !isBinaryPath(path)) await get().openFile(node)
    },

    toggleSidebar: () => {
      set((s) => {
        s.sidebarVisible = !s.sidebarVisible
      })
    },

    togglePanel: () => {
      set((s) => {
        s.panelVisible = !s.panelVisible
      })
    },

    setSidebarWidth: (width) => {
      set((s) => {
        s.sidebarWidth = clampSidebar(width)
      })
    },

    setPanelHeight: (height) => {
      set((s) => {
        s.panelHeight = clampPanel(height, typeof window === 'undefined' ? 800 : window.innerHeight)
      })
    },

    persistLayout: () => {
      saveLayout({ sidebarWidth: get().sidebarWidth, panelHeight: get().panelHeight })
    },

    setActiveView: (view) => {
      set((s) => {
        s.activeView = view
        s.sidebarVisible = true
      })
    },

    loadRegistries: async (version) => {
      const data = await fetchRegistries(version)
      set((s) => {
        s.registries = data
      })
    },

    loadRecentFolders: async () => {
      const bridge = window.mccodeDesktop
      if (!bridge?.getRecentFolders) return
      try {
        const list = await bridge.getRecentFolders()
        set((s) => {
          s.recentFolders = list
        })
      } catch {
        // ignore
      }
    },

    setGameVersion: async (version) => {
      set((s) => {
        s.gameVersion = version
      })
      if (!get().rootName) return
      const spy = await loadSpyglass()
      spy.resetSpyglass()
      await spy.initSpyglass({
        gameVersion: version,
        onDiagnostics: (uri, diagnostics) =>
          handleDiagnostics(uri, diagnostics, (path, diags) => get().setDiagnostics(path, diags)),
        onStatus: (message) => {
          get().setStatusMessage(message)
        },
        onLog: (level, message) => get().appendLog(level, message),
      })
      for (const file of [...get().openFiles]) {
        const model = getModel(file.path)
        await spy.openDocument(
          file.path,
          file.language,
          model ? model.getValue() : file.savedContent,
        )
      }
      const resolved =
        (await spy.getResolvedVersion()) ?? versionIdForPackFormat(get().pack.packFormat) ?? version
      set((s) => {
        s.resolvedVersion = resolved
        s.diagnostics = {}
      })
      void loadCommandTree(resolved)
      void get().loadRegistries(resolved)
    },

    setPaletteVisible: (value) => {
      set((s) => {
        s.paletteVisible = value
      })
    },

    openSettings: () => {
      set((s) => {
        s.settingsVisible = true
      })
    },

    closeSettings: () => {
      set((s) => {
        s.settingsVisible = false
      })
    },

    updateSettings: (patch) => {
      set((s) => {
        if (patch.editor) s.settings.editor = { ...s.settings.editor, ...patch.editor }
        if (patch.ai) s.settings.ai = { ...s.settings.ai, ...patch.ai }
        if (patch.confirmDelete !== undefined) s.settings.confirmDelete = patch.confirmDelete
        if (patch.autoSave !== undefined) s.settings.autoSave = patch.autoSave
        if (patch.language !== undefined) s.settings.language = patch.language
      })
      saveSettings(get().settings)
    },

    importSettings: (next) => {
      set((s) => {
        s.settings = next
      })
      saveSettings(get().settings)
    },

    setStatusMessage: (message) => {
      set((s) => {
        s.statusMessage = message
      })
    },

    setAiStatus: (status, message = '') => {
      set((s) => {
        s.aiStatus = status
        s.aiMessage = message
      })
    },

    setCursor: (cursor) => {
      set((s) => {
        s.cursor = cursor
      })
    },

    setDiagnostics: (path, diagnostics) => {
      set((s) => {
        if (diagnostics.length === 0) delete s.diagnostics[path]
        else s.diagnostics[path] = diagnostics
      })
    },

    appendLog: (level, message) => {
      set((s) => {
        s.logs.push(`[${level}] ${message}`)
        if (s.logs.length > 500) s.logs.splice(0, s.logs.length - 500)
      })
    },

    openPrompt: (config) => {
      set((s) => {
        s.promptDialog = {
          title: config.title,
          value: config.value ?? '',
          hint: config.hint ?? '',
          confirmLabel: config.confirmLabel ?? '',
          onConfirm: config.onConfirm,
        }
      })
    },

    setPromptValue: (value) => {
      set((s) => {
        if (s.promptDialog) s.promptDialog.value = value
      })
    },

    closePrompt: () => {
      set((s) => {
        s.promptDialog = null
      })
    },

    confirmPrompt: () => {
      const dialog = get().promptDialog
      if (!dialog) return
      const value = dialog.value.trim()
      set((s) => {
        s.promptDialog = null
      })
      if (value) dialog.onConfirm(value)
    },

    openNewPackDialog: () => {
      set((s) => {
        s.newPackDialog = {
          namespace: 'mccode',
          packFormat: get().pack.packFormat ?? 94,
          description: 'My datapack',
        }
      })
    },

    closeNewPackDialog: () => {
      set((s) => {
        s.newPackDialog = null
      })
    },

    setNewPackField: (patch) => {
      set((s) => {
        if (s.newPackDialog) s.newPackDialog = { ...s.newPackDialog, ...patch }
      })
    },

    confirmNewPack: async () => {
      const dialog = get().newPackDialog
      if (!dialog) return
      const namespace = dialog.namespace.trim()
      if (!namespace) return
      if (
        get().pack.packFormat !== null &&
        typeof window !== 'undefined' &&
        !window.confirm(t('confirm.reinitPack'))
      ) {
        return
      }
      const provider = getProvider()
      try {
        const files = datapackFiles({
          namespace,
          packFormat: dialog.packFormat,
          description: dialog.description,
        })
        for (const [path, content] of Object.entries(files)) {
          await provider.writeFile(path, content)
        }
        for (const dir of datapackDirs(namespace)) {
          try {
            await provider.createDirectory(dir)
          } catch {
            // ignore
          }
        }
        set((s) => {
          s.newPackDialog = null
          s.statusMessage = t('status.initializedPack', { namespace })
        })
        await get().refreshTree()
      } catch (error) {
        set((s) => {
          s.newPackDialog = null
          s.statusMessage = t('status.initPackFailed', { error: String(error) })
        })
      }
    },
  })),
)
