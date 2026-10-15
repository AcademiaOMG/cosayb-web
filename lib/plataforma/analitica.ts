// Consola de plataforma · analítica de uso. Tipos del API (docs/SAAS_API_CONTRATO.md §7c), llamadas y lógica PURA
// (aviso de poca historia, intensidad de color de la retención, etiquetas de semanas). Sin React.

import { qs, saasData } from "@/lib/saas/real"
import { fmtDate, fmtDay } from "@/lib/saas/format"

const API = "/api/v1/platform/analitica"

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface Capture {
  startedAt: string | null
  historyDays: number
  totalEvents: number
  enough: boolean
}

export interface AnalyticsKpi {
  value: number
  previous: number
  changePercent: number | null
}

export interface DailyPoint {
  date: string
  users: number
  orgs: number
  actions: number
}

export interface Actividad {
  days: number
  period: { from: string; to: string }
  previousPeriod: { from: string; to: string }
  capture: Capture
  base: { users: number; organizations: number }
  kpis: Record<"activeUsers" | "activeOrganizations" | "actions" | "dau" | "wau" | "mau" | "stickiness", AnalyticsKpi>
  series: DailyPoint[]
}

export interface ModuloUso {
  module: string
  actions: number
  previousActions: number
  changePercent: number | null
  users: number
  organizations: number
  byAction: Record<"view" | "create" | "update" | "delete" | "export", number>
  usedByOrganizations: number
  adoptionPercent: number
  lowAdoption: boolean
}

export interface Modulos {
  days: number
  period: { from: string; to: string }
  capture: Capture
  activeOrganizations: number
  lowAdoptionThreshold: number
  modules: ModuloUso[]
}

export interface FunnelStep {
  key: string
  count: number
  percentOfStart: number
  percentOfPrevious: number
  lost: number
  lostPercent: number
}

export interface CohortCell {
  week: number
  users: number | null
  percent: number | null
  partial: boolean
}

export interface Cohort {
  week: string
  size: number
  cells: CohortCell[]
}

export interface Retencion {
  weeks: number
  retentionWeeks: number
  capture: Capture
  cohorts: Cohort[]
}

export interface PlanUso {
  plan: string
  organizations: number
  activeOrganizations: number
  activePercent: number
  users: number
  actions: number
  actionsPerActiveOrganization: number
  topModules: { module: string; actions: number }[]
}

export interface LimitSignal {
  organizationId: string
  name: string
  hits: number
  lastAt: string
  modules: { module: string; hits: number }[]
  actions: number
  activeDays: number
}

export interface TrialSignal {
  organizationId: string
  name: string
  trialEndsAt: string
  daysLeft: number
  actions: number
  activeDays: number
  highActivity: boolean
}

export interface Planes {
  days: number
  period: { from: string; to: string }
  capture: Capture
  byPlan: PlanUso[]
  signals: { averageActionsPerActiveOrganization: number; trialWindowDays: number; limits: LimitSignal[]; trials: TrialSignal[] }
}

// ── Llamadas ─────────────────────────────────────────────────────────────────

export const analiticaApi = {
  actividad: (days: number) => saasData<Actividad>(`${API}/actividad${qs({ days })}`),
  modulos: (days: number) => saasData<Modulos>(`${API}/modulos${qs({ days })}`),
  embudo: (days: number) => saasData<{ days: number; steps: FunnelStep[] }>(`${API}/embudo${qs({ days: days || undefined })}`),
  retencion: (weeks: number) => saasData<Retencion>(`${API}/retencion${qs({ weeks })}`),
  planes: (days: number) => saasData<Planes>(`${API}/planes${qs({ days })}`),
}

// ── Lógica pura ──────────────────────────────────────────────────────────────

export const PERIODS = [
  { value: 7, label: "Últimos 7 días" },
  { value: 30, label: "Últimos 30 días" },
  { value: 90, label: "Últimos 90 días" },
] as const

const pluralDays = (n: number) => `${n} ${n === 1 ? "día" : "días"}`

/** Aviso cuando la captura de uso es reciente: en vez de mostrar tendencias engañosas, se explica. */
export function historyNotice(capture: Capture): string | null {
  if (!capture.startedAt) {
    return "Todavía no hay uso registrado. Las cifras aparecerán cuando los clientes empiecen a usar el producto."
  }
  if (capture.enough) return null
  return `La captura de uso empezó el ${fmtDate(capture.startedAt)}; hay ${pluralDays(capture.historyDays)} de historia. Con menos de 7 días las cifras y comparaciones aún no son confiables.`
}

/** Hay historia suficiente para comparar contra el periodo anterior completo. */
export function canCompare(capture: Capture, days: number): boolean {
  return capture.historyDays >= days * 2
}

/** Intensidad de color de una celda de retención: -1 sin dato, 0 a 4 de menor a mayor. */
export function heatLevel(percent: number | null): -1 | 0 | 1 | 2 | 3 | 4 {
  if (percent === null) return -1
  if (percent <= 0) return 0
  if (percent < 10) return 1
  if (percent < 25) return 2
  if (percent < 50) return 3
  return 4
}

const HEAT_MIX = [0, 14, 30, 52, 78]

export function heatStyle(percent: number | null): { background: string; color: string } {
  const level = heatLevel(percent)
  if (level < 0) return { background: "transparent", color: "var(--text-muted)" }
  return {
    background: level === 0 ? "var(--bg-secondary)" : `color-mix(in srgb, var(--accent) ${HEAT_MIX[level]}%, var(--bg-surface))`,
    color: level >= 3 ? "#fff" : "var(--text-primary)",
  }
}

/** «2026-09-14» → «14 sep – 20 sep» (semana de lunes a domingo). */
export function weekRangeLabel(monday: string): string {
  const end = new Date(Date.parse(`${monday}T00:00:00Z`) + 6 * 86_400_000).toISOString().slice(0, 10)
  return `${fmtDay(monday)} – ${fmtDay(end)}`
}

export const fmtNumber = (n: number) => n.toLocaleString("es-CO", { maximumFractionDigits: 1 })
export const fmtPercent = (n: number) => `${fmtNumber(n)} %`

/** Ancho de una barra (0–100) respecto al máximo de la lista. */
export function barWidth(value: number, max: number): number {
  return max > 0 ? Math.max(value > 0 ? 2 : 0, Math.round((value / max) * 100)) : 0
}

/** Texto de la tendencia de un módulo contra el periodo anterior. */
export function trendText(changePercent: number | null, comparable: boolean): string {
  if (!comparable) return "Sin comparación"
  if (changePercent === null) return "Nuevo"
  if (changePercent === 0) return "Igual"
  return `${changePercent > 0 ? "▲" : "▼"} ${fmtNumber(Math.abs(changePercent))} %`
}

/** Un solo texto para «el uso de X en el periodo»: «3 de 5 negocios activos». */
export function adoptionText(used: number, active: number): string {
  return `${used} de ${active} ${active === 1 ? "negocio activo" : "negocios activos"}`
}
