/**
 * Store global de notificaciones (toast). No depende de React: se puede
 * llamar desde componentes, handlers, hooks o utilidades:
 *
 *   import { toast } from "@/lib/toast"
 *   toast.success("Receta guardada")
 *   toast.error("No se pudo eliminar el ingrediente")
 *
 * El <ToastProvider /> único (components/ui/Toast.tsx, montado en
 * app/layout.tsx) se suscribe a este store y renderiza las notificaciones.
 */

export type ToastType = "success" | "error" | "warning" | "info"

export interface ToastOptions {
  /** Texto secundario bajo el mensaje */
  description?: string
  /** ms visible; 0 = no se cierra sola. Por defecto según tipo */
  duration?: number
  /** Clave de deduplicación. Por defecto tipo + mensaje */
  id?: string
}

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  description?: string
  duration: number
  /** Veces que se disparó el mismo aviso mientras seguía visible */
  count: number
  /** Cambia en cada re-disparo (reinicia el temporizador) */
  stamp: number
  /** En animación de salida */
  leaving: boolean
}

/** Los errores y avisos permanecen más tiempo que las confirmaciones. */
export const TOAST_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 5000,
  warning: 6000,
  error: 8000,
}

/** Máximo de notificaciones simultáneas (las más antiguas salen primero). */
export const MAX_TOASTS = 4
/** Duración de la animación de salida (coincide con .toast-out en globals.css). */
export const TOAST_EXIT_MS = 160

type Listener = () => void

let items: ToastItem[] = []
let stampCounter = 0
const listeners = new Set<Listener>()

function emit() {
  listeners.forEach((l) => l())
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSnapshot(): ToastItem[] {
  return items
}

const EMPTY: ToastItem[] = []
export function getServerSnapshot(): ToastItem[] {
  return EMPTY
}

function push(type: ToastType, message: string, opts: ToastOptions = {}): string {
  const id = opts.id ?? `${type}:${message}`
  const stamp = ++stampCounter
  const existing = items.find((t) => t.id === id && !t.leaving)

  if (existing) {
    // Deduplicación: mismo aviso aún visible → contador + reinicio del tiempo
    items = items.map((t) => (t === existing ? { ...t, count: t.count + 1, stamp } : t))
  } else {
    const next: ToastItem = {
      id,
      type,
      message,
      description: opts.description,
      duration: opts.duration ?? TOAST_DURATIONS[type],
      count: 1,
      stamp,
      leaving: false,
    }
    const active = items.filter((t) => !t.leaving)
    const overflow = Math.max(0, active.length + 1 - MAX_TOASTS)
    const dropped = new Set(active.slice(0, overflow).map((t) => t.id))
    items = [...items.filter((t) => !dropped.has(t.id)), next]
  }
  emit()
  return id
}

/** Inicia la salida animada y retira la notificación después. */
export function dismiss(id: string): void {
  if (!items.some((t) => t.id === id && !t.leaving)) return
  items = items.map((t) => (t.id === id ? { ...t, leaving: true } : t))
  emit()
  setTimeout(() => {
    items = items.filter((t) => !(t.id === id && t.leaving))
    emit()
  }, TOAST_EXIT_MS)
}

export function clearAll(): void {
  items.forEach((t) => dismiss(t.id))
}

/** Solo para tests: reinicia el store. */
export function __resetToasts(): void {
  items = []
  stampCounter = 0
  emit()
}

export const toast = {
  success: (message: string, opts?: ToastOptions) => push("success", message, opts),
  error: (message: string, opts?: ToastOptions) => push("error", message, opts),
  warning: (message: string, opts?: ToastOptions) => push("warning", message, opts),
  info: (message: string, opts?: ToastOptions) => push("info", message, opts),
  dismiss,
  clear: clearAll,
}
