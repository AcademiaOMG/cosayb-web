import type { Ingrediente, FactorRendimiento, Receta, Menu, CostoMenuResult, Valoracion, Valuation, ValuationRefType, PuntoEquilibrio } from "@/types/domain"
import type { ApiResponse } from "@/types/api"

// ─── URL base ─────────────────────────────────────────────────────────────────
// NEXT_PUBLIC_API_URL debe apuntar al backend Express (puerto 3000 en local).
// En producción, setear la variable de entorno en el proveedor de hosting.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

// ─── Fetcher genérico ─────────────────────────────────────────────────────────
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // necesario para enviar cookies de sesión (Better Auth)
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    let message = response.statusText
    try {
      const body = JSON.parse(text)
      if (body.error) message = body.error
      else if (body.message) message = body.message
    } catch {
      if (text) message = text
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

// ─── Tipos de respuesta del backend ──────────────────────────────────────────
// El backend devuelve { data, total } — sin paginación por cursor todavía.
export interface ListResponse<T> {
  data: T[]
  total: number
}

// ─── Ingredientes ─────────────────────────────────────────────────────────────

/** GET /api/v1/ingredients — público; si hay cookie de sesión devuelve propios + públicos */
export async function getIngredientes(): Promise<ListResponse<Ingrediente>> {
  return fetchAPI("/api/v1/ingredients")
}

/** POST /api/v1/ingredients — requiere sesión */
export async function createIngrediente(
  data: Pick<Ingrediente, "name" | "costPerUnit" | "weightGrams" | "isPublic">
): Promise<ApiResponse<Ingrediente>> {
  return fetchAPI("/api/v1/ingredients", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      costPerUnit: parseFloat(data.costPerUnit),   // backend espera number
      weightGrams: parseFloat(data.weightGrams),   // backend espera number
      isPublic: data.isPublic,
    }),
  })
}

