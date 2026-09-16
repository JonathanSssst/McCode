import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useT } from '@/i18n'
import { getProvider } from '@/lib/provider'
import type { SearchFileResult, SearchMatch } from '@/lib/search'
import { searchFiles } from '@/lib/search'
import { flattenFiles } from '@/lib/tree'
import { useWorkspace } from '@/store/workspace'

const HISTORY_KEY = 'mccode:searchHistory'
const ROW_HEIGHT = 18
const OVERSCAN = 8

type Row =
  | { kind: 'file'; path: string; count: number }
  | { kind: 'match'; path: string; match: SearchMatch }

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

function saveHistory(query: string): void {
  try {
    const next = [query, ...loadHistory().filter((item) => item !== query)].slice(0, 20)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

function Toggle({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean
  title: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`flex h-6 w-7 items-center justify-center rounded font-mono text-[12px] ${
        active ? 'bg-vsc-accent text-white' : 'bg-[#3c3c3c] text-vsc-fg-dim hover:text-vsc-fg'
      }`}
    >
      {children}
    </button>
  )
}

export function SearchView() {
  const tree = useWorkspace((s) => s.tree)
  const reveal = useWorkspace((s) => s.reveal)
  const applyEdits = useWorkspace((s) => s.applyRenameEdits)
  const [query, setQuery] = useState('')
  const [replace, setReplace] = useState('')
  const [include, setInclude] = useState('')
  const [exclude, setExclude] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [results, setResults] = useState<SearchFileResult[]>([])
  const [searching, setSearching] = useState(false)
  const [info, setInfo] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(600)
  const controllerRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const tr = useT()

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const update = () => setViewportHeight(el.clientHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = []
    for (const file of results) {
      out.push({ kind: 'file', path: file.path, count: file.matches.length })
      for (const match of file.matches) out.push({ kind: 'match', path: file.path, match })
    }
    return out
  }, [results])

  const totalHeight = rows.length * ROW_HEIGHT
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const end = Math.min(rows.length, start + Math.ceil(viewportHeight / ROW_HEIGHT) + OVERSCAN * 2)
  const visible = rows.slice(start, end)

  const run = async () => {
    const value = query.trim()
    if (!value) {
      setResults([])
      setInfo('')
      return
    }
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setSearching(true)
    setResults([])
    setInfo(tr('search.searching'))
    try {
      const paths = flattenFiles(tree).map((file) => file.path)
      const outcome = await searchFiles(
        getProvider(),
        paths,
        value,
        { caseSensitive, regex: useRegex },
        {
          signal: controller.signal,
          include: include.trim(),
          exclude: exclude.trim(),
          onProgress: (scanned, total, hits) => {
            if (scanned % 25 === 0) setInfo(tr('search.scanned', { scanned, total, hits }))
          },
        },
      )
      setResults(outcome.results)
      if (outcome.cancelled) {
        setInfo(tr('search.cancelled'))
      } else {
        const totalMatches = outcome.results.reduce((sum, item) => sum + item.matches.length, 0)
        setInfo(
          outcome.results.length > 0
            ? tr('search.matchSummary', {
                matches: totalMatches,
                files: outcome.results.length,
              }) + (outcome.truncated ? tr('search.truncated') : '')
            : tr('search.noResults'),
        )
        saveHistory(value)
        setHistory(loadHistory())
      }
    } catch {
      setInfo(tr('search.invalidRegex'))
    } finally {
      setSearching(false)
    }
  }

  const replaceAll = async () => {
    if (results.length === 0) return
    const edits = results.flatMap((file) =>
      file.matches.map((match) => ({
        path: file.path,
        range: {
          startLine: match.line - 1,
          startChar: match.column - 1,
          endLine: match.line - 1,
          endChar: match.endColumn - 1,
        },
        text: replace,
      })),
    )
    await applyEdits(edits)
    await run()
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-vsc-fg-dim">
        {tr('search.title')}
      </div>
      <div className="flex items-center gap-1 px-2 pb-1">
        <input
          value={query}
          spellCheck={false}
          list="mccode-search-history"
          placeholder={tr('search.placeholder')}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void run()
          }}
          className="min-w-0 flex-1 rounded bg-[#3c3c3c] px-2 py-1 text-[12px] text-vsc-fg outline-none placeholder:text-vsc-fg-dim"
        />
        <datalist id="mccode-search-history">
          {history.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
        <Toggle
          active={caseSensitive}
          title={tr('search.caseSensitive')}
          onClick={() => setCaseSensitive((v) => !v)}
        >
          Aa
        </Toggle>
        <Toggle active={useRegex} title={tr('search.regex')} onClick={() => setUseRegex((v) => !v)}>
          .*
        </Toggle>
        <Toggle
          active={showFilters}
          title={tr('search.filters')}
          onClick={() => setShowFilters((v) => !v)}
        >
          ≡
        </Toggle>
      </div>
      <div className="flex items-center gap-1 px-2 pb-1">
        <input
          value={replace}
          spellCheck={false}
          placeholder={tr('search.replacePlaceholder')}
          onChange={(e) => setReplace(e.target.value)}
          className="min-w-0 flex-1 rounded bg-[#3c3c3c] px-2 py-1 text-[12px] text-vsc-fg outline-none placeholder:text-vsc-fg-dim"
        />
        <button
          onClick={() => void replaceAll()}
          disabled={results.length === 0}
          className="rounded bg-vsc-accent px-2 py-1 text-[12px] text-white disabled:opacity-40"
          title={tr('search.replaceAllHint')}
        >
          {tr('search.replaceAll')}
        </button>
      </div>
      {showFilters && (
        <div className="flex flex-col gap-1 px-2 pb-1">
          <input
            value={include}
            spellCheck={false}
            placeholder={tr('search.includePlaceholder')}
            onChange={(e) => setInclude(e.target.value)}
            className="rounded bg-[#3c3c3c] px-2 py-1 text-[12px] text-vsc-fg outline-none placeholder:text-vsc-fg-dim"
          />
          <input
            value={exclude}
            spellCheck={false}
            placeholder={tr('search.excludePlaceholder')}
            onChange={(e) => setExclude(e.target.value)}
            className="rounded bg-[#3c3c3c] px-2 py-1 text-[12px] text-vsc-fg outline-none placeholder:text-vsc-fg-dim"
          />
        </div>
      )}
      <div className="flex items-center gap-2 px-3 pb-1 text-[11px] text-vsc-fg-dim">
        <span className="truncate">{info}</span>
        {searching && (
          <button
            className="shrink-0 text-vsc-fg hover:text-white"
            onClick={() => controllerRef.current?.abort()}
          >
            {tr('search.cancel')}
          </button>
        )}
      </div>
      <div
        ref={scrollRef}
        onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
        className="min-h-0 flex-1 overflow-auto pb-4"
      >
        {rows.length === 0 && !searching && info === '' && (
          <div className="px-3 py-2 text-[12px] text-vsc-fg-dim">{tr('search.hint')}</div>
        )}
        {rows.length > 0 && (
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ position: 'absolute', top: start * ROW_HEIGHT, left: 0, right: 0 }}>
              {visible.map((row, index) => {
                const absolute = start + index
                if (row.kind === 'file') {
                  return (
                    <div
                      key={`f-${row.path}`}
                      title={row.path}
                      className="flex h-[18px] items-center gap-2 truncate px-3 text-[12px] text-vsc-fg"
                    >
                      <span className="truncate">{row.path}</span>
                      <span className="text-vsc-fg-dim">{row.count}</span>
                    </div>
                  )
                }
                const match = row.match
                return (
                  <div
                    key={`m-${absolute}`}
                    title={`${row.path}:${match.line}:${match.column}`}
                    onClick={() =>
                      void reveal(row.path, {
                        startLine: match.line - 1,
                        startChar: match.column - 1,
                        endLine: match.line - 1,
                        endChar: match.endColumn - 1,
                      })
                    }
                    className="flex h-[18px] cursor-pointer items-center gap-2 whitespace-nowrap px-3 pl-6 font-mono text-[12px] text-vsc-fg-dim hover:bg-[#2a2d2e]"
                  >
                    <span className="shrink-0 text-[#6a9955]">
                      {match.line}:{match.column}
                    </span>
                    <span className="truncate text-vsc-fg">{match.text.trim()}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
