"use client"

import { useState } from "react"
import { CheckCircle2, AlertTriangle, ChevronDown, Download, Trash2, X, Loader2 } from "lucide-react"
import Button from "@/components/ui/Button"

// ─── Panel «Calidad del banco» ───────────────────────────────────────────────

export interface ChequeoCalidad {
  id: string
  texto: string
  ayuda: string
  /** null = todavía no se sabe (se está revisando) */
  cuenta: number | null
  gravedad: "alta" | "media"
  activo: boolean
  onClick: () => void
}

export function PanelCalidad({
  chequeos,
  revisando,
}: {
  chequeos: ChequeoCalidad[]
  revisando?: { hechas: number; total: number } | null
}) {
  const [abierto, setAbierto] = useState(true)
  const pendientes = chequeos.reduce((s, c) => s + (c.cuenta ?? 0), 0)
  const conPendientes = chequeos.filter((c) => (c.cuenta ?? 0) > 0).length
  const todoBien = pendientes === 0 && chequeos.every((c) => c.cuenta !== null)

  return (
    <section
      aria-label="Calidad del banco"
      style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}
    >
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left md:px-5"
      >
        {todoBien ? (
          <CheckCircle2 size={20} aria-hidden="true" style={{ color: "#16A34A" }} />
        ) : (
          <AlertTriangle size={20} aria-hidden="true" style={{ color: "#D97706" }} />
        )}
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Calidad del banco</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {todoBien
              ? "Todo en orden: no hay nada por corregir."
              : conPendientes > 0
              ? `${conPendientes} ${conPendientes === 1 ? "tema" : "temas"} por revisar. Toca uno para ver solo esos.`
              : "Revisando el banco…"}
            {revisando && (
              <span className="inline-flex items-center gap-1 pl-2">
                <Loader2 size={11} className="animate-spin" aria-hidden="true" />
                revisando recetas {revisando.hechas}/{revisando.total}
              </span>
            )}
          </span>
        </span>
        <ChevronDown size={18} aria-hidden="true" className={`shrink-0 transition-transform ${abierto ? "rotate-180" : ""}`} style={{ color: "var(--text-muted)" }} />
      </button>

      {abierto && (
        <div className="grid gap-2 px-4 pb-4 md:grid-cols-2 md:px-5 xl:grid-cols-3">
          {chequeos.map((c) => {
            const hay = (c.cuenta ?? 0) > 0
            return (
              <button
                key={c.id}
                type="button"
                onClick={c.onClick}
                aria-pressed={c.activo}
                disabled={c.cuenta === null || (!hay && !c.activo)}
                className="flex items-start gap-3 rounded-xl p-3 text-left transition-colors disabled:cursor-default"
                style={{
                  border: `1px solid ${c.activo ? "var(--accent)" : "var(--border-light)"}`,
                  background: c.activo ? "var(--accent-light)" : "var(--bg-primary)",
                }}
              >
                <span
                  className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg px-1.5 text-sm font-bold tabular-nums"
                  style={{
                    background: !hay ? "#DCFCE7" : c.gravedad === "alta" ? "#FEE2E2" : "#FEF3C7",
                    color: !hay ? "#166534" : c.gravedad === "alta" ? "#991B1B" : "#92400E",
                  }}
                >
                  {c.cuenta === null ? "…" : c.cuenta}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{c.texto}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{c.ayuda}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

// ─── Barra de selección múltiple ─────────────────────────────────────────────

export function BarraSeleccion({
  cantidad,
  singular,
  plural,
  onLimpiar,
  onExportar,
  onEliminar,
  eliminando,
}: {
  cantidad: number
  singular: string
  plural: string
  onLimpiar: () => void
  onExportar?: () => void
  onEliminar?: () => void
  eliminando?: boolean
}) {
  if (cantidad === 0) return null
  return (
    <div
      role="region"
      aria-label="Acciones sobre la selección"
      className="sticky bottom-4 z-30 flex flex-wrap items-center gap-2 px-4 py-3"
      style={{ background: "var(--text-primary)", color: "#fff", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)" }}
    >
      <span className="mr-auto text-sm font-semibold">
        {cantidad} {cantidad === 1 ? singular : plural} {cantidad === 1 ? "seleccionado" : "seleccionados"}
      </span>
      {onExportar && (
        <Button variant="ghost" size="sm" onClick={onExportar} style={{ color: "#fff" }}>
          <Download size={14} aria-hidden="true" /> Exportar
        </Button>
      )}
      {onEliminar && (
        <Button variant="danger" size="sm" onClick={onEliminar} loading={eliminando}>
          <Trash2 size={14} aria-hidden="true" /> Eliminar
        </Button>
      )}
      <button
        type="button"
        onClick={onLimpiar}
        aria-label="Quitar la selección"
        title="Quitar la selección"
        className="rounded-lg p-2 transition-colors hover:bg-white/10"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
