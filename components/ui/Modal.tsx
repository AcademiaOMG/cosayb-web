"use client"

import { useEffect, useLayoutEffect, useRef, useCallback } from "react"
import type React from "react"
import { X } from "lucide-react"

export interface ModalProps {
  isOpen?: boolean
  open?: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
  /** Modal más ancho (max-w-3xl) para formularios complejos */
  wide?: boolean
  /** Ventana de trabajo (calculadoras con dos columnas): max-w-5xl y más alta */
  xwide?: boolean
  /** Entrada suave (fundido + leve subida) */
  animate?: boolean
  /** Overlay con fondo desenfocado (backdrop-blur) tras el contenido */
  blur?: boolean
}

export default function Modal({ isOpen, open, onClose, title, children, footer, wide, xwide, animate, blur }: ModalProps) {
  const visible = typeof open === "boolean" ? open : !!isOpen
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Entrada animada: el panel "nace" desde el elemento que se pulsó (la tarjeta) y crece hasta su sitio
  useLayoutEffect(() => {
    if (!visible || !animate) return
    const panel = panelRef.current
    const trigger = document.activeElement as HTMLElement | null
    if (!panel || !trigger || trigger === document.body) return
    const t = trigger.getBoundingClientRect()
    const p = panel.getBoundingClientRect()
    panel.style.setProperty("--mo-dx", `${t.left + t.width / 2 - (p.left + p.width / 2)}px`)
    panel.style.setProperty("--mo-dy", `${t.top + t.height / 2 - (p.top + p.height / 2)}px`)
  }, [visible, animate])

  // Store the element that had focus before the modal opened
  useEffect(() => {
    if (visible) {
      previousFocusRef.current = document.activeElement as HTMLElement
    }
  }, [visible])

  // Focus the close button or first interactive element when modal opens
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      // Try to focus the close button, then the panel itself
      const closeBtn = panel.querySelector<HTMLButtonElement>("[aria-label='Cerrar']")
      if (closeBtn) {
        closeBtn.focus()
      } else {
        panel.focus()
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [visible])

  // Focus trap
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose()
      return
    }

    if (e.key !== "Tab") return

    const panel = panelRef.current
    if (!panel) return

    const focusable = panel.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [onClose])

  useEffect(() => {
    if (!visible) return
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
      // Restore focus to the element that had it before the modal
      previousFocusRef.current?.focus()
    }
  }, [visible, handleKeyDown])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0${animate ? " modal-overlay-in" : ""}`}
        style={{
          background: "rgba(18, 33, 58, 0.5)",
          ...(blur
            ? { backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }
            : {}),
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative z-10 w-full flex flex-col ${xwide ? "max-h-[92vh]" : "max-h-[85vh]"} overflow-hidden outline-none${animate ? " modal-panel-in" : ""} ${xwide ? "max-w-5xl" : wide ? "max-w-3xl" : "max-w-lg"}`}
        style={{
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Header — fixed */}
        <div className="flex items-center justify-between px-6 pt-6 pb-0 shrink-0">
          {title && (
            <h2
              id="modal-title"
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 transition-colors"
            style={{ color: "var(--text-muted)" }}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer — fixed */}
        {footer && (
          <div className="px-6 pb-6 pt-4 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
