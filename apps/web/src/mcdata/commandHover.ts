import { COMMAND_DOCS } from './commandDocs.zh'
import { isKnownCommand, isKnownSubcommand } from './commands'
import { SELECTOR_ARG_DOCS, type Doc } from './selectorArgs.zh'
import { SUBCOMMAND_DOCS } from './subcommandDocs.zh'

interface WordInfo {
  text: string
  start: number
  end: number
}

function wordAt(line: string, col: number): WordInfo {
  let start = col
  let end = col
  while (start > 0 && /[A-Za-z0-9_-]/.test(line[start - 1])) start -= 1
  while (end < line.length && /[A-Za-z0-9_-]/.test(line[end])) end += 1
  return { text: line.slice(start, end), start, end }
}

function isInsideSelector(line: string, col: number): boolean {
  const at = line.lastIndexOf('@', col - 1)
  if (at === -1) return false
  const bracket = line.indexOf('[', at)
  if (bracket === -1 || bracket > col) return false
  const close = line.indexOf(']', bracket)
  return close === -1 || close > col
}

export function renderDoc(
  word: string,
  doc: Doc,
  kind: 'command' | 'subcommand' | 'selector',
): string {
  const label = kind === 'selector' ? '选择器参数' : kind === 'subcommand' ? '子命令' : '命令'
  const wiki =
    doc.wiki ?? (kind === 'command' ? `https://minecraft.wiki/w/Commands/${word}` : undefined)
  let markdown = `**${label}** \`${word}\`\n\n${doc.summary}`
  if (doc.syntax) markdown += `\n\n\`\`\`\n${doc.syntax}\n\`\`\``
  if (wiki) markdown += `\n\n[查看 Wiki](${wiki})`
  return markdown
}

export function resolveCommandHover(line: string, col: number): string | undefined {
  const info = wordAt(line, col)
  const word = info.text
  if (!word) return undefined
  const lower = word.toLowerCase()

  if (SELECTOR_ARG_DOCS[lower] && isInsideSelector(line, info.start)) {
    return renderDoc(lower, SELECTOR_ARG_DOCS[lower], 'selector')
  }

  const prefix = line
    .slice(0, info.end)
    .replace(/@[a-z_]+\[[^\]]*\]/gi, ' ')
    .replace(/@[a-z_]+/gi, ' ')
    .replace(/[a-z_][a-z0-9_]*:[a-z0-9_/.+-]+/gi, ' ')
  const tokens: string[] = prefix.match(/[A-Za-z_][A-Za-z0-9_-]*/g) ?? []
  if (tokens.length === 0) return undefined
  if (tokens[tokens.length - 1].toLowerCase() !== lower) tokens.push(word)

  let start = tokens.length - 1
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    if (isKnownCommand(tokens[i])) {
      start = i
      break
    }
  }
  const path = tokens.slice(start).map((token) => token.toLowerCase())

  for (let k = 0; k < path.length; k += 1) {
    const key = path.slice(k).join(' ')
    const doc = SUBCOMMAND_DOCS[key]
    if (doc) return renderDoc(key, doc, 'subcommand')
  }

  const curated = COMMAND_DOCS[lower]
  if (curated) return renderDoc(lower, curated, isKnownCommand(lower) ? 'command' : 'subcommand')

  const parent = path[0]
  if (isKnownCommand(parent) && path.length > 1) {
    return renderDoc(
      path[path.length - 1],
      { summary: `命令 ${parent} 的子命令。`, wiki: `https://minecraft.wiki/w/Commands/${parent}` },
      'subcommand',
    )
  }
  if (isKnownSubcommand(lower)) {
    return renderDoc(lower, { summary: '命令子命令。' }, 'subcommand')
  }
  return undefined
}
