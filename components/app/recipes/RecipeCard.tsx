"use client"

import { memo } from "react"
import type { Recipe } from "@/types/domain"
import { ChefHat, BookMarked, UtensilsCrossed, Trash2 } from "lucide-react"
import "./recipe-cards.css"

interface RecipeCardProps {
  recipe: Recipe
  onClick: (recipe: Recipe) => void
  /** Sin handler = usuario sin permiso → el botón no se renderiza */
  onDelete?: (recipe: Recipe) => void
}

const RecipeCard = memo(function RecipeCard({ recipe, onClick, onDelete }: RecipeCardProps) {
  const servings = parseInt(recipe.servings, 10) || 0
  const servingWeight = recipe.servingWeightG ? parseFloat(recipe.servingWeightG) : null
  const itemCount = recipe.itemCount ?? recipe.items?.length ?? 0
  const safetyMargin = parseFloat(recipe.safetyMargin) || 0
  const isPublic = recipe.isPublic ?? false
  // La API no permite eliminar recetas base: no se ofrece un botón que siempre fallaría
  const canDelete = !isPublic && !recipe.isBase && !!onDelete

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Ver receta ${recipe.name}`}
      className="rc-card"
      onClick={() => onClick(recipe)}
      onKeyDown={(e) => {
        // Solo cuando el foco está en la tarjeta (no en el botón de eliminar)
        if (e.target !== e.currentTarget) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick(recipe)
        }
      }}
    >
      {canDelete && (
        <button
          type="button"
          className="rc-delete"
          aria-label={`Eliminar receta ${recipe.name}`}
          title="Eliminar receta"
          onClick={(e) => {
            e.stopPropagation()
            onDelete?.(recipe)
          }}
        >
          <Trash2 size={14} />
        </button>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", paddingRight: canDelete ? "28px" : 0 }}>
        <div className={`rc-icon${isPublic ? " is-public" : ""}`} aria-hidden="true">
          <ChefHat size={19} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="rc-title">{recipe.name}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
            {recipe.isBase ? (
              <span className="rc-badge is-base">
                <BookMarked size={10} /> Base
              </span>
            ) : (
              <span className="rc-badge is-main">
                <UtensilsCrossed size={10} /> Principal
              </span>
            )}
            {isPublic && <span className="rc-badge is-public">Banco</span>}
            <span className="rc-sub">
              {itemCount} ingrediente{itemCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {recipe.description && (
        <p
          className="text-xs"
          style={{
            color: "var(--text-secondary)",
            lineHeight: "1.5",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {recipe.description}
        </p>
      )}

      <dl className="rc-stats" style={{ marginTop: "auto" }}>
        <Stat label="Porciones" value={String(servings)} />
        <Stat label="Peso / porción" value={servingWeight != null ? `${servingWeight.toFixed(0)} g` : "—"} />
        <Stat label="Margen seg." value={`${safetyMargin.toLocaleString("es-CO", { maximumFractionDigits: 1 })} %`} />
        <Stat label="N.°" value={recipe.recipeNumber} />
      </dl>
    </article>
  )
})

export default RecipeCard

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rc-stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
