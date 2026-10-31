// Unidades de las líneas de receta (lógica pura). Espejo de cosayb-api/src/modules/ingredients/units.ts:
// solo se convierte dentro de la misma familia (g↔kg, ml↔l). NUNCA g↔und ni g↔ml.

export type BaseUnit = "g" | "ml" | "und" | "porcion"
export type InputUnit = BaseUnit | "kg" | "l"

const FACTOR: Record<InputUnit, { base: BaseUnit; factor: number }> = {
  g: { base: "g", factor: 1 },
  kg: { base: "g", factor: 1000 },
  ml: { base: "ml", factor: 1 },
  l: { base: "ml", factor: 1000 },
  und: { base: "und", factor: 1 },
  porcion: { base: "porcion", factor: 1 },
}

/** Unidad base de un ingrediente (los datos heredados sin unidad son gramos). */
export function baseUnitOf(ing?: { unit?: BaseUnit | null } | null): BaseUnit {
  return ing?.unit ?? "g"
}

/** Unidades que se pueden elegir en una línea cuya unidad base es `base` (la misma familia). */
export function unitOptionsFor(base: BaseUnit): { value: InputUnit; label: string }[] {
  switch (base) {
    case "g":
      return [{ value: "g", label: "g" }, { value: "kg", label: "kg" }]
    case "ml":
      return [{ value: "ml", label: "ml" }, { value: "l", label: "l" }]
    case "und":
      return [{ value: "und", label: "und" }]
    default:
      return [{ value: "porcion", label: "porc." }]
  }
}

export function unitLabel(unit: InputUnit): string {
  return unit === "porcion" ? "porc." : unit
}

/** Convierte `qty` a la unidad base; null si no son de la misma familia (p. ej. g → und). */
export function toBaseQuantity(qty: number, input: InputUnit, base: BaseUnit): number | null {
  const f = FACTOR[input]
  if (!f || f.base !== base) return null
  return Math.round(qty * f.factor * 100) / 100
}

/** Cantidad en la unidad que se muestra (g→kg cuando se eligió kg). */
export function fromBaseQuantity(qty: number, display: InputUnit): number {
  return qty / FACTOR[display].factor
}

/** Una línea aporta peso solo si está en gramos (las sub-recetas se tratan como gramos). */
export function isMassUnit(unit: BaseUnit | undefined | null): boolean {
  return (unit ?? "g") === "g"
}

/** "30 und", "500 g", "1,5 kg": cantidad legible con su unidad. */
export function quantityText(qty: number, unit: InputUnit): string {
  const n = qty.toLocaleString("es-CO", { maximumFractionDigits: 2 })
  return `${n} ${unitLabel(unit)}`
}
