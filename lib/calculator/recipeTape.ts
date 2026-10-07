// ─── Calculadora de receta con cinta (hoja FORMATORECETA del Excel) ─────────
// Lógica pura, sin React. La "cinta" es la lista de líneas (ingrediente o
// receta base + gramos) que se suman como en una sumadora con rollo de papel.
//
// El Excel pide la cantidad POR PORCIÓN y la multiplica por el número de
// personas; la API guarda los gramos TOTALES de la receta. Son equivalentes:
// costo por porción = costo total / porciones.

import { solveRecipePricing, type RecipePricingOutcome } from "./recipePricing"

export type TapeKind = "ingredient" | "recipe"

export interface TapeLine {
  key: string
  kind: TapeKind
  refId: string
  name: string
  grams: number
}

/**
 * Costo por gramo de un componente.
 * number = conocido · null = no disponible · undefined = todavía cargando.
 */
export type CostLookup = (kind: TapeKind, refId: string) => number | null | undefined

export interface PricedLine {
  line: TapeLine
  costPerGram: number | null
  /** gramos × costo del gramo; null si el costo no está disponible */
  cost: number | null
  pending: boolean
}

export interface PricedTape {
  lines: PricedLine[]
  totalGrams: number
  /** Suma de costos de las líneas con costo conocido (sin margen) */
  rawCost: number
  /** Líneas cuyo costo no se pudo obtener (no suman) */
  unpriced: number
  /** Líneas cuyo costo todavía se está cargando */
  pending: number
  /** Cambia si cambia cualquier línea o costo: invalida un cálculo anterior */
  signature: string
}

export function priceTape(lines: TapeLine[], lookup: CostLookup): PricedTape {
  let totalGrams = 0
  let rawCost = 0
  let unpriced = 0
  let pending = 0
  const priced = lines.map((line): PricedLine => {
    const cpg = lookup(line.kind, line.refId)
    totalGrams += line.grams
    if (cpg === undefined) {
      pending++
      return { line, costPerGram: null, cost: null, pending: true }
    }
    if (cpg === null || !Number.isFinite(cpg)) {
      unpriced++
      return { line, costPerGram: null, cost: null, pending: false }
    }
    const cost = line.grams * cpg
    rawCost += cost
    return { line, costPerGram: cpg, cost, pending: false }
  })
  const signature = priced.map((p) => `${p.line.key}:${p.line.grams}:${p.costPerGram ?? "x"}`).join("|")
  return { lines: priced, totalGrams, rawCost, unpriced, pending, signature }
}

/** Mueve una línea de `from` a `to` (devuelve una copia; índices fuera de rango no cambian nada). */
export function moveLine<T>(lines: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= lines.length || to >= lines.length) return lines
  const next = [...lines]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/** Margen de seguridad válido: 0 a 5 % (null/vacío cuenta como 0). */
export function validateSafetyMargin(margin: number | null): string | null {
  const m = margin ?? 0
  if (m < 0 || m > 5) return "El margen de seguridad debe estar entre 0% y 5%."
  return null
}

/** Peso por porción por defecto = peso total / porciones, a un decimal (como el formulario anterior). */
export function defaultServingWeight(totalGrams: number, servings: number): number | null {
  if (servings <= 0 || totalGrams <= 0) return null
  return parseFloat((totalGrams / servings).toFixed(1))
}

export type RecipeTapeField = "grams" | "servings" | "pctMP" | "margin"

export interface RecipeTapeInputs {
  grams: number | null
  servings: number | null
  pctMP: number | null
  margin: number | null
}

export type RecipeTapeOutcome =
  | {
      ok: true
      signature: string
      servings: number
      totalGrams: number
      servingWeightG: number | null
      /** Hoja: "COSTO 1 GRAMO" (costo sin margen / peso) */
      costPerGram: number
      rawCostTotal: number
      rawCostPerServing: number
      costWithMarginTotal: number
      costWithMarginPerServing: number
      /** Precio potencial por porción (D23) y de la receta completa (F23) */
      pricePerServing: number
      priceTotal: number
      pricing: Extract<RecipePricingOutcome, { ok: true }>
    }
  | { ok: false; field: RecipeTapeField; message: string }

/** Fórmulas de la hoja con la cinta ya sumada. `grams` solo se usa como campo de error. */
export function solveRecipeTape(v: RecipeTapeInputs, tape: PricedTape): RecipeTapeOutcome {
  if (tape.lines.length === 0) {
    return { ok: false, field: "grams", message: "Agrega al menos un ingrediente a la cinta" }
  }
  if (tape.pending > 0) {
    return { ok: false, field: "grams", message: "Espera: aún se cargan los costos de la cinta" }
  }
  if (tape.rawCost <= 0) {
    return { ok: false, field: "grams", message: "La cinta no suma costo: revisa los precios de los ingredientes" }
  }
  const servings = v.servings
  if (servings == null || servings <= 0) {
    return { ok: false, field: "servings", message: "Falta el número de porciones" }
  }
  if (!Number.isInteger(servings)) {
    return { ok: false, field: "servings", message: "Las porciones deben ser un número entero" }
  }
  const marginError = validateSafetyMargin(v.margin)
  if (marginError) return { ok: false, field: "margin", message: marginError }

  const rawCostPerServing = tape.rawCost / servings
  const pricing = solveRecipePricing({ cost: rawCostPerServing, pctMP: v.pctMP, margin: v.margin ?? 0 })
  if (!pricing.ok) {
    return { ok: false, field: pricing.field === "cost" ? "grams" : pricing.field, message: pricing.message }
  }

  return {
    ok: true,
    signature: tape.signature,
    servings,
    totalGrams: tape.totalGrams,
    servingWeightG: defaultServingWeight(tape.totalGrams, servings),
    costPerGram: tape.totalGrams > 0 ? tape.rawCost / tape.totalGrams : 0,
    rawCostTotal: tape.rawCost,
    rawCostPerServing,
    costWithMarginTotal: pricing.costWithMargin * servings,
    costWithMarginPerServing: pricing.costWithMargin,
    pricePerServing: pricing.suggestedPrice,
    priceTotal: pricing.suggestedPrice * servings,
    pricing,
  }
}
