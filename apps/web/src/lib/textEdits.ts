export interface LineCharRange {
  startLine: number
  startChar: number
  endLine: number
  endChar: number
}

export interface LineCharEdit {
  range: LineCharRange
  text: string
}

function lineStarts(text: string): number[] {
  const starts = [0]
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '\n') starts.push(i + 1)
  }
  return starts
}

export function applyTextEdits(text: string, edits: LineCharEdit[]): string {
  if (edits.length === 0) return text
  const starts = lineStarts(text)
  const offsetAt = (line: number, char: number): number => {
    const base = starts[line] ?? text.length
    return Math.min(base + char, text.length)
  }
  const resolved = edits
    .map((edit) => ({
      start: offsetAt(edit.range.startLine, edit.range.startChar),
      end: offsetAt(edit.range.endLine, edit.range.endChar),
      text: edit.text,
    }))
    .filter((edit) => edit.end >= edit.start)
  resolved.sort((a, b) => b.start - a.start)
  let out = text
  for (const edit of resolved) {
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end)
  }
  return out
}
