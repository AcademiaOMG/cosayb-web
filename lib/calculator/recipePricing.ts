// ─── Precio potencial de una receta (hoja FORMATORECETA del Excel) ──────────
// La fórmula base es calcPricing de Valoración. Aquí se llama sin descuentos
// de impuestos/otros porque así lo define el Excel (celda D24).

import { calcPricing } from "@/app/(app)/valoracion/lib"
import type { ValuationIndicator } from "@/types/domain"

export type RecipePricingField = "cost" | "pctMP" | "margin"

export interface RecipePricingInputs {
  /** Costo de materia prima de la receta (o de una porción) */
  cost: number | null
  pctMP: number | null
  margin: number | null
}

export type RecipePricingOutcome =
  | {
      ok: true
      costWithMargin: number
      suggestedPrice: number
      pctMP: number
      pctFixedCosts: number
      pctProfit: number
      indicator: ValuationIndicator
    }
  | { ok: false; reason: "missing" | "invalid"; field: RecipePricingField; message: string }

export function solveRecipePricing(v: RecipePricingInputs): RecipePricingOutcome {
  if (v.cost == null || v.cost <= 0) {
    return { ok: false, reason: "missing", field: "cost", message: "Falta el costo de materia prima" }
  }
  if (v.pctMP == null || v.pctMP === 0) {
    return { ok: false, reason: "missing", field: "pctMP", message: "Falta el % de materia prima" }
  }
  if (v.pctMP < 0 || v.pctMP >= 100) {
    return { ok: false, reason: "invalid", field: "pctMP", message: "El % de materia prima debe estar entre 0 y 100" }
  }
  const margin = v.margin ?? 0
  if (margin < 0) {
    return { ok: false, reason: "invalid", field: "margin", message: "El margen de seguridad no puede ser negativo" }
  }

  const p = calcPricing(v.cost, v.pctMP, margin, { impuestos: 0, otros: 0 })
  if (!p) return { ok: false, reason: "invalid", field: "cost", message: "Revisa los datos ingresados" }

  return {
    ok: true,
    costWithMargin: v.cost * (1 + margin / 100),
    suggestedPrice: p.suggested,
    pctMP: v.pctMP,
    pctFixedCosts: p.pctFixedCosts,
    pctProfit: p.pctProfit,
    indicator: p.indicator,
  }
}
