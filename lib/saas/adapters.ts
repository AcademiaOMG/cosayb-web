// Adaptadores PUROS del contrato del API (docs/SAAS_API_CONTRATO.md del repo del API)
// a los tipos del dominio web. Sin red ni React: se prueban con datos de ejemplo.

import { previewPlanChange } from "./billing"
import type {
  AppNotification, BillingOverview, Invoice, InvoiceStatus, NotificationKind, OrgBilling, PaymentMethodInfo,
  PaymentStatus, PlanId, PlanUsage, PlatformPayment, PlatformSaasMetrics, PlatformSubscription, PlatformTicket,
  SubscriptionStatus, SupportTicket, TicketCategory, TicketStatus,
} from "./types"

const PLANS: PlanId[] = ["free", "pro", "academia"]
const asPlan = (v: unknown): PlanId => (PLANS.includes(v as PlanId) ? (v as PlanId) : "free")

// ── Facturación ──────────────────────────────────────────────────────────────

export interface RawMySubscription {
  membership: string
  effectiveMembership: string
  isTrialing: boolean
  trialExpired: boolean
  trialEndsAt: string | null
  subscription: {
    status: string
    amount: number
    method: string
    cardLast4?: string | null
    currentPeriodStart?: string | null
    currentPeriodEnd?: string | null
    cancelAtPeriodEnd?: boolean
    nextRetryAt?: string | null
    failedAttempts?: number
  } | null
}

export const SUB_STATUS: Record<string, SubscriptionStatus> = {
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELLED: "canceled",
  PENDING: "pending",
}

const METHOD_BRAND: Record<string, string> = { tarjeta: "Tarjeta", pse: "PSE", nequi: "Nequi" }

function methodFromApi(method: string, last4?: string | null): PaymentMethodInfo {
  const type = (["tarjeta", "pse", "nequi"].includes(method) ? method : "tarjeta") as PaymentMethodInfo["type"]
  return { type, brand: METHOD_BRAND[type], last4: last4 ?? null, expMonth: null, expYear: null }
}

/** GET /billing/me/subscription → resumen de facturación de la UI. */
export function overviewFromApi(raw: RawMySubscription): BillingOverview {
  const sub = raw.subscription
  const plan = asPlan(raw.membership)
  if (!sub) {
    return {
      plan,
      status: raw.isTrialing ? "trialing" : "free",
      amount: 0,
      currency: "COP",
      trialEndsAt: raw.isTrialing ? raw.trialEndsAt : null,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      scheduledPlan: null,
      paymentMethod: null,
      pastDue: null,
    }
  }
  const status = SUB_STATUS[sub.status] ?? "active"
  const cancelAtPeriodEnd = !!sub.cancelAtPeriodEnd
  return {
    plan,
    status,
    amount: sub.amount,
    currency: "COP",
    trialEndsAt: null,
    currentPeriodStart: sub.currentPeriodStart ?? null,
    currentPeriodEnd: sub.currentPeriodEnd ?? null,
    cancelAtPeriodEnd,
    scheduledPlan: cancelAtPeriodEnd ? "free" : null,
    paymentMethod: methodFromApi(sub.method, sub.cardLast4),
    pastDue:
      status === "past_due"
        ? { since: null, graceEndsAt: null, attempts: sub.failedAttempts ?? 1, nextRetryAt: sub.nextRetryAt ?? null }
        : null,
  }
}

export interface RawInvoice {
  id: string
  invoiceNo: string
  description: string
  currency?: string
  subtotal: number
  tax: number
  total: number
  status: string
  paymentMethod?: string | null
  cardLast4?: string | null
  periodStart?: string | null
  periodEnd?: string | null
  issuedAt: string
}

const INVOICE_STATUS: Record<string, InvoiceStatus> = { PAID: "paid", VOID: "void" }

export function invoiceFromApi(raw: RawInvoice): Invoice {
  const method = raw.paymentMethod ? methodFromApi(raw.paymentMethod, raw.cardLast4) : null
  return {
    id: raw.id,
    number: raw.invoiceNo,
    issuedAt: raw.issuedAt,
    description: raw.description,
    amount: raw.subtotal,
    tax: raw.tax,
    total: raw.total,
    currency: "COP",
    status: INVOICE_STATUS[raw.status] ?? "paid",
    paymentMethodLabel: method ? (method.last4 ? `${method.brand} •••• ${method.last4}` : method.brand) : "—",
    periodStart: raw.periodStart ?? null,
    periodEnd: raw.periodEnd ?? null,
  }
}

export function usageFromApi(raw: { membership: string; items: PlanUsage["items"] }): PlanUsage {
  return { membership: asPlan(raw.membership), items: raw.items }
}

/** Vista previa calculada en el cliente (el API no expone vista previa; el cobro lo decide el checkout). */
export function previewFromOverview(o: BillingOverview, target: PlanId, now: Date = new Date()) {
  return previewPlanChange(o, target, now)
}

// ── Notificaciones ───────────────────────────────────────────────────────────

export interface RawNotification {
  id: string
  type: string
  title: string
  body: string
  data?: { url?: string } | null
  readAt: string | null
  createdAt: string
}

export function notificationKind(type: string): NotificationKind {
  if (type.startsWith("billing.")) return "billing"
  if (type.startsWith("team.")) return "team"
  if (type.startsWith("support.")) return "support"
  return "system"
}

