import { getModel } from '@/monaco/models'
import { monaco } from '@/monaco/setup'
import { resolveCommandHover } from '@/mcdata/commandHover'
import { useWorkspace } from '@/store/workspace'
import {
  type SpyDiagnostic,
  type SpyRange,
  codeActionsAt,
  colorizeDocument,
  completeAt,
  definitionAt,
  documentSymbolsAt,
  formatDocument,
  hoverAt,
  prepareRenameAt,
  renameAt,
} from './client'

const COLOR_TYPES = [
  'comment',
  'enum',
  'enumMember',
  'escape',
  'function',
  'keyword',
  'modifier',
  'number',
  'property',
  'string',
  'struct',
  'type',
  'variable',
  'error',
  'literal',
  'operator',
  'resourceLocation',
  'vector',
] as const

const COLOR_MODIFIERS = [
  'declaration',
  'defaultLibrary',
  'definition',
  'deprecated',
  'documentation',
  'modification',
  'readonly',
] as const

const COMPLETION_KIND: Record<number, monaco.languages.CompletionItemKind> = {
  1: monaco.languages.CompletionItemKind.Text,
  2: monaco.languages.CompletionItemKind.Method,
  3: monaco.languages.CompletionItemKind.Function,
  4: monaco.languages.CompletionItemKind.Constructor,
  5: monaco.languages.CompletionItemKind.Field,
  6: monaco.languages.CompletionItemKind.Variable,
  7: monaco.languages.CompletionItemKind.Class,
  8: monaco.languages.CompletionItemKind.Interface,
  9: monaco.languages.CompletionItemKind.Module,
  10: monaco.languages.CompletionItemKind.Property,
  11: monaco.languages.CompletionItemKind.Unit,
  12: monaco.languages.CompletionItemKind.Value,
  13: monaco.languages.CompletionItemKind.Enum,
  14: monaco.languages.CompletionItemKind.Keyword,
  15: monaco.languages.CompletionItemKind.Snippet,
  16: monaco.languages.CompletionItemKind.Color,
  17: monaco.languages.CompletionItemKind.File,
  18: monaco.languages.CompletionItemKind.Reference,
  19: monaco.languages.CompletionItemKind.Folder,
  20: monaco.languages.CompletionItemKind.EnumMember,
  21: monaco.languages.CompletionItemKind.Constant,
  22: monaco.languages.CompletionItemKind.Struct,
  23: monaco.languages.CompletionItemKind.Event,
  24: monaco.languages.CompletionItemKind.Operator,
  25: monaco.languages.CompletionItemKind.TypeParameter,
}

function pathFromModel(model: monaco.editor.ITextModel): string {
  return model.uri.path.replace(/^\/+/, '')
}

function functionFilePath(id: string): string {
  const [namespace, path] = id.includes(':') ? id.split(':') : ['minecraft', id]
  return `data/${namespace}/function/${path}.mcfunction`
}

function toMonacoRange(range: SpyRange): monaco.IRange {
  return {
    startLineNumber: range.startLine + 1,
    startColumn: range.startChar + 1,
    endLineNumber: range.endLine + 1,
    endColumn: range.endChar + 1,
  }
}

export function applyDiagnosticsToPath(path: string, diagnostics: SpyDiagnostic[]): void {
  const model = getModel(path)
  if (!model) return
  monaco.editor.setModelMarkers(
    model,
    'spyglass',
    diagnostics.map((d) => ({
      ...toMonacoRange(d.range),
      message: d.message,
      severity: [1, 2, 4, 8][d.severity] ?? 8,
      code: d.suggestion,
    })),
  )
}

const PROVIDER_LANGUAGES = ['mcfunction', 'mcdoc', 'snbt']

