import { useEffect, useRef } from 'react'
import { useT } from '@/i18n'
import { useWorkspace } from '@/store/workspace'

export function NewPackDialog() {
  const dialog = useWorkspace((s) => s.newPackDialog)
  const setField = useWorkspace((s) => s.setNewPackField)
  const close = useWorkspace((s) => s.closeNewPackDialog)
  const confirm = useWorkspace((s) => s.confirmNewPack)
  const firstRef = useRef<HTMLInputElement>(null)
  const tr = useT()

  useEffect(() => {
    if (dialog) requestAnimationFrame(() => firstRef.current?.select())
  }, [dialog])

  if (!dialog) return null

  const inputClass =
    'w-full rounded border border-[#454545] bg-[#1e1e1e] px-2 py-1 text-[13px] text-vsc-fg outline-none'

  return (
    <div className="fixed inset-0 z-[70] flex justify-center bg-black/30 pt-[12vh]" onClick={close}>
      <div
        className="h-fit w-[520px] max-w-[90vw] rounded-md border border-[#454545] bg-[#252526] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 text-[13px] text-vsc-fg">{tr('newPack.title')}</div>
        <label className="mb-1 block text-[11px] text-vsc-fg-dim">{tr('newPack.namespace')}</label>
        <input
          ref={firstRef}
          value={dialog.namespace}
          spellCheck={false}
          onChange={(e) => setField({ namespace: e.target.value })}
          className={`${inputClass} mb-3 font-mono`}
        />
        <label className="mb-1 block text-[11px] text-vsc-fg-dim">{tr('newPack.packFormat')}</label>
        <input
          type="number"
          value={dialog.packFormat}
          onChange={(e) => setField({ packFormat: Number(e.target.value) })}
          className={`${inputClass} mb-3 w-24`}
        />
        <label className="mb-1 block text-[11px] text-vsc-fg-dim">
          {tr('newPack.description')}
        </label>
        <input
          value={dialog.description}
          onChange={(e) => setField({ description: e.target.value })}
          className={inputClass}
        />
        <div className="mt-4 flex justify-end gap-2 text-[12px]">
          <button className="rounded px-3 py-1 text-vsc-fg hover:bg-white/10" onClick={close}>
            {tr('common.cancel')}
          </button>
          <button
            className="rounded bg-vsc-accent px-3 py-1 text-white hover:brightness-110"
            onClick={() => void confirm()}
          >
            {tr('common.create')}
          </button>
        </div>
      </div>
    </div>
  )
}
