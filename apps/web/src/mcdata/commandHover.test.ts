import { describe, expect, it } from 'vitest'
import { resolveCommandHover } from './commandHover'

function hover(line: string, word: string): string | undefined {
  return resolveCommandHover(line, line.indexOf(word) + 1)
}

describe('resolveCommandHover', () => {
  it('resolves top-level commands', () => {
    expect(hover('say hello', 'say')).toContain('命令')
    expect(hover('give @a minecraft:stone', 'give')).toContain('`give`')
  })

  it('resolves subcommand paths', () => {
    expect(hover('scoreboard objectives add obj dummy', 'add')).toContain(
      '`scoreboard objectives add`',
    )
    expect(hover('scoreboard objectives add obj dummy', 'objectives')).toContain(
      '`scoreboard objectives`',
    )
    expect(hover('team add red', 'add')).toContain('`team add`')
    expect(hover('tag @a add foo', 'add')).toContain('`tag add`')
    expect(hover('data get entity @a Health', 'get')).toContain('`data get`')
  })

  it('resolves commands after execute run', () => {
    expect(hover('execute as @a run give @s stone', 'give')).toContain('命令')
    expect(hover('execute as @a run give @s stone', 'give')).toContain('`give`')
  })

  it('resolves selector arguments', () => {
    expect(hover('@a[distance=..5]', 'distance')).toContain('选择器参数')
  })

  it('falls back for unknown subcommands', () => {
    const result = hover('team xyz', 'xyz')
    expect(result).toContain('子命令')
    expect(result).toContain('team')
  })

  it('returns undefined for non-commands', () => {
    expect(hover('minecraft:stone', 'stone')).toBeUndefined()
  })
})
