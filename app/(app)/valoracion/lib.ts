import type { Valuation, ValuationIndicator, ValuationRefType } from "@/types/domain"

// ─── Fórmulas ───────────────────────────────────────────────────────────────
// Espejo exacto de calcularPricing() en cosayb-api/valuations.service.ts —
// misma fórmula en ambos lados evita que el preview en vivo y lo que se
// guarda en el historial muestren números distintos para los mismos datos.
const PCT_IMPUESTOS = 5
const PCT_OTROS = 5

export interface PricingResult {
  suggested: number
  pctMateriaprima: number
  pctFixedCosts: number
  pctImpuestos: number
  pctOtros: number
  pctProfit: number
  indicator: ValuationIndicator
}

export function calcPricing(cost: number, pctMP: number, margin: number): PricingResult | null {
  if (cost <= 0 || pctMP <= 0 || pctMP >= 100) return null
  const pct = pctMP / 100
  const withMargin = cost * (1 + margin / 100)
  const suggested = withMargin / pct
  const pctFixedCosts = ((1 - pct) / 1.8) * 100
  const pctProfitBruto = (1 - (1 - pct) / 1.8 - pct) * 100
  const pctProfit = Math.max(0, pctProfitBruto - PCT_IMPUESTOS - PCT_OTROS)
  const indicator: ValuationIndicator = pct < 0.32 ? "MUY BUENO" : pct > 0.37 ? "MALO" : "REGULAR"
  return {
    suggested,
    pctMateriaprima: pctMP,
    pctFixedCosts,
    pctImpuestos: PCT_IMPUESTOS,
    pctOtros: PCT_OTROS,
    pctProfit,
    indicator,
  }
}

/** Inversa: dado el costo de MP y el precio de venta deseado, ¿qué % de MP resulta? */
export function solvePctFromPrecioVenta(cost: number, precioVenta: number, margin: number): number | null {
  if (cost <= 0 || precioVenta <= 0) return null
  const pctMP = ((cost * (1 + margin / 100)) / precioVenta) * 100
  if (pctMP <= 0 || pctMP >= 100) return null
  return pctMP
}

/** Inversa: dado el precio de venta y el % de MP deseado, ¿qué costo de MP resulta? */
export function solveCostoFromPrecioVenta(precioVenta: number, pctMP: number, margin: number): number | null {
  if (precioVenta <= 0 || pctMP <= 0 || pctMP >= 100) return null
  const cost = (precioVenta * (pctMP / 100)) / (1 + margin / 100)
  if (cost <= 0) return null
  return cost
}

/** Convierte un % del desglose (Costos fijos, Impuestos, Otros, Ganancia) a COP sobre el precio final */
export function moneyFromPct(pct: number, total: number) {
  return (pct / 100) * total
}

// ─── Indicador ────────────────────────────────────────────────────────────────
export const IND: Record<ValuationIndicator, { color: string; bg: string; text: string; sublabel: string }> = {
  "MUY BUENO": { color: "#10B981", bg: "#ECFDF5", text: "#064E3B", sublabel: "Excelente rentabilidad" },
  "REGULAR": { color: "#F59E0B", bg: "#FFFBEB", text: "#78350F", sublabel: "Margen moderado" },
  "MALO": { color: "#EF4444", bg: "#FEF2F2", text: "#7F1D1D", sublabel: "Revisar estructura de costos" },
}