/** PUT /api/v1/ingredients/:id — requiere sesión; solo campos propios */
export async function updateIngrediente(
  id: string,
  data: Partial<Pick<Ingrediente, "name" | "costPerUnit" | "weightGrams" | "isPublic">>
): Promise<ApiResponse<Ingrediente>> {
  const body: Record<string, unknown> = {}
  if (data.name !== undefined) body.name = data.name
  if (data.costPerUnit !== undefined) body.costPerUnit = parseFloat(data.costPerUnit)
  if (data.weightGrams !== undefined) body.weightGrams = parseFloat(data.weightGrams)
  if (data.isPublic !== undefined) body.isPublic = data.isPublic

  return fetchAPI(`/api/v1/ingredients/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

/** DELETE /api/v1/ingredients/:id — requiere sesión */
export async function deleteIngrediente(id: string): Promise<void> {
  return fetchAPI(`/api/v1/ingredients/${id}`, { method: "DELETE" })
}

/** POST /api/v1/ingredients/import — requiere sesión; evita duplicados por nombre */
export async function importIngredientes(
  ingredientes: Array<{ name: string; costPerUnit: number; weightGrams: number }>
): Promise<ApiResponse<{ inserted: number; skipped: number }>> {
  return fetchAPI("/api/v1/ingredients/import", {
    method: "POST",
    body: JSON.stringify({ ingredients: ingredientes }),
  })
}

// ─── Factores de Rendimiento ──────────────────────────────────────────────────

export async function getFactoresRendimiento(variant?: string): Promise<ListResponse<FactorRendimiento>> {
  const params = variant ? `?variant=${variant}` : ""
  return fetchAPI(`/api/v1/yield-factors${params}`)
}

export async function getFactorRendimientoById(id: string): Promise<ApiResponse<FactorRendimiento>> {
  return fetchAPI(`/api/v1/yield-factors/${id}`)
}

export async function createFactorRendimiento(
  data: {
    variant: "bfactor" | "bfactorveg"
    ingredientName: string
    totalCost: number
    totalWeightGrams: number
    wasteItems: { name: string; weightGrams: number }[]
  }
): Promise<ApiResponse<FactorRendimiento>> {
  return fetchAPI("/api/v1/yield-factors", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateFactorRendimiento(
  id: string,
  data: Partial<{
    variant: "bfactor" | "bfactorveg"
    ingredientName: string
    totalCost: number
    totalWeightGrams: number
    wasteItems: { name: string; weightGrams: number }[]
  }>
): Promise<ApiResponse<FactorRendimiento>> {
  return fetchAPI(`/api/v1/yield-factors/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteFactorRendimiento(id: string): Promise<void> {
  return fetchAPI(`/api/v1/yield-factors/${id}`, { method: "DELETE" })
}

export async function saveFactorRendimientoAsIngrediente(id: string): Promise<ApiResponse<Ingrediente>> {
  return fetchAPI(`/api/v1/yield-factors/${id}/guardar-como-ingrediente`, { method: "POST" })
}

// ─── Recetas ──────────────────────────────────────────────────────────────────

import type { Recipe, RecipeCostResult } from "@/types/domain"

export interface RecipeItemPayload {
  componentType: 'ingredient' | 'recipe'
  ingredientId?: string
  subRecipeId?: string
  quantityG: number
  sortOrder?: number
}

export interface CreateRecipePayload {
  name: string
  recipeNumber: string
  servings: number
  servingWeightG?: number
  safetyMargin?: number
  isBase?: boolean
  items: RecipeItemPayload[]
}

/** GET /api/v1/recipes */
export async function getRecipes(search?: string): Promise<{ data: Recipe[] }> {
  const q = search ? `?search=${encodeURIComponent(search)}` : ''
  return fetchAPI(`/api/v1/recipes${q}`)
}

/** GET /api/v1/recipes?base=true — solo recetas base del tenant */
export async function getBaseRecipes(): Promise<{ data: Recipe[] }> {
  return fetchAPI('/api/v1/recipes?base=true')
}

/** GET /api/v1/recipes/:id */
export async function getRecipeById(id: string): Promise<{ data: Recipe }> {
  return fetchAPI(`/api/v1/recipes/${id}`)
}

/** POST /api/v1/recipes */
export async function createRecipe(
  data: CreateRecipePayload
): Promise<{ data: Recipe }> {
  return fetchAPI('/api/v1/recipes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** PUT /api/v1/recipes/:id */
export async function updateRecipe(
  id: string,
  data: Partial<CreateRecipePayload>
): Promise<{ data: Recipe }> {
  return fetchAPI(`/api/v1/recipes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/** DELETE /api/v1/recipes/:id */
export async function deleteRecipe(id: string): Promise<void> {
  return fetchAPI(`/api/v1/recipes/${id}`, { method: 'DELETE' })
}

/** GET /api/v1/recipes/:id/cost — CTE recursiva */
export async function getRecipeCost(id: string): Promise<{ data: RecipeCostResult }> {
  return fetchAPI(`/api/v1/recipes/${id}/cost`)
}

export async function getRecetas(): Promise<ListResponse<Receta>> {
  return fetchAPI("/api/v1/recetas")
}

export async function createReceta(
  data: { nombre: string; descripcion?: string; costoPorPorcion: number; pesoTotalGramos: number }
): Promise<ApiResponse<Receta>> {
  return fetchAPI("/api/v1/recetas", { method: "POST", body: JSON.stringify(data) })
}

export async function deleteReceta(id: string): Promise<void> {
  return fetchAPI(`/api/v1/recetas/${id}`, { method: "DELETE" })
}

// ─── Menús ────────────────────────────────────────────────────────────────────
export async function getMenus(): Promise<ListResponse<Menu>> {
  return fetchAPI("/api/v1/menus")
}

export async function getMenuById(id: string): Promise<ApiResponse<Menu>> {
  return fetchAPI(`/api/v1/menus/${id}`)
}

export async function getMenuCosto(id: string): Promise<ApiResponse<Menu & { costo: CostoMenuResult | null }>> {
  return fetchAPI(`/api/v1/menus/${id}/costo`)
}

export interface CreateMenuPayload {
  nombre: string
  fecha: string
  numPersonas: number
  margenSeguridad?: number
  pctMateriaPrima?: number
  notas?: string
  recetas: { recetaId: string; cantidadGramos: number; orden?: number }[]
}

export async function createMenu(data: CreateMenuPayload): Promise<ApiResponse<Menu>> {
  return fetchAPI("/api/v1/menus", { method: "POST", body: JSON.stringify(data) })
}

export async function updateMenu(id: string, data: Partial<CreateMenuPayload>): Promise<ApiResponse<Menu>> {
  return fetchAPI(`/api/v1/menus/${id}`, { method: "PUT", body: JSON.stringify(data) })
}

export async function deleteMenu(id: string): Promise<void> {
  return fetchAPI(`/api/v1/menus/${id}`, { method: "DELETE" })
}

// ─── Valoraciones ─────────────────────────────────────────────────────────────
export async function getValuations(): Promise<ListResponse<Valuation>> {
  return fetchAPI("/api/v1/valuations")
}

export interface CreateValuationPayload {
  name: string
  refType: ValuationRefType
  refId?: string
  costMateriaprima: number
  pctMateriaprima: number
  safetyMargin?: number
  actualPrice?: number
  notes?: string
}

export interface ValuationCreateResult extends Omit<Valuation, "suggestedPrice" | "costMateriaprima" | "actualPrice"> {
  suggestedPrice: number
  costMateriaprima: number
  actualPrice: number | null
  breakdown: {
    pctMateriaprima: number
    pctFixedCosts: number
    pctProfit: number
  }
}

export async function createValuation(
  data: CreateValuationPayload
): Promise<{ data: ValuationCreateResult }> {
  return fetchAPI("/api/v1/valuations", { method: "POST", body: JSON.stringify(data) })
}

// ─── Punto de Equilibrio ──────────────────────────────────────────────────────
import type { BreakEvenRecord, FixedCostItem } from "@/types/domain"

export interface CreateBreakEvenPayload {
  fixedCosts: FixedCostItem[]
  salePrice: number
  variableCost: number
}

/** POST /api/v1/break-even — guarda y devuelve el cálculo */
export async function createBreakEven(
  data: CreateBreakEvenPayload
): Promise<{ data: BreakEvenRecord }> {
  return fetchAPI("/api/v1/break-even", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

/** GET /api/v1/break-even — historial ordenado por fecha descendente */
export async function getBreakEvenHistory(): Promise<{
  data: BreakEvenRecord[]
  total: number
}> {
  return fetchAPI("/api/v1/break-even")
}

/** GET /api/v1/break-even/export — descarga el Excel directamente */
export async function exportBreakEvenExcel(): Promise<Blob> {
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
  const response = await fetch(`${API_BASE_URL}/api/v1/break-even/export`, {
    credentials: "include",
  })
  if (!response.ok) throw new Error("Error al exportar el historial")
  return response.blob()
}
