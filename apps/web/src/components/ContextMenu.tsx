import { useEffect } from 'react'
import { useWorkspace } from '@/store/workspace'

export function ContextMenu() {
  const menu = useWorkspace((s) => s.contextMenu)
  const close = useWorkspace((s) => s.closeContextMenu)

  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menu, close])

  if (!menu) return null

  const width = 200
  const itemHeight = 26
  const height = menu.items.length * itemHeight + 10
  const left = Math.min(menu.x, Math.max(8, window.innerWidth - width - 8))
  const top = Math.min(menu.y, Math.max(8, window.innerHeight - height - 8))

  return (
    <div
      className="fixed inset-0 z-[60]"
      onMouseDown={close}
      onContextMenu={(e) => {
        e.preventDefault()
        close()
      }}
    >
      <div
        className="absolute min-w-[200px] rounded border border-[#454545] bg-[#252526] py-1 shadow-2xl"
        style={{ left, top }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {menu.items.map((item, index) =>
          item.separator ? (
            <div key={index} className="my-1 border-t border-[#454545]" />
          ) : (
            <button
              key={index}
              className={`block w-full px-3 py-[3px] text-left text-[13px] hover:bg-[#04395e] hover:text-white ${
                item.danger ? 'text-[#f48771]' : 'text-vsc-fg'
              }`}
              onClick={() => {
                close()
                item.run?.()
              }}
            >
              {item.label}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
