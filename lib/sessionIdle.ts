/**
 * Cierre de sesión por inactividad (lógica pura, sin React ni DOM, para poder probarla).
 *
 * - `activity()` se llama con cada interacción real (clic, tecla, scroll, toque).
 *   Guarda la hora en el almacenamiento compartido (vale entre pestañas y recargas)
 *   y, como mucho cada `keepAliveMs`, pide renovar la sesión en el servidor.
 * - `check()` se llama periódicamente y al volver a la pestaña: si pasaron más de
 *   `idleMs` sin actividad en NINGUNA pestaña, llama a `onExpire` (una sola vez).
 */
export interface IdleStorage {
  get(): number | null
  set(value: number): void
}

export interface IdleTrackerOptions {
  idleMs: number
  keepAliveMs: number
  now: () => number
  storage: IdleStorage
  /** Renueva la sesión en el servidor (la cookie y la base de datos) */
  ping: () => void
  onExpire: () => void
  /** Cada cuánto, como mucho, se escribe la hora en el almacenamiento */
  saveEveryMs?: number
}

export function createIdleTracker({ idleMs, keepAliveMs, now, storage, ping, onExpire, saveEveryMs = 10_000 }: IdleTrackerOptions) {
  const stored = () => {
    const v = storage.get()
    return v != null && Number.isFinite(v) && v > 0 ? v : 0
  }
  // Abrir la app cuenta como actividad: nunca se arranca con una hora vieja de otra sesión.
  let last = now()
  let lastSaved = 0
  let lastPing = now()
  let expired = false

  function activity() {
    if (expired) return
    const t = now()
    last = t
    if (t - lastSaved >= saveEveryMs) {
      lastSaved = t
      storage.set(t)
    }
    if (t - lastPing >= keepAliveMs) {
      lastPing = t
      ping()
    }
  }

  function check() {
    if (expired) return false
    // Otra pestaña pudo registrar actividad más reciente
    last = Math.max(last, stored())
    if (now() - last > idleMs) {
      expired = true
      onExpire()
      return true
    }
    return false
  }

  // Deja la hora de arranque en el almacenamiento para las demás pestañas
  activity()

  return { activity, check, isExpired: () => expired }
}
