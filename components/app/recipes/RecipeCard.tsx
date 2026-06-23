"use client"

import type { Recipe } from "@/types/domain"
import { ChefHat, Pencil, Trash2, Calculator, BookMarked } from "lucide-react"
import Button from "@/components/ui/Button"

interface RecipeCardProps {
  recipe: Recipe
  onEdit: (recipe: Recipe) => void
  onDelete: (recipe: Recipe) => void
  onCost: (recipe: Recipe) => void
}

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export default function RecipeCard({ recipe, onEdit, onDelete, onCost }: RecipeCardProps) {
  const servings = parseFloat(recipe.servings)
  const servingWeight = recipe.servingWeightG ? parseFloat(recipe.servingWeightG) : null
  const itemCount = recipe.items?.length ?? 0

  return (
    <article
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        transition: "box-shadow 0.18s ease, border-color 0.18s ease",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow =
          "0 4px 20px rgba(18,33,58,0.10)"
        ;(e.currentTarget as HTMLElement).style.borderColor = "var(--border-medium)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = ""
        ;(e.currentTarget as HTMLElement).style.borderColor = "var(--border-light)"
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        {/* Icon */}
        <div
          style={{
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: "10px",
            background: "var(--accent-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChefHat size={20} style={{ color: "var(--accent)" }} />
        </div>

        {/* Name + number */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h3
              className="font-semibold text-sm"
              style={{
                color: "var(--text-primary)",
                lineHeight: "1.3",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              {recipe.name}
            </h3>
            {recipe.isBase && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  color: "#6D28D9",
                  background: "#EDE9FE",
                  borderRadius: "100px",
                  padding: "2px 8px",
                  whiteSpace: "nowrap",
                }}
              >
                <BookMarked size={10} />
                Base
              </span>
            )}
          </div>
          <p
            className="text-xs"
            style={{ color: "var(--text-muted)", marginTop: "2px" }}
          >
            N.° {recipe.recipeNumber}
          </p>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
        }}
      >
        <Stat label="Porciones" value={servings % 1 === 0 ? String(servings) : servings.toFixed(1)} />
        <Stat
          label="Peso / porción"
          value={servingWeight != null ? `${servingWeight} g` : "—"}
        />
        <Stat label="Componentes" value={`${itemCount}`} />
        <Stat label="Margen seg." value={`${parseFloat(recipe.safetyMargin)} %`} />
      </div>

      {/* ── Actions ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
        <Button
          id={`recipe-cost-${recipe.id}`}
          size="sm"
          variant="ghost"
          onClick={() => onCost(recipe)}
          style={{ flex: 1, justifyContent: "center" }}
          title="Calcular costo"
        >
          <Calculator size={14} />
          Costo
        </Button>
        <Button
          id={`recipe-edit-${recipe.id}`}
          size="sm"
          variant="ghost"
          onClick={() => onEdit(recipe)}
          title="Editar receta"
          style={{ padding: "0 10px" }}
        >
          <Pencil size={14} />
        </Button>
        <Button
          id={`recipe-delete-${recipe.id}`}
          size="sm"
          variant="ghost"
          onClick={() => onDelete(recipe)}
          title="Eliminar receta"
          style={{ padding: "0 10px", color: "#B42020" }}
        >
          <Trash2 size={14} />
        </Button>
      </div>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "var(--bg-primary)",
        borderRadius: "10px",
        padding: "8px 10px",
      }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)", marginBottom: "2px" }}>
        {label}
      </p>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  )
}
