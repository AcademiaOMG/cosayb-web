// Shared Ingredient type used across the inventario feature
// Extends Ingrediente from domain.ts for backward compatibility
import type { Ingrediente } from "./domain"

export type Ingredient = Ingrediente & {
  priceConfirmedAt: string | null
  priceSource: string | null
  sipsaMatchName: string | null
  category: string | null
}

export interface IngredientForm {
  name: string
  costPerUnit: string
  weightGrams: string
}

export type IngredientOriginFilter = "all" | "own" | "base"
