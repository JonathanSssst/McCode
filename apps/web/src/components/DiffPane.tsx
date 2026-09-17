import { useEffect, useRef } from 'react'
import { useT } from '@/i18n'
import { languageForPath } from '@/lib/languages'
import { findNode } from '@/lib/tree'
import { monaco } from '@/monaco/setup'
import { useWorkspace } from '@/store/workspace'

export function DiffPane() {
  const diff = useWorkspace((s) => s.gitDiff)
  const close = useWorkspace((s) => s.closeGitDiff)
  const openFile = useWorkspace((s) => s.openFile)
  const tree = useWorkspace((s) => s.tree)
  const editorSettings = useWorkspace((s) => s.settings.editor)
  const tr = useT()

  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneDiffEditor | null>(null)
  const modelsRef = useRef<{
    original: monaco.editor.ITextModel
    modified: monaco.editor.ITextModel
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current || editorRef.current) return
    const initial = useWorkspace.getState().settings.editor
    const editor = monaco.editor.createDiffEditor(containerRef.current, {
      readOnly: true,
      renderSideBySide: true,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderOverviewRuler: false,
      ignoreTrimWhitespace: false,
      padding: { top: 6 },
      fontSize: initial.fontSize,
      fontFamily: initial.fontFamily,
    })
    editorRef.current = editor
    return () => {
      editor.dispose()
      editorRef.current = null
      modelsRef.current?.original.dispose()
      modelsRef.current?.modified.dispose()
      modelsRef.current = null
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !diff || diff.loading) return
    const language = languageForPath(diff.path)
    const base = `mccode-diff://${encodeURIComponent(diff.path)}`
    const original = monaco.editor.createModel(
      diff.original,
      language,
      monaco.Uri.parse(`${base}/original`),
    )
    const modified = monaco.editor.createModel(
      diff.working,
      language,
      monaco.Uri.parse(`${base}/modified`),
    )
    const previous = modelsRef.current
    editor.setModel({ original, modified })
    modelsRef.current = { original, modified }
    previous?.original.dispose()
    previous?.modified.dispose()
  }, [diff])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.updateOptions({
      fontSize: editorSettings.fontSize,
      fontFamily: editorSettings.fontFamily,
    })
  }, [editorSettings])

  if (!diff) return null

  const open = () => {
    const node = findNode(tree, diff.path)
    if (node) void openFile(node, { preview: false })
  }

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-vsc-bg">
      <div className="flex h-[30px] shrink-0 items-center gap-2 border-b border-vsc-border px-3 text-[12px] text-vsc-fg">
        <span className="truncate" title={diff.path}>
          {diff.path}
        </span>
        <span className="shrink-0 text-[11px] text-vsc-fg-dim">HEAD ↔ {tr('scm.workingTree')}</span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          <button className="text-vsc-fg-dim hover:text-white" onClick={open}>
            {tr('scm.openFile')}
          </button>
          <button
            className="text-vsc-fg-dim hover:text-white"
            title={tr('scm.diffClose')}
            onClick={close}
          >
            ✕
          </button>
        </span>
      </div>
      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className="absolute inset-0" />
        {diff.loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-vsc-bg text-[12px] text-vsc-fg-dim">
            {tr('scm.diffLoading')}
          </div>
        )}
      </div>
    </div>
  )
}