export function notificationFromApi(raw: RawNotification): AppNotification {
  const url = raw.data?.url
  return {
    id: raw.id,
    kind: notificationKind(raw.type),
    title: raw.title,
    body: raw.body,
    // Solo rutas internas (evita enlaces externos inyectados)
    href: typeof url === "string" && url.startsWith("/") && !url.startsWith("//") ? url : null,
    createdAt: raw.createdAt,
    readAt: raw.readAt,
  }
}

// ── Soporte ──────────────────────────────────────────────────────────────────

export interface RawTicket {
  id: string
  ticketNo: string
  name: string
  email: string
  category: string
  subject: string
  message: string
  status: string
  createdAt: string
  updatedAt: string
  internalNote?: string | null
  organizationName?: string | null
}

const CATEGORIES: TicketCategory[] = ["general", "billing", "technical", "account", "other"]
const TICKET_STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"]

export function ticketFromApi(raw: RawTicket): SupportTicket {
  return {
    id: raw.id,
    number: raw.ticketNo,
    name: raw.name,
    email: raw.email,
    category: CATEGORIES.includes(raw.category as TicketCategory) ? (raw.category as TicketCategory) : "other",
    subject: raw.subject,
    message: raw.message,
    status: TICKET_STATUSES.includes(raw.status as TicketStatus) ? (raw.status as TicketStatus) : "open",
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  }
}

export function platformTicketFromApi(raw: RawTicket): PlatformTicket {
  return { ...ticketFromApi(raw), organizationName: raw.organizationName ?? null }
}

// ── Plataforma ───────────────────────────────────────────────────────────────

export interface RawPlatformSubscription {
  id: string
  organizationId: string
  organizationName: string
  userEmail?: string | null
  plan: string
  amount: number
  status: string
  currentPeriodEnd?: string | null
  cancelAtPeriodEnd?: boolean
  failedAttempts?: number
  nextRetryAt?: string | null
  createdAt: string
}

export function platformSubscriptionFromApi(raw: RawPlatformSubscription): PlatformSubscription {
  return {
    id: raw.id,
    organizationId: raw.organizationId,
    organizationName: raw.organizationName,
    userEmail: raw.userEmail ?? null,
    plan: asPlan(raw.plan),
    status: SUB_STATUS[raw.status] ?? "active",
    amount: raw.amount,
    currentPeriodEnd: raw.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: !!raw.cancelAtPeriodEnd,
    failedAttempts: raw.failedAttempts ?? 0,
    nextRetryAt: raw.nextRetryAt ?? null,
    createdAt: raw.createdAt,
  }
}

/** Estados de la UI → valor que espera el filtro del API. */
export const SUB_STATUS_TO_API: Partial<Record<SubscriptionStatus, string>> = {
  active: "ACTIVE",
  past_due: "PAST_DUE",
  canceled: "CANCELLED",
  pending: "PENDING",
}

export interface RawPlatformPayment {
  id: string
  operationNo: string
  organizationId?: string | null
  organizationName?: string | null
  method: string
  amount: number
  status: string
  kind?: string
  createdAt: string
}

const PAYMENT_STATUS: Record<string, PaymentStatus> = {
  APPROVED: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
  PENDING: "pending",
  PROCESSING: "pending",
}

export const PAYMENT_STATUS_TO_API: Record<PaymentStatus, string> = {
  paid: "APPROVED",
  failed: "FAILED",
  refunded: "REFUNDED",
  pending: "PENDING",
}

export function platformPaymentFromApi(raw: RawPlatformPayment): PlatformPayment {
  return {
    id: raw.id,
    organizationId: raw.organizationId ?? "",
    organizationName: raw.organizationName ?? (raw.organizationId ? `Org ${raw.organizationId.slice(0, 8)}` : "—"),
    invoiceNumber: raw.operationNo,
    amount: raw.amount,
    status: PAYMENT_STATUS[raw.status] ?? "pending",
    method: raw.method,
    createdAt: raw.createdAt,
  }
}

export interface RawSaasMetrics {
  windowDays: number
  mrr: number
  arr: number
  activeSubscriptions: number
  mrrPastDue: number
  mrrPendingCancellation: number
  byPlan: Record<string, { subscriptions: number; mrr: number }>
  newSignups: number
  signupsByDay: { day: string; total: number }[]
  newOrganizations: number
  cancellations: number
  churnRatePercent: number
  revenue: number
  failedPayments: number
  activeTrials: number
  openSupportTickets: number
}

export function metricsFromApi(raw: RawSaasMetrics): PlatformSaasMetrics {
  return {
    ...raw,
    byPlan: Object.entries(raw.byPlan ?? {}).map(([plan, v]) => ({ plan: asPlan(plan), subscriptions: v.subscriptions, mrr: v.mrr })),
    signupsByDay: raw.signupsByDay ?? [],
  }
}

/** GET /platform/organizations/:id/billing: el nombre llega una vez en `organization`, no en cada fila. */
export function orgBillingFromApi(raw: {
  organization?: { name: string } | null
  subscriptions: (Omit<RawPlatformSubscription, "organizationName"> & { organizationName?: string })[]
  invoices: RawInvoice[]
  payments: RawPlatformPayment[]
}): OrgBilling {
  const orgName = raw.organization?.name
  return {
    subscriptions: (raw.subscriptions ?? []).map((s) =>
      platformSubscriptionFromApi({ ...s, organizationName: s.organizationName ?? orgName ?? "—" }),
    ),
    invoices: (raw.invoices ?? []).map(invoiceFromApi),
    payments: (raw.payments ?? []).map((p) => platformPaymentFromApi({ ...p, organizationName: p.organizationName ?? orgName })),
  }
}
