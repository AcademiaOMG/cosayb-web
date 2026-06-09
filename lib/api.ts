import type {
  Ingrediente,
  FactorRendimiento,
  Receta,
  Menu,
  Valoracion,
  PuntoEquilibrio,
} from "@/types/domain"
import type { ApiResponse, PaginatedResponse } from "@/types/api"

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

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
    credentials: "include",
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new Error(`API ${response.status}: ${text || response.statusText}`)
  }

  return response.json() as Promise<T>
}

// ─── Ingredientes ──────────────────────────────────────────────────
// TODO: GET /api/ingredientes
export async function getIngredientes(): Promise<PaginatedResponse<Ingrediente>> {
  return fetchAPI("/api/ingredientes")
}

// TODO: POST /api/ingredientes
export async function createIngrediente(
  data: Omit<Ingrediente, "id" | "organizationId" | "createdAt" | "updatedAt">
): Promise<ApiResponse<Ingrediente>> {
  return fetchAPI("/api/ingredientes", { method: "POST", body: JSON.stringify(data) })
}

// TODO: PUT /api/ingredientes/:id
export async function updateIngrediente(
  id: string,
  data: Partial<Omit<Ingrediente, "id" | "organizationId" | "createdAt" | "updatedAt">>
): Promise<ApiResponse<Ingrediente>> {
  return fetchAPI(`/api/ingredientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

// TODO: DELETE /api/ingredientes/:id
export async function deleteIngrediente(id: string): Promise<void> {
  return fetchAPI(`/api/ingredientes/${id}`, { method: "DELETE" })
}

// ─── Factores de Rendimiento ───────────────────────────────────────
// TODO: GET /api/factores-rendimiento
export async function getFactoresRendimiento(): Promise<
  PaginatedResponse<FactorRendimiento>
> {
  return fetchAPI("/api/factores-rendimiento")
}

// TODO: POST /api/factores-rendimiento
export async function createFactorRendimiento(
  data: Omit<FactorRendimiento, "id" | "organizationId" | "createdAt" | "updatedAt">
): Promise<ApiResponse<FactorRendimiento>> {
  return fetchAPI("/api/factores-rendimiento", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

// ─── Recetas ───────────────────────────────────────────────────────
// TODO: GET /api/recetas
export async function getRecetas(): Promise<PaginatedResponse<Receta>> {
  return fetchAPI("/api/recetas")
}

// TODO: POST /api/recetas
export async function createReceta(
  data: Omit<Receta, "id" | "organizationId" | "createdAt" | "updatedAt" | "costoTotal" | "costoPorcion">
): Promise<ApiResponse<Receta>> {
  return fetchAPI("/api/recetas", { method: "POST", body: JSON.stringify(data) })
}

// TODO: PUT /api/recetas/:id
export async function updateReceta(
  id: string,
  data: Partial<Omit<Receta, "id" | "organizationId" | "createdAt" | "updatedAt">>
): Promise<ApiResponse<Receta>> {
  return fetchAPI(`/api/recetas/${id}`, { method: "PUT", body: JSON.stringify(data) })
}

// TODO: DELETE /api/recetas/:id
export async function deleteReceta(id: string): Promise<void> {
  return fetchAPI(`/api/recetas/${id}`, { method: "DELETE" })
}

// ─── Menús ─────────────────────────────────────────────────────────
// TODO: GET /api/menus
export async function getMenus(): Promise<PaginatedResponse<Menu>> {
  return fetchAPI("/api/menus")
}

// TODO: POST /api/menus
export async function createMenu(
  data: Omit<Menu, "id" | "organizationId" | "createdAt" | "updatedAt">
): Promise<ApiResponse<Menu>> {
  return fetchAPI("/api/menus", { method: "POST", body: JSON.stringify(data) })
}

// ─── Valoraciones ──────────────────────────────────────────────────
// TODO: GET /api/valoraciones
export async function getValoraciones(): Promise<PaginatedResponse<Valoracion>> {
  return fetchAPI("/api/valoraciones")
}

// TODO: POST /api/valoraciones
export async function createValoracion(
  data: Omit<Valoracion, "id" | "organizationId" | "createdAt" | "updatedAt" | "utilidadBruta" | "porcentajeUtilidad">
): Promise<ApiResponse<Valoracion>> {
  return fetchAPI("/api/valoraciones", { method: "POST", body: JSON.stringify(data) })
}

// ─── Punto de Equilibrio ───────────────────────────────────────────
// TODO: POST /api/punto-equilibrio/calcular
export async function calcularPuntoEquilibrio(
  data: Pick<PuntoEquilibrio, "costosFijos" | "costosVariables" | "precioVentaPromedio">
): Promise<ApiResponse<PuntoEquilibrio>> {
  return fetchAPI("/api/punto-equilibrio/calcular", {
    method: "POST",
    body: JSON.stringify(data),
  })
}
