// ─── Punto de equilibrio (hoja PUNTOEKILIBRIO del Excel) ────────────────────
// Lógica pura. Los días del mes son 30, como en la celda I10 del Excel.
// Espejo de calcularBreakEven() en cosayb-api para unidades e ingresos.

export type BreakEvenField = "fixedCosts" | "salePrice" | "variableCost"

export interface BreakEvenInputs {
  fixedCosts: number | null
  salePrice: number | null
  variableCost: number | null
}

export type BreakEvenOutcome =
  | {
      ok: true
      fixedCosts: number
      salePrice: number
      variableCost: number
      contributionMargin: number
      unitsPerMonth: number
      unitsPerDay: number
      revenuePerMonth: number
      revenuePerDay: number
    }
  | { ok: false; reason: "missing" | "invalid"; field: BreakEvenField; message: string }

export const BREAK_EVEN_DAYS = 30

export const BREAK_EVEN_FIELD_META: Record<BreakEvenField, { label: string; lcd: string; missing: string }> = {
  fixedCosts: { label: "Costos fijos del mes", lcd: "COSTOS FIJOS DEL MES", missing: "los costos fijos" },
  salePrice: { label: "Precio de venta", lcd: "PRECIO DE VENTA", missing: "el precio de venta" },
  variableCost: { label: "Costos variables por producto", lcd: "COSTO VARIABLE", missing: "el costo variable" },
}

const REQUIRED: BreakEvenField[] = ["fixedCosts", "salePrice", "variableCost"]

/** El costo variable puede ser 0 (un producto sin insumos); los otros dos no. */
export function missingBreakEvenInputs(v: BreakEvenInputs): BreakEvenField[] {
  return REQUIRED.filter((f) => (f === "variableCost" ? v[f] == null : v[f] == null || v[f] === 0))
}

export function describeBreakEvenMissing(fields: BreakEvenField[]): string {
  return `Falta ${fields.map((f) => BREAK_EVEN_FIELD_META[f].missing).join(" y ")}`
}

export function solveBreakEven(v: BreakEvenInputs): BreakEvenOutcome {
  const missing = missingBreakEvenInputs(v)
  if (missing.length > 0) {
    return { ok: false, reason: "missing", field: missing[0], message: describeBreakEvenMissing(missing) }
  }
  const fixedCosts = v.fixedCosts!
  const salePrice = v.salePrice!
  const variableCost = v.variableCost!

  const contributionMargin = salePrice - variableCost
  if (contributionMargin <= 0) {
    return {
      ok: false,
      reason: "invalid",
      field: "salePrice",
      message: "El precio de venta debe ser mayor al costo variable",
    }
  }

  const unitsPerMonth = fixedCosts / contributionMargin
  const unitsPerDay = unitsPerMonth / BREAK_EVEN_DAYS
  return {
    ok: true,
    fixedCosts,
    salePrice,
    variableCost,
    contributionMargin,
    unitsPerMonth,
    unitsPerDay,
    revenuePerMonth: unitsPerMonth * salePrice,
    revenuePerDay: unitsPerDay * salePrice,
  }
}

// ─── Rubros de costos fijos (celdas E7:E16 de la hoja PUNTOEKILIBRIO) ────────

export type BreakEvenRubro =
  | "rent"
  | "salaries"
  | "water"
  | "energy"
  | "gas"
  | "phone"
  | "marketing"
  | "taxes"
  | "other"

export interface BreakEvenRubroMeta {
  key: BreakEvenRubro
  /** Nombre que se guarda en el historial */
  name: string
  /** Etiqueta corta del registro de la calculadora */
  lcd: string
  group: "main" | "services"
  /** Palabras (sin tildes, minúsculas) que identifican el rubro en registros viejos: empiezan una palabra; con "$" al final, deben ser la palabra completa ("gas" no es "gastos") */
  aliases: string[]
}

export const BREAK_EVEN_RUBROS: BreakEvenRubroMeta[] = [
  { key: "rent", name: "Arriendo", lcd: "ARRIENDO", group: "main", aliases: ["arriendo", "alquiler", "canon", "renta"] },
  { key: "salaries", name: "Sueldos", lcd: "SUELDOS", group: "main", aliases: ["sueldo", "salario", "nomina", "personal", "empleado"] },
  { key: "water", name: "Agua", lcd: "AGUA", group: "services", aliases: ["agua", "acueducto"] },
  { key: "energy", name: "Energía", lcd: "ENERGÍA", group: "services", aliases: ["energia", "luz", "electric"] },
  { key: "gas", name: "Gas", lcd: "GAS", group: "services", aliases: ["gas$"] },
  { key: "phone", name: "Teléfonos", lcd: "TELÉFONOS", group: "services", aliases: ["telefono", "celular", "internet", "movil"] },
  { key: "marketing", name: "Marketing digital", lcd: "MARKETING DIGITAL", group: "services", aliases: ["marketing", "publicidad", "redes", "pauta"] },
  { key: "taxes", name: "Impuestos", lcd: "IMPUESTOS", group: "services", aliases: ["impuesto", "predial", "iva$", "declaracion"] },
  { key: "other", name: "Otros", lcd: "OTROS", group: "services", aliases: ["otro"] },
]

export const BREAK_EVEN_RUBRO_KEYS = BREAK_EVEN_RUBROS.map((r) => r.key)

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()

function aliasMatches(normalized: string, alias: string): boolean {
  const whole = alias.endsWith("$")
  const word = whole ? alias.slice(0, -1) : alias
  return new RegExp(`(^|[^a-z])${word}${whole ? "($|[^a-z])" : ""}`).test(normalized)
}

/** Rubro al que corresponde un nombre libre; sin coincidencia → "other". */
export function rubroForName(name: string): BreakEvenRubro {
  const n = normalize(name)
  // Impuestos primero: "impuesto de renta" no es arriendo.
  const order: BreakEvenRubro[] = ["taxes", "rent", "salaries", "water", "energy", "gas", "phone", "marketing"]
  for (const key of order) {
    const meta = BREAK_EVEN_RUBROS.find((r) => r.key === key)!
    if (meta.aliases.some((alias) => aliasMatches(n, alias))) return key
  }
  return "other"
}

/** Reparte costos fijos libres (registros viejos) en los rubros; lo que no coincide suma en "Otros". */
export function distributeFixedCosts(items: { name: string; amount: number }[]): Record<BreakEvenRubro, number> {
  const out = Object.fromEntries(BREAK_EVEN_RUBRO_KEYS.map((k) => [k, 0])) as Record<BreakEvenRubro, number>
  for (const item of items) {
    const amount = Number(item.amount)
    if (!Number.isFinite(amount) || amount <= 0) continue
    out[rubroForName(item.name)] += amount
  }
  return out
}

/** Rubros con monto > 0 listos para la API (`fixedCosts`). */
export function rubrosToFixedCosts(values: Record<BreakEvenRubro, number | null>): { name: string; amount: number }[] {
  return BREAK_EVEN_RUBROS.flatMap((r) => ((values[r.key] ?? 0) > 0 ? [{ name: r.name, amount: values[r.key] as number }] : []))
}

export function sumRubros(values: Record<BreakEvenRubro, number | null>): number {
  return BREAK_EVEN_RUBROS.reduce((s, r) => s + (values[r.key] ?? 0), 0)
}

/** Por día a partir de lo mensual (30 días, como la celda I10 del Excel) */
export const perDay = (monthly: number) => monthly / BREAK_EVEN_DAYS
