"use client"

import { memo } from "react"
import type { Recipe } from "@/types/domain"
import { ChefHat, BookMarked, Globe, Trash2 } from "lucide-react"

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

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onClick(recipe)}
      onKeyDown={(e) => e.key === "Enter" && onClick(recipe)}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        borderRadius: "16px",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        transition: "box-shadow 0.18s ease, border-color 0.18s ease",
        cursor: "pointer",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(18,33,58,0.10)"
        ;(e.currentTarget as HTMLElement).style.borderColor = "var(--border-medium)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.boxShadow = ""
        ;(e.currentTarget as HTMLElement).style.borderColor = "var(--border-light)"
      }}
    >
      {/* Botón eliminar — esquina superior derecha, solo recetas propias */}
      {!isPublic && onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(recipe) }}
          title="Eliminar receta"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            border: "none",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            transition: "color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = "#B42020"
            ;(e.currentTarget as HTMLButtonElement).style.background = "#FEF2F2"
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)"
            ;(e.currentTarget as HTMLButtonElement).style.background = "transparent"
          }}
        >
          <Trash2 size={13} />
        </button>
      )}

      {/* Header: icono + nombre + badges */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", paddingRight: isPublic ? "0" : "28px" }}>
        <div
          style={{
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: "10px",
            background: isPublic ? "#F0FDF4" : "var(--accent-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChefHat size={18} style={{ color: isPublic ? "#16A34A" : "var(--accent)" }} />
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

          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "4px", flexWrap: "wrap" }}>
            {recipe.isBase && (
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: "3px",
                  fontSize: "9px", fontWeight: 600, letterSpacing: "0.5px",
                  textTransform: "uppercase", color: "#6D28D9", background: "#EDE9FE",
                  borderRadius: "100px", padding: "2px 7px",
                }}
              >
                <BookMarked size={9} /> Base
              </span>
            )}
            {isPublic && (
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: "3px",
                  fontSize: "9px", fontWeight: 600, letterSpacing: "0.5px",
                  textTransform: "uppercase", color: "#0369A1", background: "#E0F2FE",
                  borderRadius: "100px", padding: "2px 7px",
                }}
              >
                <Globe size={9} /> Banco
              </span>
            )}
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {itemCount} ingrediente{itemCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Descripción breve */}
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

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        <Stat label="Porciones" value={String(servings)} />
        <Stat
          label="Peso / porción"
          value={servingWeight != null ? `${servingWeight.toFixed(0)} g` : "—"}
        />
        <Stat label="Margen seg." value={`${safetyMargin.toFixed(1)}%`} />
        <Stat label="N.°" value={recipe.recipeNumber} />
      </div>
    </article>
  )
})

export default RecipeCard

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--bg-primary)", borderRadius: "8px", padding: "6px 10px" }}>
      <p className="text-xs" style={{ color: "var(--text-muted)", marginBottom: "1px" }}>{label}</p>
      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  )
}
