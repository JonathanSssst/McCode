import { useEffect, useRef, type RefObject } from 'react'
import { useT } from '@/i18n'
import { useWorkspace } from '@/store/workspace'

function Dialog({
  title,
  value,
  onChange,
  onCancel,
  onConfirm,
  inputRef,
}: {
  title: string
  value: string
  onChange: (value: string) => void
  onCancel: () => void
  onConfirm: () => void
  inputRef: RefObject<HTMLInputElement>
}) {
  const tr = useT()
  return (
    <div
      className="fixed inset-0 z-[70] flex justify-center bg-black/30 pt-[12vh]"
      onClick={onCancel}
    >
      <div
        className="h-fit w-[560px] max-w-[90vw] rounded-md border border-[#454545] bg-[#252526] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 truncate text-[13px] text-vsc-fg" title={title}>
          {title}
        </div>
        <input
          ref={inputRef}
          value={value}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCancel()
            else if (e.key === 'Enter') onConfirm()
          }}
          className="w-full rounded border border-[#454545] bg-[#1e1e1e] px-2 py-1 font-mono text-[13px] text-vsc-fg outline-none"
        />
        <div className="mt-3 flex justify-end gap-2 text-[12px]">
          <button className="rounded px-3 py-1 text-vsc-fg hover:bg-white/10" onClick={onCancel}>
            {tr('common.cancel')}
          </button>
          <button
            className="rounded bg-vsc-accent px-3 py-1 text-white hover:brightness-110"
            onClick={onConfirm}
          >
            {tr('common.ok')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function InputDialog() {
  const newFile = useWorkspace((s) => s.newFileDialog)
  const rename = useWorkspace((s) => s.renameDialog)
  const newFolder = useWorkspace((s) => s.newFolderDialog)
  const setPath = useWorkspace((s) => s.setNewFilePath)
  const closeNew = useWorkspace((s) => s.closeNewFileDialog)
  const confirmNew = useWorkspace((s) => s.confirmNewFile)
  const setRenameName = useWorkspace((s) => s.setRenameName)
  const closeRename = useWorkspace((s) => s.closeRenameDialog)
  const confirmRename = useWorkspace((s) => s.confirmRename)
  const setFolderPath = useWorkspace((s) => s.setNewFolderPath)
  const closeFolder = useWorkspace((s) => s.closeNewFolderDialog)
  const confirmFolder = useWorkspace((s) => s.confirmNewFolder)
  const inputRef = useRef<HTMLInputElement>(null)
  const tr = useT()

  const active = Boolean(newFile) || Boolean(rename) || Boolean(newFolder)

  useEffect(() => {
    if (active) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [active])

  if (newFile) {
    return (
      <Dialog
        title={tr('cmd.new', { kind: tr(`template.${newFile.kind}`) })}
        value={newFile.path}
        onChange={setPath}
        onCancel={closeNew}
        onConfirm={() => void confirmNew()}
        inputRef={inputRef}
      />
    )
  }

  if (newFolder) {
    return (
      <Dialog
        title={tr('dialog.newFolder')}
        value={newFolder.path}
        onChange={setFolderPath}
        onCancel={closeFolder}
        onConfirm={() => void confirmFolder()}
        inputRef={inputRef}
      />
    )
  }

  if (rename) {
    return (
      <Dialog
        title={tr('dialog.rename', { path: rename.path })}
        value={rename.name}
        onChange={setRenameName}
        onCancel={closeRename}
        onConfirm={() => void confirmRename()}
        inputRef={inputRef}
      />
    )
  }

  return null
}
