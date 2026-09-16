import { describe, expect, it } from 'vitest'
import { pinTab, upsertTab } from './tabs'

interface Tab {
  path: string
  preview: boolean
}

const tab = (path: string, preview = false): Tab => ({ path, preview })

describe('upsertTab', () => {
  it('appends a pinned tab when none is open', () => {
    const files: Tab[] = []
    const replaced = upsertTab(files, 'a.mcfunction', false, () => tab('a.mcfunction'))
    expect(files).toEqual([tab('a.mcfunction', false)])
    expect(replaced).toBeNull()
  })

  it('appends a preview tab when no preview exists', () => {
    const files: Tab[] = [tab('a.mcfunction', false)]
    upsertTab(files, 'b.mcfunction', true, () => tab('b.mcfunction', true))
    expect(files).toEqual([tab('a.mcfunction', false), tab('b.mcfunction', true)])
  })

  it('replaces the existing preview tab in place', () => {
    const files: Tab[] = [tab('a.mcfunction', false), tab('b.mcfunction', true)]
    const replaced = upsertTab(files, 'c.mcfunction', true, () => tab('c.mcfunction', true))
    expect(files).toEqual([tab('a.mcfunction', false), tab('c.mcfunction', true)])
    expect(replaced?.path).toBe('b.mcfunction')
  })

  it('never replaces a pinned tab', () => {
    const files: Tab[] = [tab('a.mcfunction', false)]
    upsertTab(files, 'b.mcfunction', true, () => tab('b.mcfunction', true))
    expect(files[0]).toEqual(tab('a.mcfunction', false))
    expect(files).toHaveLength(2)
  })

  it('promotes an open preview tab to pinned when opened permanently', () => {
    const files: Tab[] = [tab('a.mcfunction', true)]
    const replaced = upsertTab(files, 'a.mcfunction', false, () => tab('a.mcfunction', false))
    expect(files).toEqual([tab('a.mcfunction', false)])
    expect(replaced).toBeNull()
  })

  it('does not duplicate an already open tab', () => {
    const files: Tab[] = [tab('a.mcfunction', false)]
    upsertTab(files, 'a.mcfunction', true, () => tab('a.mcfunction', true))
    expect(files).toEqual([tab('a.mcfunction', false)])
    expect(files).toHaveLength(1)
  })
})

describe('pinTab', () => {
  it('clears the preview flag', () => {
    const files: Tab[] = [tab('a.mcfunction', true)]
    pinTab(files, 'a.mcfunction')
    expect(files[0].preview).toBe(false)
  })

  it('ignores unknown paths', () => {
    const files: Tab[] = [tab('a.mcfunction', true)]
    pinTab(files, 'missing')
    expect(files[0].preview).toBe(true)
  })
})
