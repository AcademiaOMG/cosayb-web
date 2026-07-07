"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import type { Recipe, RecipeCostResult } from "@/types/domain"
import { getRecipeById, getRecipeCost, importarBancoRecipe } from "@/lib/api"
import {
  ChefHat, Calculator, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Info, Scale, Download,
} from "lucide-react"

interface RecipeDetailModalProps {
  open: boolean
  onClose: () => void
  recipeId: string | null
  onEdit?: (id: string) => void
  onDelete?: (recipe: Recipe) => void
  onImported?: () => void
}

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

export default function RecipeDetailModal({
  open,
  onClose,
  recipeId,
  onEdit,
  onDelete,
  onImported,
}: RecipeDetailModalProps) {
  const [materialCostPct, setMaterialCostPct] = useState("30")
  const [importing, setImporting] = useState(false)

  const { data: recipe, error: recipeError, isLoading: loading } = useSWR(
    open && recipeId ? ["recipe-detail", recipeId] : null,
    () => getRecipeById(recipeId!).then((r) => r.data),
  )

  const { data: cost, isLoading: costLoading } = useSWR(
    open && recipeId ? ["recipe-cost", recipeId, materialCostPct] : null,
    async () => {
      const pct = parseFloat(materialCostPct)
      if (isNaN(pct) || pct <= 0 || pct >= 100) return null
      const res = await getRecipeCost(recipeId!, pct / 100)
      return res.data as RecipeCostResult
    },
  )

  // Profitability computado en el cliente (el backend no lo devuelve)
  const profitability = useMemo(() => {
    if (!cost) return null
    const pct = parseFloat(materialCostPct) / 100
    if (isNaN(pct) || pct <= 0 || pct >= 1) return null
    const potentialSalePrice = cost.costWithMarginPerServing / pct
    const fixedCostPct = (1 - pct) / 1.8
    const fixedCostAmount = potentialSalePrice * fixedCostPct
    const profitPct = 1 - pct - fixedCostPct
    const profitAmount = potentialSalePrice * profitPct
    const materialCostRating: "MUY_BUENO" | "REGULAR" | "MALO" =
      pct <= 0.30 ? "MUY_BUENO" : pct <= 0.35 ? "REGULAR" : "MALO"
    return { materialCostPct: pct, fixedCostPct, fixedCostAmount, potentialSalePrice, profitPct, profitAmount, materialCostRating }
  }, [cost, materialCostPct])

  const error = recipeError ? "Error al cargar la receta." : null

  const totalWeightG = recipe?.totalWeightG
    ?? recipe?.items?.reduce((sum, item) => sum + (parseFloat(item.quantityG) || 0), 0)
    ?? 0

  async function handleImport() {
    if (!recipe) return
    setImporting(true)
    try {
      await importarBancoRecipe(recipe.id)
      onImported?.()
    } finally {
      setImporting(false)
    }
  }

  const isPublic = recipe?.isPublic ?? false
  const canEdit = !isPublic && !recipe?.isBase && !!onEdit
  const canDelete = !isPublic && !!onDelete

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={recipe ? recipe.name : "Detalle de receta"}
      wide
      footer={
        <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center" }}>
          {/* Acciones destructivas a la izquierda */}
          <div>
            {canDelete && recipe && (
              <Button variant="danger" onClick={() => onDelete!(recipe)}>
                Eliminar
              </Button>
            )}
          </div>

          {/* Acciones positivas a la derecha */}
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
            {isPublic && (
              <Button
                variant="primary"
                loading={importing}
                onClick={handleImport}
              >
                <Download size={14} />
                Importar a mis recetas
              </Button>
            )}
            {canEdit && recipe && (
              <Button variant="ghost" onClick={() => { onEdit!(recipe.id); }}>
                Editar
              </Button>
            )}
          </div>
        </div>
      }
    >
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <LoadingSpinner size={32} />
        </div>
      ) : error ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "16px",
            borderRadius: "12px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#B42020",
          }}
        >
          <AlertTriangle size={18} />
          <p className="text-sm">{error}</p>
        </div>
      ) : recipe ? (
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "20px" }}>

          {/* ═══════════════════ IZQUIERDA ═══════════════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Descripción */}
            {recipe.description && (
              <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                {recipe.description}
              </p>
            )}

            {/* Ficha técnica */}
            <section
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <ChefHat size={16} style={{ color: "var(--accent)" }} />
                <h3 className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  Ficha técnica
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <DetailField label="Porciones" value={String(Math.round(parseFloat(recipe.servings)))} />
                <DetailField label="Peso porción" value={recipe.servingWeightG ? `${parseFloat(recipe.servingWeightG).toFixed(0)} g` : "—"} />
                <DetailField
                  label="Margen seguridad"
                  value={`${parseFloat(recipe.safetyMargin).toFixed(1)}%`}
                  tooltip="Porcentaje extra sobre el costo de materia prima para cubrir variaciones de precio."
                />
                <DetailField label="Peso total" value={`${totalWeightG.toFixed(0)} g`} />
                <DetailField
                  label="Tipo"
                  value={recipe.isBase ? "Receta base" : "Receta principal"}
                  highlight={recipe.isBase}
                />
              </div>
            </section>

            {/* Componentes */}
            <section
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Scale size={16} style={{ color: "var(--accent)" }} />
                <h3 className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  Componentes ({recipe.items?.length ?? 0})
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {recipe.items?.map((item, idx) => (
                  <div
                    key={item.id ?? idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 70px",
                      gap: "8px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      background: idx % 2 === 0 ? "var(--bg-surface)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "9px",
                          padding: "2px 6px",
                          borderRadius: "100px",
                          background: item.componentType === "recipe" ? "#EDE9FE" : "#E0F2FE",
                          color: item.componentType === "recipe" ? "#6D28D9" : "#0369A1",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {item.componentType === "recipe" ? "Base" : "Ing"}
                      </span>
                      <p className="text-xs" style={{ color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.componentType === "recipe"
                          ? (item.subRecipeName ?? "Sub-receta")
                          : (item.ingredientName ?? "Ingrediente")}
                      </p>
                    </div>
                    <p className="text-xs text-right" style={{ color: "var(--text-secondary)" }}>
                      {parseFloat(item.quantityG).toFixed(0)} g
                    </p>
                  </div>
                ))}
                {(recipe.items?.length ?? 0) === 0 && (
                  <p className="text-xs text-center" style={{ color: "var(--text-muted)", padding: "12px 0" }}>
                    Sin componentes registrados.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* ═══════════════════ DERECHA ═══════════════════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Costos */}
            <section
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Calculator size={16} style={{ color: "var(--accent)" }} />
                <h3 className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                  Análisis de costos
                </h3>
              </div>

              {costLoading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                  <LoadingSpinner size={20} />
                </div>
              ) : cost ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <CostCard
                    label="Costo materia prima"
                    value={COP.format(cost.rawCostTotal)}
                    sublabel={`${COP.format(cost.rawCostPerServing)} / porción`}
                  />
                  <CostCard
                    label={`Con margen ${parseFloat(recipe.safetyMargin).toFixed(1)}%`}
                    value={COP.format(cost.costWithMarginTotal)}
                    sublabel={`${COP.format(cost.costWithMarginPerServing)} / porción`}
                    accent
                  />
                </div>
              ) : (
                <p className="text-xs text-center" style={{ color: "var(--text-muted)", padding: "16px 0" }}>
                  No se pudo calcular el costo.
                </p>
              )}
            </section>

            {/* Rentabilidad */}
            <section
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-light)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <TrendingUp size={16} style={{ color: "var(--accent)" }} />
                  <h3 className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                    Rentabilidad
                  </h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <label className="text-xs" style={{ color: "var(--text-muted)" }}>
                    %MP:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={materialCostPct}
                    onChange={(e) => setMaterialCostPct(e.target.value)}
                    style={{
                      width: "44px",
                      padding: "3px 4px",
                      borderRadius: "6px",
                      border: "1px solid var(--border-light)",
                      background: "var(--bg-surface)",
                      fontSize: "11px",
                      textAlign: "right",
                    }}
                  />
                </div>
              </div>

              {profitability ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "6px",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      background: "#F0F9FF",
                      border: "1px solid #BAE6FD",
                    }}
                  >
                    <Info size={12} style={{ color: "#0369A1", marginTop: "2px", flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: "#0369A1", lineHeight: "1.4" }}>
                      El <strong>% de materia prima</strong> es el porcentaje del precio de venta destinado a ingredientes.
                      El rango ideal es entre 30% y 32%.
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <MetricCard
                      label="% Materia Prima"
                      value={`${(profitability.materialCostPct * 100).toFixed(1)}%`}
                      rating={profitability.materialCostRating}
                      description="Cuanto menor, mejor"
                    />
                    <MetricCard
                      label="Costos Fijos"
                      value={`${(profitability.fixedCostPct * 100).toFixed(1)}%`}
                      amount={COP.format(profitability.fixedCostAmount)}
                      description="(100% - %MP) / 1.8"
                    />
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      background: "var(--accent-light)",
                      border: "1px solid var(--accent)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--accent-text)" }}>
                        Precio potencial de venta
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Costo con margen / %MP
                      </p>
                    </div>
                    <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>
                      {COP.format(profitability.potentialSalePrice)}
                    </p>
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      background: profitability.profitPct > 0 ? "#F0FDF4" : "#FEF2F2",
                      border: `1px solid ${profitability.profitPct > 0 ? "#BBF7D0" : "#FECACA"}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p
                        className="text-xs font-semibold"
                        style={{ color: profitability.profitPct > 0 ? "#166534" : "#991B1B" }}
                      >
                        Ganancia neta
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        100% - (%MP + %CostosFijos)
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        className="text-lg font-bold"
                        style={{ color: profitability.profitPct > 0 ? "#166534" : "#991B1B" }}
                      >
                        {(profitability.profitPct * 100).toFixed(1)}%
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: profitability.profitPct > 0 ? "#166534" : "#991B1B" }}
                      >
                        {COP.format(profitability.profitAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {costLoading ? "Calculando el costo…" : "Ajusta el %MP para ver el análisis de rentabilidad."}
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function DetailField({
  label,
  value,
  highlight = false,
  tooltip,
}: {
  label: string
  value: string
  highlight?: boolean
  tooltip?: string
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        {tooltip && (
          <div style={{ position: "relative" }} className="group">
            <Info size={11} style={{ color: "var(--text-muted)", cursor: "help" }} />
            <div
              style={{
                display: "none",
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginBottom: "6px",
                padding: "8px 10px",
                borderRadius: "8px",
                background: "#1E293B",
                color: "#fff",
                fontSize: "11px",
                lineHeight: "1.4",
                width: "200px",
                zIndex: 50,
                pointerEvents: "none",
              }}
              className="group-hover:!block"
            >
              {tooltip}
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  border: "5px solid transparent",
                  borderTopColor: "#1E293B",
                }}
              />
            </div>
          </div>
        )}
      </div>
      <p
        className="text-xs font-medium"
        style={{ color: highlight ? "var(--accent)" : "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  )
}

function CostCard({
  label,
  value,
  sublabel,
  accent = false,
  colSpan = false,
}: {
  label: string
  value: string
  sublabel?: string
  accent?: boolean
  colSpan?: boolean
}) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "8px",
        background: accent ? "var(--accent-light)" : "var(--bg-surface)",
        border: accent ? "1px solid var(--accent)" : "1px solid var(--border-light)",
        gridColumn: colSpan ? "span 2" : undefined,
      }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)", marginBottom: "4px" }}>
        {label}
      </p>
      <p
        className="text-sm font-bold"
        style={{ color: accent ? "var(--accent)" : "var(--text-primary)" }}
      >
        {value}
      </p>
      {sublabel && (
        <p className="text-xs" style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
          {sublabel}
        </p>
      )}
    </div>
  )
}

function MetricCard({
  label,
  value,
  rating,
  amount,
  description,
}: {
  label: string
  value: string
  rating?: "MUY_BUENO" | "REGULAR" | "MALO"
  amount?: string
  description?: string
}) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "8px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {label}
        </p>
        {rating && <RatingBadge rating={rating} />}
      </div>
      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
        {value}
      </p>
      {amount && (
        <p className="text-xs" style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
          {amount}
        </p>
      )}
      {description && (
        <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "4px", fontStyle: "italic" }}>
          {description}
        </p>
      )}
    </div>
  )
}

function RatingBadge({ rating }: { rating: "MUY_BUENO" | "REGULAR" | "MALO" }) {
  const config = {
    MUY_BUENO: { bg: "#DCFCE7", color: "#166534", label: "MUY BUENO", icon: TrendingUp },
    REGULAR: { bg: "#FEF9C3", color: "#854D0E", label: "REGULAR", icon: Minus },
    MALO: { bg: "#FEE2E2", color: "#991B1B", label: "MALO", icon: TrendingDown },
  }
  const { bg, color, label, icon: Icon } = config[rating]
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "8px",
        fontWeight: 600,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        color,
        background: bg,
        borderRadius: "100px",
        padding: "1px 6px",
      }}
    >
      <Icon size={8} />
      {label}
    </span>
  )
}
