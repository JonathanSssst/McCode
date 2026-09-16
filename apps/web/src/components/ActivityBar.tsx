import type { ReactNode } from 'react'
import { useT } from '@/i18n'
import { useWorkspace } from '@/store/workspace'
import {
  IconDatabase,
  IconExplorer,
  IconList,
  IconProblems,
  IconSearch,
  IconSettings,
} from './icons'

function ActivityButton({
  active,
  title,
  onClick,
  children,
}: {
  active?: boolean
  title: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`relative flex h-12 w-12 items-center justify-center text-vsc-fg-dim hover:text-white ${
        active ? 'text-white' : ''
      }`}
    >
      {active && <span className="absolute left-0 top-0 h-full w-0.5 bg-white" />}
      {children}
    </button>
  )
}

export function ActivityBar() {
  const sidebarVisible = useWorkspace((s) => s.sidebarVisible)
  const activeView = useWorkspace((s) => s.activeView)
  const toggleSidebar = useWorkspace((s) => s.toggleSidebar)
  const setActiveView = useWorkspace((s) => s.setActiveView)
  const openFolder = useWorkspace((s) => s.openFolder)
  const tr = useT()

  const clickView = (view: 'explorer' | 'data' | 'search' | 'outline') => {
    if (activeView === view && sidebarVisible) toggleSidebar()
    else setActiveView(view)
  }

  return (
    <div className="flex w-12 flex-col items-center bg-vsc-activity">
      <ActivityButton
        title={tr('activity.explorer')}
        active={activeView === 'explorer' && sidebarVisible}
        onClick={() => clickView('explorer')}
      >
        <IconExplorer />
      </ActivityButton>
      <ActivityButton
        title={tr('activity.data')}
        active={activeView === 'data' && sidebarVisible}
        onClick={() => clickView('data')}
      >
        <IconDatabase />
      </ActivityButton>
      <ActivityButton
        title={tr('activity.outline')}
        active={activeView === 'outline' && sidebarVisible}
        onClick={() => clickView('outline')}
      >
        <IconList />
      </ActivityButton>
      <ActivityButton
        title={tr('activity.search')}
        active={activeView === 'search' && sidebarVisible}
        onClick={() => clickView('search')}
      >
        <IconSearch />
      </ActivityButton>
      <ActivityButton
        title={tr('activity.problems')}
        onClick={() => useWorkspace.getState().togglePanel()}
      >
        <IconProblems />
      </ActivityButton>
      <div className="mt-auto flex flex-col items-center pb-2">
        <button
          title={tr('activity.settings')}
          onClick={() => useWorkspace.getState().openSettings()}
          className="flex h-10 w-10 items-center justify-center text-vsc-fg-dim hover:text-white"
        >
          <IconSettings />
        </button>
        <button
          title={tr('activity.openFolder')}
          onClick={() => void openFolder()}
          className="flex h-10 w-10 items-center justify-center text-lg text-vsc-fg-dim hover:text-white"
        >
          +
        </button>
      </div>
    </div>
  )
}