// ─── Formato ──────────────────────────────────────────────────────────────────
export const fmt = (v: number | string) =>
  `$${parseFloat(String(v)).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export const fmtPct = (v: number | string) => `${parseFloat(String(v)).toFixed(1)}%`

export const refLabel = (r: ValuationRefType) =>
  r === "recipe" ? "Receta" : r === "menu" ? "Menú" : "Independiente"

// ─── % Materia Prima y margen: persistencia local ─────────────────────────────
export function getStored(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
export function saveStored(key: string, value: string) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, value)
  } catch {
    // almacenamiento bloqueado (modo privado) — el valor solo no se recuerda
  }
}

// ─── Modos de la calculadora ────────────────────────────────────────────────
// Las tres calculadoras son UNA sola ecuación:
//   precioVenta = costoMP × (1 + margen) ÷ %MP
// cada modo despeja una de las tres variables a partir de las otras dos.
//
// El orden sigue el modelo de datos real: lo que se guarda en el historial es
// (costoMP, %MP, margen) y el precio de venta se DERIVA de ellos
// (calcPricing / calcularPricing en la API). Por eso el recorrido va del dato
// base al resultado final:
//   1. Precio de materia prima — el costo de los ingredientes
//   2. % de materia prima      — qué parte del precio es ese costo (usa 1)
//   3. Precio de venta         — el resultado final (usa 1 y 2) y lo que se guarda
// Cada resultado queda cargado como dato de entrada del paso siguiente.
export type CalculatorMode = "precio-venta" | "porcentaje-mp" | "precio-mp"
export type ValuationField = "costoMP" | "pctMP" | "precioVenta"

export const MODE_ORDER: CalculatorMode[] = ["precio-mp", "porcentaje-mp", "precio-venta"]

export interface ModeMeta {
  /** Nombre del cálculo */
  title: string
  /** La pregunta que responde, en palabras del restaurantero */
  question: string
  /** Qué hace con qué datos — acompaña a la pregunta */
  hint: string
  /** Etiqueta del resultado en la pantalla LCD */
  resultLabel: string
  /** Variable que despeja */
  solves: ValuationField
  /** Las dos variables que necesita, en orden de ingreso */
  inputs: [ValuationField, ValuationField]
}

export const MODE_META: Record<CalculatorMode, ModeMeta> = {
  "precio-mp": {
    title: "Precio de materia prima",
    question: "¿Cuánto puedo gastar en ingredientes?",
    hint: "Con el precio al que vendes el plato y el % que quieres destinar a ingredientes, obtienes tu tope de costo por porción.",
    resultLabel: "PRECIO DE MATERIA PRIMA",
    solves: "costoMP",
    inputs: ["precioVenta", "pctMP"],
  },
  "porcentaje-mp": {
    title: "% de materia prima",
    question: "¿Qué parte del precio se va en ingredientes?",
    hint: "Con lo que te cuestan los ingredientes y el precio de venta, ves qué tanto pesa la materia prima en el plato.",
    resultLabel: "% DE MATERIA PRIMA",
    solves: "pctMP",
    inputs: ["costoMP", "precioVenta"],
  },
  "precio-venta": {
    title: "Precio de venta",
    question: "¿A cuánto debo vender el plato?",
    hint: "Con lo que te cuestan los ingredientes y el % que quieres que representen, obtienes el precio sugerido y su desglose completo.",
    resultLabel: "PRECIO DE VENTA",
    solves: "precioVenta",
    inputs: ["costoMP", "pctMP"],
  },
}

export const FIELD_META: Record<ValuationField, { label: string; lcd: string; missing: string }> = {
  costoMP: { label: "Precio de materia prima", lcd: "PRECIO MATERIA PRIMA", missing: "el precio de materia prima" },
  pctMP: { label: "% de materia prima", lcd: "% MATERIA PRIMA", missing: "el % de materia prima" },
  precioVenta: { label: "Precio de venta", lcd: "PRECIO DE VENTA", missing: "el precio de venta" },
}

export function nextMode(mode: CalculatorMode): CalculatorMode | null {
  const i = MODE_ORDER.indexOf(mode)
  return i >= 0 && i < MODE_ORDER.length - 1 ? MODE_ORDER[i + 1] : null
}

// ─── Resolver un modo ──────────────────────────────────────────────────────
export interface ValuationInputs {
  costoMP: number | null
  pctMP: number | null
  precioVenta: number | null
  margin: number | null
}

export type SolveOutcome =
  | {
      ok: true
      mode: CalculatorMode
      /** Las tres variables resueltas, coherentes entre sí */
      costoMP: number
      pctMP: number
      precioVenta: number
      margin: number
      /** Valor que despejó el modo (el que va en la pantalla) */
      value: number
      pricing: PricingResult
    }
  | {
      ok: false
      mode: CalculatorMode
      reason: "missing" | "invalid"
      /** Registro a señalar en la UI */
      field: ValuationField | "margin"
      message: string
    }

const joinMissing = (fields: ValuationField[]) =>
  fields.map((f) => FIELD_META[f].missing).join(" y ")

/** Qué datos le faltan a un modo — para guiar antes de calcular. */
export function missingInputs(mode: CalculatorMode, v: ValuationInputs): ValuationField[] {
  return MODE_META[mode].inputs.filter((f) => v[f] == null || v[f] === 0)
}

export function describeMissing(fields: ValuationField[]): string {
  return `Falta ${joinMissing(fields)}`
}

/**
 * Resuelve el modo con los datos ingresados. Nunca falla en silencio: si no
 * se puede calcular devuelve QUÉ dato revisar y por qué, para mostrarlo en
 * la pantalla de la calculadora.
 */
export function solveValuation(mode: CalculatorMode, v: ValuationInputs): SolveOutcome {
  const fail = (reason: "missing" | "invalid", field: ValuationField | "margin", message: string): SolveOutcome =>
    ({ ok: false, mode, reason, field, message })

  const missing = missingInputs(mode, v)
  if (missing.length > 0) return fail("missing", missing[0], describeMissing(missing))

  const margin = v.margin ?? 0
  if (margin < 0) return fail("invalid", "margin", "El margen de seguridad no puede ser negativo")

  const needsPct = MODE_META[mode].inputs.includes("pctMP")
  if (needsPct && (v.pctMP! <= 0 || v.pctMP! >= 100)) {
    return fail("invalid", "pctMP", "El % de materia prima debe estar entre 0 y 100")
  }

  let costoMP: number
  let pctMP: number
  if (mode === "precio-venta") {
    costoMP = v.costoMP!
    pctMP = v.pctMP!
  } else if (mode === "porcentaje-mp") {
    costoMP = v.costoMP!
    const solved = solvePctFromPrecioVenta(costoMP, v.precioVenta!, margin)
    if (solved == null) {
      const minPrice = Math.ceil(costoMP * (1 + margin / 100))
      return fail("invalid", "precioVenta", `El precio de venta debe ser mayor a ${fmt(minPrice)}`)
    }
    pctMP = solved
  } else {
    pctMP = v.pctMP!
    const solved = solveCostoFromPrecioVenta(v.precioVenta!, pctMP, margin)
    if (solved == null) return fail("invalid", "precioVenta", "Revisa el precio de venta")
    costoMP = solved
  }

  const pricing = calcPricing(costoMP, pctMP, margin)
  if (!pricing) return fail("invalid", MODE_META[mode].inputs[0], "Revisa los datos ingresados")

  const precioVenta = mode === "precio-venta" ? pricing.suggested : v.precioVenta!
  const value = mode === "precio-venta" ? precioVenta : mode === "porcentaje-mp" ? pctMP : costoMP

  return { ok: true, mode, costoMP, pctMP, precioVenta, margin, value, pricing }
}

// ─── Datos para el panel de guardado ───────────────────────────────────────
export interface SaveFormState {
  name: string
  refType: ValuationRefType
  refId: string | null
  actualPrice: string
  notes: string
}

export const EMPTY_SAVE: SaveFormState = {
  name: "",
  refType: "standalone",
  refId: null,
  actualPrice: "",
  notes: "",
}

export function saveFormFromValuation(v: Valuation): SaveFormState {
  return {
    name: v.name,
    refType: v.refType,
    refId: v.refId,
    actualPrice: v.actualPrice ? parseFloat(v.actualPrice).toString() : "",
    notes: v.notes ?? "",
  }
}
