import { monaco } from './api'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import { mcfunctionLanguage } from './mcfunction'

let initialized = false

export function setupMonaco(): void {
  if (initialized) return
  initialized = true

  ;(self as unknown as { MonacoEnvironment: monaco.Environment }).MonacoEnvironment = {
    getWorker(_workerId: string, label: string): Worker {
      if (label === 'json') return new jsonWorker()
      return new editorWorker()
    },
  }

  monaco.languages.register({ id: 'mcfunction', extensions: ['.mcfunction'] })
  monaco.languages.setMonarchTokensProvider('mcfunction', mcfunctionLanguage)
  monaco.languages.setLanguageConfiguration('mcfunction', {
    comments: { lineComment: '#' },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  })

  monaco.languages.register({ id: 'mcdoc', extensions: ['.mcdoc'] })
  monaco.languages.register({ id: 'snbt', extensions: ['.snbt'] })

  monaco.editor.defineTheme('mccode-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'literal', foreground: '569CD6' },
      { token: 'enum', foreground: '4FC1FF' },
      { token: 'enumMember', foreground: '4FC1FF' },
      { token: 'escape', foreground: 'D7BA7D' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'modifier', foreground: '569CD6' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'property', foreground: '9CDCFE' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'struct', foreground: '4EC9B0' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'error', foreground: 'F44747' },
      { token: 'operator', foreground: 'D4D4D4' },
      { token: 'resourceLocation', foreground: '4EC9B0' },
      { token: 'vector', foreground: 'B5CEA8' },
      { token: 'type.identifier', foreground: '4EC9B0' },
      { token: 'identifier', foreground: '9CDCFE' },
      { token: 'delimiter', foreground: 'D4D4D4' },
    ],
    colors: {
      'editor.background': '#1e1e1e',
      'editor.foreground': '#d4d4d4',
      'editorLineNumber.foreground': '#858585',
      'editorLineNumber.activeForeground': '#c6c6c6',
      'editor.selectionBackground': '#264f78',
      'editor.lineHighlightBackground': '#2a2d2e',
      'editorCursor.foreground': '#aeafad',
      'editorIndentGuide.background1': '#404040',
      'editorGutter.background': '#1e1e1e',
      'minimap.background': '#1e1e1e',
      'editorWidget.background': '#252526',
      'editorWidget.border': '#454545',
      'editorSuggestWidget.background': '#252526',
      'editorSuggestWidget.selectedBackground': '#04395e',
    },
  })

  monaco.editor.defineTheme('mccode-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000' },
      { token: 'keyword', foreground: '0000FF' },
      { token: 'literal', foreground: '0000FF' },
      { token: 'enum', foreground: '0070C1' },
      { token: 'enumMember', foreground: '0070C1' },
      { token: 'escape', foreground: 'EE0000' },
      { token: 'function', foreground: '795E26' },
      { token: 'modifier', foreground: '0000FF' },
      { token: 'number', foreground: '098658' },
      { token: 'property', foreground: '001080' },
      { token: 'string', foreground: 'A31515' },
      { token: 'struct', foreground: '267F99' },
      { token: 'type', foreground: '267F99' },
      { token: 'variable', foreground: '001080' },
      { token: 'error', foreground: 'E51400' },
      { token: 'operator', foreground: '000000' },
      { token: 'resourceLocation', foreground: '267F99' },
      { token: 'vector', foreground: '098658' },
      { token: 'type.identifier', foreground: '267F99' },
      { token: 'identifier', foreground: '001080' },
      { token: 'delimiter', foreground: '000000' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#000000',
      'editorLineNumber.foreground': '#237893',
      'editorLineNumber.activeForeground': '#0b216f',
      'editor.selectionBackground': '#add6ff',
      'editor.lineHighlightBackground': '#f3f3f3',
      'editorCursor.foreground': '#000000',
      'editorIndentGuide.background1': '#d3d3d3',
      'editorGutter.background': '#ffffff',
      'minimap.background': '#ffffff',
      'editorWidget.background': '#f3f3f3',
      'editorWidget.border': '#c8c8c8',
      'editorSuggestWidget.background': '#f3f3f3',
      'editorSuggestWidget.selectedBackground': '#0060c0',
    },
  })
}

export { monaco }
