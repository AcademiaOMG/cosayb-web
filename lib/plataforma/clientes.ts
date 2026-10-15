// Gestión de clientes de la consola de plataforma: tipos, llamadas al API (`/platform/clients/*`)
// y lógica pura de filtros (estado ↔ parámetros de URL), probada en clientes.test.ts.

import { saasData, saasFetch, json, qs } from "@/lib/saas/real"

const API = "/api/v1/platform/clients"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

export type Plan = "free" | "pro" | "academia"
export type TrialState = "active" | "expired" | "none"

export const PLAN_NAMES: Record<Plan, string> = { free: "Gratis", pro: "Pro", academia: "Academia" }
export const TRIAL_NAMES: Record<TrialState, string> = { active: "En prueba", expired: "Prueba vencida", none: "Sin prueba" }

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ClientOrg {
  id: string
  name: string
  membership: Plan
  status: "active" | "suspended"
  trialEndsAt: string | null
  trialState: TrialState
  createdAt: string
  owner: { id: string; name: string; email: string }
  memberCount: number
  lastActivityAt: string | null
  pastDue: boolean
}
export interface OrgCounts { all: number; free: number; pro: number; academia: number; suspended: number; trialActive: number; trialExpired: number; pastDue: number }
export interface ListPage<T, C> { data: T[]; total: number; page: number; limit: number; counts: C }

export interface ClientUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  createdAt: string
  lastActivityAt: string | null
  businessCount: number
  platformRoles: string[]
  orgRoles: { roleSlug: string; roleName: string; organizationId: string | null; orgName: string | null }[]
}
export interface UserCounts { all: number; verified: number; unverified: number; team: number; client: number; noBusiness: number }

export interface UsageItem { feature: string; label: string; current: number; limit: number | null; percent: number | null; atLimit: boolean }
export interface OrgOverview {
  id: string
  name: string
  membership: Plan
  status: "active" | "suspended"
  createdAt: string
  owner: { id: string; name: string; email: string } | null
  memberCount: number
  pendingInvitations: number
  lastActivityAt: string | null
  trial: { endsAt: string | null; state: TrialState; daysLeft: number }
  subscription: { plan: Plan; status: string; amount: number; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; failedAttempts: number } | null
  usage: UsageItem[]
}
export interface OrgTeam {
  ownerId: string
  members: {
    membershipId: string; userId: string; name: string; email: string; emailVerified: boolean
    status: string; joinedAt: string; isOwner: boolean; lastActivityAt: string | null
    roles: { roleSlug: string; roleName: string }[]
  }[]
  invitations: { id: string; email: string; roleSlug: string; roleName: string; status: "pending" | "accepted" | "revoked" | "expired"; createdAt: string; expiresAt: string; invitedByName: string }[]
}
export interface ActivityRow {
  id: string; action: string; actorName: string | null; byPlatformTeam: boolean
  justification: string | null; createdAt: string; organizationName?: string | null; direction?: "own" | "about"
}
export interface OrgNote { id: string; body: string; createdAt: string; authorId: string; authorName: string }
export interface UserSession { id: string; ipAddress: string | null; userAgent: string | null; createdAt: string; lastActivityAt: string; expiresAt: string }

// ─── Filtros (lógica pura) ───────────────────────────────────────────────────

export interface OrgFilters {
  search: string
  plan?: Plan
  status?: "suspended"
  trial?: TrialState
  billing?: "past_due"
  sort: "created" | "name" | "members" | "activity"
  dir: "asc" | "desc"
  page: number
}
export interface UserFilters {
  search: string
  kind?: "team" | "client" | "no_business"
  verified?: "yes" | "no"
  sort: "created" | "name" | "activity"
  dir: "asc" | "desc"
  page: number
}

const pick = <T extends string>(v: string | null, allowed: readonly T[]): T | undefined =>
  v !== null && (allowed as readonly string[]).includes(v) ? (v as T) : undefined
const pageOf = (v: string | null) => Math.max(1, Number.parseInt(v ?? "1", 10) || 1)
const dirOf = (v: string | null) => (v === "asc" ? "asc" : "desc")

export function parseOrgFilters(p: URLSearchParams): OrgFilters {
  return {
    search: p.get("q") ?? "",
    plan: pick(p.get("plan"), ["free", "pro", "academia"]),
    status: pick(p.get("status"), ["suspended"]),
    trial: pick(p.get("trial"), ["active", "expired", "none"]),
    billing: pick(p.get("billing"), ["past_due"]),
    sort: pick(p.get("sort"), ["created", "name", "members", "activity"]) ?? "created",
    dir: dirOf(p.get("dir")),
    page: pageOf(p.get("page")),
  }
}

export function parseUserFilters(p: URLSearchParams): UserFilters {
  return {
    search: p.get("q") ?? "",
    kind: pick(p.get("kind"), ["team", "client", "no_business"]),
    verified: pick(p.get("verified"), ["yes", "no"]),
    sort: pick(p.get("sort"), ["created", "name", "activity"]) ?? "created",
    dir: dirOf(p.get("dir")),
    page: pageOf(p.get("page")),
  }
}

