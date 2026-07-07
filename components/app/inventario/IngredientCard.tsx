"use client"

import { Pencil, Trash2, Scale, DollarSign } from "lucide-react"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import type { Ingredient } from "@/types/ingredient"

export interface IngredientCardProps {
  ingredient: Ingredient
  /** Sin handler = usuario sin permiso → el botón no se renderiza */
  onEdit?: (ingredient: Ingredient) => void
  onDelete?: (ingredient: Ingredient) => void
}

function getPriceBadge(priceConfirmedAt: string | null): { label: string; variant: "warning" | "muted" } | null {
  if (!priceConfirmedAt) return { label: "Precio pendiente", variant: "muted" }
  const stale = Date.now() - new Date(priceConfirmedAt).getTime() > 30 * 24 * 60 * 60 * 1000
  return stale ? { label: "Precio desactualizado", variant: "warning" } : null
}

export default function IngredientCard({
  ingredient,
  onEdit,
  onDelete,
}: IngredientCardProps) {
  const isOwn = ingredient.userId !== null
  const costPerUnit = parseFloat(ingredient.costPerUnit)
  const weightGrams = parseFloat(ingredient.weightGrams)
  const costPerGram = parseFloat(ingredient.costPerGram)
  const priceBadge = getPriceBadge(ingredient.priceConfirmedAt)

  return (
    <article
      className="relative flex flex-col gap-4 rounded-2xl p-5 transition-all duration-200 hover:shadow-[0_4px_16px_rgba(18,33,58,0.10)] hover:border-[var(--border-medium)] hover:scale-[1.02]"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        boxShadow: "0 1px 3px rgba(18,33,58,0.04)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <h3
            className="font-semibold text-sm leading-snug truncate"
            style={{ color: "var(--text-primary)" }}
            title={ingredient.name}
          >
            {ingredient.name}
          </h3>
          <div className="flex flex-wrap gap-1">
            <Badge variant={isOwn ? "accent" : "muted"}>
              {isOwn ? "Propio" : "Banco"}
            </Badge>
            {priceBadge && (
              <Badge variant={priceBadge.variant}>{priceBadge.label}</Badge>
            )}
          </div>
        </div>

        {/* Actions — solo ingredientes propios y con permisos */}
        {isOwn && (onEdit || onDelete) && (
          <div
            className="flex gap-1 shrink-0"
            aria-label="Acciones"
          >
            {onEdit && (
              <button
                onClick={() => onEdit(ingredient)}
                aria-label={`Editar ${ingredient.name}`}
                className="rounded-lg p-1.5 transition-colors hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--text-muted)" }}
              >
                <Pencil size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(ingredient)}
                aria-label={`Eliminar ${ingredient.name}`}
                className="rounded-lg p-1.5 transition-colors hover:bg-red-50"
                style={{ color: "var(--text-muted)" }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <dl className="grid grid-cols-2 gap-3">
        <div
          className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5"
          style={{ background: "var(--bg-primary)" }}
        >
          <dt
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <DollarSign size={11} aria-hidden="true" />
            Costo unitario
          </dt>
          <dd
            className="text-sm font-semibold font-mono"
            style={{ color: "var(--text-primary)" }}
          >
            ${costPerUnit.toLocaleString("es-CO")}
          </dd>
        </div>

        <div
          className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5"
          style={{ background: "var(--bg-primary)" }}
        >
          <dt
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <Scale size={11} aria-hidden="true" />
            Peso
          </dt>
          <dd
            className="text-sm font-semibold font-mono"
            style={{ color: "var(--text-primary)" }}
          >
            {weightGrams.toLocaleString("es-CO")} g
          </dd>
        </div>

        <div
          className="col-span-2 flex items-center justify-between rounded-xl px-3 py-2"
          style={{
            background: "var(--accent-light)",
          }}
        >
          <span className="text-xs" style={{ color: "var(--accent-text)" }}>
            Costo por gramo
          </span>
          <span
            className="text-xs font-bold font-mono"
            style={{ color: "var(--accent-text)" }}
          >
            ${Number.isInteger(costPerGram) ? costPerGram.toLocaleString("es-CO") : costPerGram.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}/g
          </span>
        </div>
      </dl>
    </article>
  )
}
