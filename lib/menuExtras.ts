import type { Ingrediente } from "@/types/domain"

/**
 * Extras del menú (vasos, platos, bebidas, acompañamientos…).
 * Funciones puras: espejo de api/src/modules/ingredients/units.ts.
 *
 * Modelo: un extra es una fila de `ingredients` con kind='extra' y una unidad base
 * (und | ml | g | porcion). `weightGrams` guarda el CONTENIDO del empaque en esa unidad
 * y `costPerGram` el costo por 1 unidad base.
 */
export type ExtraUnit = "und" | "ml" | "g" | "porcion"

export const EXTRA_UNITS: { value: ExtraUnit; label: string; plural: string }[] = [
  { value: "und", label: "Unidad", plural: "unidades" },
  { value: "porcion", label: "Porción", plural: "porciones" },
  { value: "ml", label: "Mililitros (ml)", plural: "ml" },
  { value: "g", label: "Gramos (g)", plural: "g" },
]

/** Abreviatura corta para mostrar junto a una cantidad. */
export function unitShort(unit: ExtraUnit): string {
  return unit === "porcion" ? "porc." : unit
}

/** Nombre normalizado: sin tildes, minúsculas, sin signos y con espacios colapsados. */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function findDuplicateByName<T extends { name: string }>(name: string, list: T[]): T | undefined {
  const target = normalizeName(name)
  if (!target) return undefined
  return list.find((x) => normalizeName(x.name) === target)
}

/** Costo por 1 unidad base = costo del empaque / contenido. */
export function costPerBaseUnit(packCost: number, packContent: number): number {
  if (!(packContent > 0)) throw new Error("El contenido del empaque debe ser mayor a 0")
  return Number((packCost / packContent).toFixed(4))
}

export function isExtra(ing: Pick<Ingrediente, "kind">): boolean {
  return ing.kind === "extra"
}

/** Unidad en que se cuenta la cantidad por persona de un ítem 'ingredient' del menú. */
export function menuUnitOf(ing: Pick<Ingrediente, "kind" | "unit">): ExtraUnit {
  return ing.kind === "extra" && ing.unit ? (ing.unit as ExtraUnit) : "und"
}

/**
 * Costo por unidad de la línea de menú: extras → costo por unidad base;
 * ingredientes legados → costo del empaque (comportamiento anterior intacto).
 */
export function menuUnitCost(ing: Pick<Ingrediente, "kind" | "costPerUnit" | "costPerGram">): number {
  return ing.kind === "extra" ? parseFloat(ing.costPerGram) : parseFloat(ing.costPerUnit)
}

/** Valores iniciales del formulario de extras al editar uno existente (misma semántica que al crear). */
export function extraFormFromIngredient(
  ing: Pick<Ingrediente, "name" | "unit" | "costPerUnit" | "weightGrams">,
): ExtraFormInput {
  const unit = (ing.unit as ExtraUnit | undefined) ?? "und"
  return {
    name: ing.name,
    unit,
    cost: String(parseFloat(ing.costPerUnit)),
    content: String(parseFloat(ing.weightGrams)),
  }
}

/** Texto compacto "unidad" para mostrar en listados (p. ej. "und", "ml", "porc."). */
export function extraUnitLabel(ing: Pick<Ingrediente, "kind" | "unit">): string | null {
  return ing.kind === "extra" ? unitShort(menuUnitOf(ing)) : null
}

/** Para selectores de RECETAS: los extras (vasos, bebidas…) no son ingredientes de receta. */
export function onlyRecipeIngredients<T extends Pick<Ingrediente, "kind">>(list: T[]): T[] {
  return list.filter((i) => i.kind !== "extra")
}

export interface ExtraFormInput {
  name: string
  unit: ExtraUnit
  /** Costo del empaque (o de la unidad si el contenido es 1), crudo del input */
  cost: string
  /** Contenido del empaque en la unidad elegida (por defecto 1) */
  content: string
}

export type ExtraFormErrors = Partial<Record<"name" | "cost" | "content", string>>

export interface ExtraPayload {
  name: string
  kind: "extra"
  unit: ExtraUnit
  costPerUnit: number
  weightGrams: number
}

/** Valida el formulario compacto y arma el payload; `existing` evita duplicados por nombre normalizado. */
export function validateExtraForm(
  input: ExtraFormInput,
  existing: Pick<Ingrediente, "id" | "name">[],
  /** Al editar: id del extra que se edita (no cuenta como duplicado de sí mismo) */
  editingId?: string,
): { ok: true; payload: ExtraPayload } | { ok: false; errors: ExtraFormErrors; duplicate?: Pick<Ingrediente, "id" | "name"> } {
  const errors: ExtraFormErrors = {}
  const name = input.name.trim().replace(/\s+/g, " ")
  const cost = parseFloat(input.cost.replace(",", "."))
  const content = input.content.trim() === "" ? 1 : parseFloat(input.content.replace(",", "."))

  if (!name) errors.name = "Escribe el nombre del extra"
  else if (name.length > 120) errors.name = "El nombre es demasiado largo"
  const duplicate = name ? findDuplicateByName(name, editingId ? existing.filter((x) => x.id !== editingId) : existing) : undefined
  if (duplicate) errors.name = `Ya existe «${duplicate.name}» en tu inventario`
  if (!(cost > 0)) errors.cost = "El costo debe ser mayor a 0"
  if (!(content > 0)) errors.content = "El contenido debe ser mayor a 0"

  if (Object.keys(errors).length > 0) return { ok: false, errors, duplicate }
  return {
    ok: true,
    payload: { name, kind: "extra", unit: input.unit, costPerUnit: cost, weightGrams: content },
  }
}
