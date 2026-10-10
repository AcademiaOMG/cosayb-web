"use client"

import type { Recipe } from "@/types/domain"
import { ChefHat, Download, Pencil, BookMarked } from "lucide-react"
import Button from "@/components/ui/Button"
import "./recipe-cards.css"

interface BancoRecipeCardProps {
  recipe: Recipe
  onPreview: (recipe: Recipe) => void
  onImport: (recipe: Recipe) => void
  onUseAsTemplate: (recipe: Recipe) => void
  importing: boolean
}

export default function BancoRecipeCard({
  recipe,
  onPreview,
  onImport,
  onUseAsTemplate,
  importing,
}: BancoRecipeCardProps) {
  const servings = parseFloat(recipe.servings)
  const servingWeight = recipe.servingWeightG ? parseFloat(recipe.servingWeightG) : null
  const itemCount = recipe.items?.length ?? 0

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Ver receta ${recipe.name}`}
      className="rc-card"
      onClick={() => onPreview(recipe)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onPreview(recipe)
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div className="rc-icon is-public" aria-hidden="true">
          <ChefHat size={20} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="rc-title">{recipe.name}</h3>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
            {recipe.isBase && (
              <span className="rc-badge is-base">
                <BookMarked size={10} /> Preparación base
              </span>
            )}
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
        <Stat label="Porciones" value={servings % 1 === 0 ? String(servings) : servings.toFixed(1)} />
        <Stat label="Peso / porción" value={servingWeight != null ? `${servingWeight} g` : "N/D"} />
      </dl>

      {/* Acciones: no deben abrir también la vista previa de la tarjeta */}
      <div style={{ display: "flex", gap: "6px" }} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <Button
          id={`banco-import-${recipe.id}`}
          size="sm"
          variant="ghost"
          loading={importing}
          onClick={() => onImport(recipe)}
          style={{ flex: 1, justifyContent: "center" }}
          title="Importar a mis recetas"
        >
          <Download size={14} />
          Importar
        </Button>
        <Button
          id={`banco-template-${recipe.id}`}
          size="sm"
          variant="ghost"
          disabled={importing}
          onClick={() => onUseAsTemplate(recipe)}
          style={{ flex: 1, justifyContent: "center" }}
          title="Importar y abrir en el editor"
        >
          <Pencil size={14} />
          Plantilla
        </Button>
      </div>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rc-stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
