/**
 * Consentimiento de cookies. Las «necesarias» siempre están activas; la única
 * categoría opcional hoy es la de medición (`analytics`). Se guarda en una
 * cookie propia (1 año) para poder leerla también desde el servidor.
 */

export const CONSENT_COOKIE = "cosayb_consent"
export const CONSENT_VERSION = 1
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export interface ConsentState {
  v: number
  analytics: boolean
  decidedAt: string
}

export function serializeConsent(analytics: boolean, now: Date = new Date()): string {
  const state: ConsentState = { v: CONSENT_VERSION, analytics, decidedAt: now.toISOString() }
  return encodeURIComponent(JSON.stringify(state))
}

/** Devuelve el estado guardado o `null` si no hay decisión (o es de otra versión / está corrupto). */
export function parseConsent(raw: string | null | undefined): ConsentState | null {
  if (!raw) return null
  try {
    const obj = JSON.parse(decodeURIComponent(raw)) as Partial<ConsentState>
    if (obj.v !== CONSENT_VERSION || typeof obj.analytics !== "boolean") return null
    return { v: obj.v, analytics: obj.analytics, decidedAt: String(obj.decidedAt ?? "") }
  } catch {
    return null
  }
}

/** Extrae el valor de una cookie del string `document.cookie`. */
export function readCookie(cookieString: string, name: string): string | null {
  for (const part of cookieString.split(";")) {
    const [k, ...rest] = part.trim().split("=")
    if (k === name) return rest.join("=")
  }
  return null
}

// ── Store mínimo (compatible con useSyncExternalStore) ─────────────────────

const listeners = new Set<() => void>()
let cached: { raw: string | null; state: ConsentState | null } | null = null

function currentRaw(): string | null {
  if (typeof document === "undefined") return null
  return readCookie(document.cookie, CONSENT_COOKIE)
}

export function getConsent(): ConsentState | null {
  const raw = currentRaw()
  if (!cached || cached.raw !== raw) cached = { raw, state: parseConsent(raw) }
  return cached.state
}

export function getServerConsent(): ConsentState | null {
  return null
}

export function subscribeConsent(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function setConsent(analytics: boolean): void {
  if (typeof document === "undefined") return
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${CONSENT_COOKIE}=${serializeConsent(analytics)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`
  listeners.forEach((l) => l())
}

export const OPEN_PREFERENCES_EVENT = "open-cookie-preferences"

export function openCookiePreferences(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT))
}