export function registerSpyglassFeatures(): void {
  const selector = PROVIDER_LANGUAGES.map((language) => ({ language }))

  monaco.languages.registerCompletionItemProvider(selector, {
    triggerCharacters: [' ', ':', '[', '{', ',', '/', '.', '=', '@'],
    async provideCompletionItems(model, position, context) {
      const path = pathFromModel(model)
      const items = await completeAt(path, model.getValue(), position, context.triggerCharacter)
      const word = model.getWordUntilPosition(position)
      const fallbackRange = {
        startLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endLineNumber: position.lineNumber,
        endColumn: word.endColumn,
      }
      return {
        suggestions: items.map((item) => ({
          label: item.label,
          kind:
            item.kind !== undefined
              ? (COMPLETION_KIND[item.kind] ?? monaco.languages.CompletionItemKind.Text)
              : monaco.languages.CompletionItemKind.Text,
          detail: item.detail,
          documentation: item.documentation ? { value: item.documentation } : undefined,
          insertText: item.insertText ?? item.label,
          insertTextRules: item.insertText
            ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            : undefined,
          sortText: item.sortText,
          filterText: item.filterText,
          range: toMonacoRange(item.range) ?? fallbackRange,
        })),
      }
    },
  })

  monaco.languages.registerHoverProvider(selector, {
    async provideHover(model, position) {
      const hover = await hoverAt(pathFromModel(model), model.getValue(), position)
      if (hover) {
        return {
          contents: [{ value: hover.markdown }],
          range: toMonacoRange(hover.range),
        }
      }
      const line = model.getLineContent(position.lineNumber)
      const markdown = resolveCommandHover(line, position.column - 1)
      if (!markdown) return null
      return { contents: [{ value: markdown }] }
    },
  })

  monaco.languages.registerDefinitionProvider(selector, {
    async provideDefinition(model, position) {
      const path = pathFromModel(model)
      const locations = await definitionAt(path, model.getValue(), position)
      return locations.map((location) => ({
        uri: monaco.Uri.parse('mccode://workspace/' + location.path.replace(/^\/+/, '')),
        range: toMonacoRange(location.range),
      }))
    },
  })

  monaco.languages.registerRenameProvider(selector, {
    async resolveRenameLocation(model, position) {
      const range = await prepareRenameAt(pathFromModel(model), model.getValue(), position)
      if (!range) return null
      const monacoRange = toMonacoRange(range)
      return { range: monacoRange, text: model.getValueInRange(monacoRange) }
    },
    async provideRenameEdits(model, position, newName) {
      const path = pathFromModel(model)
      const edits = await renameAt(path, model.getValue(), position, newName)
      if (!edits || edits.length === 0) return null
      const other = edits.filter((edit) => edit.path !== path)
      const local = edits.filter((edit) => edit.path === path)
      if (other.length > 0) {
        await useWorkspace.getState().applyRenameEdits(other)
      }
      if (local.length === 0) return { edits: [] }
      const uri = monaco.Uri.parse('mccode://workspace/' + path.replace(/^\/+/, ''))
      return {
        edits: local.map((edit) => ({
          resource: uri,
          versionId: undefined,
          textEdit: { range: toMonacoRange(edit.range), text: edit.text },
        })),
      }
    },
  })

  monaco.languages.registerCodeActionProvider(selector, {
    async provideCodeActions(model, range) {
      const actions = await codeActionsAt(pathFromModel(model), model.getValue(), {
        startLine: range.startLineNumber - 1,
        startChar: range.startColumn - 1,
        endLine: range.endLineNumber - 1,
        endChar: range.endColumn - 1,
      })
      const uri = model.uri
      return {
        actions: actions.map((action) => ({
          title: action.title,
          kind: 'quickfix' as const,
          isPreferred: action.isPreferred,
          edit: {
            edits: action.edits.map((edit) => ({
              resource: uri,
              versionId: undefined,
              textEdit: { range: toMonacoRange(edit.range), text: edit.text },
            })),
          },
        })),
        dispose: () => {},
      }
    },
  })

  monaco.editor.registerCommand('mccode.createFunction', (_accessor, id: string) => {
    void useWorkspace.getState().createFileAt(functionFilePath(id), '')
  })

  monaco.languages.registerCodeActionProvider(selector, {
    provideCodeActions(model, range) {
      const markers = monaco.editor.getModelMarkers({ owner: 'spyglass', resource: model.uri })
      const actions = []
      for (const marker of markers) {
        const overlaps =
          marker.startLineNumber <= range.endLineNumber &&
          range.startLineNumber <= marker.endLineNumber
        if (!overlaps) continue
        const suggestion = typeof marker.code === 'string' ? marker.code : undefined
        if (suggestion) {
          actions.push({
            title: `是否想输入 “${suggestion}”?`,
            kind: 'quickfix' as const,
            isPreferred: true,
            edit: {
              edits: [
                {
                  resource: model.uri,
                  versionId: undefined,
                  textEdit: {
                    range: {
                      startLineNumber: marker.startLineNumber,
                      startColumn: marker.startColumn,
                      endLineNumber: marker.endLineNumber,
                      endColumn: marker.endColumn,
                    },
                    text: suggestion,
                  },
                },
              ],
            },
          })
        }
        const fnMatch = /Cannot find function [“"]([^”"]+)[”"]/.exec(marker.message)
        if (fnMatch) {
          actions.push({
            title: `创建函数 ${fnMatch[1]}`,
            kind: 'quickfix' as const,
            command: {
              id: 'mccode.createFunction',
              title: `创建函数 ${fnMatch[1]}`,
              arguments: [fnMatch[1]],
            },
          })
        }
      }
      return { actions, dispose: () => {} }
    },
  })

  monaco.languages.registerDocumentSymbolProvider(['mcfunction', 'mcdoc', 'snbt'], {
    async provideDocumentSymbols(model) {
      const symbols = await documentSymbolsAt(pathFromModel(model), model.getValue())
      return symbols.map((symbol) => ({
        name: symbol.name,
        detail: '',
        kind: symbol.kind as monaco.languages.SymbolKind,
        tags: [],
        range: toMonacoRange(symbol.range),
        selectionRange: toMonacoRange(symbol.selectionRange),
      }))
    },
  })

  monaco.languages.registerDocumentFormattingEditProvider('mcfunction', {
    async provideDocumentFormattingEdits(model, options) {
      const formatted = await formatDocument(
        pathFromModel(model),
        model.getValue(),
        options.tabSize,
        options.insertSpaces,
      )
      if (formatted === undefined || formatted === model.getValue()) return []
      return [{ range: model.getFullModelRange(), text: formatted }]
    },
  })

  const legend = {
    tokenTypes: [...COLOR_TYPES],
    tokenModifiers: [...COLOR_MODIFIERS],
  }

  monaco.languages.registerDocumentSemanticTokensProvider('mcfunction', {
    getLegend: () => legend,
    releaseDocumentSemanticTokens: () => {},
    async provideDocumentSemanticTokens(model) {
      const tokens = await colorizeDocument(pathFromModel(model), model.getValue())
      const sorted = [...tokens].sort((a, b) => a.start - b.start)
      const data: number[] = []
      let prevLine = 0
      let prevChar = 0
      let lastEnd = -1
      for (const token of sorted) {
        if (token.end <= token.start || token.start < lastEnd) continue
        const typeIndex = COLOR_TYPES.indexOf(token.type as (typeof COLOR_TYPES)[number])
        if (typeIndex < 0) continue
        let modifiers = 0
        for (const modifier of token.modifiers) {
          const index = COLOR_MODIFIERS.indexOf(modifier as (typeof COLOR_MODIFIERS)[number])
          if (index >= 0) modifiers |= 1 << index
        }
        const start = model.getPositionAt(token.start)
        const line = start.lineNumber - 1
        const char = start.column - 1
        const deltaLine = line - prevLine
        const deltaChar = deltaLine === 0 ? char - prevChar : char
        data.push(deltaLine, deltaChar, token.end - token.start, typeIndex, modifiers)
        prevLine = line
        prevChar = char
        lastEnd = token.end
      }
      return { data: new Uint32Array(data) }
    },
  })
}
