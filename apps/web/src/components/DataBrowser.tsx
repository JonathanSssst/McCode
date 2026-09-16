import { useMemo, useState } from 'react'
import { useT } from '@/i18n'
import { lengthen } from '@/mcdata/registries'
import { insertText } from '@/monaco/activeEditor'
import { useWorkspace } from '@/store/workspace'

const PREFERRED = [
  'block',
  'item',
  'entity_type',
  'particle_type',
  'sound_event',
  'mob_effect',
  'enchantment',
  'attribute',
  'game_event',
  'damage_type',
  'potion',
  'fluid',
  'menu',
  'instrument',
  'painting_variant',
  'trim_material',
  'trim_pattern',
  'jukebox_song',
  'banner_pattern',
  'cat_variant',
  'wolf_variant',
  'frog_variant',
  'villager_type',
  'villager_profession',
]

const MAX_ROWS = 400

export function DataBrowser() {
  const registries = useWorkspace((s) => s.registries)
  const [category, setCategory] = useState('block')
  const [query, setQuery] = useState('')
  const tr = useT()

  const categories = useMemo(() => {
    const keys = Object.keys(registries)
    const preferred = PREFERRED.filter((key) => keys.includes(key))
    const rest = keys.filter((key) => !PREFERRED.includes(key)).sort()
    return [...preferred, ...rest]
  }, [registries])

  const active = categories.includes(category) ? category : (categories[0] ?? '')

  const { entries, truncated } = useMemo(() => {
    const list = registries[active] ?? []
    const q = query.trim().toLowerCase()
    const mapped = list.map(lengthen)
    const filtered = q ? mapped.filter((id) => id.toLowerCase().includes(q)) : mapped
    return { entries: filtered.slice(0, MAX_ROWS), truncated: filtered.length > MAX_ROWS }
  }, [registries, active, query])

  if (categories.length === 0) {
    return <div className="p-3 text-[12px] text-vsc-fg-dim">{tr('data.loading')}</div>
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-vsc-fg-dim">
        {tr('data.title')}
      </div>
      <select
        value={active}
        onChange={(e) => setCategory(e.target.value)}
        className="mx-2 mb-1 rounded bg-[#3c3c3c] px-1 py-0.5 text-[12px] text-vsc-fg outline-none"
      >
        {categories.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={tr('data.searchPlaceholder')}
        spellCheck={false}
        className="mx-2 mb-1 rounded bg-[#3c3c3c] px-2 py-0.5 text-[12px] text-vsc-fg outline-none placeholder:text-vsc-fg-dim"
      />
      <div className="min-h-0 flex-1 overflow-auto pb-4">
        {entries.map((id) => (
          <div
            key={id}
            title={id}
            onClick={() => insertText(id)}
            className="cursor-pointer truncate px-3 py-[2px] text-[12px] text-vsc-fg hover:bg-[#2a2d2e]"
          >
            {id}
          </div>
        ))}
        {truncated && (
          <div className="px-3 py-1 text-[11px] text-vsc-fg-dim">
            {tr('data.truncated', { max: MAX_ROWS })}
          </div>
        )}
        {entries.length === 0 && (
          <div className="px-3 py-1 text-[11px] text-vsc-fg-dim">{tr('data.noResults')}</div>
        )}
      </div>
    </div>
  )
}