/** Parámetros para la URL de la página: omite los valores por defecto. */
export function toUrlParams(f: OrgFilters | UserFilters): string {
  const p = new URLSearchParams()
  const { search, page, sort, dir, ...rest } = f
  if (search.trim()) p.set("q", search.trim())
  for (const [k, v] of Object.entries(rest)) if (v) p.set(k, String(v))
  if (sort !== "created") p.set("sort", sort)
  if (dir !== "desc") p.set("dir", dir)
  if (page > 1) p.set("page", String(page))
  return p.toString()
}

/** Parámetros para el API (usa `search` en vez de `q`). */
function apiQuery(f: OrgFilters | UserFilters, extra: Record<string, string | number> = {}): string {
  const { search, ...rest } = f
  return qs({ search: search.trim(), ...rest, page: undefined, ...extra })
}

/** Cambia un filtro y vuelve a la primera página. */
export function withFilter<F extends OrgFilters | UserFilters>(f: F, change: Partial<F>): F {
  return { ...f, ...change, page: 1 }
}

export function totalPages(total: number, limit: number): number {
  return Math.max(1, Math.ceil(total / limit))
}

/** «hace 3 días», «nunca» para fechas vacías. */
export function lastSeenLabel(iso: string | null, now: Date = new Date()): string {
  if (!iso) return "Sin accesos"
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000)
  if (days <= 0) return "Hoy"
  if (days === 1) return "Ayer"
  if (days < 30) return `Hace ${days} días`
  if (days < 365) return `Hace ${Math.floor(days / 30)} ${Math.floor(days / 30) === 1 ? "mes" : "meses"}`
  return "Hace más de un año"
}

/** Resumen del dispositivo a partir del user-agent, sin mostrar el texto técnico. */
export function deviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Dispositivo desconocido"
  const browser = /Edg\//.test(userAgent) ? "Edge" : /Chrome\//.test(userAgent) ? "Chrome" : /Firefox\//.test(userAgent) ? "Firefox" : /Safari\//.test(userAgent) ? "Safari" : "Navegador"
  const os = /Windows/.test(userAgent) ? "Windows" : /Android/.test(userAgent) ? "Android" : /iPhone|iPad/.test(userAgent) ? "iOS" : /Mac OS/.test(userAgent) ? "macOS" : /Linux/.test(userAgent) ? "Linux" : ""
  return os ? `${browser} en ${os}` : browser
}

// ─── Llamadas al API ─────────────────────────────────────────────────────────

const get = async <T>(path: string) => saasData<T>(`${API}${path}`)
const withBody = (method: string, body: unknown): RequestInit => ({ ...json(body), method })

export async function listClientOrgs(f: OrgFilters, limit = 25): Promise<ListPage<ClientOrg, OrgCounts>> {
  return saasFetch<ListPage<ClientOrg, OrgCounts>>(`${API}/organizations${apiQuery(f, { page: f.page, limit })}`)
}
export async function listClientUsers(f: UserFilters, limit = 25): Promise<ListPage<ClientUser, UserCounts>> {
  return saasFetch<ListPage<ClientUser, UserCounts>>(`${API}/users${apiQuery(f, { page: f.page, limit })}`)
}

/** Descarga el CSV del resultado filtrado (el API lo audita). */
export async function downloadClientsCsv(kind: "organizations" | "users", f: OrgFilters | UserFilters): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${API}/${kind}/export${apiQuery(f)}`, { credentials: "include" })
  if (!res.ok) throw new Error("No pudimos generar el archivo. Inténtalo de nuevo.")
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement("a")
  a.href = url
  a.download = kind === "organizations" ? "negocios.csv" : "usuarios.csv"
  a.click()
  URL.revokeObjectURL(url)
}

export const getOrgOverview = (id: string) => get<OrgOverview>(`/organizations/${id}/overview`)
export const getOrgTeam = (id: string) => get<OrgTeam>(`/organizations/${id}/team`)
export const getOrgActivity = (id: string, offset = 0) => saasFetch<{ data: ActivityRow[]; total: number }>(`${API}/organizations/${id}/activity${qs({ limit: 30, offset })}`)
export const listOrgNotes = (id: string) => get<OrgNote[]>(`/organizations/${id}/notes`)
export const addOrgNote = (id: string, body: string) => saasData<OrgNote>(`${API}/organizations/${id}/notes`, json({ body }))
export const deleteOrgNote = (id: string, noteId: string) => saasData<{ deleted: boolean }>(`${API}/organizations/${id}/notes/${noteId}`, { method: "DELETE" })
export const extendOrgTrial = (id: string, days: number, justification: string) =>
  saasData<{ trialEndsAt: string }>(`${API}/organizations/${id}/extend-trial`, json({ days, justification }))
export const resendOrgInvitation = (orgId: string, invitationId: string) =>
  saasData<{ sent: boolean }>(`${API}/organizations/${orgId}/invitations/${invitationId}/resend`, json({}))

export const listUserSessions = (id: string) => get<UserSession[]>(`/users/${id}/sessions`)
export const revokeUserSessions = (id: string, justification: string) =>
  saasData<{ revoked: number }>(`${API}/users/${id}/sessions`, withBody("DELETE", { justification }))
export const sendUserPasswordReset = (id: string) => saasData<{ sent: boolean }>(`${API}/users/${id}/send-password-reset`, json({}))
export const getUserActivity = (id: string, offset = 0) => saasFetch<{ data: ActivityRow[]; total: number }>(`${API}/users/${id}/activity${qs({ limit: 30, offset })}`)
