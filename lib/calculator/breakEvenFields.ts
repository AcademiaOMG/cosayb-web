// ─── Campos de costos fijos de la calculadora de punto de equilibrio ─────────
// Lógica pura (sin React): los 9 rubros del Excel ya vienen creados como
// campos; el usuario puede renombrarlos y añadir otros. Los montos viven como
// dígitos crudos ("2000000"), igual que en el resto de registros de la calculadora.

import { parseEntry } from "./entry"
import { BREAK_EVEN_RUBROS } from "./breakEven"

export interface CostField {
  /** Id estable del campo: la clave del rubro ("rent") o "x1", "x2"… en los añadidos */
  id: string
  /** Nombre que se muestra y se guarda en el historial */
  name: string
  /** Rubro predefinido del Excel (no se puede quitar, sí renombrar) */
  preset: boolean
}

export const PRICE_FIELD = "price"
export const VARIABLE_FIELD = "variable"

export const NEW_COST_NAME = "Nuevo costo"
export const COST_NAME_MAX = 40

export const presetCostFields = (): CostField[] =>
  BREAK_EVEN_RUBROS.map((r) => ({ id: r.key, name: r.name, preset: true }))

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()

const toRaw = (n: number) => String(Math.round(n))

/**
 * Campos y montos iniciales. Sin registro previo: los 9 rubros en blanco.
 * Con registro: cada costo cuyo nombre coincide (sin tildes ni mayúsculas) con
 * un rubro rellena ese campo (si se repite, suma); el resto crea un campo
 * añadido con su propio nombre. Los montos en 0 o sin nombre no se precargan.
 */
export function prefillCostFields(costs: { name: string; amount: number }[] = []): {
  fields: CostField[]
  values: Record<string, string>
  nextExtra: number
} {
  const fields = presetCostFields()
  const totals: Record<string, number> = {}
  let nextExtra = 1
  for (const c of costs) {
    const name = String(c.name ?? "").trim()
    const amount = Number(c.amount)
    if (name === "" || !Number.isFinite(amount) || amount <= 0) continue
    const key = normalize(name)
    const field =
      fields.find((f) => normalize(f.name) === key) ??
      (() => {
        const added: CostField = { id: `x${nextExtra++}`, name: name.slice(0, COST_NAME_MAX), preset: false }
        fields.push(added)
        return added
      })()
    totals[field.id] = (totals[field.id] ?? 0) + amount
  }
  const values: Record<string, string> = {}
  for (const f of fields) values[f.id] = totals[f.id] ? toRaw(totals[f.id]) : ""
  return { fields, values, nextExtra }
}

const amountOf = (values: Record<string, string>, id: string) => Math.max(0, parseEntry(values[id] ?? "") ?? 0)

/** Total de los costos con monto: campos vacíos o en 0 no cuentan. */
export function sumCostFields(fields: CostField[], values: Record<string, string>): number {
  return fields.reduce((s, f) => s + amountOf(values, f.id), 0)
}

/** Costos listos para guardar: solo los que tienen monto > 0. */
export function fixedCostsFromFields(
  fields: CostField[],
  values: Record<string, string>,
): { name: string; amount: number }[] {
  return fields.flatMap((f) => (amountOf(values, f.id) > 0 ? [{ name: f.name.trim(), amount: amountOf(values, f.id) }] : []))
}
