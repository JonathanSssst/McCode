const API = 'https://api.spyglassmc.com/mcje/versions'

let cached: string[] | null = null

export async function fetchReleaseVersions(): Promise<string[]> {
  if (cached) return cached
  try {
    const response = await fetch(API)
    if (!response.ok) return []
    const data = (await response.json()) as { id: string; type: string }[]
    cached = data.filter((entry) => entry.type === 'release').map((entry) => entry.id)
    return cached
  } catch {
    return []
  }
}
