import { useWorkspace } from '@/store/workspace'
import { IconClose } from './icons'

export function EditorTabs() {
  const openFiles = useWorkspace((s) => s.openFiles)
  const activePath = useWorkspace((s) => s.activePath)
  const setActive = useWorkspace((s) => s.setActive)
  const closeFile = useWorkspace((s) => s.closeFile)

  if (openFiles.length === 0) return null

  return (
    <div className="flex h-[35px] shrink-0 items-stretch overflow-x-auto bg-vsc-bg-alt">
      {openFiles.map((file) => {
        const active = file.path === activePath
        return (
          <div
            key={file.path}
            onClick={() => setActive(file.path)}
            title={file.path}
            className={`group flex cursor-pointer items-center gap-2 border-r border-vsc-border px-3 text-[13px] ${
              active ? 'bg-vsc-bg text-white' : 'bg-vsc-bg-alt text-vsc-fg-dim hover:text-vsc-fg'
            }`}
          >
            <span className={`max-w-[160px] truncate ${file.preview ? 'italic' : ''}`}>
              {file.name}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeFile(file.path)
              }}
              className={`flex h-4 w-4 items-center justify-center rounded hover:bg-white/20 ${
                file.dirty ? '' : active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {file.dirty ? <span className="text-[15px] leading-none">●</span> : <IconClose />}
            </button>
          </div>
        )
      })}
    </div>
  )
}
