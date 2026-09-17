import { useEffect, useRef } from 'react'
import { useT } from '@/i18n'
import { useWorkspace } from '@/store/workspace'

export function PromptDialog() {
  const dialog = useWorkspace((s) => s.promptDialog)
  const setValue = useWorkspace((s) => s.setPromptValue)
  const close = useWorkspace((s) => s.closePrompt)
  const confirm = useWorkspace((s) => s.confirmPrompt)
  const tr = useT()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (dialog) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [dialog])

  if (!dialog) return null

  return (
    <div className="fixed inset-0 z-[70] flex justify-center bg-black/30 pt-[12vh]" onClick={close}>
      <div
        className="h-fit w-[520px] max-w-[90vw] rounded-md border border-[#454545] bg-[#252526] p-4 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-2 truncate text-[13px] text-vsc-fg" title={dialog.title}>
          {dialog.title}
        </div>
        <input
          ref={inputRef}
          value={dialog.value}
          spellCheck={false}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') close()
            else if (event.key === 'Enter') confirm()
          }}
          className="w-full rounded border border-[#454545] bg-[#1e1e1e] px-2 py-1 font-mono text-[13px] text-vsc-fg outline-none"
        />
        {dialog.hint && <div className="mt-1 text-[11px] text-vsc-fg-dim">{dialog.hint}</div>}
        <div className="mt-3 flex justify-end gap-2 text-[12px]">
          <button className="rounded px-3 py-1 text-vsc-fg hover:bg-white/10" onClick={close}>
            {tr('common.cancel')}
          </button>
          <button
            className="rounded bg-vsc-accent px-3 py-1 text-white hover:brightness-110"
            onClick={confirm}
          >
            {dialog.confirmLabel || tr('common.ok')}
          </button>
        </div>
      </div>
    </div>
  )
}
