import type { Ingrediente as Ingredient, Recipe } from "@/types/domain"
import type { RecipeItemPayload } from "@/lib/api"
import { createRecipe, updateRecipe, getRecipeById, getBaseRecipes, getRecipeCost, fetchAPI } from "@/lib/api"

export interface RecipePayload {
  name: string
  recipeNumber: string
  servings: number
  servingWeightG?: number
  safetyMargin: number
  isBase: boolean
  description?: string | null
  items: RecipeItemPayload[]
}

/**
 * Fuente de datos inyectable: la MISMA calculadora de receta sirve al Tenant
 * Workspace (recetas de la organización) y al Content Studio del banco público
 * (Platform Console), con distinto submit handler y distinto catálogo.
 */
export interface RecipeFormDataSource {
  /** Clave para el caché SWR — debe diferir entre superficies */
  sourceKey: string
  loadCatalog: () => Promise<{ ingredients: Ingredient[]; baseRecipes: Recipe[] }>
  loadRecipe: (id: string) => Promise<Recipe>
  create: (payload: RecipePayload) => Promise<unknown>
  update: (id: string, payload: RecipePayload) => Promise<unknown>
  /**
   * Costo por gramo de una receta base (null si no se puede conocer). Es
   * opcional: sin él, las recetas base de la cinta no suman al costo y la
   * pantalla lo avisa.
   */
  loadCostPerGram?: (recipeId: string) => Promise<number | null>
  /** Dónde se crean ingredientes en esta superficie (para guiar si el catálogo está vacío) */
  ingredientsHref?: string
}

/** Fuente por defecto: recetas del tenant activo */
export const TENANT_SOURCE: RecipeFormDataSource = {
  sourceKey: "tenant",
  ingredientsHref: "/inventario",
  loadCatalog: async () => {
    // Los ingredientes son indispensables: si fallan, se avisa (antes se mostraba
    // "No hay ingredientes" como si el negocio no tuviera ninguno). Las recetas
    // base sí son opcionales.
    const [ingRes, baseRes] = await Promise.all([
      fetchAPI("/api/v1/ingredients"),
      getBaseRecipes().catch(() => ({ data: [] as Recipe[] })),
    ])
    return { ingredients: (ingRes as { data: Ingredient[] }).data ?? [], baseRecipes: baseRes.data ?? [] }
  },
  loadRecipe: (id) => getRecipeById(id).then((r) => r.data),
  create: (payload) => createRecipe(payload),
  update: (id, payload) => updateRecipe(id, payload),
  loadCostPerGram: (id) => getRecipeCost(id).then((r) => r.data.costPerGram),
}
