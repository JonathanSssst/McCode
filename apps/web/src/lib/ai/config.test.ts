import { describe, expect, it } from 'vitest'
import { DEFAULT_BASE_URL, DEFAULT_MODEL, buildConfig } from './config'
import { DEFAULT_AI_SETTINGS } from './types'

describe('buildConfig', () => {
  it('returns null without an API key', () => {
    expect(buildConfig({}, DEFAULT_AI_SETTINGS)).toBeNull()
    expect(buildConfig({ VITE_DEEPSEEK_API_KEY: '   ' }, DEFAULT_AI_SETTINGS)).toBeNull()
  })

  it('applies the default base URL and model', () => {
    const config = buildConfig({ VITE_DEEPSEEK_API_KEY: 'sk-test' }, DEFAULT_AI_SETTINGS)
    expect(config?.baseUrl).toBe(DEFAULT_BASE_URL)
    expect(config?.model).toBe(DEFAULT_MODEL)
  })

  it('honours env overrides and strips trailing slashes', () => {
    const config = buildConfig(
      {
        VITE_DEEPSEEK_API_KEY: 'sk-test',
        VITE_DEEPSEEK_BASE_URL: 'https://example.com/v1/',
        VITE_DEEPSEEK_MODEL: 'custom-model',
      },
      DEFAULT_AI_SETTINGS,
    )
    expect(config?.baseUrl).toBe('https://example.com/v1')
    expect(config?.model).toBe('custom-model')
  })

  it('carries the AI settings over', () => {
    const config = buildConfig(
      { VITE_DEEPSEEK_API_KEY: 'sk-test' },
      { ...DEFAULT_AI_SETTINGS, maxTokens: 512, temperature: 1 },
    )
    expect(config?.maxTokens).toBe(512)
    expect(config?.temperature).toBe(1)
  })
})
