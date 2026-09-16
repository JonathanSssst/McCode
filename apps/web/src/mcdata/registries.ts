const API = 'https://api.spyglassmc.com/mcje/versions/'
const CACHE_PREFIX = 'mccode:registries:v1:'

export function lengthen(id: string): string {
  return id.includes(':') ? id : `minecraft:${id}`
}

export async function fetchRegistries(version: string): Promise<Record<string, string[]>> {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + version)
    if (cached) return JSON.parse(cached) as Record<string, string[]>
  } catch {
    // ignore
  }
  try {
    const response = await fetch(API + encodeURIComponent(version) + '/registries')
    if (!response.ok) return {}
    const data = (await response.json()) as Record<string, string[]>
    try {
      localStorage.setItem(CACHE_PREFIX + version, JSON.stringify(data))
    } catch {
      // ignore quota errors
    }
    return data
  } catch {
    return {}
  }
}
