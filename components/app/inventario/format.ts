import type { Ingredient } from "@/types/ingredient"

const STALE_MS = 30 * 24 * 60 * 60 * 1000

/** "$14.500" */
export function formatCOP(value: string | number): string {
  const n = typeof value === "number" ? value : parseFloat(value)
  if (!Number.isFinite(n)) return "—"
  return `$${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`
}

/** "1.500 g" */
export function formatGrams(value: string | number): string {
  const n = typeof value === "number" ? value : parseFloat(value)
  if (!Number.isFinite(n)) return "—"
  return `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })} g`
}

/** "$9,67" — sin sufijo, el contexto (columna o "/g") lo aporta */
export function formatPerGram(value: string | number): string {
  const n = typeof value === "number" ? value : parseFloat(value)
  if (!Number.isFinite(n)) return "—"
  // Siempre dos decimales para que la columna alinee por la coma.
  // Solo valores ínfimos (< $0,10/g) necesitan un decimal más para no verse como $0,00.
  const digits = n > 0 && n < 0.1 ? 3 : 2
  return `$${n.toLocaleString("es-CO", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
}

/**
 * El banco general guarda nombres en MAYÚSCULAS. En una lista densa eso
 * se lee como un grito y cuesta escanear, así que solo para mostrar lo
 * pasamos a tipo oración. Nombres con mayúsculas mixtas se respetan tal cual.
 */
export function displayName(name: string): string {
  const trimmed = name.trim()
  if (trimmed !== trimmed.toUpperCase() || !/[A-ZÁÉÍÓÚÑ]/.test(trimmed)) return trimmed
  const lower = trimmed.toLocaleLowerCase("es-CO")
  return lower.charAt(0).toLocaleUpperCase("es-CO") + lower.slice(1)
}

/** Para buscar: minúsculas y sin tildes ("azucar" encuentra "AZÚCAR") */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

export type PriceStatus = "confirmed" | "stale" | "pending"

export function getPriceStatus(ingredient: Pick<Ingredient, "priceConfirmedAt">): PriceStatus {
  if (!ingredient.priceConfirmedAt) return "pending"
  const age = Date.now() - new Date(ingredient.priceConfirmedAt).getTime()
  return age > STALE_MS ? "stale" : "confirmed"
}

export function isOwnIngredient(ingredient: Pick<Ingredient, "userId">): boolean {
  return ingredient.userId !== null
}
