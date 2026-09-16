import { describe, expect, it } from 'vitest'
import { hashKey, LruCache } from './cache'

describe('hashKey', () => {
  it('is stable for the same input', () => {
    expect(hashKey('hello')).toBe(hashKey('hello'))
  })

  it('differs for different input', () => {
    expect(hashKey('hello')).not.toBe(hashKey('hellp'))
  })
})

describe('LruCache', () => {
  it('stores and retrieves values', () => {
    const cache = new LruCache<number>(2)
    cache.set('a', 1)
    expect(cache.get('a')).toBe(1)
    expect(cache.get('missing')).toBeUndefined()
  })

  it('evicts the least recently used entry', () => {
    const cache = new LruCache<number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.get('a')
    cache.set('c', 3)
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('a')).toBe(1)
    expect(cache.get('c')).toBe(3)
  })

  it('refreshes recency on set of an existing key', () => {
    const cache = new LruCache<number>(2)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('a', 10)
    cache.set('c', 3)
    expect(cache.get('b')).toBeUndefined()
    expect(cache.get('a')).toBe(10)
  })

  it('reports its size and clears', () => {
    const cache = new LruCache<number>(3)
    cache.set('a', 1)
    cache.set('b', 2)
    expect(cache.size).toBe(2)
    cache.clear()
    expect(cache.size).toBe(0)
  })
})
