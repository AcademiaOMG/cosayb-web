"use client"

import { useState } from "react"
import Modal from "@/components/ui/Modal"
import "./calculator.css"

/**
 * Ventana de una calculadora (nueva receta, nuevo factor de rendimiento…): el
 * mismo Modal que usa el resto de la app, así se cierra igual en todas — con la
 * X, con Esc o tocando fuera. Si hay datos escritos, antes de cerrar avisa en
 * línea (no se pierde nada sin querer).
 */
export default function CalcModal({
  title,
  subtitle,
  dirty = false,
  onClose,
  children,
}: {
  title: string
  subtitle?: string
  /** Hay datos escritos que se perderían al cerrar */
  dirty?: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const [confirming, setConfirming] = useState(false)

  function requestClose() {
    if (dirty) setConfirming(true)
    else onClose()
  }

  return (
    <Modal open onClose={requestClose} title={title} xwide blur>
      <div className="flex flex-col gap-4">
        {subtitle && (
          <p className="text-sm -mt-1" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}

        {confirming && (
          <div
            role="alertdialog"
            aria-label="Cerrar sin guardar"
            className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}
          >
            <p className="text-sm flex-1">Lo que escribiste no se ha guardado y se perderá si cierras.</p>
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
                onClick={onClose}
                className="h-9 px-3 rounded-lg text-sm font-semibold"
                style={{ background: "transparent", color: "#92400E", border: "1px solid #FDE68A" }}
              >
                Cerrar sin guardar
              </button>
            </div>
          </div>
        )}

        {children}
      </div>
    </Modal>
  )
}
