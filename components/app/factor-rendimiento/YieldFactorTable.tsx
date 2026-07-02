"use client"

import type { FactorRendimiento } from "@/types/domain"
import Badge from "@/components/ui/Badge"
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
    <div className="w-full overflow-hidden rounded-xl" style={{ border: "1px solid var(--border-light)" }}>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ background: "var(--bg-secondary)" }}>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Tipo</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Ingrediente</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide hidden sm:table-cell" style={{ color: "var(--text-muted)" }}>Rendimiento</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide hidden md:table-cell" style={{ color: "var(--text-muted)" }}>Costo/g</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide hidden lg:table-cell" style={{ color: "var(--text-muted)" }}>Ultima modif.</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const yieldFactor = parseFloat(item.yieldFactor)
            const realCostPerGram = parseFloat(item.realCostPerGram)
            const totalWeight = parseFloat(item.totalWeightGrams)
            const netWeight = parseFloat(item.netWeightGrams)
            const totalWasteGrams = parseFloat(item.totalWasteGrams)

            return (
              <tr
                key={item.id}
                className="transition-colors hover:opacity-90 cursor-pointer"
                style={{ borderTop: "1px solid var(--border-light)" }}
                onClick={() => onView(item)}
              >
                <td className="px-4 py-3">
                  <Badge variant={item.variant === "bfactor" ? "accent" : "success"}>
                    {item.variant === "bfactor" ? "Proteina" : "Vegetal"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>{item.ingredientName}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {totalWeight.toFixed(2)}g &rarr; {netWeight.toFixed(2)}g utiles
                    {totalWasteGrams > 0 && <span style={{ color: "#EF4444" }}> &middot; se tiran {totalWasteGrams.toFixed(2)}g</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell">
                  <span className="text-lg font-bold" style={{ color: "var(--accent-text)" }}>{(yieldFactor * 100).toFixed(2)}%</span>
                </td>
                <td className="px-4 py-3 text-right hidden md:table-cell">
                  <span className="font-mono text-sm" style={{ color: "var(--text-secondary)" }}>{formatCOP(realCostPerGram)}/g</span>
                </td>
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(item.updatedAt)}</span>
                </td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => onView(item)}
                      className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                      style={{ color: "var(--text-muted)" }}
                      title="Ver detalles completos"
                      aria-label={`Ver detalles de ${item.ingredientName}`}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                      style={{ color: "var(--text-muted)" }}
                      title="Editar este ingrediente"
                      aria-label={`Editar ${item.ingredientName}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(item)}
                      className="p-1.5 rounded-lg transition-colors hover:opacity-80"
                      style={{ color: "#EF4444" }}
                      title="Eliminar este ingrediente"
                      aria-label={`Eliminar ${item.ingredientName}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
