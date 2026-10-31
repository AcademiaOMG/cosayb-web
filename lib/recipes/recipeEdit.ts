// Lógica pura de la edición de recetas por secciones (sin React ni red).
// Una "línea" es un ingrediente o preparación base con cantidad + unidad. El costo se calcula con la
// unidad BASE del ingrediente: cantidad (convertida a base) × costo por unidad base. Nunca g↔und.

import type { RecipeItemPayload } from "@/lib/api"
import { toBaseQuantity, type BaseUnit, type InputUnit } from "./units"

export type LineKind = "ingredient" | "recipe"

export interface EditLine {
  key: string
  kind: LineKind
  /** id del ingrediente o de la preparación base ("" = ya no existe) */
  refId: string
  name: string
  /** Lo que escribió la persona, en `unit` */
  quantity: number
  unit: InputUnit
  /** Unidad base del ingrediente (g para sub-recetas) */
  baseUnit: BaseUnit
}

/** Costo por unidad base de un componente: number = conocido · null = sin costo · undefined = cargando */
export type CostLookup = (kind: LineKind, refId: string) => number | null | undefined

export interface PricedEditLine {
  line: EditLine
  /** Cantidad en la unidad base (null si la unidad no es convertible) */
  baseQuantity: number | null
  costPerBase: number | null
  cost: number | null
  error: string | null
}

/** Error de una línea (null = válida). */
export function lineError(l: Pick<EditLine, "quantity" | "unit" | "baseUnit" | "refId" | "name">): string | null {
  if (!l.refId) return `«${l.name}» ya no existe: quítalo para poder guardar`
  if (!Number.isFinite(l.quantity) || l.quantity <= 0) return "La cantidad debe ser mayor a 0"
  if (toBaseQuantity(l.quantity, l.unit, l.baseUnit) === null) {
    return `Este ingrediente se mide en ${l.baseUnit === "und" ? "unidades" : l.baseUnit}; no se puede usar ${l.unit}`
  }
  return null
}

export function priceEditLines(lines: EditLine[], lookup: CostLookup): { lines: PricedEditLine[]; total: number; unpriced: number; pending: number } {
  let total = 0
  let unpriced = 0
  let pending = 0
  const priced = lines.map((line): PricedEditLine => {
    const baseQuantity = toBaseQuantity(line.quantity, line.unit, line.baseUnit)
    const error = lineError(line)
    const c = lookup(line.kind, line.refId)
    if (c === undefined) {
      pending++
      return { line, baseQuantity, costPerBase: null, cost: null, error }
    }
    if (c === null || !Number.isFinite(c) || baseQuantity === null) {
      unpriced++
      return { line, baseQuantity, costPerBase: null, cost: null, error }
    }
    const cost = baseQuantity * c
    total += cost
    return { line, baseQuantity, costPerBase: c, cost, error }
  })
  return { lines: priced, total, unpriced, pending }
}

/** Primer problema que impide guardar las líneas (null = se puede guardar). */
export function linesProblem(lines: EditLine[]): string | null {
  if (lines.length === 0) return "La receta debe tener al menos un ingrediente"
  for (const l of lines) {
    const e = lineError(l)
    if (e) return `${l.name}: ${e}`
  }
  return null
}

/** Payload de items: se envía lo escrito + su unidad; el API convierte a la base y rechaza lo incompatible. */
export function buildItemsPayload(lines: EditLine[]): RecipeItemPayload[] {
  return lines.map((l, idx) => ({
    componentType: l.kind,
    ingredientId: l.kind === "ingredient" ? l.refId : undefined,
    subRecipeId: l.kind === "recipe" ? l.refId : undefined,
    quantityG: l.quantity,
    unit: l.kind === "recipe" ? "g" : l.unit,
    sortOrder: idx,
  }))
}

export interface CostImpact {
  before: number | null
  after: number | null
  delta: number | null
  pct: number | null
  /** true = vale la pena pedir confirmación (el costo cambia) */
  changes: boolean
}

/** Cambio de costo por porción antes → después; tolera valores desconocidos. */
export function costImpact(before: number | null, after: number | null, epsilon = 0.005): CostImpact {
  if (before == null || after == null) return { before, after, delta: null, pct: null, changes: true }
  const delta = after - before
  const pct = before > 0 ? (delta / before) * 100 : null
  return { before, after, delta, pct, changes: Math.abs(delta) > epsilon }
}

export type EditSection = "general" | "yield" | "ingredients"

/** Secciones cuyo guardado puede modificar costos, rendimientos o cálculos asociados. */
export const SECTION_AFFECTS_COST: Record<EditSection, boolean> = {
  general: false, // nombre, descripción, tipo: no cambian costos
  yield: true, // porciones y margen cambian el costo por porción
  ingredients: true,
}

export interface YieldValues {
  servings: string
  servingWeight: string
  margin: string
}

export interface YieldProblems {
  servings?: string
  servingWeight?: string
  margin?: string
}

export function validateYield(v: YieldValues): YieldProblems {
  const p: YieldProblems = {}
  const servings = parseFloat(v.servings.replace(",", "."))
  if (!Number.isFinite(servings) || servings <= 0) p.servings = "Escribe cuántas porciones salen"
  else if (!Number.isInteger(servings)) p.servings = "Las porciones deben ser un número entero"
  if (v.servingWeight.trim()) {
    const w = parseFloat(v.servingWeight.replace(",", "."))
    if (!Number.isFinite(w) || w <= 0) p.servingWeight = "El peso por porción debe ser mayor a 0"
  }
  const m = parseFloat(v.margin.replace(",", ".") || "0")
  if (!Number.isFinite(m) || m < 0 || m > 5) p.margin = "El margen debe estar entre 0 % y 5 %"
  return p
}

/** Peso total solo de las líneas en gramos (30 und no suman gramos). */
export function totalMassG(lines: EditLine[]): number {
  return lines.reduce((s, l) => {
    if (l.baseUnit !== "g") return s
    return s + (toBaseQuantity(l.quantity, l.unit, l.baseUnit) ?? 0)
  }, 0)
}

/** ¿Cambió algo entre dos listas de líneas? (cantidad, unidad, componente u orden) */
export function linesChanged(a: EditLine[], b: EditLine[]): boolean {
  if (a.length !== b.length) return true
  return a.some((l, i) => l.kind !== b[i].kind || l.refId !== b[i].refId || l.quantity !== b[i].quantity || l.unit !== b[i].unit)
}
