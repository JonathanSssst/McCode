export function stripCodeFences(text: string): string {
  const trimmed = text.trim()
  const fenced = /^```[a-zA-Z0-9_-]*\r?\n([\s\S]*?)\r?\n?```$/.exec(trimmed)
  return fenced ? fenced[1].trim() : trimmed
}

const PROSE_LINE = /^(here|note|sure|certainly|the following|this|i |explanation|we )/i

export function cleanCompletion(
  raw: string,
  language: string,
  options: { maxLines?: number; currentLinePrefix?: string } = {},
): string {
  const maxLines = options.maxLines ?? 8
  let lines = stripCodeFences(raw).split(/\r?\n/)
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop()

  const prefix = options.currentLinePrefix?.trim()
  if (prefix && lines.length > 1 && lines[0].trim() === prefix) lines = lines.slice(1)

  lines = lines.filter((line) => !line.includes('```'))
  if (language === 'mcfunction') {
    lines = lines.filter((line) => {
      const trimmed = line.trim()
      return trimmed === '' || trimmed.startsWith('#') || !PROSE_LINE.test(trimmed)
    })
  }
  if (lines.length > maxLines) lines = lines.slice(0, maxLines)
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop()
  return lines.join('\n')
}
