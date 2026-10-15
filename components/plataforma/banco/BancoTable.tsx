"use client"

import type { CSSProperties, ReactNode } from "react"

/**
 * Lista del banco: mismo aspecto que las listas de la app (DataList) pero con casillas para
 * seleccionar varias filas y acciones por fila. Escritorio en columnas, celular en tarjetas.
 */
export interface BancoColumn<T> {
  label: string
  width: string
  align?: "left" | "right"
  strong?: boolean
  render: (row: T) => ReactNode
}

const CHECK_W = "2rem"

export default function BancoTable<T>({
  rows,
  rowKey,
  columns,
  seleccion,
  onToggle,
  onToggleTodas,
  actions,
  actionsWidth = "6rem",
  mobile,
  ariaLabel,
  rowLabel,
}: {
  rows: T[]
  rowKey: (row: T) => string
  columns: BancoColumn<T>[]
  /** ids seleccionados; omitir para una lista sin casillas */
  seleccion?: Set<string>
  onToggle?: (id: string) => void
  /** marca o desmarca todas las filas visibles */
  onToggleTodas?: (marcar: boolean) => void
  actions?: (row: T) => ReactNode
  actionsWidth?: string
  mobile: (row: T) => ReactNode
  ariaLabel: string
  rowLabel: (row: T) => string
}) {
  const conCasillas = !!seleccion && !!onToggle
  const template = [conCasillas ? CHECK_W : null, ...columns.map((c) => c.width), actionsWidth].filter(Boolean).join(" ")
  const grid = { ["--cols" as string]: template } as CSSProperties
  const todasMarcadas = conCasillas && rows.length > 0 && rows.every((r) => seleccion.has(rowKey(r)))
  const algunaMarcada = conCasillas && rows.some((r) => seleccion.has(rowKey(r)))

  return (
    <div
      className="overflow-hidden"
      style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}
    >
      <div
        className="hidden items-center gap-4 px-5 py-3 md:grid md:[grid-template-columns:var(--cols)]"
        style={{ ...grid, background: "var(--bg-secondary)", color: "var(--text-muted)" }}
      >
        {conCasillas && (
          <input
            type="checkbox"
            checked={todasMarcadas}
            ref={(el) => { if (el) el.indeterminate = !todasMarcadas && algunaMarcada }}
            onChange={(e) => onToggleTodas?.(e.target.checked)}
            aria-label="Seleccionar todos los de esta página"
            className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
          />
        )}
        {columns.map((c) => (
          <span key={c.label} className={`text-xs font-semibold${c.align === "right" ? " text-right" : ""}`}>
            {c.label}
          </span>
        ))}
        <span />
      </div>

      <ul aria-label={ariaLabel}>
        {rows.map((row) => {
          const id = rowKey(row)
          const marcada = !!seleccion?.has(id)
          return (
            <li
              key={id}
              className="group relative list-none transition-colors even:bg-[var(--bg-primary)]/60 hover:bg-[var(--accent-light)]/50 focus-within:bg-[var(--accent-light)]/50"
              style={marcada ? { background: "var(--accent-light)" } : undefined}
            >
              {/* Celular */}
              <div className="flex items-start gap-3 px-4 py-3.5 md:hidden">
                {conCasillas && (
                  <input
                    type="checkbox"
                    checked={marcada}
                    onChange={() => onToggle(id)}
                    aria-label={`Seleccionar ${rowLabel(row)}`}
                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[var(--accent)]"
                  />
                )}
                <div className="min-w-0 flex-1">{mobile(row)}</div>
                <div className="flex shrink-0 items-center">{actions?.(row)}</div>
              </div>

              {/* Escritorio */}
              <div
                className="relative hidden items-center gap-4 px-5 md:grid md:[grid-template-columns:var(--cols)]"
                style={{ ...grid, minHeight: 52 }}
              >
                {conCasillas && (
                  <input
                    type="checkbox"
                    checked={marcada}
                    onChange={() => onToggle(id)}
                    aria-label={`Seleccionar ${rowLabel(row)}`}
                    className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                  />
                )}
                {columns.map((c) => (
                  <span
                    key={c.label}
                    className={`min-w-0 truncate text-sm tabular-nums${c.align === "right" ? " text-right" : ""}${c.strong ? " font-bold" : ""}`}
                    style={{ color: c.strong ? "var(--text-primary)" : "var(--text-secondary)" }}
                  >
                    {c.render(row)}
                  </span>
                ))}
                <div className="flex items-center justify-end gap-0.5 opacity-70 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  {actions?.(row)}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Botón de icono para la columna de acciones de una fila */
export function AccionFila({
  label,
  onClick,
  children,
  peligro = false,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  peligro?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        peligro ? "hover:bg-red-50 hover:text-[#B42020]" : "hover:bg-[var(--bg-secondary)]"
      }`}
      style={{ color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}
    >
      {children}
    </button>
  )
}

/** Etiqueta pequeña de aviso (repetido, sin peso…) */
export function Aviso({ children, tono = "warning" }: { children: ReactNode; tono?: "warning" | "danger" | "muted" }) {
  const estilos = {
    warning: { background: "#FEF3C7", color: "#92400E" },
    danger: { background: "#FEE2E2", color: "#991B1B" },
    muted: { background: "var(--bg-secondary)", color: "var(--text-muted)" },
  }[tono]
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-md px-1.5 py-px text-[11px] font-semibold leading-4"
      style={estilos}
    >
      {children}
    </span>
  )
}
