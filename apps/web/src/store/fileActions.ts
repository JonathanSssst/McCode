import { fileName } from '@/lib/languages'
import { versionIdForPackFormat } from '@/lib/pack'
import { getProvider } from '@/lib/provider'
import { TEMPLATES, detectNamespace } from '@/lib/templates'
import { findNode, flattenFiles } from '@/lib/tree'
import { buildWorkspaceZip, buildZipName, downloadZip } from '@/lib/zip'
import { uniqueChildName } from './helpers'
import type { WorkspaceState } from './workspace'

type ImmerSet = (recipe: (draft: WorkspaceState) => void) => void
type ImmerGet = () => WorkspaceState

export type FileActions = Pick<
  WorkspaceState,
  | 'openNewFileDialog'
  | 'closeNewFileDialog'
  | 'setNewFilePath'
  | 'confirmNewFile'
  | 'openRenameDialog'
  | 'closeRenameDialog'
  | 'setRenameName'
  | 'confirmRename'
  | 'openNewFolderDialog'
  | 'closeNewFolderDialog'
  | 'setNewFolderPath'
  | 'confirmNewFolder'
  | 'copyEntry'
  | 'pasteEntry'
  | 'deleteEntry'
  | 'revealEntry'
  | 'copyPath'
  | 'openContextMenu'
  | 'closeContextMenu'
  | 'exportZip'
  | 'reveal'
  | 'clearPendingReveal'
>

