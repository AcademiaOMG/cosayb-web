// Motor del modo mock: transiciones puras sobre un estado serializable.
// Reproduce las reglas de negocio del API (ver billing.ts) para poder demostrar
// el ciclo completo sin pasarela. No usa red ni almacenamiento: la persistencia
// está en mockStore.ts.

import {
  PAST_DUE_GRACE_DAYS, PERIOD_DAYS, TRIAL_DAYS, addDays, planLabel, planPrice, previewPlanChange,
} from "./billing"
import type {
  AppNotification, BillingOverview, Invoice, NotificationKind, PaymentMethodInfo, PaymentMethodInput,
  PlanChangePreview, PlanId, SupportTicket, SupportTicketInput,
} from "./types"
import { SaasError } from "./types"

export interface MockState {
  /** operationNo de la suscripción real ya incorporada (ver syncFromReal). */
  adopted: string | null
  billing: BillingOverview
  invoices: Invoice[]
  notifications: AppNotification[]
  tickets: SupportTicket[]
  seq: { invoice: number; notification: number; ticket: number }
}

const iso = (d: Date) => d.toISOString()

export function createInitialState(now: Date = new Date()): MockState {
  const trialEnds = addDays(now, TRIAL_DAYS - 5)
  return {
    adopted: null,
    billing: {
      plan: "free",
      status: "trialing",
      amount: 0,
      currency: "COP",
      trialEndsAt: iso(trialEnds),
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      scheduledPlan: null,
      paymentMethod: null,
      pastDue: null,
    },
    invoices: [],
    notifications: [
      {
        id: "n-0",
        kind: "system",
        title: "Bienvenido a CO$AYB",
        body: "Tu prueba gratuita de 14 días ya está activa. Crea tu primera receta para ver el costo real.",
        href: "/recetas",
        createdAt: iso(addDays(now, -5)),
        readAt: null,
      },
    ],
    tickets: [],
    seq: { invoice: 0, notification: 1, ticket: 0 },
  }
}

export function pushNotification(
  state: MockState,
  kind: NotificationKind,
  title: string,
  body: string,
  href: string | null,
  now: Date,
): MockState {
  const n = state.seq.notification + 1
  const item: AppNotification = { id: `n-${n}`, kind, title, body, href, createdAt: iso(now), readAt: null }
  return {
    ...state,
    seq: { ...state.seq, notification: n },
    notifications: [item, ...state.notifications].slice(0, 50),
  }
}

function addInvoice(
  state: MockState,
  data: { description: string; amount: number; status: Invoice["status"]; periodStart: Date | null; periodEnd: Date | null },
  now: Date,
): { state: MockState; invoice: Invoice } {
  const n = state.seq.invoice + 1
  const method = state.billing.paymentMethod
  const invoice: Invoice = {
    id: `inv-${n}`,
    number: `OMG-INV-${String(n).padStart(5, "0")}`,
    issuedAt: iso(now),
    description: data.description,
    amount: data.amount,
    tax: 0,
    total: data.amount,
    currency: "COP",
    status: data.status,
    paymentMethodLabel: methodLabel(method),
    periodStart: data.periodStart ? iso(data.periodStart) : null,
    periodEnd: data.periodEnd ? iso(data.periodEnd) : null,
  }
  return {
    invoice,
    state: { ...state, seq: { ...state.seq, invoice: n }, invoices: [invoice, ...state.invoices] },
  }
}

export function methodLabel(m: PaymentMethodInfo | null): string {
  if (!m) return "—"
  return m.last4 ? `${m.brand} •••• ${m.last4}` : m.brand
}

export function toPaymentMethod(input: PaymentMethodInput): PaymentMethodInfo {
  return {
    type: input.type,
    brand: input.brand,
    last4: input.last4,
    expMonth: input.expMonth,
    expYear: input.expYear,
  }
}

export function setPaymentMethod(state: MockState, input: PaymentMethodInput, now: Date): MockState {
  let next: MockState = { ...state, billing: { ...state.billing, paymentMethod: toPaymentMethod(input) } }
  next = pushNotification(next, "billing", "Método de pago actualizado", `Ahora cobramos a ${methodLabel(next.billing.paymentMethod)}.`, "/configuracion/facturacion", now)
  return next
}

export function preview(state: MockState, target: PlanId, now: Date): PlanChangePreview {
  return previewPlanChange(state.billing, target, now)
}

