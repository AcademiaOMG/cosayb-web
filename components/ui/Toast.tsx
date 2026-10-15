"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react"
import {
  toast,
  dismiss,
  subscribe,
  getSnapshot,
  getServerSnapshot,
  type ToastItem,
  type ToastType,
} from "@/lib/toast"

export { toast }

const STYLES: Record<ToastType, { color: string; Icon: typeof Info; label: string }> = {
  success: { color: "var(--success)", Icon: CheckCircle2, label: "Éxito" },
  error: { color: "var(--error)", Icon: XCircle, label: "Error" },
  warning: { color: "var(--warning)", Icon: AlertTriangle, label: "Aviso" },
  info: { color: "var(--accent)", Icon: Info, label: "Información" },
}

function ToastCard({ item }: { item: ToastItem }) {
  const { color, Icon, label } = STYLES[item.type]
  const remaining = useRef(item.duration)
  const startedAt = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const start = () => {
    if (item.duration <= 0 || item.leaving) return
    startedAt.current = Date.now()
    timer.current = setTimeout(() => dismiss(item.id), remaining.current)
  }
  const pause = () => {
    if (!timer.current) return
    clearTimeout(timer.current)
    timer.current = null
    remaining.current = Math.max(1000, remaining.current - (Date.now() - startedAt.current))
  }

  // Cada re-disparo (stamp) reinicia el tiempo completo
  useEffect(() => {
    remaining.current = item.duration
    start()
    return () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.stamp, item.duration, item.leaving])

  // error/warning interrumpen al lector de pantalla (alert); el resto es cortés (status)
  const assertive = item.type === "error" || item.type === "warning"

  return (
    <div
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={pause}
      onMouseLeave={start}
      onFocus={pause}
      onBlur={start}
      className={`pointer-events-auto flex w-full items-start gap-3 py-3 pl-3 pr-2 text-sm ${item.leaving ? "toast-out" : "toast-in"}`}
      style={{
        background: "var(--bg-surface)",
        borderRadius: "var(--radius-md)",
        color: "var(--text-primary)",
        boxShadow: "var(--shadow-md)",
        border: "1px solid var(--border-light)",
        borderLeft: `4px solid ${color}`,
      }}
    >
      <Icon size={18} aria-hidden="true" style={{ color, flexShrink: 0, marginTop: 1 }} />
      <div className="min-w-0 flex-1">
        <span className="sr-only">{label}: </span>
        <p className="font-medium break-words">
          {item.message}
          {item.count > 1 && (
            <span
              className="ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-semibold"
              style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
              aria-label={`${item.count} veces`}
            >
              ×{item.count}
            </span>
          )}
        </p>
        {item.description && (
          <p className="mt-0.5 text-[13px] break-words" style={{ color: "var(--text-secondary)" }}>
            {item.description}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        className="rounded p-1"
        style={{ color: "var(--text-muted)" }}
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>
    </div>
  )
}

/**
 * Provider ÚNICO de notificaciones: montar una sola vez en app/layout.tsx.
 * Móvil: arriba y centrado (abajo está la barra de pestañas flotante);
 * ≥sm: abajo a la derecha. Usa `app-theme-neutral` para verse igual en la
 * app, el login y el sitio público.
 */
export default function ToastProvider() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return (
    <div
      className="app-theme-neutral pointer-events-none fixed inset-x-4 top-4 z-[70] flex flex-col gap-2 sm:inset-x-auto sm:bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:right-6 sm:top-auto sm:w-[380px] lg:bottom-6"
      style={{ background: "transparent" }}
    >
      {items.map((item) => (
        <ToastCard key={item.id} item={item} />
      ))}
    </div>
  )
}
