export interface SpyRange {
  startLine: number
  startChar: number
  endLine: number
  endChar: number
}

export interface SpyDiagnostic {
  message: string
  severity: number
  range: SpyRange
  suggestion?: string
}

export interface SpyCompletion {
  label: string
  kind?: number
  detail?: string
  documentation?: string
  insertText?: string
  sortText?: string
  filterText?: string
  deprecated?: boolean
  range: SpyRange
}

export interface SpyHover {
  markdown: string
  range: SpyRange
}

export interface SpyLocation {
  path: string
  range: SpyRange
}

export interface SpyEdit {
  path: string
  range: SpyRange
}

export interface SpyTextEdit extends SpyEdit {
  text: string
}

export interface SpyCodeAction {
  title: string
  isPreferred?: boolean
  edits: SpyTextEdit[]
}

export interface SpySymbol {
  name: string
  kind: number
  range: SpyRange
  selectionRange: SpyRange
}

export interface SpyColorToken {
  start: number
  end: number
  type: string
  modifiers: string[]
}
