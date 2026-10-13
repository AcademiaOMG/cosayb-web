"use client"

import { useEffect, useId, useRef, useState, useCallback } from "react"
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
  /**
   * Entrada/salida animada (fundido + leve subida y escala). Activa por
   * defecto en TODOS los modales; pasar `animate={false}` para desactivarla.
   * Respeta prefers-reduced-motion (ver globals.css).
   */
  animate?: boolean
  /** Overlay con fondo desenfocado (backdrop-blur) tras el contenido */
  blur?: boolean
}

/** Duración de la animación de salida (debe coincidir con .modal-*-out en globals.css). */
const EXIT_MS = 160

// Pila de modales abiertos: solo el de arriba responde a Esc / Tab, y el
// scroll del body se libera únicamente cuando se cierra el último.
const modalStack: string[] = []

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
}

export default function Modal({ isOpen, open, onClose, title, children, footer, wide, xwide, animate = true, blur }: ModalProps) {
  const visible = typeof open === "boolean" ? open : !!isOpen
  const uid = useId()
  const titleId = `modal-title-${uid}`
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Montaje diferido: al cerrar, el modal permanece en el DOM lo justo para
  // reproducir la animación de salida y luego se desmonta.
  const [mounted, setMounted] = useState(visible)
  if (visible && !mounted) setMounted(true)
  const closing = !visible && mounted

  useEffect(() => {
    if (visible || !mounted) return
    const ms = animate && !prefersReducedMotion() ? EXIT_MS : 0
    const timer = setTimeout(() => setMounted(false), ms)
    return () => clearTimeout(timer)
  }, [visible, mounted, animate])

  // Guardar el foco previo y enfocar el primer control al abrir
  useEffect(() => {
    if (!visible) return
    previousFocusRef.current = document.activeElement as HTMLElement
    const timer = setTimeout(() => {
      const panel = panelRef.current
      if (!panel) return
      // Prioridad: [data-autofocus] (p. ej. "Cancelar" en confirmaciones) → botón Cerrar → panel
      const target =
        panel.querySelector<HTMLElement>("[data-autofocus]") ??
        panel.querySelector<HTMLElement>("[aria-label='Cerrar']")
      if (target) target.focus()
      else panel.focus()
    }, 0)
    return () => clearTimeout(timer)
  }, [visible])

  // Esc + trap de foco (solo el modal superior de la pila)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== uid) return

      if (e.key === "Escape") {
        e.stopPropagation()
        onCloseRef.current()
        return
      }

      if (e.key !== "Tab") return

      const panel = panelRef.current
      if (!panel) return

      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (e.shiftKey) {
        if (active === first || active === panel) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last) {
        e.preventDefault()
        first.focus()
      }
    },
    [uid]
  )

  useEffect(() => {
    if (!visible) return
    modalStack.push(uid)
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      const i = modalStack.indexOf(uid)
      if (i >= 0) modalStack.splice(i, 1)
      if (modalStack.length === 0) document.body.style.overflow = ""
      // Devolver el foco al elemento que lo tenía antes de abrir
      previousFocusRef.current?.focus()
    }
  }, [visible, handleKeyDown, uid])

  if (!mounted) return null

  const phase = animate ? (closing ? "out" : "in") : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-hidden={closing ? true : undefined}
      inert={closing ? true : undefined}
    >
      {/* Overlay */}
      <div
        className={`absolute inset-0${phase ? ` modal-overlay-${phase}` : ""}`}
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
        className={`relative z-10 w-full flex flex-col ${xwide ? "max-h-[92vh]" : "max-h-[85vh]"} overflow-hidden outline-none${phase ? ` modal-panel-${phase}` : ""} ${xwide ? "max-w-5xl" : wide ? "max-w-3xl" : "max-w-lg"}`}
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
              id={titleId}
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