export const createFileActions = (set: ImmerSet, get: ImmerGet): FileActions => ({
  openNewFileDialog: (kind) => {
    const namespace = detectNamespace(flattenFiles(get().tree).map((node) => node.path))
    set((s) => {
      s.newFileDialog = { kind, path: TEMPLATES[kind].defaultPath(namespace) }
    })
  },

  closeNewFileDialog: () => {
    set((s) => {
      s.newFileDialog = null
    })
  },

  setNewFilePath: (path) => {
    set((s) => {
      if (s.newFileDialog) s.newFileDialog.path = path
    })
  },

  confirmNewFile: async () => {
    const dialog = get().newFileDialog
    if (!dialog) return
    const path = dialog.path.trim().replace(/^\/+/, '')
    if (!path) return
    await getProvider().writeFile(path, TEMPLATES[dialog.kind].content)
    set((s) => {
      s.newFileDialog = null
      s.statusMessage = `Created ${fileName(path)}`
    })
    await get().refreshTree()
    const node = findNode(get().tree, path)
    if (node) await get().openFile(node)
  },

  openRenameDialog: (path) => {
    set((s) => {
      s.renameDialog = { path, name: fileName(path) }
    })
  },

  closeRenameDialog: () => {
    set((s) => {
      s.renameDialog = null
    })
  },

  setRenameName: (name) => {
    set((s) => {
      if (s.renameDialog) s.renameDialog.name = name
    })
  },

  confirmRename: async () => {
    const dialog = get().renameDialog
    if (!dialog) return
    const newName = dialog.name.trim()
    if (!newName || newName === fileName(dialog.path)) {
      set((s) => {
        s.renameDialog = null
      })
      return
    }
    const oldPath = dialog.path
    try {
      await getProvider().rename(oldPath, newName)
      for (const file of [...get().openFiles]) {
        if (file.path === oldPath || file.path.startsWith(`${oldPath}/`)) get().closeFile(file.path)
      }
      set((s) => {
        s.renameDialog = null
        s.statusMessage = `Renamed to ${newName}`
      })
      await get().refreshTree()
    } catch (error) {
      set((s) => {
        s.renameDialog = null
        s.statusMessage = `Rename failed: ${String(error)}`
      })
    }
  },

  openNewFolderDialog: (basePath) => {
    set((s) => {
      s.newFolderDialog = { path: basePath ? `${basePath}/new_folder` : 'new_folder' }
    })
  },

  closeNewFolderDialog: () => {
    set((s) => {
      s.newFolderDialog = null
    })
  },

  setNewFolderPath: (path) => {
    set((s) => {
      if (s.newFolderDialog) s.newFolderDialog.path = path
    })
  },

  confirmNewFolder: async () => {
    const dialog = get().newFolderDialog
    if (!dialog) return
    const path = dialog.path.trim().replace(/^\/+/, '').replace(/\/+$/, '')
    if (!path) return
    try {
      await getProvider().createDirectory(path)
      set((s) => {
        s.newFolderDialog = null
        s.statusMessage = `Created ${path}`
      })
      await get().refreshTree()
    } catch (error) {
      set((s) => {
        s.newFolderDialog = null
        s.statusMessage = `Create folder failed: ${String(error)}`
      })
    }
  },

  copyEntry: (path) => {
    set((s) => {
      s.fileClipboard = { path }
      s.statusMessage = `Copied ${fileName(path)}`
    })
  },

  pasteEntry: async (targetDir) => {
    const clip = get().fileClipboard
    if (!clip) return
    const source = findNode(get().tree, clip.path)
    if (!source) return
    const dir = targetDir.replace(/\/+$/, '')
    const children = dir === '' ? get().tree : (findNode(get().tree, dir)?.children ?? [])
    const name = uniqueChildName(new Set(children.map((n) => n.name)), fileName(clip.path))
    try {
      await getProvider().copy(clip.path, dir, name)
      set((s) => {
        s.statusMessage = `Pasted ${name}`
      })
      await get().refreshTree()
    } catch (error) {
      set((s) => {
        s.statusMessage = `Paste failed: ${String(error)}`
      })
    }
  },

  deleteEntry: async (path) => {
    const node = findNode(get().tree, path)
    if (!node) return
    if (
      get().settings.confirmDelete &&
      typeof window !== 'undefined' &&
      !window.confirm(`Delete ${fileName(path)}?`)
    ) {
      return
    }
    try {
      await getProvider().remove(path, node.kind === 'directory')
      for (const file of [...get().openFiles]) {
        if (file.path === path || file.path.startsWith(`${path}/`)) get().closeFile(file.path)
      }
      set((s) => {
        s.statusMessage = `Deleted ${fileName(path)}`
      })
      await get().refreshTree()
    } catch (error) {
      set((s) => {
        s.statusMessage = `Delete failed: ${String(error)}`
      })
    }
  },

  revealEntry: async (path) => {
    try {
      await getProvider().reveal(path)
    } catch (error) {
      set((s) => {
        s.statusMessage = String(error)
      })
    }
  },

  copyPath: async (path) => {
    try {
      await navigator.clipboard.writeText(path)
      set((s) => {
        s.statusMessage = `Copied path: ${path}`
      })
    } catch {
      set((s) => {
        s.statusMessage = `Path: ${path}`
      })
    }
  },

  openContextMenu: (x, y, items) => {
    set((s) => {
      s.contextMenu = { x, y, items }
    })
  },

  closeContextMenu: () => {
    set((s) => {
      s.contextMenu = null
    })
  },

  exportZip: async () => {
    const { tree, rootName, pack, resolvedVersion } = get()
    if (tree.length === 0) return
    set((s) => {
      s.statusMessage = 'Exporting…'
    })
    try {
      const mcVersion = resolvedVersion ?? versionIdForPackFormat(pack.packFormat)
      const name = buildZipName([
        rootName,
        mcVersion,
        pack.packFormat !== null ? `pack${pack.packFormat}` : null,
      ])
      const data = await buildWorkspaceZip(tree, (path) => getProvider().readFile(path))
      downloadZip(name, data)
      set((s) => {
        s.statusMessage = `Exported ${name}`
      })
    } catch (error) {
      set((s) => {
        s.statusMessage = `Export failed: ${String(error)}`
      })
    }
  },

  reveal: async (path, range) => {
    const node = findNode(get().tree, path)
    if (!node) return
    set((s) => {
      s.pendingReveal = { path, range }
    })
    await get().openFile(node)
  },

  clearPendingReveal: () => {
    set((s) => {
      s.pendingReveal = null
    })
  },
})
