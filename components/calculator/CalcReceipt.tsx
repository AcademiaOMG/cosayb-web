"use client"

import { useId, useState } from "react"
import { ChevronDown } from "lucide-react"
import type { ReactNode } from "react"
import "./calcReceipt.css"

/**
 * El desglose de TODAS las calculadoras: un recibo que sale de la impresora
 * (ranura + papel con borde rasgado). Se dibuja solo cuando hay resultado;
 * sin resultado no se muestra nada. Las filas, separadores y el total son las
 * mismas piezas en cada módulo, para que el resultado se lea igual en todos.
 */
export default function CalcReceipt({
  title,
  animate = true,
  children,
}: {
  title: string
  /** false = ya impreso (resultado precargado): sin animación de salida */
  animate?: boolean
  children: ReactNode
}) {
  return (
    <div className={`calc-printer${animate ? "" : " calc-receipt-still"}`}>
      <div className="calc-printer-slot" />
      <div className="calc-printer-mask">
        <div className="calc-receipt calc-receipt-print" role="region" aria-label={title}>
          <p className="calc-receipt-title">{title}</p>
          {children}
        </div>
      </div>
    </div>
  )
}

/** Fila «dato → valor» con guía punteada */
export function ReceiptRow({
  label,
  value,
  bad = false,
  color,
  wrap = false,
}: {
  label: ReactNode
  value: ReactNode
  /** Valor en rojo (dato que no cuadra) */
  bad?: boolean
  /** Color del rótulo (leyenda de una dona, por ejemplo) */
  color?: string
  wrap?: boolean
}) {
  return (
    <div className="calc-receipt-row">
      <span className={`calc-receipt-row-label${wrap ? " is-wrap" : ""}`} style={color ? { color } : undefined}>
        {label}
      </span>
      <span className="calc-receipt-row-leader" />
      <span className="calc-receipt-row-value" style={bad ? { color: "var(--error)" } : undefined}>
        {value}
      </span>
    </div>
  )
}

export function ReceiptDivider() {
  return <hr className="calc-receipt-divider" />
}

/** Subtítulo de un bloque del recibo */
export function ReceiptSection({ children }: { children: ReactNode }) {
  return <p className="calc-receipt-section">{children}</p>
}

/** La cifra grande: la respuesta a la pregunta de la calculadora */
export function ReceiptHero({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <div className="calc-receipt-hero">
      <span className="calc-receipt-total-label">{label}</span>
      <span className="calc-receipt-hero-value">{value}</span>
      {note && <span className="calc-receipt-note">{note}</span>}
    </div>
  )
}

/**
 * Bloque plegable del recibo (cerrado por defecto): el detalle está a un toque
 * pero no alarga el recibo. Mismo comportamiento en todas las calculadoras.
 */
export function ReceiptFold({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string
  count?: number
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className="calc-receipt-fold" data-open={open || undefined}>
      <button
        type="button"
        className="calc-receipt-fold-head"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="calc-receipt-fold-title">{title}</span>
        {count !== undefined && <span className="calc-receipt-fold-count">{count}</span>}
        <ChevronDown size={16} aria-hidden="true" className="calc-receipt-fold-chevron" />
      </button>
      {open && (
        <div id={id} className="calc-receipt-fold-body anim-rise">
          {children}
        </div>
      )}
    </div>
  )
}
