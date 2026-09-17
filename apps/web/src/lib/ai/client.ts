import { desktopAi } from './config'
import type { AiConfig, ChatMessage } from './types'

export class AiRequestError extends Error {}

export interface RequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : Boolean(
        error && typeof error === 'object' && (error as { name?: string }).name === 'AbortError',
      )
}

async function requestViaDesktop(
  bridge: MccodeDesktopBridge,
  config: AiConfig,
  messages: ChatMessage[],
  signal?: AbortSignal,
): Promise<string> {
  const id = `ai-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const abort = () => void bridge.aiCancel?.(id)
  if (signal) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
    signal.addEventListener('abort', abort, { once: true })
  }
  try {
    const result = await bridge.aiComplete!({
      id,
      baseUrl: config.baseUrl,
      model: config.model,
      messages,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    })
    if (!result.ok) throw new AiRequestError(result.error ?? 'AI request failed')
    return result.content ?? ''
  } finally {
    signal?.removeEventListener('abort', abort)
  }
}

export async function requestChatCompletion(
  config: AiConfig,
  messages: ChatMessage[],
  options: RequestOptions = {},
): Promise<string> {
  const bridge = desktopAi()
  if (bridge) return requestViaDesktop(bridge, config, messages, options.signal)

  const { signal, timeoutMs = 30000, fetchImpl = fetch } = options
  const controller = new AbortController()
  const abort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', abort, { once: true })
  }
  const timer = setTimeout(abort, timeoutMs)

  try {
    const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream: false,
      }),
      signal: controller.signal,
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      throw new AiRequestError(
        `AI request failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`,
      )
    }
    const data = (await response.json()) as {
      choices?: { message?: { content?: string | null } }[]
    }
    return data.choices?.[0]?.message?.content ?? ''
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abort)
  }
}
