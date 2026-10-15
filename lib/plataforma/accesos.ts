// Accesos y actividad de la consola de plataforma: tipos, llamadas al API (`/platform/accesos/*`)
// y lógica pura de filtros (estado ↔ parámetros de URL), probada en accesos.test.ts.

import { saasData, saasFetch, qs } from "@/lib/saas/real"

const API = "/api/v1/platform/accesos"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface BusinessRole { name: string; roleSlug: string | null; roleName: string | null }

export interface AccessUser {
  userId: string
  name: string
  email: string
  isTeam: boolean
  lastAccessAt: string | null
  lastActivityAt: string | null
  logins7: number
  logins30: number
  device: string | null
  ip: string | null
  method: string | null
  platformRoles: string[]
  businesses: BusinessRole[]
}
export interface AccessCounts { all: number; never: number; active7: number; team: number }
export interface AccessPage { data: AccessUser[]; total: number; page: number; limit: number; counts: AccessCounts }

export interface ActivityEvent {
  id: number
  at: string | null
  userId: string | null
  userName: string | null
  userEmail: string | null
  organizationId: string | null
  organizationName: string | null
  module: string
  action: string
  status: number | null
  ip: string | null
}
export interface ActivityPage { data: ActivityEvent[]; total: number; page: number; limit: number }

export interface AccessDetail {
  user: { id: string; name: string; email: string; platformRoles: string[]; businesses: BusinessRole[] }
  summary: { lastAccessAt: string | null; logins7: number; logins30: number; failed30: number }
  timeline: { at: string | null; type: string; device: string | null; ip: string | null; method: string | null; reason: string | null }[]
  topModules: { module: string; total: number; lastAt: string | null }[]
  recentActions: { at: string | null; module: string; action: string; status: number | null; organizationName: string | null }[]
  devices: { label: string; count: number; lastAt: string | null }[]
  ips: { ip: string; count: number; lastAt: string | null }[]
}

// ─── Filtros de «Últimos accesos» (lógica pura) ──────────────────────────────

export type AccessSort = "last_access" | "name" | "logins7" | "logins30" | "activity"

export interface AccessFilters {
  search: string
  /** Último acceso dentro de los últimos N días (0 = cualquiera). */
  days: number
  team: boolean
  status?: "never" | "inactive"
  inactiveDays: number
  sort: AccessSort
  dir: "asc" | "desc"
  page: number
}

export const DEFAULT_INACTIVE_DAYS = 30
export const PERIOD_OPTIONS = [7, 30, 90] as const
export const INACTIVE_OPTIONS = [7, 14, 30, 60, 90] as const

const pick = <T extends string>(v: string | null, allowed: readonly T[]): T | undefined =>
  v !== null && (allowed as readonly string[]).includes(v) ? (v as T) : undefined
const intOf = (v: string | null, fallback: number, allowed?: readonly number[]) => {
  const n = Number.parseInt(v ?? "", 10)
  if (!Number.isFinite(n) || n < 0) return fallback
  return allowed && !allowed.includes(n) ? fallback : n
}

export function parseAccessFilters(p: URLSearchParams): AccessFilters {
  return {
    search: p.get("q") ?? "",
    days: intOf(p.get("dias"), 0, PERIOD_OPTIONS),
    team: p.get("equipo") === "1",
    status: pick(p.get("estado"), ["never", "inactive"]),
    inactiveDays: intOf(p.get("inactivos"), DEFAULT_INACTIVE_DAYS, INACTIVE_OPTIONS),
    sort: pick(p.get("orden"), ["last_access", "name", "logins7", "logins30", "activity"]) ?? "last_access",
    dir: p.get("dir") === "asc" ? "asc" : "desc",
    page: Math.max(1, Number.parseInt(p.get("page") ?? "1", 10) || 1),
  }
}

/** Parámetros para la URL de la página (omite valores por defecto). La pestaña activa la conserva la página. */
export function accessToUrl(f: AccessFilters): string {
  const p = new URLSearchParams()
  if (f.search.trim()) p.set("q", f.search.trim())
  if (f.days) p.set("dias", String(f.days))
  if (f.team) p.set("equipo", "1")
  if (f.status) p.set("estado", f.status)
  if (f.status === "inactive" && f.inactiveDays !== DEFAULT_INACTIVE_DAYS) p.set("inactivos", String(f.inactiveDays))
  if (f.sort !== "last_access") p.set("orden", f.sort)
  if (f.dir !== "desc") p.set("dir", f.dir)
  if (f.page > 1) p.set("page", String(f.page))
  return p.toString()
}

