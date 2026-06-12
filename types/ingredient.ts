// Shared Ingredient type used across the inventario feature
export interface Ingredient {
  id: string
  name: string
  costPerUnit: string
  weightGrams: string
  costPerGram: string
  isPublic: boolean
  userId: string | null
}

export interface IngredientForm {
  name: string
  costPerUnit: string
  weightGrams: string
}

export type IngredientOriginFilter = "all" | "own" | "base"
