import { COMMAND_NAMES_1_21_11, EXECUTE_SUBCOMMANDS } from './commandNames'

interface CommandTreeNode {
  type: string
  parser?: string
  children?: Record<string, CommandTreeNode>
}

interface CachedCommands {
  commands: string[]
  subcommands: string[]
}

const CACHE_PREFIX = 'mccode:commands:v1:'
const API_BASE = 'https://api.spyglassmc.com/mcje/versions/'

let currentVersion = '1.21.11'
let commandSet = new Set(COMMAND_NAMES_1_21_11.map((name) => name.toLowerCase()))
let subcommandSet = new Set(EXECUTE_SUBCOMMANDS.map((name) => name.toLowerCase()))

export function getCommandVersion(): string {
  return currentVersion
}

export function isKnownCommand(word: string): boolean {
  return commandSet.has(word.toLowerCase())
}

export function isKnownSubcommand(word: string): boolean {
  return subcommandSet.has(word.toLowerCase())
}

function readCache(version: string): CachedCommands | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + version)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as CachedCommands
    if (!Array.isArray(parsed.commands)) return undefined
    return parsed
  } catch {
    return undefined
  }
}

function writeCache(version: string, value: CachedCommands): void {
  try {
    localStorage.setItem(CACHE_PREFIX + version, JSON.stringify(value))
  } catch {
    // Ignore quota/availability errors; the in-memory set still works.
  }
}

function collectLiterals(node: CommandTreeNode, out: Set<string>): void {
  const children = node.children ?? {}
  for (const [name, child] of Object.entries(children)) {
    if (child.type === 'literal') out.add(name.toLowerCase())
    collectLiterals(child, out)
  }
}

function applySets(commands: Set<string>, subcommands: Set<string>, version: string): void {
  if (commands.size > 0) commandSet = commands
  if (subcommands.size > 0) subcommandSet = subcommands
  currentVersion = version
}

export async function loadCommandTree(version: string): Promise<void> {
  currentVersion = version

  const cached = readCache(version)
  if (cached) {
    applySets(
      new Set(cached.commands.map((s) => s.toLowerCase())),
      new Set((cached.subcommands ?? []).map((s) => s.toLowerCase())),
      version,
    )
    return
  }

  try {
    const response = await fetch(API_BASE + encodeURIComponent(version) + '/commands')
    if (!response.ok) return
    const tree = (await response.json()) as CommandTreeNode
    const commands = new Set<string>()
    const subcommands = new Set<string>()
    for (const [name, child] of Object.entries(tree.children ?? {})) {
      commands.add(name.toLowerCase())
      collectLiterals(child, subcommands)
    }
    if (commands.size === 0) return
    applySets(commands, subcommands, version)
    writeCache(version, { commands: [...commands], subcommands: [...subcommands] })
  } catch {
    // Keep the static fallback sets.
  }
}
