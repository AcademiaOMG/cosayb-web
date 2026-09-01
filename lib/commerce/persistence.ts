import type { CheckoutState, CheckoutKind } from "./machine"
import { sanitizeForPersist } from "./machine"

// Borrador del checkout en sessionStorage — sobrevive un refresh mientras la
// pestaña siga abierta y la sesión activa.

const PREFIX = "cosayb.checkout"

export function draftKey(kind: CheckoutKind, discriminator: string): string {
  return `${PREFIX}.${kind}.${discriminator}`
}

export function saveDraft(key: string, state: CheckoutState): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(key, JSON.stringify(sanitizeForPersist(state)))
  } catch {
    /* cuota llena / modo privado — el checkout sigue funcionando en memoria */
  }
}

export function loadDraft(key: string): CheckoutState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CheckoutState
    // Nunca rehidratar en un estado terminal de proceso.
    if (parsed.status === "processing") parsed.status = "form"
    return parsed
  } catch {
    return null
  }
}

export function clearDraft(key: string): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    /* noop */
  }
}
