import { useRef, type PointerEvent as ReactPointerEvent } from 'react'

export function Splitter({
  orientation,
  label,
  onResize,
  onResizeEnd,
  onReset,
}: {
  orientation: 'vertical' | 'horizontal'
  label?: string
  onResize: (delta: number) => void
  onResizeEnd?: () => void
  onReset?: () => void
}) {
  const dragging = useRef(false)
  const last = useRef(0)
  const vertical = orientation === 'vertical'

  const position = (event: ReactPointerEvent<HTMLDivElement>) =>
    vertical ? event.clientX : event.clientY

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    dragging.current = true
    last.current = position(event)
    event.currentTarget.setPointerCapture(event.pointerId)
    document.body.style.cursor = vertical ? 'col-resize' : 'row-resize'
    document.body.style.userSelect = 'none'
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const current = position(event)
    const delta = current - last.current
    if (delta === 0) return
    last.current = current
    onResize(delta)
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    dragging.current = false
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    onResizeEnd?.()
  }

  return (
    <div
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onReset}
      className={`shrink-0 transition-colors hover:bg-vsc-accent/60 ${
        vertical ? 'w-[4px] cursor-col-resize' : 'h-[4px] cursor-row-resize'
      }`}
    />
  )
}
