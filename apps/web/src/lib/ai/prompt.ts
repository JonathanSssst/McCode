import { headWithin, tailWithin } from './context'
import type { ChatMessage } from './types'

const MAX_PREFIX_CHARS = 6000
const MAX_SUFFIX_CHARS = 1200
const MAX_RELATED_FILE_CHARS = 1500

export interface RelatedFile {
  path: string
  content: string
}

export interface PromptInput {
  language: string
  path: string
  prefix: string
  suffix: string
  namespace: string | null
  packFormat: number | null
  gameVersion: string
  relatedFiles: RelatedFile[]
  maxLines: number
}

function relatedSection(files: RelatedFile[]): string {
  if (files.length === 0) return ''
  const blocks = files.map(
    (file) => `### ${file.path}\n${headWithin(file.content, MAX_RELATED_FILE_CHARS).trimEnd()}`,
  )
  return `Related project files:\n\n${blocks.join('\n\n')}\n\n`
}

export function buildMessages(input: PromptInput): ChatMessage[] {
  const version = input.gameVersion === 'auto' ? 'latest' : input.gameVersion
  const pack = input.packFormat === null ? 'unknown' : String(input.packFormat)
  const system = [
    'You are an expert Minecraft Java Edition datapack developer embedded in a code editor.',
    `Target version: Minecraft ${version} (pack_format ${pack}).`,
    'Rules:',
    '- Reply with ONLY the text to insert at the cursor. No explanations, no markdown, no code fences.',
    `- One command per line and at most ${input.maxLines} lines.`,
    '- Use modern syntax (execute, data, scoreboard, function, macro functions with $(...)).',
    '- Only reference functions, tags and IDs that appear in the provided context.',
    '- If the cursor sits inside an unfinished command, finish that command instead of starting a new one.',
    '- Never repeat text that already appears before the cursor.',
  ].join('\n')

  const user = [
    `Project namespace: ${input.namespace ?? 'unknown'}`,
    '',
    relatedSection(input.relatedFiles),
    `Current file (${input.language}): ${input.path}`,
    '```',
    `${tailWithin(input.prefix, MAX_PREFIX_CHARS)}<CURSOR>${headWithin(input.suffix, MAX_SUFFIX_CHARS)}`,
    '```',
    '',
    'Continue the code at <CURSOR>.',
  ].join('\n')

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}
