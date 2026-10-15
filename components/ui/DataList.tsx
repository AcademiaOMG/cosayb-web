"use client"

import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"

/**
 * Tabla de listas (Recetas, Inventario, historiales): columnas alineadas con números a la
 * derecha, filas que abren su detalle, sin pastillas de color ni puntos. En el celular cada
 * fila pasa a una tarjeta de dos líneas (`mobile`).
 */
export interface DataColumn<T> {
  label: string
  /** Ancho de la columna en escritorio (CSS grid): "minmax(0,1fr)", "7rem"… */
  width: string
  /** Números y montos: alineados a la derecha */
  align?: "left" | "right"
  /** Cifra principal de la fila: va en negrita y con el color fuerte */
  strong?: boolean
  render: (row: T) => ReactNode
}

export default function DataList<T>({
  rows,
  rowKey,
  columns,
  onOpen,
  openLabel,
  actions,
  actionsWidth = "6rem",
  mobile,
  ariaLabel,
}: {
  rows: T[]
  rowKey: (row: T) => string
  columns: DataColumn<T>[]
  onOpen: (row: T) => void
  /** Texto accesible del botón que cubre la fila */
  openLabel: (row: T) => string
  /** Botones al final de la fila en escritorio (ver, reutilizar, borrar…) */
  actions?: (row: T) => ReactNode
  actionsWidth?: string
  /** Contenido de la tarjeta en celular */
  mobile: (row: T) => ReactNode
  ariaLabel: string
}) {
  const template = [...columns.map((c) => c.width), actionsWidth].join(" ")
  // Los anchos van como variable CSS para poder usarlos solo desde md (en celular no hay columnas)
  const grid = { ["--cols" as string]: template } as React.CSSProperties

  return (
    <div
      className="overflow-hidden"
      style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}
    >
      <div
        className="hidden items-center gap-4 px-5 py-3 md:grid md:[grid-template-columns:var(--cols)]"
        style={{ ...grid, background: "var(--bg-secondary)", color: "var(--text-muted)" }}
        aria-hidden="true"
      >
        {columns.map((c) => (
          <span
            key={c.label}
            className={`text-xs font-semibold${c.align === "right" ? " text-right" : ""}`}
            style={c.strong ? { color: "var(--text-secondary)" } : undefined}
          >
            {c.label}
          </span>
        ))}
        <span />
      </div>

      <ul aria-label={ariaLabel}>
        {rows.map((row) => (
          <li
            key={rowKey(row)}
            className="group relative list-none transition-colors even:bg-[var(--bg-primary)]/60 hover:bg-[var(--accent-light)]/50 focus-within:bg-[var(--accent-light)]/50"
          >
            {/* Botón que cubre toda la fila → abre el detalle. Las acciones van por encima (z-10). */}
            <button
              type="button"
              onClick={() => onOpen(row)}
              className="absolute inset-0 z-0 w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
              aria-label={openLabel(row)}
            />

            {/* Celular */}
            <div className="pointer-events-none relative flex items-start gap-2 px-4 py-3.5 md:hidden">
              <div className="min-w-0 flex-1">{mobile(row)}</div>
              <ChevronRight size={16} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: "var(--border-medium)" }} />
            </div>

            {/* Escritorio */}
            <div
              className="pointer-events-none relative hidden items-center gap-4 px-5 md:grid md:[grid-template-columns:var(--cols)]"
              style={{ ...grid, minHeight: 52 }}
            >
              {columns.map((c) => (
                <span
                  key={c.label}
                  className={`min-w-0 truncate text-sm tabular-nums${c.align === "right" ? " text-right" : ""}${c.strong ? " font-bold" : ""}`}
                  style={{ color: c.strong ? "var(--text-primary)" : "var(--text-secondary)" }}
                >
                  {c.render(row)}
                </span>
              ))}
              <div className="pointer-events-auto relative z-10 flex items-center justify-end gap-0.5 opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                {actions?.(row)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Botón de icono para la columna de acciones de una fila */
export function RowAction({
  label,
  onClick,
  children,
  danger = false,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        danger ? "hover:bg-red-50 hover:text-[#B42020]" : "hover:bg-[var(--bg-secondary)]"
      }`}
      style={{ color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}
    >
      {children}
    </button>
  )
}
