"use client"

import Table from "@/components/ui/Table"
import IndicatorPill from "@/components/ui/IndicatorPill"
import { Calculator, Eye, Pencil, Plus } from "lucide-react"
import type { Valuation, ValuationIndicator, ValuationRefType } from "@/types/domain"
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
  canCreate,
  onNewCalculation,
  onView,
  onReuse,
}: {
  history: Valuation[]
  isLoading: boolean
  canCreate: boolean
  onNewCalculation: () => void
  onView: (v: Valuation) => void
  onReuse: (v: Valuation) => void
}) {
  if (isLoading) return <HistorySkeleton />

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

  return (
    <Table
      columns={[
        {
          key: "name",
          label: "Nombre",
          render: (v) => (
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>{v as string}</span>
          ),
        },
        {
          key: "indicator",
          label: "Indicador",
          render: (v) => <IndicatorPill indicator={v as ValuationIndicator} />,
        },
        {
          key: "pctMateriaprima",
          label: "% MP",
          render: (v) => <span className="tabular-nums text-sm" style={{ color: "var(--text-secondary)" }}>{fmtPct(v as string)}</span>,
        },
        {
          key: "costMateriaprima",
          label: "Costo MP",
          render: (v) => <span className="tabular-nums text-sm" style={{ color: "var(--text-secondary)" }}>{fmt(v as string)}</span>,
        },
        {
          key: "suggestedPrice",
          label: "Precio sugerido",
          render: (v) => <span className="font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{fmt(v as string)}</span>,
        },
        {
          key: "actualPrice",
          label: "Precio real",
          render: (v) => v
            ? <span className="tabular-nums text-sm" style={{ color: "var(--text-secondary)" }}>{fmt(v as string)}</span>
            : <span style={{ color: "var(--text-muted)" }}>—</span>,
        },
        {
          key: "refType",
          label: "Tipo",
          render: (v) => (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>
              {refLabel(v as ValuationRefType)}
            </span>
          ),
        },
        {
          key: "createdAt",
          label: "Fecha",
          render: (v) => (
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              {new Date(v as string).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          ),
        },
        {
          key: "id",
          label: "",
          render: (_, row) => {
            const valuation = row as unknown as Valuation
            return (
              <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onView(valuation)}
                  title="Ver valoración"
                  className="p-1.5 transition-colors hover:bg-[var(--bg-secondary)]"
                  style={{ color: "var(--text-muted)", borderRadius: "var(--radius-sm)" }}
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => onReuse(valuation)}
                  title="Reutilizar como base para un nuevo cálculo"
                  className="p-1.5 transition-colors hover:bg-[var(--bg-secondary)]"
                  style={{ color: "var(--text-muted)", borderRadius: "var(--radius-sm)" }}
                >
                  <Pencil size={14} />
                </button>
              </div>
            )
          },
        },
      ]}
      data={history as unknown as Record<string, unknown>[]}
      rowKey="id"
      onRowClick={(row) => onView(row as unknown as Valuation)}
    />
  )
}
