// Reglas de facturación puras (sin red ni React). Valores por defecto de negocio
// alineados con el API: periodo de 30 días, prueba de 14 y gracia por pago fallido de 5.

import { PLAN_CATALOG, type PaidPlanId } from "@/lib/commerce/catalog"
import { resolvePlanIntent } from "@/lib/commerce/planState"
import type {
  BillingOverview, PlanChangePreview, PlanId, SubscriptionStatus, InvoiceStatus,
} from "./types"

export const PERIOD_DAYS = 30
export const TRIAL_DAYS = 14
export const PAST_DUE_GRACE_DAYS = 5 // solo modo mock; el API reintenta a +1/+3/+5 días

const DAY_MS = 24 * 60 * 60 * 1000
const RANK: Record<PlanId, number> = { free: 0, pro: 1, academia: 2 }

export function planPrice(plan: PlanId): number {
  return PLAN_CATALOG[plan].amount
}

export function planLabel(plan: PlanId): string {
  return PLAN_CATALOG[plan].label
}

export function addDays(from: Date | string, days: number): Date {
  return new Date(new Date(from).getTime() + days * DAY_MS)
}

/** Días completos (hacia arriba) hasta una fecha; nunca negativo. */
export function daysUntil(date: string | Date | null | undefined, now: Date = new Date()): number {
  if (!date) return 0
  const diff = new Date(date).getTime() - now.getTime()
  return diff <= 0 ? 0 : Math.ceil(diff / DAY_MS)
}

/** Qué pasaría (y qué se cobra) al pasar a otro plan. */
export function previewPlanChange(
  overview: Pick<BillingOverview, "plan" | "currentPeriodEnd" | "paymentMethod" | "status" | "trialEndsAt">,
  target: PlanId,
  now: Date = new Date(),
): PlanChangePreview {
  const from = overview.plan
  const newMonthly = planPrice(target)
  if (target === from && overview.status !== "trialing") {
    return {
      from, to: target, kind: "same", chargeNow: 0, effectiveAt: now.toISOString(),
      immediate: true, newMonthly, requiresPaymentMethod: false,
    }
  }
  const upgrade = RANK[target] > RANK[from] || (overview.status === "trialing" && target !== "free")
  if (upgrade) {
    return {
      from, to: target, kind: "upgrade", chargeNow: newMonthly, effectiveAt: now.toISOString(),
      immediate: true, newMonthly, requiresPaymentMethod: !overview.paymentMethod,
    }
  }
  const effectiveAt = overview.currentPeriodEnd ?? overview.trialEndsAt ?? now.toISOString()
  return {
    from, to: target, kind: "downgrade", chargeNow: 0, effectiveAt, immediate: false,
    newMonthly, requiresPaymentMethod: false,
  }
}

/** Ruta del checkout para pasar al plan de pago `plan`, o null si no corresponde (ya lo tiene / sería bajar). */
export function checkoutPathForPlan(
  o: Pick<BillingOverview, "plan" | "status">,
  plan: PaidPlanId,
): string | null {
  const trialing = o.status === "trialing"
  const intent = resolvePlanIntent(
    { membership: o.plan, effectiveMembership: trialing ? "pro" : o.plan, isTrialing: trialing, hasOrganization: true },
    plan,
  )
  if (intent === "blocked") return null
  return `/checkout/subscription/${plan}${intent === "upgrade" ? "?mode=upgrade" : ""}`
}

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  free: "Gratis",
  trialing: "En prueba",
  active: "Activa",
  past_due: "Pago pendiente",
  canceled: "Cancelada",
  pending: "Procesando pago",
}

export type Tone = "success" | "warning" | "accent" | "muted"

export const STATUS_TONES: Record<SubscriptionStatus, Tone> = {
  free: "muted",
  trialing: "accent",
  active: "success",
  past_due: "warning",
  canceled: "muted",
  pending: "accent",
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  paid: "Pagada",
  open: "Pendiente",
  failed: "Fallida",
  refunded: "Reembolsada",
  void: "Anulada",
}

export const INVOICE_STATUS_TONES: Record<InvoiceStatus, Tone> = {
  paid: "success",
  open: "warning",
  failed: "warning",
  refunded: "muted",
  void: "muted",
}

/** Aviso global según el estado de facturación (null = sin aviso). */
export interface BillingNotice {
  tone: "warning" | "info"
  message: string
  cta: { label: string; href: string }
}

export function billingNotice(o: BillingOverview | null | undefined, now: Date = new Date()): BillingNotice | null {
  if (!o) return null
  if (o.status === "past_due") {
    const days = daysUntil(o.pastDue?.graceEndsAt, now)
    const retryAt = o.pastDue?.nextRetryAt
    let message = "No pudimos cobrar tu suscripción. Revisa tu método de pago para conservar tu plan."
    if (days > 0) {
      message = `No pudimos cobrar tu suscripción. Actualiza tu método de pago en ${days} ${days === 1 ? "día" : "días"} para no perder tu plan.`
    } else if (retryAt) {
      message = `No pudimos cobrar tu suscripción. Reintentaremos el cobro el ${new Date(retryAt).toLocaleDateString("es-CO", { day: "numeric", month: "long" })}.`
    }
    return { tone: "warning", message, cta: { label: "Ver facturación", href: "/configuracion/facturacion" } }
  }
  if (o.status === "trialing") {
    const days = daysUntil(o.trialEndsAt, now)
    if (days <= 3) {
      return {
        tone: "info",
        message:
          days > 0
            ? `Tu prueba gratuita termina en ${days} ${days === 1 ? "día" : "días"}.`
            : "Tu prueba gratuita termina hoy.",
        cta: { label: "Elegir plan", href: "/planes" },
      }
    }
  }
  if (o.cancelAtPeriodEnd && o.currentPeriodEnd) {
    const days = daysUntil(o.currentPeriodEnd, now)
    return {
      tone: "info",
      message: `Tu suscripción termina en ${days} ${days === 1 ? "día" : "días"}. Puedes reanudarla cuando quieras.`,
      cta: { label: "Reanudar", href: "/configuracion/facturacion" },
    }
  }
  return null
}

export function brandFromCardNumber(digits: string): string {
  const d = digits.replace(/\D/g, "")
  if (/^4/.test(d)) return "Visa"
  if (/^(5[1-5]|2[2-7])/.test(d)) return "Mastercard"
  if (/^3[47]/.test(d)) return "American Express"
  return "Tarjeta"
}

/** Algoritmo de Luhn para validar el número de tarjeta. */
export function luhnValid(digits: string): boolean {
  const d = digits.replace(/\D/g, "")
  if (d.length < 13 || d.length > 19) return false
  let sum = 0
  let alt = false
  for (let i = d.length - 1; i >= 0; i--) {
    let n = Number(d[i])
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

/** Valida MM/AA: mes 1–12 y no vencido. Devuelve [mes, año completo] o null. */
export function parseExpiry(raw: string, now: Date = new Date()): [number, number] | null {
  const m = /^(\d{2})\/(\d{2})$/.exec(raw.trim())
  if (!m) return null
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return null
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)
  if (endOfMonth.getTime() < now.getTime()) return null
  return [month, year]
}
