"use client"

import type { Recipe } from "@/types/domain"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { Download, Pencil, BookMarked } from "lucide-react"

interface BancoDetailModalProps {
  open: boolean
  onClose: () => void
  recipe: Recipe | null
  onImport: (recipe: Recipe) => void
  onUseAsTemplate: (recipe: Recipe) => void
  importing: boolean
}

export default function BancoDetailModal({
  open,
  onClose,
  recipe,
  onImport,
  onUseAsTemplate,
  importing,
}: BancoDetailModalProps) {
  if (!recipe) return null

  const servings = parseFloat(recipe.servings)
  const servingWeight = recipe.servingWeightG ? parseFloat(recipe.servingWeightG) : null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={recipe.name}
      footer={
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            variant="ghost"
            loading={importing}
            onClick={() => { onImport(recipe); onClose() }}
          >
            <Download size={14} />
            Importar
          </Button>
          <Button
            variant="primary"
            disabled={importing}
            onClick={() => { onUseAsTemplate(recipe); onClose() }}
          >
            <Pencil size={14} />
            Usar como plantilla
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Meta */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {recipe.isBase && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                color: "#6D28D9",
                background: "#EDE9FE",
                borderRadius: "100px",
                padding: "3px 10px",
              }}
            >
              <BookMarked size={10} />
              Receta base
            </span>
          )}
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              background: "var(--bg-primary)",
              borderRadius: "100px",
              padding: "3px 10px",
            }}
          >
            {servings % 1 === 0 ? String(servings) : servings.toFixed(1)} porción{servings !== 1 ? "es" : ""}
            {servingWeight != null ? ` · ${servingWeight} g c/u` : ""}
          </span>
        </div>

        {/* Description */}
        {recipe.description && (
          <p
            className="text-sm"
            style={{
              color: "var(--text-secondary)",
              lineHeight: "1.6",
              padding: "12px 16px",
              background: "var(--bg-primary)",
              borderRadius: "10px",
              borderLeft: "3px solid #16A34A",
            }}
          >
            {recipe.description}
          </p>
        )}

        {/* Ingredient list */}
        <div>
          <p
            className="text-xs"
            style={{
              color: "var(--text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "8px",
            }}
          >
            Ingredientes ({recipe.items?.length ?? 0})
          </p>

          {recipe.items && recipe.items.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {recipe.items
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                      borderRadius: "10px",
                      background: "var(--bg-primary)",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "var(--text-primary)" }}>
                      {item.ingredientName ?? "Ingrediente"}
                    </span>
                    <span
                      style={{
                        color: "var(--text-muted)",
                        fontVariantNumeric: "tabular-nums",
                        flexShrink: 0,
                        marginLeft: "12px",
                      }}
                    >
                      {parseFloat(item.quantityG).toLocaleString("es-CO")} g
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Sin ingredientes registrados.
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
