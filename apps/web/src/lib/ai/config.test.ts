import { describe, expect, it } from 'vitest'
import { DEFAULT_BASE_URL, DEFAULT_MODEL, buildConfig } from './config'
import { DEFAULT_AI_SETTINGS } from './types'

describe('buildConfig', () => {
  it('applies the default base URL and model', () => {
    const config = buildConfig({}, DEFAULT_AI_SETTINGS)
    expect(config.baseUrl).toBe(DEFAULT_BASE_URL)
    expect(config.model).toBe(DEFAULT_MODEL)
    expect(config.apiKey).toBe('')
  })

  it('uses the env key when present', () => {
    expect(buildConfig({ VITE_DEEPSEEK_API_KEY: ' sk-test ' }, DEFAULT_AI_SETTINGS).apiKey).toBe(
      'sk-test',
    )
  })

  it('honours env overrides and strips trailing slashes', () => {
    const config = buildConfig(
      {
        VITE_DEEPSEEK_BASE_URL: 'https://example.com/v1/',
        VITE_DEEPSEEK_MODEL: 'custom-model',
      },
      DEFAULT_AI_SETTINGS,
    )
    expect(config.baseUrl).toBe('https://example.com/v1')
    expect(config.model).toBe('custom-model')
  })

  it('prefers settings over env', () => {
    const config = buildConfig(
      { VITE_DEEPSEEK_BASE_URL: 'https://env.example', VITE_DEEPSEEK_MODEL: 'env-model' },
      { ...DEFAULT_AI_SETTINGS, baseUrl: 'http://127.0.0.1:11434/', model: 'llama3' },
    )
    expect(config.baseUrl).toBe('http://127.0.0.1:11434')
    expect(config.model).toBe('llama3')
  })

  it('carries the AI settings over', () => {
    const config = buildConfig({}, { ...DEFAULT_AI_SETTINGS, maxTokens: 512, temperature: 1 })
    expect(config.maxTokens).toBe(512)
    expect(config.temperature).toBe(1)
  })
})
