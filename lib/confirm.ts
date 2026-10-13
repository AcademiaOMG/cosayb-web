/**
 * Store global de confirmaciones (ConfirmDialog). Promesa-based:
 *
 *   const confirm = useConfirm()            // components/ui/ConfirmDialog.tsx
 *   if (await confirm({ title: "Eliminar receta", itemName: recipe.name,
 *                       description: "Esta acción no se puede deshacer.",
 *                       confirmLabel: "Eliminar", variant: "danger" })) { ... }
 *
 * Usar SOLO para acciones destructivas o sensibles (eliminar, descartar
 * cambios sin guardar, cerrar sesión cuando corresponda). Nunca para guardar.
 */

export interface ConfirmOptions {
  title: string
  /** Texto explicativo (consecuencias) */
  description?: string
  /** Nombre del elemento afectado; se muestra destacado */
  itemName?: string
  confirmLabel?: string
  cancelLabel?: string
  /** "danger" (rojo, para eliminar/descartar) o "default" */
  variant?: "danger" | "default"
}

export interface ConfirmRequest extends ConfirmOptions {
  id: number
  resolve: (value: boolean) => void
}

type Listener = () => void

let queue: ConfirmRequest[] = []
let counter = 0
const listeners = new Set<Listener>()

export function subscribeConfirm(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Solicitud activa (la primera de la cola) o null. */
export function getActiveConfirm(): ConfirmRequest | null {
  return queue[0] ?? null
}

export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    queue = [...queue, { ...options, id: ++counter, resolve }]
    listeners.forEach((l) => l())
  })
}

/** Resuelve la solicitud activa y pasa a la siguiente de la cola. */
export function settleConfirm(value: boolean): void {
  const active = queue[0]
  if (!active) return
  queue = queue.slice(1)
  active.resolve(value)
  listeners.forEach((l) => l())
}
