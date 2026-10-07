"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, X } from "lucide-react"
import { scrollMainToTop } from "./scrollMainToTop"

/**
 * Esqueleto común de la vista de calculadora de los módulos (Punto de
 * equilibrio, Factor de rendimiento, Recetas): "← Historial", título, y un
 * aviso en línea si se intenta salir con datos sin guardar. Así los tres
 * módulos se abren, se leen y se cierran igual.
 */
export default function CalcViewShell({
  title,
  subtitle,
  backLabel,
  onBack,
  dirty = false,
  asModal = false,
  children,
}: {
  title: string
  subtitle?: string
  /** Texto del botón de volver, ej. "Mis recetas" */
  backLabel: string
  onBack: () => void
  /** Hay datos escritos que se perderían al salir */
  dirty?: boolean
  /** Ventana flotante: título a la izquierda y botón "Cerrar" (X) a la derecha, en vez de "← volver" */
  asModal?: boolean
  children: React.ReactNode
}) {
  const [confirming, setConfirming] = useState(false)

  // Al abrir la calculadora se empieza arriba, aunque la lista estuviera scrolleada.
  useEffect(() => {
    scrollMainToTop()
  }, [])

  function leave() {
    onBack()
    scrollMainToTop()
  }

  function handleBack() {
    if (dirty) setConfirming(true)
    else leave()
  }

  return (
    <div className="w-full flex flex-col gap-5">
      {asModal ? (
        <div className="flex items-center gap-4 pb-3 shrink-0" style={{ borderBottom: "1px solid var(--border-light)" }}>
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="text-xl font-bold leading-tight truncate" style={{ color: "var(--text-primary)" }}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleBack}
            aria-label={`Cerrar y volver a ${backLabel}`}
            title="Cerrar"
            className="flex items-center justify-center h-9 w-9 rounded-full shrink-0 transition-colors hover:bg-[var(--bg-secondary)]"
            style={{ color: "var(--text-secondary)" }}
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm font-medium h-9 px-2 -ml-2 rounded-lg transition-colors hover:bg-[var(--bg-secondary)] shrink-0"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={16} aria-hidden />
            {backLabel}
          </button>
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="text-lg font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {confirming && (
        <div
          role="alertdialog"
          aria-label="Salir sin guardar"
          className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}
        >
          <p className="text-sm flex-1">Lo que escribiste no se ha guardado y se perderá si sales.</p>
          <div className="flex gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => setConfirming(false)}
              className="h-9 px-3 rounded-lg text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Seguir editando
            </button>
            <button
              type="button"
              onClick={leave}
              className="h-9 px-3 rounded-lg text-sm font-semibold"
              style={{ background: "transparent", color: "#92400E", border: "1px solid #FDE68A" }}
            >
              Salir sin guardar
            </button>
          </div>
        </div>
      )}

      {children}
    </div>
  )
}
