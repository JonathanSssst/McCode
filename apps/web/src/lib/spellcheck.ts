export function extractCandidates(message: string): string[] {
  const out: string[] = []
  const pattern = /[\u201C"]([^\u201D"]+)[\u201D"]/g
  let match: RegExpExecArray | null
  while ((match = pattern.exec(message)) !== null) out.push(match[1])
  return out
}

export function editDistance(a: string, b: string): number {
  const al = a.length
  const bl = b.length
  if (al === 0) return bl
  if (bl === 0) return al
  let prev = new Array<number>(bl + 1)
  for (let j = 0; j <= bl; j += 1) prev[j] = j
  for (let i = 1; i <= al; i += 1) {
    const cur = new Array<number>(bl + 1)
    cur[0] = i
    for (let j = 1; j <= bl; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    prev = cur
  }
  return prev[bl]
}

function thresholdFor(length: number): number {
  if (length <= 2) return 0
  if (length <= 4) return 1
  return 2
}

export function suggestFromMessage(message: string, token: string): string | undefined {
  const word = token.trim()
  if (!word || !/^[A-Za-z0-9_:-]+$/.test(word)) return undefined
  const lower = word.toLowerCase()
  const candidates = extractCandidates(message)
  if (candidates.length === 0) return undefined
  let best: string | undefined
  let bestDistance = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    if (candidate.toLowerCase() === lower) continue
    const distance = editDistance(lower, candidate.toLowerCase())
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  }
  const limit = thresholdFor(word.length)
  if (best && bestDistance > 0 && bestDistance <= limit) return best
  return undefined
}

export interface RangeLike {
  startLine: number
  startChar: number
  endLine: number
  endChar: number
}

export interface DiagnosticLike {
  message: string
  range: RangeLike
  suggestion?: string
}

export interface TextModelLike {
  getValue(): string
  getOffsetAt(position: { lineNumber: number; column: number }): number
}

export function enrichDiagnostics<T extends DiagnosticLike>(
  model: TextModelLike | null | undefined,
  diagnostics: T[],
): T[] {
  if (!model) return diagnostics
  let text: string
  try {
    text = model.getValue()
  } catch {
    return diagnostics
  }
  return diagnostics.map((diagnostic) => {
    if (diagnostic.suggestion) return diagnostic
    try {
      const start = model.getOffsetAt({
        lineNumber: diagnostic.range.startLine + 1,
        column: diagnostic.range.startChar + 1,
      })
      const end = model.getOffsetAt({
        lineNumber: diagnostic.range.endLine + 1,
        column: diagnostic.range.endChar + 1,
      })
      const suggestion = suggestFromMessage(diagnostic.message, text.slice(start, end))
      return suggestion ? { ...diagnostic, suggestion } : diagnostic
    } catch {
      return diagnostic
    }
  })
}
