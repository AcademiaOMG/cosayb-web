"use client"

import { memo } from "react"
import type { Recipe } from "@/types/domain"
import { ChefHat, Pencil, Trash2, Calculator, BookMarked, Globe } from "lucide-react"
import Button from "@/components/ui/Button"

interface RecipeCardProps {
  recipe: Recipe
  onEdit: (recipe: Recipe) => void
  onDelete: (recipe: Recipe) => void
  onCost: (recipe: Recipe) => void
}

const RecipeCard = memo(function RecipeCard({ recipe, onEdit, onDelete, onCost }: RecipeCardProps) {
  const servings = parseInt(recipe.servings, 10) || 0
  const servingWeight = recipe.servingWeightG ? parseFloat(recipe.servingWeightG) : null
  const itemCount = recipe.itemCount ?? recipe.items?.length ?? 0
  const totalWeightG = recipe.totalWeightG ?? 0
  const safetyMargin = parseFloat(recipe.safetyMargin) || 0
  const isPublic = recipe.isPublic ?? false
  const isBase = recipe.isBase

  return (
    <article
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        borderRadius: "16px",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
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
      {/* Header: icon + name + badges */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div
          style={{
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: "10px",
            background: "var(--accent-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChefHat size={18} style={{ color: "var(--accent)" }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            className="font-semibold text-sm"
            style={{
              color: "var(--text-primary)",
              lineHeight: "1.3",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {recipe.name}
          </h3>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
            {isBase && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "9px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  color: "#6D28D9",
                  background: "#EDE9FE",
                  borderRadius: "100px",
                  padding: "2px 7px",
                }}
              >
                <BookMarked size={9} />
                Base
              </span>
            )}
            {isPublic && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  fontSize: "9px",
                  fontWeight: 600,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  color: "#0369A1",
                  background: "#E0F2FE",
                  borderRadius: "100px",
                  padding: "2px 7px",
                }}
              >
                <Globe size={9} />
                Pública
              </span>
            )}
            <span
              className="text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              {itemCount} componente{itemCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "6px",
        }}
      >
        <Stat label="Porciones" value={String(servings)} />
        <Stat
          label="Peso / porción"
          value={servingWeight != null ? `${servingWeight.toFixed(0)} g` : "—"}
        />
        <Stat label="Margen seg." value={`${safetyMargin.toFixed(1)}%`} />
        <Stat
          label="Peso total"
          value={totalWeightG > 0 ? `${totalWeightG.toFixed(0)} g` : "—"}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
        <Button
          id={`recipe-cost-${recipe.id}`}
          size="sm"
          variant="ghost"
          onClick={() => onCost(recipe)}
          style={{ flex: 1, justifyContent: "center" }}
          title="Ver detalle y costo"
        >
          <Calculator size={14} />
          Detalle
        </Button>
        {!isBase && !isPublic && (
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
        )}
        {!isBase && !isPublic && (
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
        )}
      </div>
    </article>
  )
})

export default RecipeCard

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: "var(--bg-primary)",
        borderRadius: "8px",
        padding: "6px 10px",
      }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)", marginBottom: "1px" }}>
        {label}
      </p>
      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  )
}
