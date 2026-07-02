"use client"

import type { Recipe } from "@/types/domain"
import { ChefHat, Download, Pencil, BookMarked } from "lucide-react"
import Button from "@/components/ui/Button"

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
      onClick={() => onPreview(recipe)}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        transition: "box-shadow 0.18s ease, border-color 0.18s ease",
        cursor: "pointer",
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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div
          style={{
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: "10px",
            background: "#F0FDF4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChefHat size={20} style={{ color: "#16A34A" }} />
        </div>

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
          <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "2px" }}>
            {itemCount} ingrediente{itemCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Description */}
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
            marginTop: "-4px",
          }}
        >
          {recipe.description}
        </p>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <Stat label="Porciones" value={servings % 1 === 0 ? String(servings) : servings.toFixed(1)} />
        <Stat
          label="Peso / porción"
          value={servingWeight != null ? `${servingWeight} g` : "N/D"}
        />
      </div>

      {/* Actions — stop propagation so card click doesn't also fire */}
      <div
        style={{ display: "flex", gap: "6px", marginTop: "2px" }}
        onClick={(e) => e.stopPropagation()}
      >
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
