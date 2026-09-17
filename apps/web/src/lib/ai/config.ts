import type { AiConfig, AiSettings } from './types'

export const DEFAULT_BASE_URL = 'https://api.deepseek.com'
export const DEFAULT_MODEL = 'deepseek-chat'

export interface AiEnv {
  VITE_DEEPSEEK_API_KEY?: string
  VITE_DEEPSEEK_BASE_URL?: string
  VITE_DEEPSEEK_MODEL?: string
}

export function buildConfig(env: AiEnv, settings: AiSettings): AiConfig {
  const baseUrl = (settings.baseUrl || env.VITE_DEEPSEEK_BASE_URL || DEFAULT_BASE_URL)
    .trim()
    .replace(/\/+$/, '')
  const model = (settings.model || env.VITE_DEEPSEEK_MODEL || DEFAULT_MODEL).trim() || DEFAULT_MODEL
  return {
    ...settings,
    baseUrl,
    model,
    apiKey: (env.VITE_DEEPSEEK_API_KEY ?? '').trim(),
  }
}

export function resolveConfig(settings: AiSettings): AiConfig {
  return buildConfig(import.meta.env, settings)
}

/** Desktop bridge that proxies AI requests (the key stays in the main process). */
export function desktopAi(): MccodeDesktopBridge | undefined {
  const bridge = typeof window === 'undefined' ? undefined : window.mccodeDesktop
  return bridge?.aiComplete && bridge.aiStatus ? bridge : undefined
}

/** Web fallback: the key comes from the build-time env. */
export function envKeyConfigured(): boolean {
  return Boolean((import.meta.env.VITE_DEEPSEEK_API_KEY ?? '').trim())
}
