import { useEffect, useState } from 'react'
import { useT } from '@/i18n'

function MinimizeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12">
      <rect x="1" y="5.75" width="10" height="1" fill="currentColor" />
    </svg>
  )
}

function MaximizeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
      <rect x="1.5" y="1.5" width="9" height="9" />
    </svg>
  )
}

function RestoreIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
      <rect x="1.5" y="3.5" width="7" height="7" />
      <path d="M3.5 3.5V1.5h7v7h-2" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor">
      <path d="m2 2 8 8M10 2l-8 8" />
    </svg>
  )
}

export function WindowControls() {
  const bridge = window.mccodeDesktop
  const [maximized, setMaximized] = useState(false)
  const tr = useT()

  useEffect(() => {
    if (!bridge?.windowIsMaximized) return
    void bridge.windowIsMaximized().then(setMaximized)
    return bridge.onWindowMaximized?.(setMaximized)
  }, [bridge])

  if (!bridge?.windowMinimize) return null

  const buttonClass =
    'flex h-full w-[46px] items-center justify-center text-vsc-fg [-webkit-app-region:no-drag]'

  return (
    <div className="ml-2 flex h-full items-stretch">
      <button
        className={`${buttonClass} hover:bg-white/10`}
        title={tr('window.minimize')}
        onClick={() => bridge.windowMinimize()}
      >
        <MinimizeIcon />
      </button>
      <button
        className={`${buttonClass} hover:bg-white/10`}
        title={maximized ? tr('window.restore') : tr('window.maximize')}
        onClick={() => bridge.windowToggleMaximize()}
      >
        {maximized ? <RestoreIcon /> : <MaximizeIcon />}
      </button>
      <button
        className={`${buttonClass} hover:bg-[#e81123] hover:text-white`}
        title={tr('window.close')}
        onClick={() => bridge.windowClose()}
      >
        <CloseIcon />
      </button>
    </div>
  )
}
