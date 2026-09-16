import type * as monaco from 'monaco-editor'

let active: monaco.editor.IStandaloneCodeEditor | null = null

export function setActiveEditor(editor: monaco.editor.IStandaloneCodeEditor | null): void {
  active = editor
}

export function getActiveEditor(): monaco.editor.IStandaloneCodeEditor | null {
  return active
}

export function insertSnippet(snippet: string): void {
  const editor = active
  if (!editor) return
  editor.focus()
  const action = editor.getAction('editor.action.insertSnippet')
  if (action) {
    void action.run({ snippet })
    return
  }
  const plain = snippet
    .replace(/\$\{\d+:([^}]*)\}/g, '$1')
    .replace(/\$\{\d+\}/g, '')
    .replace(/\$\d+|\$0/g, '')
    .replace(/\\\$/g, '$')
  editor.trigger('mccode', 'type', { text: plain })
}

export function insertText(text: string): void {
  const editor = active
  if (!editor) return
  const selection = editor.getSelection()
  if (!selection) return
  editor.focus()
  editor.executeEdits('mccode', [{ range: selection, text }])
}
