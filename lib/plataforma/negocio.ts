// Consola de plataforma · negocio. Tipos del API (docs/SAAS_API_CONTRATO.md §7b), llamadas y lógica PURA
// (comparación de periodos, antigüedad de tickets, CSV, textos de motivos). Sin React.

import { qs, saasData, saasFetch } from "@/lib/saas/real"
import { fmtDate, formatCOP } from "@/lib/saas/format"
import { SUB_STATUS } from "@/lib/saas/adapters"
import type { SubscriptionStatus } from "@/lib/saas/types"

const API = "/api/v1/platform/negocio"

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface Kpi {
  value: number
  previous: number
}

export interface MonthPoint {
  month: string
  mrr: number
  revenue: number
  newSubscriptions: number
  cancellations: number
  churnPercent: number
}

export interface Resumen {
  windowDays: number
  period: { from: string; to: string }
  previousPeriod: { from: string; to: string }
  kpis: Record<
    "mrr" | "activeSubscriptions" | "revenue" | "newSubscriptions" | "cancellations" | "churnPercent" | "failedPayments" | "newSignups",
    Kpi
  >
  arr: number
  mrrPastDue: number
  mrrPendingCancellation: number
  newOrganizations: number
  byPlan: { plan: string; subscriptions: number; mrr: number }[]
  monthly: MonthPoint[]
  signupsByDay: { day: string; total: number }[]
}

export type AttentionKind = "past_due_subscriptions" | "failed_payments" | "tickets_open" | "trials_ending" | "scheduled_cancellations"

export interface AttentionSample {
  id: string
  title: string
  detail?: string | null
  at?: string | null
  organizationId?: string | null
}

export interface AttentionItem {
  kind: AttentionKind
  count: number
  overdue?: number
  sample: AttentionSample[]
}

export interface SubscriptionRow {
  id: string
  operationNo: string
  organizationId: string
  organizationName: string
  userName: string
  userEmail: string
  plan: string
  amount: number
  status: string
  method: string
  cardLast4: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  failedAttempts: number
  nextRetryAt: string | null
  createdAt: string
}

export interface PaymentRow {
  id: string
  operationNo: string
  organizationId: string | null
  organizationName: string | null
  userEmail: string | null
  subscriptionId: string
  plan: string | null
  method: string
  cardLast4: string | null
  amount: number
  status: string
  kind: string
  attempt: number
  failureReason: string | null
  createdAt: string
}

export interface PaymentSummary {
  approvedAmount: number
  approvedCount: number
  failedCount: number
}

export interface SubscriptionDetail {
  subscription: Omit<SubscriptionRow, "organizationName" | "userName" | "userEmail" | "method"> & {
    paymentMethod: string
    currentPeriodStart: string | null
    cancelledAt: string | null
  }
  organization: { id: string; name: string; membership: string; status: string }
  customer: { name: string; email: string }
  payments: Pick<PaymentRow, "id" | "operationNo" | "method" | "amount" | "status" | "kind" | "attempt" | "failureReason" | "cardLast4" | "createdAt">[]
  invoices: { id: string; invoiceNo: string; total: number; status: string; issuedAt: string; periodStart: string | null; periodEnd: string | null }[]
}

export interface PaymentDetail {
  payment: Omit<PaymentRow, "organizationName" | "userEmail" | "plan" | "subscriptionId"> & { subjectId: string }
  organization: { id: string; name: string | null } | null
  subscription: { id: string; operationNo: string; plan: string; status: string; userName: string; userEmail: string } | null
  invoice: { id: string; invoiceNo: string; subtotal: number; tax: number; total: number; status: string; issuedAt: string; periodStart: string | null; periodEnd: string | null; description: string } | null
}

export type TicketStatusApi = "open" | "in_progress" | "resolved" | "closed"

export interface TicketRow {
  id: string
  ticketNo: string
  name: string
  email: string
  category: string
  subject: string
  message: string
  status: TicketStatusApi
  internalNote: string | null
  organizationId: string | null
  organizationName: string | null
  createdAt: string
  updatedAt: string
  replies: number
  ageHours: number
  overdue: boolean
}

export interface TicketCounts {
  open: number
  in_progress: number
  resolved: number
  closed: number
  overdue: number
}

export interface TicketDetail {
  ticket: Omit<TicketRow, "organizationName" | "replies"> & { userId: string | null }
  user: { id: string; name: string; email: string; emailVerified: boolean; createdAt: string } | null
  organization: { id: string; name: string; membership: string; status: string } | null
  replies: { id: string; authorName: string; sentTo: string; body: string; createdAt: string }[]
  slaHours: number
}

export interface Paged<T> {
  data: T[]
  total: number
}

export type SortOrder = "asc" | "desc"

