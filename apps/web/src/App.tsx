import { useEffect, useState } from 'react'
import { setLanguage, useT } from '@/i18n'
import { ActivityBar } from '@/components/ActivityBar'
import { CommandPalette } from '@/components/CommandPalette'
import { ContextMenu } from '@/components/ContextMenu'
import { DataBrowser } from '@/components/DataBrowser'
import { EditorPane } from '@/components/EditorPane'
import { EditorTabs } from '@/components/EditorTabs'
import { FileExplorer } from '@/components/FileExplorer'
import { InputDialog } from '@/components/InputDialog'
import { NewPackDialog } from '@/components/NewPackDialog'
import { OutlineView } from '@/components/OutlineView'
import { Panel } from '@/components/Panel'
import { SearchView } from '@/components/SearchView'
import { SettingsDialog } from '@/components/SettingsDialog'
import { Splitter } from '@/components/Splitter'
import { StatusBar } from '@/components/StatusBar'
import { WindowControls } from '@/components/WindowControls'
import { DEFAULT_LAYOUT } from '@/lib/layout'
import { useWorkspace } from '@/store/workspace'

function MenuBar() {
  const [open, setOpen] = useState<string | null>(null)
  const setPaletteVisible = useWorkspace((s) => s.setPaletteVisible)
  const rootName = useWorkspace((s) => s.rootName)
  const recentFolders = useWorkspace((s) => s.recentFolders)
  const bridge = window.mccodeDesktop
  const tr = useT()

  const menus: Record<string, { label: string; run: () => void }[]> = {
    [tr('menu.file')]: [
      { label: tr('menu.openFolder'), run: () => void useWorkspace.getState().openFolder() },
      { label: tr('menu.initDatapack'), run: () => useWorkspace.getState().openNewPackDialog() },
      ...recentFolders.map((folder) => ({
        label: tr('menu.openRecent', { path: folder }),
        run: () => void useWorkspace.getState().openFolder(folder),
      })),
      { label: tr('menu.save'), run: () => void useWorkspace.getState().saveActive() },
      { label: tr('menu.export'), run: () => void useWorkspace.getState().exportZip() },
      { label: tr('menu.closeFolder'), run: () => useWorkspace.getState().closeFolder() },
      ...(bridge ? [{ label: tr('menu.exit'), run: () => bridge.windowClose() }] : []),
    ],
    [tr('menu.view')]: [
      { label: tr('menu.toggleSidebar'), run: () => useWorkspace.getState().toggleSidebar() },
      { label: tr('menu.togglePanel'), run: () => useWorkspace.getState().togglePanel() },
      { label: tr('menu.settings'), run: () => useWorkspace.getState().openSettings() },
      { label: tr('menu.refresh'), run: () => void useWorkspace.getState().refreshTree() },
      ...(bridge?.windowReload
        ? [{ label: tr('menu.reload'), run: () => bridge.windowReload() }]
        : []),
      ...(bridge?.windowToggleDevTools
        ? [{ label: tr('menu.devtools'), run: () => bridge.windowToggleDevTools() }]
        : []),
    ],
    [tr('menu.help')]: [{ label: tr('menu.commandPalette'), run: () => setPaletteVisible(true) }],
  }

  return (
    <div className="relative flex h-[30px] select-none items-center gap-1 bg-[#323233] pl-2 text-[12px] text-vsc-fg [-webkit-app-region:drag]">
      <span className="mr-2 font-semibold text-white">MCCode</span>
      {Object.keys(menus).map((name) => (
        <div key={name} className="relative [-webkit-app-region:no-drag]">
          <button
            className={`rounded px-2 py-0.5 ${open === name ? 'bg-white/15' : 'hover:bg-white/10'}`}
            onClick={() => setOpen(open === name ? null : name)}
          >
            {name}
          </button>
          {open === name && (
            <div
              className="absolute left-0 top-full z-40 mt-0.5 min-w-[180px] rounded border border-[#454545] bg-[#252526] py-1 shadow-xl [-webkit-app-region:no-drag]"
              onMouseLeave={() => setOpen(null)}
            >
              {menus[name].map((item) => (
                <button
                  key={item.label}
                  className="block w-full px-3 py-1 text-left text-[13px] text-vsc-fg hover:bg-[#04395e] hover:text-white"
                  onClick={() => {
                    setOpen(null)
                    item.run()
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
      <span className="mx-auto text-vsc-fg-dim">{rootName ?? tr('status.untitled')}</span>
      <WindowControls />
    </div>
  )
}

export default function App() {
  const sidebarVisible = useWorkspace((s) => s.sidebarVisible)
  const panelVisible = useWorkspace((s) => s.panelVisible)
  const sidebarWidth = useWorkspace((s) => s.sidebarWidth)
  const panelHeight = useWorkspace((s) => s.panelHeight)
  const setSidebarWidth = useWorkspace((s) => s.setSidebarWidth)
  const setPanelHeight = useWorkspace((s) => s.setPanelHeight)
  const persistLayout = useWorkspace((s) => s.persistLayout)
  const activeView = useWorkspace((s) => s.activeView)
  const anyDirty = useWorkspace((s) => s.openFiles.some((file) => file.dirty))
  const language = useWorkspace((s) => s.settings.language)

  useEffect(() => {
    setLanguage(language)
  }, [language])

  useEffect(() => {
    void useWorkspace.getState().loadRecentFolders()
  }, [])

  useEffect(() => {
    const bridge = window.mccodeDesktop
    if (bridge?.setDirty) {
      bridge.setDirty(anyDirty)
      return
    }
    const handler = (event: BeforeUnloadEvent) => {
      if (!anyDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [anyDirty])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const key = e.key.toLowerCase()
      const inEditor = (e.target as HTMLElement | null)?.closest?.('.monaco-editor')
      if (e.shiftKey && key === 'p') {
        e.preventDefault()
        useWorkspace.getState().setPaletteVisible(true)
      } else if (key === 'p' && !e.shiftKey) {
        e.preventDefault()
        useWorkspace.getState().setPaletteVisible(true)
      } else if (key === 'b') {
        e.preventDefault()
        useWorkspace.getState().toggleSidebar()
      } else if (key === 'j') {
        e.preventDefault()
        useWorkspace.getState().togglePanel()
      } else if (key === ',') {
        e.preventDefault()
        useWorkspace.getState().openSettings()
      } else if (key === 's' && !inEditor) {
        e.preventDefault()
        void useWorkspace.getState().saveActive()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-vsc-bg text-[13px] text-vsc-fg">
      <MenuBar />
      <div className="flex min-h-0 flex-1">
        <ActivityBar />
        {sidebarVisible && (
          <>
            <div
              style={{ width: sidebarWidth }}
              className="flex shrink-0 flex-col overflow-hidden border-r border-vsc-border bg-vsc-bg-alt"
            >
              {activeView === 'data' ? (
                <DataBrowser />
              ) : activeView === 'search' ? (
                <SearchView />
              ) : activeView === 'outline' ? (
                <OutlineView />
              ) : (
                <FileExplorer />
              )}
            </div>
            <Splitter
              orientation="vertical"
              label="Resize Sidebar"
              onResize={(delta) => setSidebarWidth(sidebarWidth + delta)}
              onResizeEnd={persistLayout}
              onReset={() => {
                setSidebarWidth(DEFAULT_LAYOUT.sidebarWidth)
                persistLayout()
              }}
            />
          </>
        )}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <EditorTabs />
          <EditorPane />
          {panelVisible && (
            <>
              <Splitter
                orientation="horizontal"
                label="Resize Panel"
                onResize={(delta) => setPanelHeight(panelHeight - delta)}
                onResizeEnd={persistLayout}
                onReset={() => {
                  setPanelHeight(DEFAULT_LAYOUT.panelHeight)
                  persistLayout()
                }}
              />
              <Panel />
            </>
          )}
        </div>
      </div>
      <StatusBar />
      <CommandPalette />
      <InputDialog />
      <NewPackDialog />
      <ContextMenu />
      <SettingsDialog />
    </div>
  )
}
