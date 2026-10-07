"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import type { Recipe, RecipeCostResult } from "@/types/domain"
import { getRecipeById, getRecipeCost, importarBancoRecipe } from "@/lib/api"
import "./recipe-detail.css"
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

/** Gramos con hasta 2 decimales (antes se redondeaba a entero: 0,5 g aparecía como "1 g") */
const gramsText = (n: number) => `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })} g`

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
      pct < 0.32 ? "MUY_BUENO" : pct > 0.37 ? "MALO" : "REGULAR"
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
  // La API no permite editar ni eliminar recetas base
  const canDelete = !isPublic && !recipe?.isBase && !!onDelete

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={recipe ? recipe.name : "Detalle de receta"}
      wide
      animate
      footer={
        <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", alignItems: "center" }}>
          {/* Acciones destructivas a la izquierda */}
          <div>
            {canDelete && recipe && (
              <Button variant="danger" onClick={() => onDelete!(recipe)}>
                Eliminar
              </Button>
            )}
            {recipe?.isBase && !isPublic && (
              <p className="text-xs" style={{ color: "var(--text-secondary)", maxWidth: 260 }}>
                Las recetas base no se pueden editar ni eliminar.
              </p>
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="animate-pulse rounded-xl h-28" style={{ background: "var(--bg-primary)" }} />
          <div className="animate-pulse rounded-xl h-28" style={{ background: "var(--bg-primary)" }} />
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
        <div className="rd-body">
          {recipe.description && (
            <p className="rd-in text-sm" style={{ color: "var(--text-secondary)", lineHeight: "1.6", ["--rd-i" as string]: 0 }}>
              {recipe.description}
            </p>
          )}

          {/* ── Lo esencial: cuánto cuesta, a cuánto venderla y cuánto queda ── */}
          <section className="rd-in rd-hero" aria-label="Resumen de costos" style={{ ["--rd-i" as string]: 1 }}>
            {profitability && cost ? (
              <>
                <HeroStat label="Te cuesta por porción" value={COP.format(cost.costWithMarginPerServing)} hint="Ingredientes + margen" />
                <HeroStat label="Véndela a" value={COP.format(profitability.potentialSalePrice)} hint="Precio sugerido por porción" tone="accent" />
                <HeroStat
                  label="Te queda de ganancia"
                  value={COP.format(profitability.profitAmount)}
                  hint={`${(profitability.profitPct * 100).toFixed(0)} % del precio`}
                  tone={profitability.profitPct > 0 ? "good" : "bad"}
                />
              </>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)", gridColumn: "1 / -1", padding: "12px 0", textAlign: "center" }}>
                {costLoading ? "Calculando…" : "No se pudo calcular el costo de esta receta."}
              </p>
            )}
          </section>

          {/* ── Ingredientes ── */}
          <section className="rd-in rd-panel" style={{ ["--rd-i" as string]: 2 }}>
            <h3 className="rd-title">
              <Scale size={15} style={{ color: "var(--accent)" }} /> Ingredientes ({recipe.items?.length ?? 0})
            </h3>
            <ul className="rd-list">
              {recipe.items?.map((item, idx) => (
                <li key={item.id ?? idx} className="rd-item">
                  <span className="text-sm" style={{ color: "var(--text-primary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.componentType === "recipe"
                      ? (item.subRecipeName ?? "Sub-receta")
                      : (item.ingredientName ?? "Ingrediente")}
                    {item.componentType === "recipe" && <span className="rd-tag">Base</span>}
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                    {gramsText(parseFloat(item.quantityG))}
                  </span>
                </li>
              ))}
              {(recipe.items?.length ?? 0) === 0 && (
                <li className="text-xs text-center" style={{ color: "var(--text-muted)", padding: "12px 0" }}>
                  Sin ingredientes registrados.
                </li>
              )}
            </ul>
            <p className="text-xs" style={{ color: "var(--text-muted)", marginTop: "10px" }}>
              Rinde {Math.round(parseFloat(recipe.servings))} porciones
              {recipe.servingWeightG ? ` de ${gramsText(parseFloat(recipe.servingWeightG))}` : ""}.
            </p>
          </section>

          {/* ── Todo lo demás, a un clic ── */}
          <details className="rd-in rd-more" style={{ ["--rd-i" as string]: 3 }}>
            <summary>Ver más detalles</summary>

            <div className="rd-more-body">
              <section className="rd-panel">
                <h3 className="rd-title"><ChefHat size={15} style={{ color: "var(--accent)" }} /> Ficha técnica</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <DetailField label="Porciones" value={String(Math.round(parseFloat(recipe.servings)))} />
                  <DetailField label="Peso porción" value={recipe.servingWeightG ? gramsText(parseFloat(recipe.servingWeightG)) : "—"} />
                  <DetailField
                    label="Margen seguridad"
                    value={`${parseFloat(recipe.safetyMargin).toFixed(1)}%`}
                    tooltip="Porcentaje extra sobre el costo de materia prima para cubrir variaciones de precio."
                  />
                  <DetailField label="Peso total" value={gramsText(totalWeightG)} />
                  <DetailField label="Tipo" value={recipe.isBase ? "Receta base" : "Receta principal"} highlight={recipe.isBase} />
                  <DetailField label="N.° de receta" value={recipe.recipeNumber} />
                </div>
              </section>

              <section className="rd-panel">
                <h3 className="rd-title"><Calculator size={15} style={{ color: "var(--accent)" }} /> Costos</h3>
                {cost ? (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <CostCard label="Costo materia prima" value={COP.format(cost.rawCostTotal)} sublabel={`${COP.format(cost.rawCostPerServing)} / porción`} />
                    <CostCard
                      label={`Con margen ${parseFloat(recipe.safetyMargin).toFixed(1)}%`}
                      value={COP.format(cost.costWithMarginTotal)}
                      sublabel={`${COP.format(cost.costWithMarginPerServing)} / porción`}
                      accent
                    />
                    {cost.costPerGram != null && (
                      <CostCard label="Costo de 1 gramo (con margen)" value={COP.format(cost.costPerGram)} colSpan />
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-center" style={{ color: "var(--text-muted)", padding: "12px 0" }}>
                    No se pudo calcular el costo.
                  </p>
                )}
              </section>

              <section className="rd-panel">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
                  <h3 className="rd-title" style={{ marginBottom: 0 }}>
                    <TrendingUp size={15} style={{ color: "var(--accent)" }} /> Rentabilidad
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <label htmlFor="recipe-detail-pctmp" className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      % del precio en ingredientes:
                    </label>
                    <input
                      id="recipe-detail-pctmp"
                      type="number"
                      min="1"
                      max="99"
                      value={materialCostPct}
                      onChange={(e) => setMaterialCostPct(e.target.value)}
                      style={{
                        width: "52px",
                        padding: "4px 6px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-light)",
                        background: "var(--bg-surface)",
                        fontSize: "12px",
                        textAlign: "right",
                      }}
                    />
                  </div>
                </div>

                {profitability ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <p className="text-xs" style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      Menos de 32 % es muy bueno, de 32 a 37 % regular y más de 37 % malo.
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <MetricCard
                        label="Ingredientes"
                        value={`${(profitability.materialCostPct * 100).toFixed(1)}%`}
                        rating={profitability.materialCostRating}
                      />
                      <MetricCard
                        label="Costos fijos"
                        value={`${(profitability.fixedCostPct * 100).toFixed(1)}%`}
                        amount={COP.format(profitability.fixedCostAmount)}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-center" style={{ color: "var(--text-muted)", padding: "12px 0" }}>
                    Escribe un porcentaje entre 1 y 99.
                  </p>
                )}
              </section>
            </div>
          </details>
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
          <span title={tooltip} role="img" aria-label={tooltip} tabIndex={0} style={{ display: "inline-flex", cursor: "help" }}>
            <Info size={11} style={{ color: "var(--text-muted)" }} />
          </span>
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

function HeroStat({
  label,
  value,
  hint,
  tone = "plain",
}: {
  label: string
  value: string
  hint: string
  tone?: "plain" | "accent" | "good" | "bad"
}) {
  return (
    <div className={`rd-stat is-${tone}`}>
      <p className="rd-stat-label">{label}</p>
      <p className="rd-stat-value">{value}</p>
      <p className="rd-stat-hint">{hint}</p>
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