// ── Llamadas ─────────────────────────────────────────────────────────────────

export const negocioApi = {
  resumen: (days: number) => saasData<Resumen>(`${API}/resumen${qs({ days })}`),
  atencion: () => saasData<{ items: AttentionItem[]; slaHours: number }>(`${API}/atencion`),
  suscripciones: (f: Record<string, string | number | undefined>) => saasFetch<Paged<SubscriptionRow>>(`${API}/suscripciones${qs(f)}`),
  suscripcion: (id: string) => saasData<SubscriptionDetail>(`${API}/suscripciones/${encodeURIComponent(id)}`),
  pagos: (f: Record<string, string | number | undefined>) => saasFetch<Paged<PaymentRow> & { summary: PaymentSummary }>(`${API}/pagos${qs(f)}`),
  pago: (id: string) => saasData<PaymentDetail>(`${API}/pagos/${encodeURIComponent(id)}`),
  tickets: (f: Record<string, string | number | undefined>) =>
    saasFetch<Paged<TicketRow> & { counts: TicketCounts; slaHours: number }>(`${API}/soporte/tickets${qs(f)}`),
  ticket: (id: string) => saasData<TicketDetail>(`${API}/soporte/tickets/${encodeURIComponent(id)}`),
  responder: (id: string, message: string) =>
    saasData<{ status: TicketStatusApi }>(`${API}/soporte/tickets/${encodeURIComponent(id)}/respuesta`, {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
  /** Estado y nota interna: endpoint existente (§7). */
  actualizarTicket: (id: string, patch: { status?: TicketStatusApi; internalNote?: string | null }) =>
    saasData<unknown>(`/api/v1/platform/support/tickets/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) }),
}

// ── Lógica pura ──────────────────────────────────────────────────────────────

export type Change =
  | { kind: "none" } // ambos en 0: nada que comparar
  | { kind: "new" } // antes 0, ahora >0: no hay base para un porcentaje
  | { kind: "pct"; percent: number; direction: "up" | "down" | "flat" }

/** Variación entre el periodo actual y el anterior. */
export function compare(value: number, previous: number): Change {
  if (previous === 0) return value === 0 ? { kind: "none" } : { kind: "new" }
  const percent = Math.round(((value - previous) / Math.abs(previous)) * 1000) / 10
  return { kind: "pct", percent: Math.abs(percent), direction: percent > 0 ? "up" : percent < 0 ? "down" : "flat" }
}

/** Texto de la variación para mostrar: «↑ 12,5 % vs. periodo anterior». */
export function changeText(c: Change): string {
  if (c.kind === "none") return "Sin movimiento en ambos periodos"
  if (c.kind === "new") return "Sin base de comparación (el periodo anterior estaba en cero)"
  if (c.direction === "flat") return "Igual que el periodo anterior"
  const pct = c.percent.toLocaleString("es-CO", { maximumFractionDigits: 1 })
  return `${c.direction === "up" ? "Subió" : "Bajó"} ${pct} % frente al periodo anterior`
}

/** Si el cambio es bueno, malo o neutro. `higherIsBetter=false` para bajas, churn y pagos fallidos. */
export function changeTone(c: Change, higherIsBetter: boolean): "good" | "bad" | "neutral" {
  if (c.kind === "none") return "neutral"
  if (c.kind === "new") return higherIsBetter ? "good" : "bad"
  if (c.direction === "flat") return "neutral"
  return (c.direction === "up") === higherIsBetter ? "good" : "bad"
}

/** Antigüedad legible de un ticket a partir de sus horas. */
export function ageLabel(hours: number): string {
  if (hours < 1) return "menos de 1 h"
  if (hours < 48) return `${Math.floor(hours)} h`
  const d = Math.floor(hours / 24)
  return `${d} días`
}

export type SlaState = { tone: "ok" | "warning" | "late" | "done"; label: string }

/** Indicador de plazo: solo los tickets «abiertos» corren contra el plazo de primera respuesta. */
export function slaState(t: { status: TicketStatusApi; ageHours: number }, slaHours: number): SlaState {
  if (t.status !== "open") return { tone: "done", label: t.status === "in_progress" ? "En atención" : "Atendido" }
  if (t.ageHours >= slaHours) return { tone: "late", label: `Sin atender hace ${ageLabel(t.ageHours)}` }
  if (t.ageHours >= slaHours * 0.75) return { tone: "warning", label: `Por vencer · ${ageLabel(t.ageHours)} esperando` }
  return { tone: "ok", label: `Nuevo · ${ageLabel(t.ageHours)}` }
}

export const METHOD_LABELS: Record<string, string> = { tarjeta: "Tarjeta", pse: "PSE", nequi: "Nequi" }
export const methodLabel = (m: string | null | undefined) => (m ? (METHOD_LABELS[m] ?? "Otro método") : "—")

/** «Tarjeta •••• 4242» o «PSE». */
export function methodWithCard(method: string, last4: string | null): string {
  return last4 ? `${methodLabel(method)} •••• ${last4}` : methodLabel(method)
}

export const PAYMENT_KIND_LABELS: Record<string, string> = { initial: "Primer cobro", renewal: "Renovación", retry: "Reintento" }
export const paymentKindLabel = (k: string) => PAYMENT_KIND_LABELS[k] ?? "Cobro"

export const PAYMENT_STATUS_ES: Record<string, { label: string; tone: "success" | "warning" | "accent" | "muted" }> = {
  APPROVED: { label: "Aprobado", tone: "success" },
  FAILED: { label: "Rechazado", tone: "warning" },
  PENDING: { label: "Pendiente", tone: "accent" },
  PROCESSING: { label: "En proceso", tone: "accent" },
}

/** Estado de suscripción del API → estado de la UI (reutiliza las etiquetas de lib/saas/billing). */
export const subscriptionStatus = (api: string): SubscriptionStatus => SUB_STATUS[api] ?? "active"

/** Motivo de un cobro rechazado, en español claro. El API guarda el texto de la pasarela. */
export function failureReasonLabel(reason: string | null | undefined): string {
  if (!reason) return "La pasarela no informó el motivo"
  const r = reason.toLowerCase()
  if (r.includes("tarjeta")) return "La tarjeta fue rechazada por el banco"
  if (r.includes("fondos")) return "Fondos insuficientes"
  if (r.includes("rechazad")) return "El pago fue rechazado"
  if (r === "error" || r.includes("error")) return "Error al procesar el cobro"
  return reason.replace(/\s*\(simulaci[oó]n\)/i, "")
}

/** Resumen de lo que viene para una suscripción con cobro pendiente. */
export function retryText(failedAttempts: number, nextRetryAt: string | null): string {
  const tries = `${failedAttempts} ${failedAttempts === 1 ? "intento fallido" : "intentos fallidos"}`
  return nextRetryAt ? `${tries} · próximo reintento el ${fmtDate(nextRetryAt, "short")}` : tries
}

// ── CSV ──────────────────────────────────────────────────────────────────────

/** Una celda de CSV: comillas si hace falta y blindaje contra fórmulas de hojas de cálculo. */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value)
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+([.,]\d+)?$/.test(s)) s = `'${s}`
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV con separador «;» (Excel en español) y BOM para que respete las tildes. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers, ...rows].map((r) => r.map(csvCell).join(";"))
  return "﻿" + lines.join("\r\n") + "\r\n"
}

export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const todayStamp = (now: Date = new Date()) => now.toISOString().slice(0, 10)

export const subscriptionCsv = (rows: SubscriptionRow[]) =>
  toCsv(
    ["Negocio", "Cliente", "Correo", "Plan", "Importe mensual (COP)", "Estado", "Método de pago", "Alta", "Fin del periodo", "Cancela al final", "Intentos fallidos"],
    rows.map((s) => [
      s.organizationName, s.userName, s.userEmail, s.plan, s.amount, s.status, methodWithCard(s.method, s.cardLast4),
      s.createdAt.slice(0, 10), s.currentPeriodEnd?.slice(0, 10) ?? "", s.cancelAtPeriodEnd ? "Sí" : "No", s.failedAttempts,
    ]),
  )

export const paymentCsv = (rows: PaymentRow[]) =>
  toCsv(
    ["Fecha", "Negocio", "Correo", "Concepto", "Método de pago", "Importe (COP)", "Resultado", "Motivo del rechazo", "N.º de operación"],
    rows.map((p) => [
      p.createdAt.slice(0, 16).replace("T", " "), p.organizationName ?? "Negocio eliminado", p.userEmail ?? "", paymentKindLabel(p.kind),
      methodWithCard(p.method, p.cardLast4), p.amount, PAYMENT_STATUS_ES[p.status]?.label ?? p.status,
      p.status === "FAILED" ? failureReasonLabel(p.failureReason) : "", p.operationNo,
    ]),
  )

/** Descarga todas las filas del filtro (de a 500) con un tope de seguridad. */
export async function fetchAll<T>(page: (offset: number, limit: number) => Promise<Paged<T>>, cap = 5000): Promise<T[]> {
  const out: T[] = []
  const limit = 500
  for (let offset = 0; offset < cap; offset += limit) {
    const r = await page(offset, limit)
    out.push(...r.data)
    if (out.length >= r.total || r.data.length < limit) break
  }
  return out
}

export const money = formatCOP
