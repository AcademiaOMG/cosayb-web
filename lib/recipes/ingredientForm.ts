// Lógica pura del formulario de ingrediente (crear / editar / crear desde un selector).
// La unidad decide qué significa "contenido del empaque": gramos si se pesa, unidades si se cuenta.

import type { BaseUnit } from "./units"

/** Unidades que un ingrediente de cocina puede usar (ml y porción quedan para extras de menú). */
export type IngredientUnit = Extract<BaseUnit, "g" | "und">

export interface IngredientFormValues {
  name: string
  costPerUnit: string
  weightGrams: string
  unit: IngredientUnit
}

export const EMPTY_INGREDIENT_FORM: IngredientFormValues = { name: "", costPerUnit: "", weightGrams: "", unit: "g" }

export const INGREDIENT_UNIT_CHOICES: { value: IngredientUnit; label: string; description: string }[] = [
  { value: "g", label: "Por peso (gramos)", description: "Harina, azúcar, sal, carnes…" },
  { value: "und", label: "Por unidades", description: "Huevos, limones, panes…" },
]

/** Etiqueta del campo de contenido según la unidad. */
export function contentLabel(unit: IngredientUnit): string {
  return unit === "und" ? "Unidades por empaque" : "Peso del empaque (g)"
}

export function contentHint(unit: IngredientUnit): string {
  return unit === "und"
    ? "¿Cuántas unidades trae lo que compraste? Ej.: una bandeja de huevos trae 30."
    : "¿Cuántos gramos trae la presentación que compraste?"
}

export function contentPlaceholder(unit: IngredientUnit): string {
  return unit === "und" ? "Ej. 30" : "Ej. 1000"
}

/** Costo de 1 gramo o de 1 unidad (null si faltan datos). */
export function costPerBase(f: Pick<IngredientFormValues, "costPerUnit" | "weightGrams">): number | null {
  const cost = parseFloat(f.costPerUnit)
  const content = parseFloat(f.weightGrams)
  if (!Number.isFinite(cost) || !Number.isFinite(content) || cost < 0 || content <= 0) return null
  return cost / content
}

export interface IngredientFormErrors {
  name?: string
  costPerUnit?: string
  weightGrams?: string
}

/** Validación de campos antes de enviar; el API repite la validación (no es la única barrera). */
export function validateIngredientForm(f: IngredientFormValues): IngredientFormErrors {
  const errors: IngredientFormErrors = {}
  if (!f.name.trim()) errors.name = "Escribe el nombre del ingrediente"
  const cost = parseFloat(f.costPerUnit)
  if (!Number.isFinite(cost) || cost <= 0) errors.costPerUnit = "Escribe el precio de compra"
  const content = parseFloat(f.weightGrams)
  if (!Number.isFinite(content) || content <= 0) {
    errors.weightGrams = f.unit === "und" ? "Escribe cuántas unidades trae el empaque" : "Escribe cuántos gramos trae el empaque"
  } else if (f.unit === "und" && !Number.isInteger(content)) {
    errors.weightGrams = "Las unidades por empaque deben ser un número entero"
  }
  return errors
}

/** Nombre normalizado (sin tildes/signos) para detectar duplicados antes de ir al servidor. */
export function normalizeIngredientName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Ingrediente ya existente con ese nombre (propio o del banco), o undefined. */
export function findDuplicateIngredient<T extends { name: string }>(name: string, existing: T[]): T | undefined {
  const target = normalizeIngredientName(name)
  if (!target) return undefined
  return existing.find((e) => normalizeIngredientName(e.name) === target)
}
