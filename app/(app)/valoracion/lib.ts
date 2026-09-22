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
  return localStorage.getItem(key) ?? fallback
}
export function saveStored(key: string, value: string) {
  if (typeof window !== "undefined") localStorage.setItem(key, value)
}

// ─── Modos de la calculadora ────────────────────────────────────────────────
export type CalculatorMode = "precio-venta" | "porcentaje-mp" | "precio-mp"

export const MODE_LABELS: Record<CalculatorMode, { title: string; result: string }> = {
  "precio-venta": { title: "Precio de venta", result: "Precio de venta del producto" },
  "porcentaje-mp": { title: "Porcentaje de materia prima", result: "Porcentaje de materia prima" },
  "precio-mp": { title: "Precio de materia prima", result: "Precio de materia prima" },
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
