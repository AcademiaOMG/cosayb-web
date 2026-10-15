// Tipos del dominio SaaS del lado web. La implementación (mock o real) vive en services.ts.

import type { PlanId, PaymentMethodId } from "@/lib/commerce/catalog"

export type { PlanId, PaymentMethodId }

/** Estado de la suscripción de una organización. */
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "free" | "pending"

export interface PaymentMethodInfo {
  type: PaymentMethodId
  /** «Visa», «Mastercard», «PSE», «Nequi»… */
  brand: string
  last4: string | null
  expMonth: number | null
  expYear: number | null
}

export interface PastDueInfo {
  since: string | null
  /** Fecha límite antes de bajar a Free (null si el API no la informa: se usa nextRetryAt). */
  graceEndsAt: string | null
  attempts: number
  nextRetryAt: string | null
}

export interface BillingOverview {
  plan: PlanId
  status: SubscriptionStatus
  amount: number
  currency: "COP"
  trialEndsAt: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  /** Plan al que pasará al terminar el periodo (downgrade o cancelación → free). */
  scheduledPlan: PlanId | null
  paymentMethod: PaymentMethodInfo | null
  pastDue: PastDueInfo | null
}

export interface PlanChangePreview {
  from: PlanId
  to: PlanId
  kind: "upgrade" | "downgrade" | "same"
  /** Valor que se cobra ahora (0 en downgrade). */
  chargeNow: number
  /** Cuándo aplica el cambio (ISO). */
  effectiveAt: string
  /** true si el cambio es inmediato. */
  immediate: boolean
  /** Valor mensual del plan destino. */
  newMonthly: number
  requiresPaymentMethod: boolean
}

export type InvoiceStatus = "paid" | "open" | "failed" | "refunded" | "void"

export interface Invoice {
  id: string
  /** Consecutivo visible, p. ej. OMG-INV-00012. */
  number: string
  issuedAt: string
  description: string
  amount: number
  tax: number
  total: number
  currency: "COP"
  status: InvoiceStatus
  paymentMethodLabel: string
  periodStart: string | null
  periodEnd: string | null
}

export type NotificationKind = "billing" | "team" | "system" | "support"

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  href: string | null
  createdAt: string
  readAt: string | null
}

export type TicketCategory = "general" | "billing" | "technical" | "account" | "other"
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed"

export interface SupportTicketInput {
  name: string
  email: string
  category: TicketCategory
  subject: string
  message: string
  /** Honeypot anti-bot: debe ir vacío. */
  website?: string
}

export interface SupportTicket extends SupportTicketInput {
  id: string
  number: string
  status: TicketStatus
  createdAt: string
  updatedAt: string
}

export interface PaymentMethodInput {
  type: PaymentMethodId
  brand: string
  last4: string | null
  expMonth: number | null
  expYear: number | null
}

// ── Plataforma (admin) ───────────────────────────────────────────────────────

/** Espejo de GET /platform/metrics/saas (ventana de `windowDays`). */
export interface PlatformSaasMetrics {
  windowDays: number
  mrr: number
  arr: number
  activeSubscriptions: number
  mrrPastDue: number
  mrrPendingCancellation: number
  byPlan: { plan: PlanId; subscriptions: number; mrr: number }[]
  newSignups: number
  signupsByDay: { day: string; total: number }[]
  newOrganizations: number
  cancellations: number
  /** Porcentaje 0–100. */
  churnRatePercent: number
  revenue: number
  failedPayments: number
  activeTrials: number
  openSupportTickets: number
}

export interface PlatformSubscription {
  id: string
  organizationId: string
  organizationName: string
  userEmail?: string | null
  plan: PlanId
  status: SubscriptionStatus
  amount: number
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  failedAttempts?: number
  nextRetryAt?: string | null
  createdAt: string
}

export type PaymentStatus = "paid" | "failed" | "refunded" | "pending"

export interface PlatformPayment {
  id: string
  organizationId: string
  organizationName: string
  invoiceNumber: string
  amount: number
  status: PaymentStatus
  method: string
  createdAt: string
}

export interface PlatformTicket extends SupportTicket {
  organizationName: string | null
}

/** Cambio de plan por soporte (cortesía): requiere justificación de al menos 5 caracteres. */
export interface OrgSupportAction {
  plan: PlanId
  justification: string
}

export interface OrgBilling {
  subscriptions: PlatformSubscription[]
  invoices: Invoice[]
  payments: PlatformPayment[]
}

export interface PlanUsageItem {
  feature: string
  label: string
  current: number
  /** null = ilimitado; 0 = no incluido. */
  limit: number | null
  percent: number | null
  atLimit: boolean
}

export interface PlanUsage {
  membership: PlanId
  items: PlanUsageItem[]
}

/** Qué operaciones soporta el backend activo; la UI se adapta (ver services.ts). */
export interface SaasCapabilities {
  /** inline = el cambio se confirma en Facturación; checkout = se redirige al checkout. */
  planChange: "inline" | "checkout"
  downgrade: boolean
  paymentMethodUpdate: boolean
  manualRetry: boolean
}

/** Datos exportables de la cuenta (descarga JSON). */
export interface AccountExport {
  exportedAt: string
  user: Record<string, unknown>
  organizations: Record<string, unknown>[]
  data: Record<string, unknown>
}

export class SaasError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = "SaasError"
  }
}
