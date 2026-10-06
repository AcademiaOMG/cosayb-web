"use client"

import type { FactorRendimiento } from "@/types/domain"
import Badge from "@/components/ui/Badge"
import { Eye, Pencil, Trash2 } from "lucide-react"

const money = (n: number) => `$ ${n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const grams = (n: number) => `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })} g`
const pct = (n: number) => `${(n * 100).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })
}

interface YieldFactorTableProps {
  data: FactorRendimiento[]
  onView: (factor: FactorRendimiento) => void
  /** Sin permiso de editar/borrar no se pasa y el botón no aparece */
  onEdit?: (factor: FactorRendimiento) => void
  onDelete?: (factor: FactorRendimiento) => void
  /** Registro recién guardado: se resalta para que el usuario lo encuentre */
  highlightId?: string
}

const ICON_BTN =
  "p-2.5 md:p-2 rounded-lg transition-colors hover:bg-[var(--bg-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"

function Actions({ item, onView, onEdit, onDelete }: { item: FactorRendimiento } & Pick<YieldFactorTableProps, "onView" | "onEdit" | "onDelete">) {
  return (
    <div className="flex items-center gap-0.5 justify-end">
      <button
        type="button"
        onClick={() => onView(item)}
        title="Ver detalles completos"
        aria-label={`Ver detalles de ${item.ingredientName}`}
        className={ICON_BTN}
        style={{ color: "var(--text-muted)" }}
      >
        <Eye size={16} />
      </button>
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(item)}
          title="Editar este ingrediente"
          aria-label={`Editar ${item.ingredientName}`}
          className={ICON_BTN}
          style={{ color: "var(--text-muted)" }}
        >
          <Pencil size={16} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(item)}
          title="Eliminar este ingrediente"
          aria-label={`Eliminar ${item.ingredientName}`}
          className={ICON_BTN}
          style={{ color: "#B42020" }}
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  )
}

function Summary({ item }: { item: FactorRendimiento }) {
  const waste = parseFloat(item.totalWasteGrams)
  return (
    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
      {grams(parseFloat(item.totalWeightGrams))} &rarr; {grams(parseFloat(item.netWeightGrams))} útiles
      {waste > 0 && <span style={{ color: "#DC2626" }}> &middot; se tiran {grams(waste)}</span>}
    </div>
  )
}

export default function YieldFactorTable({ data, onView, onEdit, onDelete, highlightId }: YieldFactorTableProps) {
  if (data.length === 0) return null
  const handlers = { onView, onEdit, onDelete }

  return (
    <>
      {/* Escritorio / tablet: tabla */}
      <div
        className="hidden md:block w-full overflow-hidden"
        style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
      >
        <table className="w-full border-collapse">
          <caption className="sr-only">Factores de rendimiento guardados</caption>
          <thead>
            <tr style={{ background: "var(--bg-secondary)" }}>
              {["Ingrediente", "Rendimiento", "Costo por gramo", "Tipo", "Actualizado"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  {h}
                </th>
              ))}
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.id}
                data-factor-id={item.id}
                onClick={() => onView(item)}
                className="cursor-pointer transition-colors hover:bg-[var(--bg-primary)]"
                style={{
                  background: item.id === highlightId ? "var(--accent-light)" : "var(--bg-surface)",
                  borderTop: "1px solid var(--border-light)",
                }}
              >
                <td className="px-4 py-3">
                  <div className="font-medium" style={{ color: "var(--text-primary)" }}>{item.ingredientName}</div>
                  <Summary item={item} />
                </td>
                <td className="px-4 py-3">
                  <span className="font-bold tabular-nums" style={{ color: "var(--accent-text)" }}>{pct(parseFloat(item.yieldFactor))}</span>
                </td>
                <td className="px-4 py-3 text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
                  {money(parseFloat(item.realCostPerGram))}/g
                </td>
                <td className="px-4 py-3">
                  <Badge variant={item.variant === "bfactor" ? "accent" : "success"}>{item.variant === "bfactor" ? "Proteína" : "Vegetal"}</Badge>
                </td>
                <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: "var(--text-muted)" }}>{formatDate(item.updatedAt)}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Actions item={item} {...handlers} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: tarjetas, sin scroll horizontal */}
      <ul className="md:hidden flex flex-col gap-3" aria-label="Factores de rendimiento guardados">
        {data.map((item) => (
          <li
            key={item.id}
            data-factor-id={item.id}
            className="rounded-2xl p-3.5 flex flex-col gap-3"
            style={{
              background: item.id === highlightId ? "var(--accent-light)" : "var(--bg-surface)",
              border: `1px solid ${item.id === highlightId ? "var(--accent)" : "var(--border-light)"}`,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold break-words" style={{ color: "var(--text-primary)" }}>{item.ingredientName}</p>
                <Summary item={item} />
              </div>
              <Badge variant={item.variant === "bfactor" ? "accent" : "success"}>{item.variant === "bfactor" ? "Proteína" : "Vegetal"}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Rendimiento</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: "var(--accent-text)" }}>{pct(parseFloat(item.yieldFactor))}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Costo por gramo</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{money(parseFloat(item.realCostPerGram))}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--border-light)" }}>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Actualizado {formatDate(item.updatedAt)}</span>
              <Actions item={item} {...handlers} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
