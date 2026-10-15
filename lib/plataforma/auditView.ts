/** Lógica pura de la pantalla de auditoría: tiempo relativo, filtros y a quién afectó cada registro. */

export interface AuditRow {
  id: string
  actorUserId: string
  action: string
  resourceType: string
  resourceId: string | null
  organizationId: string | null
  createdAt: string
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
]

/** «hace 5 minutos», «hace 2 días»… (menos de un minuto: «hace unos segundos»). */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000)
  if (Number.isNaN(seconds)) return ""
  const abs = Math.abs(seconds)
  if (abs < 60) return seconds > 0 ? "en unos segundos" : "hace unos segundos"
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" })
  for (const [unit, size] of UNITS) {
    if (abs >= size) return rtf.format(Math.round(seconds / size), unit)
  }
  return ""
}

/** Fecha y hora exactas en la zona horaria de quien mira. */
export function exactTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })
}

/** Convierte «2026-03-05» (campo de fecha) en el inicio o el fin de ese día en hora local. */
export function dayBoundary(day: string, edge: "start" | "end"): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  const [y, m, d] = day.split("-").map(Number)
  const date = edge === "start" ? new Date(y, m - 1, d, 0, 0, 0, 0) : new Date(y, m - 1, d, 23, 59, 59, 999)
  return date.getTime()
}

export interface AuditFilters {
  action?: string
  /** AAAA-MM-DD, hora local */
  from?: string
  to?: string
}

/** Filtra por acción y rango de fechas (el usuario y el negocio se filtran en el servidor). */
export function filterAudit<T extends AuditRow>(rows: T[], filters: AuditFilters): T[] {
  const from = filters.from ? dayBoundary(filters.from, "start") : null
  const to = filters.to ? dayBoundary(filters.to, "end") : null
  return rows.filter((r) => {
    if (filters.action && r.action !== filters.action) return false
    const t = new Date(r.createdAt).getTime()
    if (from !== null && t < from) return false
    if (to !== null && t > to) return false
    return true
  })
}

/** Error de rango: devuelve el mensaje o null si está bien. */
export function dateRangeError(from?: string, to?: string): string | null {
  if (!from || !to) return null
  return from > to ? "La fecha «Desde» no puede ser posterior a «Hasta»." : null
}

const USER_RESOURCES = new Set(["user", "platform_users"])

/**
 * ¿Sobre quién o qué recayó la acción? Devuelve el nombre del usuario o del negocio si se conoce.
 * `users` y `orgs` son diccionarios id → nombre.
 */
export function resolveTargetName(
  row: Pick<AuditRow, "resourceType" | "resourceId" | "organizationId">,
  users: Record<string, string>,
  orgs: Record<string, string>
): string | null {
  if (USER_RESOURCES.has(row.resourceType) && row.resourceId && users[row.resourceId]) return users[row.resourceId]
  if (row.organizationId && orgs[row.organizationId]) return orgs[row.organizationId]
  if (row.resourceId && orgs[row.resourceId]) return orgs[row.resourceId]
  return null
}
