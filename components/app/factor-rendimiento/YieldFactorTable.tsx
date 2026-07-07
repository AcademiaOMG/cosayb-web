"use client"

import type { FactorRendimiento } from "@/types/domain"
import Badge from "@/components/ui/Badge"
import Table from "@/components/ui/Table"
import { Eye, Pencil, Trash2 } from "lucide-react"

function formatCOP(amount: number): string {
  return `$ ${amount.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
}

interface YieldFactorTableProps {
  data: FactorRendimiento[]
  onView: (factor: FactorRendimiento) => void
  onEdit: (factor: FactorRendimiento) => void
  onDelete: (factor: FactorRendimiento) => void
}

export default function YieldFactorTable({ data, onView, onEdit, onDelete }: YieldFactorTableProps) {
  if (data.length === 0) {
    return null
  }

  return (
    <Table
      rowKey="id"
      data={data as unknown as Record<string, unknown>[]}
      onRowClick={(row) => onView(row as unknown as FactorRendimiento)}
      columns={[
        {
          key: "ingredientName",
          label: "Ingrediente",
          render: (v, row) => {
            const item = row as unknown as FactorRendimiento
            const totalWeight = parseFloat(item.totalWeightGrams)
            const netWeight = parseFloat(item.netWeightGrams)
            const totalWasteGrams = parseFloat(item.totalWasteGrams)
            return (
              <div>
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>{v as string}</span>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {totalWeight.toFixed(2)}g &rarr; {netWeight.toFixed(2)}g útiles
                  {totalWasteGrams > 0 && <span style={{ color: "#EF4444" }}> &middot; se tiran {totalWasteGrams.toFixed(2)}g</span>}
                </div>
              </div>
            )
          },
        },
        {
          key: "yieldFactor",
          label: "Rendimiento",
          render: (v) => (
            <span className="font-bold tabular-nums" style={{ color: "var(--accent-text)" }}>
              {(parseFloat(v as string) * 100).toFixed(2)}%
            </span>
          ),
        },
        {
          key: "realCostPerGram",
          label: "Costo/g",
          render: (v) => (
            <span className="tabular-nums text-sm" style={{ color: "var(--text-secondary)" }}>
              {formatCOP(parseFloat(v as string))}/g
            </span>
          ),
        },
        {
          key: "variant",
          label: "Tipo",
          render: (v) => (
            <Badge variant={v === "bfactor" ? "accent" : "success"}>
              {v === "bfactor" ? "Proteína" : "Vegetal"}
            </Badge>
          ),
        },
        {
          key: "updatedAt",
          label: "Fecha",
          render: (v) => (
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>{formatDate(v as string)}</span>
          ),
        },
        {
          key: "id",
          label: "",
          render: (_v, row) => {
            const item = row as unknown as FactorRendimiento
            return (
              <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onView(item)}
                  title="Ver detalles completos"
                  aria-label={`Ver detalles de ${item.ingredientName}`}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Eye size={14} />
                </button>
                <button
                  onClick={() => onEdit(item)}
                  title="Editar este ingrediente"
                  aria-label={`Editar ${item.ingredientName}`}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onDelete(item)}
                  title="Eliminar este ingrediente"
                  aria-label={`Eliminar ${item.ingredientName}`}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                  style={{ color: "#EF4444" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          },
        },
      ]}
    />
  )
}
