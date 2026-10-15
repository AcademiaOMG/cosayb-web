// Tipos del dominio SaaS del lado web. La implementación (mock o real) vive en services.ts.

import type { PlanId, PaymentMethodId } from "@/lib/commerce/catalog"

export type { PlanId, PaymentMethodId }

/** Estado de la suscripción de una organización. */
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "free"

export interface PaymentMethodInfo {
  type: PaymentMethodId
  /** «Visa», «Mastercard», «PSE», «Nequi»… */
  brand: string
  last4: string | null
  expMonth: number | null
  expYear: number | null
}

export interface PastDueInfo {
  since: string
  /** Fecha límite antes de bajar a Free. */
  graceEndsAt: string
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

export type InvoiceStatus = "paid" | "open" | "failed" | "refunded"

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

export type TicketCategory = "cuenta" | "facturacion" | "tecnico" | "sugerencia" | "otro"
export type TicketStatus = "open" | "pending" | "closed"

export interface SupportTicketInput {
  name: string
  email: string
  category: TicketCategory
  subject: string
  message: string
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

export interface MrrPoint {
  /** YYYY-MM */
  month: string
  mrr: number
  newSubscriptions: number
  canceledSubscriptions: number
}

export interface PlatformSaasMetrics {
  mrr: number
  arr: number
  arpa: number
  activeSubscriptions: number
  trialing: number
  pastDue: number
  newThisMonth: number
  canceledThisMonth: number
  /** 0–1 */
  churnRate: number
  byPlan: { plan: PlanId; subscriptions: number; mrr: number }[]
  series: MrrPoint[]
}

export interface PlatformSubscription {
  id: string
  organizationId: string
  organizationName: string
  plan: PlanId
  status: SubscriptionStatus
  amount: number
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
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

export type OrgSupportAction =
  | { type: "extend_trial"; days: number }
  | { type: "change_plan"; plan: PlanId }
  | { type: "mark_paid" }

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
