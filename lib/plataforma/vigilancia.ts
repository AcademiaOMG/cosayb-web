// Vigilancia del panel de plataforma. Tipos del API (docs/SAAS_API_CONTRATO.md §10), llamadas y lógica PURA
// (enlaces de alertas, titulares de estado, tiempos). Sin React.

import { saasData, qs } from "@/lib/saas/real"
import type { StatusTone } from "@/components/plataforma/StatusPill"

const API = "/api/v1/platform/vigilancia"

// ── Tipos ────────────────────────────────────────────────────────────────────

export type AlertSeverity = "critical" | "warning" | "info"

export type AlertLink =
  | { type: "user"; id: string }
  | { type: "organization"; id: string }
  | { type: "accesos"; query?: string }
  | { type: "auditoria" }
  | { type: "salud" }

export interface VigilanciaAlert {
  id: string
  rule: string
  severity: AlertSeverity
  title: string
  explanation: string
  advice: string
  count: number
  since: string | null
  link: AlertLink
}

export interface VigilanciaStatus {
  ok: boolean
  activeCount: number
  critical: number
  warning: number
  info: number
}

export interface AlertasResponse {
  checkedAt: string
  status: VigilanciaStatus
  alerts: VigilanciaAlert[]
}

export interface SecuritySummary {
  loginSuccess: number
  loginFailed: number
  rateLimited: number
  passwordResets: number
  signups: number
  accountsDeleted: number
}

export type SecurityRange = "24h" | "7d"

export interface SeguridadResponse {
  range: SecurityRange
  generatedAt: string
  summary: { last24h: SecuritySummary; last7d: SecuritySummary }
  topIps: { ip: string; failures: number; accounts: number; lastAt: string }[]
  topAccounts: { email: string; userId: string | null; failures: number; ips: number; lastAt: string }[]
  blocks: { ip: string; blocks: number; lastAt: string; lastRoute: string | null }[]
  recentFailures: { id: number; at: string; email: string; ip: string | null; reason: string | null; method: string | null; userAgent: string | null }[]
  newIpAccesses: { userId: string; name: string | null; email: string; ip: string; at: string; userAgent: string | null }[]
}

export interface SaludResponse {
  checkedAt: string
  database: { ok: boolean; latencyMs: number }
  server: { uptimeSeconds: number; version: string | null; environment: string }
  email: { provider: string; failuresLast24h: number; failuresLastHour: number; lastFailureAt: string | null }
  payments: {
    provider: string
    simulated: boolean
    webhooksLast24h: { received: number; processed: number; ignored: number; failed: number }
    lastWebhookAt: string | null
    failuresLast24h: number
    failuresLastHour: number
    lastFailureAt: string | null
  }
  jobs: { job: string; name: string; lastRunAt: string; ok: boolean; durationMs: number | null }[]
  errors: { last15min: number; lastHour: number; last24h: number; recent: { at: string; method: string | null; path: string | null }[] }
}

// ── Llamadas ─────────────────────────────────────────────────────────────────

export const vigilanciaApi = {
  alertas: () => saasData<AlertasResponse>(`${API}/alertas`),
  seguridad: (range: SecurityRange) => saasData<SeguridadResponse>(`${API}/seguridad${qs({ range, limit: 50 })}`),
  salud: () => saasData<SaludResponse>(`${API}/salud`),
}

// ── Lógica pura ──────────────────────────────────────────────────────────────

export function severityTone(severity: AlertSeverity): StatusTone {
  return severity === "critical" ? "danger" : severity === "warning" ? "warning" : "info"
}

/** Destino y texto del enlace de una alerta. `internal: "salud"` = cambiar de pestaña en la misma pantalla. */
export function alertLinkTarget(link: AlertLink): { href?: string; label: string; internal?: "salud" } {
  switch (link.type) {
    case "user":
      return { href: `/plataforma/usuarios/${link.id}`, label: "Ver la ficha de la persona" }
    case "organization":
      return { href: `/plataforma/organizaciones/${link.id}`, label: "Ver el negocio" }
    case "accesos":
      return { href: "/plataforma/accesos", label: "Ver en Accesos" }
    case "auditoria":
      return { href: "/plataforma/auditoria", label: "Ver en Auditoría" }
    case "salud":
      return { label: "Ver la salud del sistema", internal: "salud" }
  }
}

/** Titular del estado general. */
export function statusHeadline(status: VigilanciaStatus): { title: string; detail: string; tone: StatusTone } {
  if (status.ok) {
    return {
      title: "Todo en orden",
      detail: status.info > 0 ? `${status.info} ${status.info === 1 ? "aviso" : "avisos"} informativos, nada urgente.` : "No hay nada sospechoso ni averiado.",
      tone: "success",
    }
  }
  const n = status.activeCount
  const parts: string[] = []
  if (status.critical > 0) parts.push(`${status.critical} ${status.critical === 1 ? "crítica" : "críticas"}`)
  if (status.warning > 0) parts.push(`${status.warning} de atención`)
  return {
    title: `${n} ${n === 1 ? "alerta activa" : "alertas activas"}`,
    detail: parts.join(" · "),
    tone: status.critical > 0 ? "danger" : "warning",
  }
}

/** Hora local de la última comprobación («10:42 a. m.»). */
export function checkedAtLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true }).format(d)
}

/** «3 días 4 h», «5 h 12 min», «8 min». */
export function uptimeLabel(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d} ${d === 1 ? "día" : "días"} ${h} h`
  if (h > 0) return `${h} h ${m} min`
  if (m > 0) return `${m} min`
  return "menos de 1 min"
}

/** La base responde bien (<150 ms), lenta (<800 ms) o muy lenta. */
export function latencyTone(ms: number): StatusTone {
  return ms < 150 ? "success" : ms < 800 ? "warning" : "danger"
}

/** Tono según cuántos fallos hubo en la última hora: 0 bien, pocos atención, muchos grave. */
export function failureTone(lastHour: number, warningAt: number, criticalAt: number): StatusTone {
  return lastHour >= criticalAt ? "danger" : lastHour >= warningAt ? "warning" : "success"
}
