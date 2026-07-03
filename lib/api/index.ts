import type { Ingrediente, FactorRendimiento, Recipe, RecipeCostResult, Menu, CostoMenuResult, Valoracion, Valuation, ValuationRefType, PuntoEquilibrio } from "@/types/domain"
import type { ApiResponse } from "@/types/api"

export {
  getCurrentOrganization, updateOrganization, getPlans, getCurrentPlan,
  getMyProfile, updateMyProfile,
  getMembers, updateMemberRole, removeMember,
  getInvitations, sendInvitation, revokeInvitation, acceptInvitation,
  getInvitationById,
} from "./settings"
export type { UserProfile, OrgMember, Invitation, InvitationDetail } from "./settings"

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
      if (body.details?.fieldErrors) {
        const fields = Object.entries(body.details.fieldErrors)
          .map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`)
          .join("; ")
        if (fields) message += ` — ${fields}`
      }
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
export type RecipeFilter = "all" | "own" | "banco"

export interface PaginatedRecipes {
  data: Recipe[]
  total: number
  page: number
  limit: number
}

export interface RecipeExtraFilters {
  type?: "base" | "principal"
  weight?: "yes" | "no"
  portions?: "small" | "medium" | "large"
  empty?: boolean
}

export async function getRecipes(
  search?: string,
  filter: RecipeFilter = "all",
  page = 1,
  limit = 12,
  extra: RecipeExtraFilters = {}
): Promise<PaginatedRecipes> {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (filter !== "all") params.set("filter", filter)
  if (page > 1) params.set("page", String(page))
  if (limit !== 12) params.set("limit", String(limit))
  if (extra.type) params.set("type", extra.type)
  if (extra.weight) params.set("weight", extra.weight)
  if (extra.portions) params.set("portions", extra.portions)
  if (extra.empty) params.set("empty", "true")
  const q = params.toString()
  return fetchAPI(`/api/v1/recipes${q ? `?${q}` : ""}`)
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

/** POST /api/v1/recipes/importar-banco — importar recetas base públicas */
export async function importPublicRecipes(): Promise<{ data: { imported: number; total: number } }> {
  return fetchAPI('/api/v1/recipes/importar-banco', { method: 'POST' })
}

/** GET /api/v1/recipes/:id/cost — CTE recursiva + análisis de rentabilidad */
export async function getRecipeCost(id: string, materialCostPct?: number): Promise<{ data: RecipeCostResult }> {
  const params = materialCostPct != null ? `?materialCostPct=${materialCostPct}` : ""
  return fetchAPI(`/api/v1/recipes/${id}/cost${params}`)
}

/** GET /api/v1/recipes/banco — recetas del banco global (isPublic = true) */
export async function getBancoRecipes(search?: string): Promise<{ data: Recipe[] }> {
  const q = search ? `?search=${encodeURIComponent(search)}` : ''
  return fetchAPI(`/api/v1/recipes/banco${q}`)
}

/** POST /api/v1/recipes/importar-banco/:id — clona una receta del banco en el tenant */
export async function importarBancoRecipe(id: string): Promise<{ data: Recipe }> {
  return fetchAPI(`/api/v1/recipes/importar-banco/${id}`, { method: 'POST' })
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
  recetas: { recipeId: string; cantidadGramos: number; orden?: number }[]
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

// ─── Permisos / RBAC ─────────────────────────────────────────────────────────

export type Resource =
  | "recipes" | "ingredients" | "menus"
  | "yieldFactors" | "valuations" | "breakEven"
  | "marketPrices" | "reports"
  | "publicRecipes" | "publicIngredients"
  | "organization" | "members" | "invitations" | "billing";

export type Action =
  | "list" | "read" | "create" | "update" | "delete"
  | "import" | "publish" | "export" | "remove" | "revoke";

export type Permission = `${Action}:${Resource}`;

export interface MembershipFeature {
  key: string
  enabled: boolean
  limit: number | null
}

export interface AuthzContext {
  scope: "user" | "organization"
  roles: string[]
  permissions: string[]
  organization: {
    id: string
    name: string
    membership: "free" | "pro" | "academia"
    features: MembershipFeature[]
  } | null
  memberships: {
    organizationId: string
    organizationName: string
    membership: string
    status: string
    isDefault: boolean
  }[]
  platformRoles: string[]
}

/** Contexto de autorización completo (roles, permisos, org activa, membresía) */
export async function getAuthzContext(): Promise<{ data: AuthzContext }> {
  return fetchAPI("/api/v1/me/context")
}

/** Roles asignables según la membresía del tenant (para invitar / cambiar rol) */
export interface AssignableRole {
  id: string
  slug: string
  name: string
  description: string | null
  scopeContext: string | null
}

export async function getAvailableRoles(): Promise<{ data: AssignableRole[] }> {
  return fetchAPI("/api/v1/roles/available")
}

/** POST /api/v1/organizations — onboarding explícito */
export async function createOrganization(name: string): Promise<{ data: { id: string; name: string } }> {
  return fetchAPI("/api/v1/organizations", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

/** GET /api/v1/organizations/me/usage — consumo de límites */
export async function getMembershipUsage(): Promise<{
  data: {
    membership: string
    features: { featureKey: string; enabled: boolean; limitValue: number | null }[]
    usage: { members: number }
  }
}> {
  return fetchAPI("/api/v1/organizations/me/usage")
}

// ─── Panel de plataforma (super admin) ───────────────────────────────────────

export interface PlatformOrg {
  id: string
  name: string
  membership: "free" | "pro" | "academia"
  status: "active" | "suspended"
  ownerId: string
  trialEndsAt: string | null
  createdAt: string
}

export async function platformListOrgs(search?: string, page = 1): Promise<{
  data: PlatformOrg[]; total: number; page: number; limit: number
}> {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  params.set("page", String(page))
  return fetchAPI(`/api/v1/platform/organizations?${params}`)
}

export async function platformUpdateOrg(
  id: string,
  data: { membership?: string; name?: string }
): Promise<{ data: PlatformOrg }> {
  return fetchAPI(`/api/v1/platform/organizations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function platformSetOrgStatus(
  id: string,
  action: "suspend" | "reactivate",
  justification?: string
): Promise<{ data: PlatformOrg }> {
  return fetchAPI(`/api/v1/platform/organizations/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify({ justification }),
  })
}

export interface PlatformUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  createdAt: string
}

export async function platformListUsers(search?: string, page = 1): Promise<{
  data: PlatformUser[]; total: number; page: number; limit: number
}> {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  params.set("page", String(page))
  return fetchAPI(`/api/v1/platform/users?${params}`)
}

export interface AuditLogEntry {
  id: string
  actorUserId: string
  actorRoles: string[]
  action: string
  resourceType: string
  resourceId: string | null
  organizationId: string | null
  justification: string | null
  createdAt: string
}

export async function platformListAudit(): Promise<{ data: AuditLogEntry[] }> {
  return fetchAPI("/api/v1/platform/audit")
}

export async function platformGetMetrics(): Promise<{
  data: {
    totalOrganizations: number
    totalUsers: number
    organizationsByMembership: { membership: string; total: number }[]
  }
}> {
  return fetchAPI("/api/v1/platform/metrics")
}

export async function platformListMemberships(): Promise<{
  data: {
    features: { id: string; membership: string; featureKey: string; enabled: boolean; limitValue: number | null }[]
    roleLimits: { membership: string; roleId: string; roleSlug: string; roleName: string }[]
  }
}> {
  return fetchAPI("/api/v1/platform/memberships")
}

export async function platformUpdateFeature(
  tier: string,
  key: string,
  data: { enabled?: boolean; limitValue?: number | null }
): Promise<{ data: unknown }> {
  return fetchAPI(`/api/v1/platform/memberships/${tier}/features/${key}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}