/** Parámetros para el API. */
export function accessApiQuery(f: AccessFilters, extra: Record<string, string | number> = {}): string {
  return qs({
    search: f.search.trim(),
    days: f.days || undefined,
    team: f.team ? "1" : undefined,
    status: f.status,
    inactiveDays: f.status === "inactive" ? f.inactiveDays : undefined,
    sort: f.sort,
    dir: f.dir,
    ...extra,
  })
}

/** Cambia un filtro y vuelve a la primera página. */
export function withAccessFilter(f: AccessFilters, change: Partial<AccessFilters>): AccessFilters {
  return { ...f, ...change, page: 1 }
}

// ─── Filtros del feed «Actividad reciente» ───────────────────────────────────

export interface ActivityFilters {
  search: string
  module?: string
  action?: string
  result?: "ok" | "blocked" | "error"
  userId?: string
  days: number
  page: number
}

export const ACTIVITY_PERIODS = [1, 7, 30, 90] as const

export function parseActivityFilters(p: URLSearchParams): ActivityFilters {
  return {
    search: p.get("q") ?? "",
    module: p.get("modulo") ?? undefined,
    action: p.get("accion") ?? undefined,
    result: pick(p.get("resultado"), ["ok", "blocked", "error"]),
    userId: p.get("persona") ?? undefined,
    days: intOf(p.get("dias"), 7, ACTIVITY_PERIODS),
    page: Math.max(1, Number.parseInt(p.get("page") ?? "1", 10) || 1),
  }
}

export function activityToUrl(f: ActivityFilters): string {
  const p = new URLSearchParams()
  if (f.search.trim()) p.set("q", f.search.trim())
  if (f.module) p.set("modulo", f.module)
  if (f.action) p.set("accion", f.action)
  if (f.result) p.set("resultado", f.result)
  if (f.userId) p.set("persona", f.userId)
  if (f.days !== 7) p.set("dias", String(f.days))
  if (f.page > 1) p.set("page", String(f.page))
  return p.toString()
}

export function activityApiQuery(f: ActivityFilters, limit: number): string {
  return qs({
    search: f.search.trim(),
    module: f.module,
    action: f.action,
    result: f.result,
    userId: f.userId,
    days: f.days,
    page: f.page,
    limit,
  })
}

// ─── Presentación (lógica pura) ──────────────────────────────────────────────

/** Dispositivo para mostrar: el API ya lo entrega como «Chrome en Windows». */
export function deviceText(device: string | null | undefined): string {
  return device && device.trim() ? device : "Dispositivo desconocido"
}

/** Resultado de una petición para el feed, en español claro y con tono. */
export function resultInfo(status: number | null): { label: string; tone: "success" | "warning" | "danger" | "neutral" } {
  if (status == null) return { label: "Sin dato", tone: "neutral" }
  if (status < 400) return { label: "Correcto", tone: "success" }
  if (status === 403 || status === 429) return { label: "Bloqueado por el plan o un límite", tone: "warning" }
  return { label: "No se pudo completar", tone: "danger" }
}

/** Nombre del archivo CSV con la fecha de hoy (hora local). */
export function accessCsvName(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `accesos-${y}-${m}-${d}.csv`
}

// ─── Llamadas al API ─────────────────────────────────────────────────────────

export const listAccessUsers = (f: AccessFilters, limit = 25) =>
  saasFetch<AccessPage>(`${API}/usuarios${accessApiQuery(f, { page: f.page, limit })}`)

export const listAccessActivity = (f: ActivityFilters, limit = 30) =>
  saasFetch<ActivityPage>(`${API}/actividad${activityApiQuery(f, limit)}`)

export const getAccessDetail = (userId: string) => saasData<AccessDetail>(`${API}/usuarios/${encodeURIComponent(userId)}`)

/** Descarga el CSV del resultado filtrado (el API lo audita). */
export async function downloadAccessCsv(f: AccessFilters): Promise<void> {
  const res = await fetch(`${API_BASE_URL}${API}/usuarios/export${accessApiQuery(f)}`, { credentials: "include" })
  if (!res.ok) throw new Error("No pudimos generar el archivo. Inténtalo de nuevo.")
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement("a")
  a.href = url
  a.download = accessCsvName()
  a.click()
  URL.revokeObjectURL(url)
}
