import { useEffect, useRef } from 'react'
import { useT } from '@/i18n'
import { languageForPath } from '@/lib/languages'
import { getOrCreateModel } from '@/monaco/models'
import { setActiveEditor } from '@/monaco/activeEditor'
import { monaco } from '@/monaco/setup'
import { useWorkspace } from '@/store/workspace'

export function EditorPane() {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const tr = useT()
  const activePath = useWorkspace((s) => s.activePath)
  const rootName = useWorkspace((s) => s.rootName)
  const editorSettings = useWorkspace((s) => s.settings.editor)

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return
    const initial = useWorkspace.getState().settings.editor
    const editor = monaco.editor.create(containerRef.current, {
      theme: initial.theme === 'light' ? 'mccode-light' : 'mccode-dark',
      automaticLayout: true,
      minimap: { enabled: initial.minimap },
      fontSize: initial.fontSize,
      fontFamily: initial.fontFamily,
      scrollBeyondLastLine: false,
      renderWhitespace: initial.renderWhitespace,
      smoothScrolling: initial.smoothScrolling,
      cursorBlinking: initial.cursorBlinking,
      tabSize: initial.tabSize,
      insertSpaces: initial.insertSpaces,
      fixedOverflowWidgets: true,
      roundedSelection: false,
      padding: { top: 6 },
    })
    editorRef.current = editor
    setActiveEditor(editor)

    editor.onDidChangeCursorPosition((e) => {
      const selection = editor.getSelection()
      const selectionLength =
        selection && !selection.isEmpty()
          ? (editor.getModel()?.getValueInRange(selection).length ?? 0)
          : 0
      useWorkspace.getState().setCursor({
        line: e.position.lineNumber,
        column: e.position.column,
        selectionLength,
      })
    })

    editor.addAction({
      id: 'mccode.saveFile',
      label: 'Save File',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        void useWorkspace.getState().saveActive()
      },
    })

    editor.onMouseDown((event) => {
      const mouse = event.event
      if (!(mouse.ctrlKey || mouse.metaKey) || !mouse.leftButton) return
      const position = event.target.position
      const path = useWorkspace.getState().activePath
      const model = editor.getModel()
      if (!position || !path || !model) return
      void import('@/spyglass/client').then(async (client) => {
        const locations = await client.definitionAt(path, model.getValue(), position)
        const target = locations.find((location) => location.path !== path)
        if (target) await useWorkspace.getState().reveal(target.path, target.range)
      })
    })

    return () => {
      editor.dispose()
      editorRef.current = null
      setActiveEditor(null)
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    monaco.editor.setTheme(editorSettings.theme === 'light' ? 'mccode-light' : 'mccode-dark')
    editor.updateOptions({
      fontSize: editorSettings.fontSize,
      fontFamily: editorSettings.fontFamily,
      tabSize: editorSettings.tabSize,
      insertSpaces: editorSettings.insertSpaces,
      wordWrap: editorSettings.wordWrap,
      minimap: { enabled: editorSettings.minimap },
      stickyScroll: { enabled: editorSettings.stickyScroll },
      renderWhitespace: editorSettings.renderWhitespace,
      cursorBlinking: editorSettings.cursorBlinking,
      smoothScrolling: editorSettings.smoothScrolling,
    })
  }, [editorSettings])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    if (!activePath) {
      editor.setModel(null)
      return
    }
    const file = useWorkspace.getState().openFiles.find((f) => f.path === activePath)
    if (!file) {
      editor.setModel(null)
      return
    }
    const model = getOrCreateModel(file.path, languageForPath(file.path), file.savedContent)
    editor.setModel(model)
    editor.focus()

    const stored = useWorkspace.getState().diagnostics[file.path]
    if (stored) {
      void import('@/spyglass/monaco').then((m) => m.applyDiagnosticsToPath(file.path, stored))
    }

    const pending = useWorkspace.getState().pendingReveal
    if (pending && pending.path === file.path) {
      const target = {
        startLineNumber: pending.range.startLine + 1,
        startColumn: pending.range.startChar + 1,
        endLineNumber: pending.range.endLine + 1,
        endColumn: pending.range.endChar + 1,
      }
      editor.setSelection(target)
      editor.revealRangeInCenter(target)
      useWorkspace.getState().clearPendingReveal()
    }

    const sub = model.onDidChangeContent(() => {
      const current = useWorkspace.getState().openFiles.find((f) => f.path === activePath)
      if (!current) return
      const value = model.getValue()
      useWorkspace.getState().setDirty(current.path, value !== current.savedContent)
      void import('@/spyglass/client').then((m) => m.scheduleDocumentSync(current.path, value))
      if (useWorkspace.getState().settings.autoSave === 'afterDelay') {
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
        autoSaveRef.current = setTimeout(() => {
          autoSaveRef.current = null
          void useWorkspace.getState().save(current.path)
        }, 1000)
      }
    })
    return () => {
      sub.dispose()
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current)
        autoSaveRef.current = null
      }
    }
  }, [activePath])

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={containerRef} className="absolute inset-0" />
      {!activePath && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-vsc-fg-dim">
          <div className="text-2xl font-light text-vsc-fg">MCCode</div>
          <div className="text-xs">
            {rootName ? tr('editor.selectFile') : tr('editor.openToStart')}
          </div>
          <div className="mt-6 space-y-1 text-center text-xs">
            <div>Ctrl+Shift+P — Command Palette</div>
            <div>Ctrl+P — Quick Open</div>
            <div>Ctrl+S — Save</div>
            <div>Ctrl+B — Toggle Sidebar</div>
          </div>
        </div>
      )}
    </div>
  )
}
