export interface LayoutState {
  sidebarWidth: number
  panelHeight: number
}

export const DEFAULT_LAYOUT: LayoutState = {
  sidebarWidth: 240,
  panelHeight: 192,
}

export const SIDEBAR_MIN = 160
export const SIDEBAR_MAX = 640
export const PANEL_MIN = 80
const PANEL_BOTTOM_RESERVED = 200

const STORAGE_KEY = 'mccode:layout'

export function clampSidebar(width: number): number {
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(width)))
}

export function clampPanel(height: number, viewportHeight = 800): number {
  const max = Math.max(PANEL_MIN, Math.round(viewportHeight) - PANEL_BOTTOM_RESERVED)
  return Math.min(max, Math.max(PANEL_MIN, Math.round(height)))
}

export function normalizeLayout(raw: unknown, viewportHeight = 800): LayoutState {
  const value = (raw ?? {}) as Partial<LayoutState>
  const sidebar =
    typeof value.sidebarWidth === 'number' ? value.sidebarWidth : DEFAULT_LAYOUT.sidebarWidth
  const panel =
    typeof value.panelHeight === 'number' ? value.panelHeight : DEFAULT_LAYOUT.panelHeight
  return {
    sidebarWidth: clampSidebar(sidebar),
    panelHeight: clampPanel(panel, viewportHeight),
  }
}

function viewportHeight(): number {
  return typeof window === 'undefined' ? 800 : window.innerHeight
}

export function loadLayout(): LayoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return normalizeLayout(null, viewportHeight())
    return normalizeLayout(JSON.parse(raw), viewportHeight())
  } catch {
    return normalizeLayout(null, viewportHeight())
  }
}

export function saveLayout(layout: LayoutState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch {
    // ignore
  }
}
