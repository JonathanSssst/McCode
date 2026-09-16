import type { AiConfig, AiSettings } from './types'

export const DEFAULT_BASE_URL = 'https://api.deepseek.com'
export const DEFAULT_MODEL = 'deepseek-chat'

export interface AiEnv {
  VITE_DEEPSEEK_API_KEY?: string
  VITE_DEEPSEEK_BASE_URL?: string
  VITE_DEEPSEEK_MODEL?: string
}

export function buildConfig(env: AiEnv, settings: AiSettings): AiConfig | null {
  const apiKey = (env.VITE_DEEPSEEK_API_KEY ?? '').trim()
  if (!apiKey) return null
  const baseUrl = (env.VITE_DEEPSEEK_BASE_URL ?? '').trim() || DEFAULT_BASE_URL
  const model = (env.VITE_DEEPSEEK_MODEL ?? '').trim() || DEFAULT_MODEL
  return {
    ...settings,
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ''),
    model,
  }
}

export function resolveConfig(settings: AiSettings): AiConfig | null {
  return buildConfig(import.meta.env, settings)
}

export function isConfigured(): boolean {
  return Boolean((import.meta.env.VITE_DEEPSEEK_API_KEY ?? '').trim())
}
