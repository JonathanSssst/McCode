import { namespaceOf, selectRelatedPaths } from '@/lib/ai/context'
import { hashKey, LruCache } from '@/lib/ai/cache'
import { isAbortError, requestChatCompletion } from '@/lib/ai/client'
import { resolveConfig } from '@/lib/ai/config'
import { buildMessages, type RelatedFile } from '@/lib/ai/prompt'
import { cleanCompletion } from '@/lib/ai/validate'
import { getProvider } from '@/lib/provider'
import { flattenFiles } from '@/lib/tree'
import { useWorkspace } from '@/store/workspace'
import { monaco } from './api'
import { getModel } from './models'

const MAX_LINES = 6
const MAX_RELATED_FILE_BYTES = 20_000
const EMPTY: monaco.languages.InlineCompletions = { items: [] }
const cache = new LruCache<string>(60)

let registered = false

function pathOfModel(model: monaco.editor.ITextModel): string {
  return decodeURIComponent(model.uri.path).replace(/^\/+/, '')
}

function delay(ms: number, token: monaco.CancellationToken): Promise<void> {
  return new Promise((resolve) => {
    let sub: monaco.IDisposable | null = null
    const timer = setTimeout(() => {
      sub?.dispose()
      resolve()
    }, ms)
    sub = token.onCancellationRequested(() => {
      clearTimeout(timer)
      resolve()
    })
  })
}

async function loadRelatedFiles(activePath: string, limit: number): Promise<RelatedFile[]> {
  if (limit <= 0) return []
  const state = useWorkspace.getState()
  const paths = selectRelatedPaths(
    flattenFiles(state.tree).map((node) => node.path),
    activePath,
    limit,
  )
  const provider = getProvider()
  const files: RelatedFile[] = []
  for (const path of paths) {
    const model = getModel(path)
    if (model) {
      files.push({ path, content: model.getValue() })
      continue
    }
    try {
      const bytes = await provider.readFile(path)
      if (bytes.length > MAX_RELATED_FILE_BYTES) continue
      files.push({ path, content: new TextDecoder().decode(bytes) })
    } catch {
      // ignore unreadable files
    }
  }
  return files
}

const provider: monaco.languages.InlineCompletionsProvider = {
  async provideInlineCompletions(model, position, _context, token) {
    const state = useWorkspace.getState()
    const settings = state.settings.ai
    const config = settings.enabled ? resolveConfig(settings) : null
    if (!config) return EMPTY
    const language = model.getLanguageId()
    if (language !== 'mcfunction' && language !== 'json') return EMPTY

    const path = pathOfModel(model)
    const value = model.getValue()
    const offset = model.getOffsetAt(position)
    const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1)

    await delay(settings.debounceMs, token)
    if (token.isCancellationRequested) return EMPTY

    const relatedFiles = settings.includeProjectContext
      ? await loadRelatedFiles(path, settings.maxContextFiles)
      : []
    if (token.isCancellationRequested) return EMPTY

    const messages = buildMessages({
      language,
      path,
      prefix: value.slice(0, offset),
      suffix: value.slice(offset),
      namespace: namespaceOf(path),
      packFormat: state.pack.packFormat,
      gameVersion: state.resolvedVersion ?? state.gameVersion,
      relatedFiles,
      maxLines: MAX_LINES,
    })

    const key = hashKey(
      `${config.model}\u0000${messages.map((message) => `${message.role}:${message.content}`).join('\u0000')}`,
    )
    let raw = cache.get(key)
    if (raw === undefined) {
      const controller = new AbortController()
      const sub = token.onCancellationRequested(() => controller.abort())
      state.setAiStatus('loading')
      try {
        raw = await requestChatCompletion(config, messages, {
          signal: controller.signal,
          timeoutMs: 30_000,
        })
        cache.set(key, raw)
        state.setAiStatus('idle')
      } catch (error) {
        if (isAbortError(error) || token.isCancellationRequested) return EMPTY
        state.setAiStatus('error', error instanceof Error ? error.message : String(error))
        return EMPTY
      } finally {
        sub.dispose()
      }
    }
    if (token.isCancellationRequested) return EMPTY

    const insertText = cleanCompletion(raw, language, {
      maxLines: MAX_LINES,
      currentLinePrefix: linePrefix,
    })
    if (!insertText.trim()) return EMPTY

    return {
      items: [
        {
          insertText,
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column,
          ),
        },
      ],
    }
  },

  freeInlineCompletions() {
    // nothing to release
  },
}

export function registerAiCompletion(): void {
  if (registered) return
  registered = true
  monaco.languages.registerInlineCompletionsProvider('mcfunction', provider)
  monaco.languages.registerInlineCompletionsProvider('json', provider)
}