/** Aplica un cambio de plan: upgrade inmediato con cobro; downgrade programado al fin del periodo. */
export function changePlan(state: MockState, target: PlanId, now: Date): MockState {
  const b = state.billing
  if (b.status === "past_due") {
    throw new SaasError("PAST_DUE", "Regulariza tu pago pendiente antes de cambiar de plan.")
  }
  const p = previewPlanChange(b, target, now)
  if (p.kind === "same") throw new SaasError("SAME_PLAN", "Ya estás en ese plan.")

  if (p.kind === "upgrade") {
    if (!b.paymentMethod) throw new SaasError("NO_PAYMENT_METHOD", "Agrega un método de pago para continuar.")
    const periodEnd = addDays(now, PERIOD_DAYS)
    let next: MockState = {
      ...state,
      billing: {
        ...b,
        plan: target,
        status: "active",
        amount: planPrice(target),
        trialEndsAt: null,
        currentPeriodStart: iso(now),
        currentPeriodEnd: iso(periodEnd),
        cancelAtPeriodEnd: false,
        scheduledPlan: null,
        pastDue: null,
      },
    }
    next = addInvoice(next, {
      description: `Plan ${planLabel(target)} — mensual`,
      amount: planPrice(target),
      status: "paid",
      periodStart: now,
      periodEnd,
    }, now).state
    return pushNotification(next, "billing", `Ahora tienes el plan ${planLabel(target)}`, `Cobramos ${planPrice(target).toLocaleString("es-CO")} COP. Revisa tu recibo en Facturación.`, "/configuracion/facturacion", now)
  }

  // downgrade: se aplica al terminar el periodo
  const next: MockState = {
    ...state,
    billing: { ...b, scheduledPlan: target, cancelAtPeriodEnd: target === "free" },
  }
  return pushNotification(next, "billing", "Cambio de plan programado", `Pasarás al plan ${planLabel(target)} al terminar tu periodo actual.`, "/configuracion/facturacion", now)
}

export function cancelSubscription(state: MockState, now: Date): MockState {
  const b = state.billing
  if (b.plan === "free" || b.status === "canceled") throw new SaasError("NOTHING_TO_CANCEL", "No tienes una suscripción de pago para cancelar.")
  const next: MockState = { ...state, billing: { ...b, cancelAtPeriodEnd: true, scheduledPlan: "free" } }
  return pushNotification(next, "billing", "Suscripción cancelada", "Conservas tu plan hasta el final del periodo ya pagado.", "/configuracion/facturacion", now)
}

export function resumeSubscription(state: MockState, now: Date): MockState {
  const b = state.billing
  if (!b.cancelAtPeriodEnd && !b.scheduledPlan) throw new SaasError("NOT_CANCELED", "Tu suscripción ya está activa.")
  const next: MockState = { ...state, billing: { ...b, cancelAtPeriodEnd: false, scheduledPlan: null } }
  return pushNotification(next, "billing", "Suscripción reanudada", "Seguiremos renovando tu plan automáticamente.", "/configuracion/facturacion", now)
}

/** Solo mock: simula que el cobro de renovación falló. */
export function simulatePaymentFailure(state: MockState, now: Date): MockState {
  const b = state.billing
  if (b.plan === "free") throw new SaasError("NO_PAID_PLAN", "Necesitas un plan de pago para simular un cobro fallido.")
  let next: MockState = {
    ...state,
    billing: {
      ...b,
      status: "past_due",
      pastDue: {
        since: iso(now),
        graceEndsAt: iso(addDays(now, PAST_DUE_GRACE_DAYS)),
        attempts: 1,
        nextRetryAt: iso(addDays(now, 1)),
      },
    },
  }
  next = addInvoice(next, {
    description: `Plan ${planLabel(b.plan)} — renovación`,
    amount: planPrice(b.plan),
    status: "failed",
    periodStart: now,
    periodEnd: addDays(now, PERIOD_DAYS),
  }, now).state
  return pushNotification(next, "billing", "No pudimos cobrar tu suscripción", "Actualiza tu método de pago para conservar tu plan.", "/configuracion/facturacion", now)
}

/** Reintenta el cobro pendiente: con método de pago válido se regulariza. */
export function retryPayment(state: MockState, now: Date): MockState {
  const b = state.billing
  if (b.status !== "past_due") throw new SaasError("NOT_PAST_DUE", "No tienes pagos pendientes.")
  if (!b.paymentMethod) throw new SaasError("NO_PAYMENT_METHOD", "Agrega un método de pago para continuar.")
  const periodEnd = addDays(now, PERIOD_DAYS)
  // la factura fallida pasa a pagada
  const invoices = state.invoices.map((inv, i) =>
    i === 0 && inv.status === "failed" ? { ...inv, status: "paid" as const, paymentMethodLabel: methodLabel(b.paymentMethod) } : inv,
  )
  const next: MockState = {
    ...state,
    invoices,
    billing: {
      ...b,
      status: "active",
      pastDue: null,
      currentPeriodStart: iso(now),
      currentPeriodEnd: iso(periodEnd),
    },
  }
  return pushNotification(next, "billing", "Pago recibido", "Regularizamos tu suscripción. ¡Gracias!", "/configuracion/facturacion", now)
}

