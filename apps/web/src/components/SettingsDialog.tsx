import type { ReactNode } from 'react'
import { useT } from '@/i18n'
import type { AppSettings } from '@/lib/settings'
import { useWorkspace } from '@/store/workspace'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-[#2b2b2b] px-5 py-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-vsc-fg-dim">
        {title}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[13px] text-vsc-fg">{label}</div>
        {hint && <div className="text-[11px] text-vsc-fg-dim">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

const inputClass =
  'rounded border border-[#454545] bg-[#1e1e1e] px-2 py-1 text-[12px] text-vsc-fg outline-none'

export function SettingsDialog() {
  const visible = useWorkspace((s) => s.settingsVisible)
  const close = useWorkspace((s) => s.closeSettings)
  const settings = useWorkspace((s) => s.settings)
  const update = useWorkspace((s) => s.updateSettings)
  const versions = useWorkspace((s) => s.versions)
  const gameVersion = useWorkspace((s) => s.gameVersion)
  const setGameVersion = useWorkspace((s) => s.setGameVersion)
  const importSettings = useWorkspace((s) => s.importSettings)
  const tr = useT()

  const exportSettings = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'mccode-settings.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const importFromFile = (file: File) => {
    void file.text().then((text) => {
      try {
        const parsed = JSON.parse(text) as AppSettings
        if (parsed && typeof parsed === 'object') importSettings(parsed)
      } catch {
        // ignore malformed settings
      }
    })
  }

  if (!visible) return null
  const editor = settings.editor

  return (
    <div className="fixed inset-0 z-[70] flex justify-center bg-black/40 pt-[7vh]" onClick={close}>
      <div
        className="flex max-h-[82vh] w-[640px] max-w-[92vw] flex-col overflow-hidden rounded-md border border-[#454545] bg-[#252526] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#2b2b2b] px-5 py-3">
          <div className="text-[14px] font-semibold text-white">{tr('settings.title')}</div>
          <div className="flex items-center gap-2 text-[12px]">
            <button
              className="rounded px-2 py-1 text-vsc-fg hover:bg-white/10"
              onClick={exportSettings}
            >
              {tr('settings.export')}
            </button>
            <label className="cursor-pointer rounded px-2 py-1 text-vsc-fg hover:bg-white/10">
              {tr('settings.import')}
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) importFromFile(file)
                  e.target.value = ''
                }}
              />
            </label>
            <button
              className="text-vsc-fg-dim hover:text-white"
              onClick={close}
              title={tr('common.close')}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <Section title={tr('settings.general')}>
            <Row label={tr('settings.language')}>
              <select
                value={settings.language}
                onChange={(e) => update({ language: e.target.value as 'zh' | 'en' })}
                className={inputClass}
              >
                <option value="zh">中文</option>
                <option value="en">English</option>
              </select>
            </Row>
          </Section>

          <Section title={tr('settings.editor')}>
            <Row label={tr('settings.theme')}>
              <select
                value={editor.theme}
                onChange={(e) => update({ editor: { theme: e.target.value as 'dark' | 'light' } })}
                className={inputClass}
              >
                <option value="dark">dark</option>
                <option value="light">light</option>
              </select>
            </Row>
            <Row label={tr('settings.fontSize')}>
              <input
                type="number"
                min={8}
                max={30}
                value={editor.fontSize}
                onChange={(e) => update({ editor: { fontSize: Number(e.target.value) } })}
                className={`${inputClass} w-20`}
              />
            </Row>
            <Row label={tr('settings.fontFamily')}>
              <input
                value={editor.fontFamily}
                onChange={(e) => update({ editor: { fontFamily: e.target.value } })}
                className={`${inputClass} w-72 font-mono`}
              />
            </Row>
            <Row label={tr('settings.tabSize')}>
              <input
                type="number"
                min={1}
                max={8}
                value={editor.tabSize}
                onChange={(e) => update({ editor: { tabSize: Number(e.target.value) } })}
                className={`${inputClass} w-20`}
              />
            </Row>
            <Row label={tr('settings.insertSpaces')} hint={tr('settings.insertSpacesHint')}>
              <input
                type="checkbox"
                checked={editor.insertSpaces}
                onChange={(e) => update({ editor: { insertSpaces: e.target.checked } })}
              />
            </Row>
            <Row label={tr('settings.wordWrap')}>
              <select
                value={editor.wordWrap}
                onChange={(e) => update({ editor: { wordWrap: e.target.value as 'off' | 'on' } })}
                className={inputClass}
              >
                <option value="off">off</option>
                <option value="on">on</option>
              </select>
            </Row>
            <Row label={tr('settings.minimap')}>
              <input
                type="checkbox"
                checked={editor.minimap}
                onChange={(e) => update({ editor: { minimap: e.target.checked } })}
              />
            </Row>
            <Row label={tr('settings.stickyScroll')} hint={tr('settings.stickyScrollHint')}>
              <input
                type="checkbox"
                checked={editor.stickyScroll}
                onChange={(e) => update({ editor: { stickyScroll: e.target.checked } })}
              />
            </Row>
            <Row label={tr('settings.renderWhitespace')}>
              <select
                value={editor.renderWhitespace}
                onChange={(e) =>
                  update({
                    editor: { renderWhitespace: e.target.value as 'none' | 'selection' | 'all' },
                  })
                }
                className={inputClass}
              >
                <option value="none">none</option>
                <option value="selection">selection</option>
                <option value="all">all</option>
              </select>
            </Row>
            <Row label={tr('settings.cursorBlinking')}>
              <select
                value={editor.cursorBlinking}
                onChange={(e) =>
                  update({
                    editor: {
                      cursorBlinking: e.target.value as
                        'blink' | 'smooth' | 'phase' | 'expand' | 'solid',
                    },
                  })
                }
                className={inputClass}
              >
                {['blink', 'smooth', 'phase', 'expand', 'solid'].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </Row>
            <Row label={tr('settings.smoothScrolling')}>
              <input
                type="checkbox"
                checked={editor.smoothScrolling}
                onChange={(e) => update({ editor: { smoothScrolling: e.target.checked } })}
              />
            </Row>
          </Section>

          <Section title={tr('settings.files')}>
            <Row label={tr('settings.confirmDelete')} hint={tr('settings.confirmDeleteHint')}>
              <input
                type="checkbox"
                checked={settings.confirmDelete}
                onChange={(e) => update({ confirmDelete: e.target.checked })}
              />
            </Row>
            <Row label={tr('settings.autoSave')} hint={tr('settings.autoSaveHint')}>
              <select
                value={settings.autoSave}
                onChange={(e) => update({ autoSave: e.target.value as 'off' | 'afterDelay' })}
                className={inputClass}
              >
                <option value="off">off</option>
                <option value="afterDelay">afterDelay</option>
              </select>
            </Row>
          </Section>

          <Section title={tr('settings.minecraft')}>
            <Row label={tr('settings.gameVersion')} hint={tr('settings.gameVersionHint')}>
              <select
                value={gameVersion}
                onChange={(e) => void setGameVersion(e.target.value)}
                className={inputClass}
              >
                <option value="auto">auto</option>
                {versions.map((version) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </Row>
          </Section>
        </div>
      </div>
    </div>
  )
}
