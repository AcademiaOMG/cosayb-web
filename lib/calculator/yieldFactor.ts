// ─── Factor de rendimiento (hojas FDRPROTEINAS y FDRVEGETALES del Excel) ─────
// Lógica pura. Las cuatro bajas son espacios (waste1…waste4) cuyo nombre
// depende del tipo de ingrediente: son las filas 10–13 de proteínas y 9–12 de
// vegetales. Las fórmulas son idénticas en ambas hojas.

export type YieldVariant = "bfactor" | "bfactorveg"

export type WasteField = "waste1" | "waste2" | "waste3" | "waste4"
export type YieldField = "totalCost" | "totalWeight" | WasteField

export type YieldInputs = Record<YieldField, number | null>

export const WASTE_FIELDS: WasteField[] = ["waste1", "waste2", "waste3", "waste4"]

/** Nombre guardado en el historial y etiqueta corta de la pantalla, por tipo. */
export const YIELD_WASTE_SLOTS: Record<YieldVariant, { name: string; short: string }[]> = {
  bfactor: [
    { name: "Huesos, cartílagos, caparazón", short: "HUESOS" },
    { name: "Grasa", short: "GRASA" },
    { name: "Cueros", short: "CUEROS" },
    { name: "Agua bolsas", short: "AGUA BOLSAS" },
  ],
  bfactorveg: [
    { name: "Cáscaras", short: "CÁSCARAS" },
    { name: "Pepas", short: "PEPAS" },
    { name: "Agua", short: "AGUA" },
    { name: "Bolsa", short: "BOLSA" },
  ],
}

export const YIELD_FIELD_META: Record<"totalCost" | "totalWeight", { label: string; lcd: string; missing: string }> = {
  totalCost: { label: "Costo total", lcd: "COSTO TOTAL", missing: "el costo total" },
  totalWeight: { label: "Peso total en gramos", lcd: "PESO TOTAL (G)", missing: "el peso total" },
}

export type YieldOutcome =
  | {
      ok: true
      costPerGram: number
      wasteWeight: number
      wasteCost: number
      /** Costo en $ de cada baja (costo/g × gramos) */
      wasteCosts: Record<WasteField, number>
      netWeight: number
      newCostPerGram: number
      /** Fracción 0–1 (el Excel lo muestra como %) */
      yieldFactor: number
    }
  | { ok: false; reason: "missing" | "invalid"; field: YieldField; message: string }

export function missingYieldInputs(v: YieldInputs): ("totalCost" | "totalWeight")[] {
  return (["totalCost", "totalWeight"] as const).filter((f) => v[f] == null || v[f] === 0)
}

export function describeYieldMissing(fields: ("totalCost" | "totalWeight")[]): string {
  return `Falta ${fields.map((f) => YIELD_FIELD_META[f].missing).join(" y ")}`
}

export function solveYieldFactor(v: YieldInputs): YieldOutcome {
  const missing = missingYieldInputs(v)
  if (missing.length > 0) {
    return { ok: false, reason: "missing", field: missing[0], message: describeYieldMissing(missing) }
  }
  const totalCost = v.totalCost!
  const totalWeight = v.totalWeight!

  const costPerGram = totalCost / totalWeight
  const wasteWeights = Object.fromEntries(WASTE_FIELDS.map((f) => [f, v[f] ?? 0])) as Record<WasteField, number>
  const wasteWeight = WASTE_FIELDS.reduce((s, f) => s + wasteWeights[f], 0)
  const netWeight = totalWeight - wasteWeight
  if (netWeight <= 0) {
    return {
      ok: false,
      reason: "invalid",
      field: "totalWeight",
      message: "Las bajas no pueden ser iguales o mayores al peso total",
    }
  }

  const wasteCosts = Object.fromEntries(WASTE_FIELDS.map((f) => [f, wasteWeights[f] * costPerGram])) as Record<WasteField, number>
  return {
    ok: true,
    costPerGram,
    wasteWeight,
    wasteCost: wasteWeight * costPerGram,
    wasteCosts,
    netWeight,
    newCostPerGram: totalCost / netWeight,
    yieldFactor: netWeight / totalWeight,
  }
}

// ─── Historial → calculadora ────────────────────────────────────────────────
export interface WasteEntry {
  name: string
  weightGrams: number
}

/**
 * Coloca los desperdicios de un registro (lista libre) en los cuatro espacios.
 * Los que coinciden por nombre con el tipo van a su espacio; los demás ocupan
 * los espacios libres CONSERVANDO su nombre; si no caben, se suman en el
 * último como "Otros desperdicios". Así editar un registro viejo no pierde
 * gramos ni renombra datos.
 */
export function placeWastes(variant: YieldVariant, items: WasteEntry[]): { grams: (number | null)[]; names: string[] } {
  const slots = YIELD_WASTE_SLOTS[variant]
  const grams: (number | null)[] = [null, null, null, null]
  const names = slots.map((s) => s.name)
  const leftovers: WasteEntry[] = []

  for (const item of items) {
    const i = slots.findIndex((s) => s.name.toLowerCase() === item.name.trim().toLowerCase())
    if (i >= 0 && grams[i] == null) grams[i] = item.weightGrams
    else leftovers.push(item)
  }
  for (const item of leftovers) {
    const free = grams.findIndex((g) => g == null)
    if (free >= 0) {
      grams[free] = item.weightGrams
      names[free] = item.name.trim() || names[free]
    } else {
      grams[3] = (grams[3] ?? 0) + item.weightGrams
      names[3] = "Otros desperdicios"
    }
  }
  return { grams, names }
}
