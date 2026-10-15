"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import type { Recipe, RecipeCostResult } from "@/types/domain"
import { recipeTypeLabel } from "@/lib/recipeLabels"
import { getRecipeById, getRecipeCost, importarBancoRecipe } from "@/lib/api"
import { Fold, FactRow, ModalHero, Panel, Stat, StatGrid, toneOfRating } from "@/components/ui/ModalKit"
import RecipeIngredients from "./RecipeIngredients"
import { AlertTriangle, Download } from "lucide-react"

interface RecipeDetailModalProps {
  open: boolean
  onClose: () => void
  recipeId: string | null
  onEdit?: (id: string) => void
  onDelete?: (recipe: Recipe) => void
  /** ¿La receta es del negocio activo? Sin esto no se ofrece editar/eliminar. */
  canModify?: (recipe: Recipe) => boolean
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
  canModify,
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
  // Propiedad real: solo las recetas de mi negocio (el tipo "preparación base" no bloquea)
  const owned = recipe && canModify ? canModify(recipe) : false
  const canEdit = owned && !!onEdit
  const canDelete = owned && !!onDelete

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={recipe ? recipe.name : "Detalle de receta"}
      wide
      tinted
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
        <div className="flex flex-col gap-3">
          <div className="h-32 animate-pulse" style={{ background: "var(--bg-primary)", borderRadius: 24 }} />
          <div className="h-20 animate-pulse" style={{ background: "var(--bg-primary)", borderRadius: 18 }} />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2.5 px-4 py-4" style={{ background: "#FEF2F2", borderRadius: 18, color: "#B42020" }}>
          <AlertTriangle size={18} />
          <p className="text-sm">{error}</p>
        </div>
      ) : recipe ? (
        <div className="flex flex-col gap-6 pb-2">
          {recipe.description && (
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {recipe.description}
            </p>
          )}

          {/* Lo esencial: a cuánto venderla y cuánto cuesta */}
          {profitability && cost ? (
            <>
              <ModalHero
                label="Véndela a"
                value={COP.format(profitability.potentialSalePrice)}
                note="por porción, precio sugerido"
                aside={
                  <p className="text-right text-sm" style={{ color: "var(--text-muted)" }}>
                    Te queda
                    <span
                      className="block text-xl font-bold tabular-nums"
                      style={{ color: profitability.profitPct > 0 ? "#0F8F5F" : "#C2362B" }}
                    >
                      {COP.format(profitability.profitAmount)}
                    </span>
                    {(profitability.profitPct * 100).toFixed(0)} % del precio
                  </p>
                }
              />
              <StatGrid cols={3}>
                <Stat label="Te cuesta por porción" value={COP.format(cost.costWithMarginPerServing)} hint="ingredientes + margen" />
                <Stat label="Rinde" value={`${Math.round(parseFloat(recipe.servings))} porciones`} hint={recipe.servingWeightG ? `de ${gramsText(parseFloat(recipe.servingWeightG))}` : undefined} />
                <Stat label="Peso total" value={gramsText(totalWeightG)} hint={recipeTypeLabel(recipe.isBase)} />
              </StatGrid>
            </>
          ) : (
            <p className="py-3 text-center text-sm" style={{ color: "var(--text-muted)" }}>
              {costLoading ? "Calculando…" : "No se pudo calcular el costo de esta receta."}
            </p>
          )}

          <Panel title="Ingredientes" aside={`${recipe.items?.length ?? 0}`}>
            <RecipeIngredients
              items={(recipe.items ?? []).map((item, idx) => ({
                key: item.id ?? String(idx),
                name: item.componentType === "recipe" ? (item.subRecipeName ?? "Preparación base") : (item.ingredientName ?? "Ingrediente"),
                grams: parseFloat(item.quantityG) || 0,
                tag: item.componentType === "recipe" ? "Preparación base" : undefined,
              }))}
            />
          </Panel>

          <div className="flex flex-col gap-2.5">
            <Fold title="Costos">
              {cost ? (
                <dl className="m-0">
                  <FactRow label="Materia prima de la receta" value={COP.format(cost.rawCostTotal)} />
                  <FactRow label="Materia prima por porción" value={COP.format(cost.rawCostPerServing)} />
                  <FactRow label={`Con margen de ${parseFloat(recipe.safetyMargin).toFixed(1)} %, receta completa`} value={COP.format(cost.costWithMarginTotal)} />
                  <FactRow label="Con margen, por porción" value={COP.format(cost.costWithMarginPerServing)} tone="accent" />
                  {cost.costPerGram != null && <FactRow label="Costo de 1 gramo, con margen" value={COP.format(cost.costPerGram)} />}
                </dl>
              ) : (
                <p className="py-2 text-sm" style={{ color: "var(--text-muted)" }}>No se pudo calcular el costo.</p>
              )}
            </Fold>

            <Fold title="Rentabilidad">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
                <label htmlFor="recipe-detail-pctmp" className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Parte del precio que se va en ingredientes
                </label>
                <span className="inline-flex items-center gap-1.5">
                  <input
                    id="recipe-detail-pctmp"
                    type="number"
                    min="1"
                    max="99"
                    value={materialCostPct}
                    onChange={(e) => setMaterialCostPct(e.target.value)}
                    className="h-10 w-20 rounded-xl px-3 text-right text-sm font-semibold tabular-nums outline-none focus:shadow-[0_0_0_3px_var(--accent-light)]"
                    style={{ background: "var(--bg-surface)", color: "var(--text-primary)" }}
                  />
                  <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>%</span>
                </span>
              </div>
              {profitability ? (
                <dl className="m-0">
                  <FactRow
                    label="Ingredientes"
                    value={`${(profitability.materialCostPct * 100).toFixed(1)} % · ${ratingText(profitability.materialCostRating)}`}
                    tone={toneOfRating(profitability.materialCostRating)}
                  />
                  <FactRow
                    label="Costos fijos"
                    value={`${(profitability.fixedCostPct * 100).toFixed(1)} % · ${COP.format(profitability.fixedCostAmount)}`}
                  />
                  <FactRow label="Ganancia" value={`${(profitability.profitPct * 100).toFixed(1)} % · ${COP.format(profitability.profitAmount)}`} tone={profitability.profitPct > 0 ? "good" : "bad"} />
                </dl>
              ) : (
                <p className="py-2 text-sm" style={{ color: "var(--text-muted)" }}>Escribe un porcentaje entre 1 y 99.</p>
              )}
              <p className="pt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                Menos de 32 % de ingredientes es muy bueno, de 32 a 37 % regular y más de 37 % malo.
              </p>
            </Fold>

            <Fold title="Ficha técnica">
              <dl className="m-0">
                <FactRow label="Tipo" value={recipeTypeLabel(recipe.isBase)} />
                <FactRow label="N.° de receta" value={recipe.recipeNumber} />
                <FactRow label="Porciones" value={String(Math.round(parseFloat(recipe.servings)))} />
                <FactRow label="Peso por porción" value={recipe.servingWeightG ? gramsText(parseFloat(recipe.servingWeightG)) : "—"} />
                <FactRow label="Margen de seguridad" value={`${parseFloat(recipe.safetyMargin).toFixed(1)} %`} />
              </dl>
            </Fold>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

const ratingText = (r: "MUY_BUENO" | "REGULAR" | "MALO") => (r === "MUY_BUENO" ? "muy bueno" : r === "MALO" ? "malo" : "regular")
