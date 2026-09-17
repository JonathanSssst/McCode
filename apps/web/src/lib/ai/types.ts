export interface AiSettings {
  enabled: boolean
  maxTokens: number
  debounceMs: number
  temperature: number
  includeProjectContext: boolean
  maxContextFiles: number
  /** Empty means: use the env/default value. */
  baseUrl: string
  /** Empty means: use the env/default value. */
  model: string
}

export interface AiConfig extends AiSettings {
  apiKey: string
  baseUrl: string
  model: string
}

export type ChatRole = 'system' | 'user' | 'assistant'

export type AiStatus = 'off' | 'idle' | 'loading' | 'error'

export interface ChatMessage {
  role: ChatRole
  content: string
}

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: true,
  maxTokens: 128,
  debounceMs: 400,
  temperature: 0.2,
  includeProjectContext: true,
  maxContextFiles: 4,
  baseUrl: '',
  model: '',
}
