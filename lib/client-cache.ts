const TTL = 30_000
const PREFIX = "cosayb_"

export function getCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (!raw) return null
    const { data, at } = JSON.parse(raw) as { data: T; at: number }
    if (Date.now() - at > TTL) {
      sessionStorage.removeItem(PREFIX + key)
      return null
    }
    return data as T
  } catch {
    return null
  }
}

export function setCache<T>(key: string, data: T): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify({ data, at: Date.now() }))
  } catch {
    // quota exceeded — ignorar
  }
}

export function invalidateCache(key: string): void {
  if (typeof window === "undefined") return
  try { sessionStorage.removeItem(PREFIX + key) } catch { /* noop */ }
}

// Llámalo en sign-out para que el siguiente usuario no vea datos del anterior
export function clearAllCache(): void {
  if (typeof window === "undefined") return
  try {
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => sessionStorage.removeItem(k))
  } catch { /* noop */ }
}
