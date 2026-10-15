"use client"

import ErrorState from "@/components/ui/ErrorState"
import DataList, { RowAction } from "@/components/ui/DataList"
import { Calculator, Pencil, Plus } from "lucide-react"
import type { Valuation } from "@/types/domain"
import { fmt, fmtPct, refLabel } from "./lib"

function HistorySkeleton() {
  return (
    <div
      className="w-full overflow-hidden animate-pulse"
      style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="px-4 py-3 flex gap-4" style={{ background: "var(--bg-secondary)" }}>
        {[24, 16, 8, 12, 16, 12, 10, 12].map((pct, i) => (
          <div key={i} className="h-3 rounded"
            style={{ background: "var(--border-light)", width: `${pct}%`, flexShrink: 0 }} />
        ))}
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="px-4 py-4 flex gap-4 items-center"
          style={{ background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-primary)" }}>
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "24%", flexShrink: 0 }} />
          <div className="h-5 rounded-full" style={{ background: "var(--bg-secondary)", width: "16%", flexShrink: 0 }} />
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "8%", flexShrink: 0 }} />
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "12%", flexShrink: 0 }} />
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "16%", flexShrink: 0 }} />
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "12%", flexShrink: 0 }} />
          <div className="h-5 rounded-full" style={{ background: "var(--bg-secondary)", width: "10%", flexShrink: 0 }} />
          <div className="h-7 ml-auto" style={{ background: "var(--bg-secondary)", width: 160, borderRadius: "var(--radius-sm)", flexShrink: 0 }} />
        </div>
      ))}
    </div>
  )
}

export default function HistoryView({
  history,
  isLoading,
  error,
  onRetry,
  canCreate,
  onNewCalculation,
  onView,
  onReuse,
}: {
  history: Valuation[]
  isLoading: boolean
  /** Falló la carga: se avisa en vez de mostrar «no hay valoraciones» como si no existieran. */
  error?: boolean
  onRetry?: () => void
  canCreate: boolean
  onNewCalculation: () => void
  onView: (v: Valuation) => void
  onReuse: (v: Valuation) => void
}) {
  if (isLoading) return <HistorySkeleton />
  if (error && history.length === 0) return <ErrorState title="No pudimos cargar tus valoraciones" onRetry={onRetry} />

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
        <div
          className="w-16 h-16 flex items-center justify-center"
          style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)" }}
        >
          <Calculator size={28} style={{ color: "var(--text-muted)" }} />
        </div>
        <div>
          <p className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
            No hay valoraciones guardadas
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Usa la calculadora para fijar el precio de un plato y guárdalo aquí.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={onNewCalculation}
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--accent)" }}
          >
            <Plus size={14} />
            Ir a la calculadora
          </button>
        )}
      </div>
    )
  }

  const date = (iso: string) =>
    new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })

  return (
    <DataList
      ariaLabel="Valoraciones guardadas"
      rows={history}
      rowKey={(v) => v.id}
      onOpen={onView}
      openLabel={(v) => `Ver valoración ${v.name}`}
      actionsWidth="5.5rem"
      columns={[
        { label: "Valoración", width: "minmax(0,1fr)", render: (v) => <span className="font-semibold" style={{ color: "var(--text-primary)" }} title={v.name}>{v.name}</span> },
        { label: "Origen", width: "7.5rem", render: (v) => refLabel(v.refType) },
        { label: "Costo materia prima", width: "9rem", align: "right", render: (v) => fmt(v.costMateriaprima) },
        { label: "% materia prima", width: "7.5rem", align: "right", render: (v) => fmtPct(v.pctMateriaprima) },
        { label: "Precio sugerido", width: "9rem", align: "right", strong: true, render: (v) => fmt(v.suggestedPrice) },
        { label: "Precio real", width: "8rem", align: "right", render: (v) => (v.actualPrice ? fmt(v.actualPrice) : "—") },
        { label: "Fecha", width: "7.5rem", render: (v) => date(v.createdAt) },
      ]}
      actions={(v) => (
        <>
          <RowAction label={`Reutilizar ${v.name} como base de un nuevo cálculo`} onClick={() => onReuse(v)}>
            <Pencil size={14} />
          </RowAction>
        </>
      )}
      mobile={(v) => (
        <div className="flex flex-col gap-2.5">
          <span className="line-clamp-2 text-[15px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>{v.name}</span>
          <dl className="m-0 grid grid-cols-2 gap-px overflow-hidden tabular-nums" style={{ background: "var(--border-light)", borderRadius: "var(--radius-md)" }}>
            <div className="flex flex-col gap-0.5 px-3 py-2" style={{ background: "var(--bg-primary)" }}>
              <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Costo materia prima</dt>
              <dd className="m-0 text-[15px]" style={{ color: "var(--text-secondary)" }}>{fmt(v.costMateriaprima)}</dd>
            </div>
            <div className="flex flex-col gap-0.5 px-3 py-2" style={{ background: "var(--bg-primary)" }}>
              <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Precio sugerido</dt>
              <dd className="m-0 text-[15px] font-bold" style={{ color: "var(--text-primary)" }}>{fmt(v.suggestedPrice)}</dd>
            </div>
          </dl>
          <p className="m-0 text-[12.5px]" style={{ color: "var(--text-muted)" }}>
            {refLabel(v.refType)} · {fmtPct(v.pctMateriaprima)} materia prima · {date(v.createdAt)}
          </p>
        </div>
      )}
    />
  )
}
