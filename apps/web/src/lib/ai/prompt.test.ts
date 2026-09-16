import { describe, expect, it } from 'vitest'
import { buildMessages, type PromptInput } from './prompt'

const input: PromptInput = {
  language: 'mcfunction',
  path: 'data/mypack/function/main.mcfunction',
  prefix: 'say hello\n',
  suffix: '',
  namespace: 'mypack',
  packFormat: 94,
  gameVersion: '1.21.11',
  relatedFiles: [],
  maxLines: 6,
}

describe('buildMessages', () => {
  it('returns a system and a user message', () => {
    const messages = buildMessages(input)
    expect(messages.map((message) => message.role)).toEqual(['system', 'user'])
  })

  it('mentions the target version and pack format', () => {
    const [system] = buildMessages(input)
    expect(system.content).toContain('1.21.11')
    expect(system.content).toContain('94')
  })

  it('states the line limit', () => {
    const [system] = buildMessages(input)
    expect(system.content).toContain('at most 6 lines')
  })

  it('marks the cursor position', () => {
    const [, user] = buildMessages(input)
    expect(user.content).toContain('say hello\n<CURSOR>')
  })

  it('includes the namespace and related files', () => {
    const messages = buildMessages({
      ...input,
      relatedFiles: [{ path: 'data/mypack/function/helper.mcfunction', content: 'say helper' }],
    })
    const [, user] = messages
    expect(user.content).toContain('mypack')
    expect(user.content).toContain('helper.mcfunction')
    expect(user.content).toContain('say helper')
  })

  it('omits the related section when there are no files', () => {
    const [, user] = buildMessages(input)
    expect(user.content).not.toContain('Related project files')
  })

  it('falls back to latest when the version is auto', () => {
    const [system] = buildMessages({ ...input, gameVersion: 'auto' })
    expect(system.content).toContain('Minecraft latest')
  })
})
