"use client"

import type { FactorRendimiento } from "@/types/domain"
import Badge from "@/components/ui/Badge"
import { Eye, Pencil, Trash2 } from "lucide-react"

function formatCOP(amount: number): string {
  return `$ ${amount.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
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
    <div className="flex flex-col gap-2">
      {data.map((item) => {
        const yieldFactor = parseFloat(item.yieldFactor)
        const realCostPerGram = parseFloat(item.realCostPerGram)
        const totalWeight = parseFloat(item.totalWeightGrams)
        const netWeight = parseFloat(item.netWeightGrams)
        const totalWasteGrams = parseFloat(item.totalWasteGrams)

        return (
          <div
            key={item.id}
            className="rounded-xl transition-shadow hover:shadow-md"
            style={{ border: "1px solid var(--border-light)", background: "var(--bg-surface)" }}
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <Badge variant={item.variant === "bfactor" ? "accent" : "success"}>
                {item.variant === "bfactor" ? "Prot" : "Veg"}
              </Badge>

              <span className="font-medium flex-1 truncate" style={{ color: "var(--text-primary)" }}>{item.ingredientName}</span>

              <span className="text-xs font-mono hidden sm:inline" style={{ color: "var(--text-secondary)" }}>
                {totalWeight.toFixed(0)}g → {netWeight.toFixed(0)}g
              </span>

              {totalWasteGrams > 0 && (
                <span className="text-xs font-mono hidden md:inline" style={{ color: "#EF4444" }}>
                  -{totalWasteGrams.toFixed(0)}g
                </span>
              )}

              <span className="text-sm font-mono font-bold flex-shrink-0" style={{ color: "var(--accent-text)" }}>
                {(yieldFactor * 100).toFixed(1)}%
              </span>

              <span className="text-sm font-mono font-bold hidden sm:inline flex-shrink-0" style={{ color: "var(--accent-text)" }}>
                {formatCOP(realCostPerGram)}/g
              </span>

              {/* Acciones */}
              <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onView(item)}
                  className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                  title="Ver detalles"
                  aria-label={`Ver detalles de ${item.ingredientName}`}
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => onEdit(item)}
                  className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                  style={{ color: "var(--text-muted)" }}
                  title="Editar"
                  aria-label={`Editar ${item.ingredientName}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => onDelete(item)}
                  className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                  style={{ color: "#EF4444" }}
                  title="Eliminar"
                  aria-label={`Eliminar ${item.ingredientName}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
