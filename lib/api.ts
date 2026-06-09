import type { Ingrediente, FactorRendimiento, Receta, Menu, Valoracion, PuntoEquilibrio } from "@/types/domain"
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
    throw new Error(`API ${response.status}: ${text || response.statusText}`)
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
// TODO: GET /api/v1/factor-rendimiento (endpoint pendiente en backend)
export async function getFactoresRendimiento(): Promise<ListResponse<FactorRendimiento>> {
  return fetchAPI("/api/v1/factor-rendimiento")
}

export async function createFactorRendimiento(
  data: Omit<FactorRendimiento, "id" | "organizationId" | "createdAt" | "updatedAt">
): Promise<ApiResponse<FactorRendimiento>> {
  return fetchAPI("/api/v1/factor-rendimiento", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ─── Recetas ──────────────────────────────────────────────────────────────────
// TODO: GET /api/v1/recetas (endpoint pendiente en backend)
export async function getRecetas(): Promise<ListResponse<Receta>> {
  return fetchAPI("/api/v1/recetas")
}

export async function createReceta(
  data: Omit<Receta, "id" | "organizationId" | "createdAt" | "updatedAt" | "costoTotal" | "costoPorcion">
): Promise<ApiResponse<Receta>> {
  return fetchAPI("/api/v1/recetas", { method: "POST", body: JSON.stringify(data) })
}

export async function updateReceta(
  id: string,
  data: Partial<Omit<Receta, "id" | "organizationId" | "createdAt" | "updatedAt">>
): Promise<ApiResponse<Receta>> {
  return fetchAPI(`/api/v1/recetas/${id}`, { method: "PUT", body: JSON.stringify(data) })
}

export async function deleteReceta(id: string): Promise<void> {
  return fetchAPI(`/api/v1/recetas/${id}`, { method: "DELETE" })
}

// ─── Menús ────────────────────────────────────────────────────────────────────
// TODO: GET /api/v1/menus (endpoint pendiente en backend)
export async function getMenus(): Promise<ListResponse<Menu>> {
  return fetchAPI("/api/v1/menus")
}

export async function createMenu(
  data: Omit<Menu, "id" | "organizationId" | "createdAt" | "updatedAt">
): Promise<ApiResponse<Menu>> {
  return fetchAPI("/api/v1/menus", { method: "POST", body: JSON.stringify(data) })
}

// ─── Valoraciones ─────────────────────────────────────────────────────────────
// TODO: GET /api/v1/valoraciones (endpoint pendiente en backend)
export async function getValoraciones(): Promise<ListResponse<Valoracion>> {
  return fetchAPI("/api/v1/valoraciones")
}

export async function createValoracion(
  data: Omit<Valoracion, "id" | "organizationId" | "createdAt" | "updatedAt" | "utilidadBruta" | "porcentajeUtilidad">
): Promise<ApiResponse<Valoracion>> {
  return fetchAPI("/api/v1/valoraciones", { method: "POST", body: JSON.stringify(data) })
}

// ─── Punto de Equilibrio ──────────────────────────────────────────────────────
// TODO: POST /api/v1/punto-equilibrio/calcular (endpoint pendiente en backend)
export async function calcularPuntoEquilibrio(
  data: Pick<PuntoEquilibrio, "costosFijos" | "costosVariables" | "precioVentaPromedio">
): Promise<ApiResponse<PuntoEquilibrio>> {
  return fetchAPI("/api/v1/punto-equilibrio/calcular", {
    method: "POST",
    body: JSON.stringify(data),
  })
}