/** Lo mínimo que se necesita de GET /billing/me/subscription (lib/commerce/services). */
export interface RealSubscriptionSnapshot {
  isTrialing: boolean
  trialExpired: boolean
  trialEndsAt: string | null
  subscription: {
    operationNo: string
    plan: string
    amount: number
    status: string
    method: string
    createdAt: string
  } | null
}

const METHOD_BRANDS: Record<string, string> = { tarjeta: "Tarjeta", pse: "PSE", nequi: "Nequi" }

/**
 * Incorpora al estado mock la suscripción REAL creada por el checkout existente
 * (que habla con el API), para que /planes → checkout → Facturación sea coherente.
 * Idempotente: solo actúa una vez por operación.
 */
export function syncFromReal(state: MockState, real: RealSubscriptionSnapshot, now: Date): MockState {
  const sub = real.subscription
  if (sub && sub.status === "ACTIVE" && (sub.plan === "pro" || sub.plan === "academia") && state.adopted !== sub.operationNo) {
    const plan = sub.plan as PlanId
    // el periodo vigente: avanza de a PERIOD_DAYS desde la compra hasta cubrir «ahora»
    let start = new Date(sub.createdAt)
    while (addDays(start, PERIOD_DAYS) <= now) start = addDays(start, PERIOD_DAYS)
    const end = addDays(start, PERIOD_DAYS)
    const type = (["tarjeta", "pse", "nequi"].includes(sub.method) ? sub.method : "tarjeta") as PaymentMethodInput["type"]
    const method: PaymentMethodInfo = { type, brand: METHOD_BRANDS[type] ?? "Tarjeta", last4: null, expMonth: null, expYear: null }
    let next: MockState = {
      ...state,
      adopted: sub.operationNo,
      billing: {
        ...state.billing,
        plan,
        status: "active",
        amount: sub.amount,
        trialEndsAt: null,
        currentPeriodStart: iso(start),
        currentPeriodEnd: iso(end),
        cancelAtPeriodEnd: false,
        scheduledPlan: null,
        paymentMethod: state.billing.paymentMethod ?? method,
        pastDue: null,
      },
    }
    next = addInvoice(next, {
      description: `Plan ${planLabel(plan)} — mensual (operación ${sub.operationNo})`,
      amount: sub.amount,
      status: "paid",
      periodStart: start,
      periodEnd: end,
    }, new Date(sub.createdAt)).state
    return pushNotification(next, "billing", `Plan ${planLabel(plan)} activo`, "Tu pago fue confirmado.", "/configuracion/facturacion", now)
  }
  // Sin suscripción de pago: refleja la prueba real mientras el estado local no tenga plan de pago
  if (state.billing.plan === "free" && !state.adopted) {
    if (real.isTrialing && real.trialEndsAt && state.billing.trialEndsAt !== real.trialEndsAt) {
      return { ...state, billing: { ...state.billing, status: "trialing", trialEndsAt: real.trialEndsAt } }
    }
    if (!real.isTrialing && real.trialExpired && state.billing.status === "trialing") {
      return { ...state, billing: { ...state.billing, status: "free", trialEndsAt: null } }
    }
  }
  return state
}

export function markNotificationRead(state: MockState, id: string, now: Date): MockState {
  return {
    ...state,
    notifications: state.notifications.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: iso(now) } : n)),
  }
}

export function markAllNotificationsRead(state: MockState, now: Date): MockState {
  return {
    ...state,
    notifications: state.notifications.map((n) => (n.readAt ? n : { ...n, readAt: iso(now) })),
  }
}

export function submitTicket(state: MockState, input: SupportTicketInput, now: Date): { state: MockState; ticket: SupportTicket } {
  const n = state.seq.ticket + 1
  const ticket: SupportTicket = {
    ...input,
    id: `t-${n}`,
    number: `SUP-${String(n).padStart(4, "0")}`,
    status: "open",
    createdAt: iso(now),
    updatedAt: iso(now),
  }
  let next: MockState = { ...state, seq: { ...state.seq, ticket: n }, tickets: [ticket, ...state.tickets] }
  next = pushNotification(next, "support", `Recibimos tu solicitud ${ticket.number}`, "Te responderemos por correo en máximo 1 día hábil.", "/soporte", now)
  return { state: next, ticket }
}
