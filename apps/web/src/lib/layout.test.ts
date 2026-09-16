import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LAYOUT,
  PANEL_MIN,
  SIDEBAR_MAX,
  SIDEBAR_MIN,
  clampPanel,
  clampSidebar,
  normalizeLayout,
} from './layout'

describe('clampSidebar', () => {
  it('keeps values inside the allowed range', () => {
    expect(clampSidebar(300)).toBe(300)
  })

  it('clamps below the minimum and above the maximum', () => {
    expect(clampSidebar(10)).toBe(SIDEBAR_MIN)
    expect(clampSidebar(9999)).toBe(SIDEBAR_MAX)
  })

  it('rounds fractional widths', () => {
    expect(clampSidebar(300.6)).toBe(301)
  })
})

describe('clampPanel', () => {
  it('keeps values inside the allowed range', () => {
    expect(clampPanel(200, 800)).toBe(200)
  })

  it('never goes below the minimum', () => {
    expect(clampPanel(5, 800)).toBe(PANEL_MIN)
  })

  it('caps at the viewport height minus the reserved space', () => {
    expect(clampPanel(5000, 800)).toBe(600)
  })

  it('falls back to the minimum when the viewport is tiny', () => {
    expect(clampPanel(300, 150)).toBe(PANEL_MIN)
  })
})

describe('normalizeLayout', () => {
  it('returns defaults for missing input', () => {
    expect(normalizeLayout(null, 800)).toEqual(DEFAULT_LAYOUT)
    expect(normalizeLayout(undefined, 800)).toEqual(DEFAULT_LAYOUT)
    expect(normalizeLayout({}, 800)).toEqual(DEFAULT_LAYOUT)
  })

  it('ignores non-numeric fields', () => {
    expect(normalizeLayout({ sidebarWidth: 'wide', panelHeight: null }, 800)).toEqual(
      DEFAULT_LAYOUT,
    )
  })

  it('clamps persisted values', () => {
    expect(normalizeLayout({ sidebarWidth: 5, panelHeight: 9999 }, 800)).toEqual({
      sidebarWidth: SIDEBAR_MIN,
      panelHeight: 600,
    })
  })
})
