// Datos y reglas del panel de plataforma en modo mock. Determinista (sin Math.random)
// para que las demos y las pruebas sean reproducibles. Reproduce la forma del contrato
// del API (docs/SAAS_API_CONTRATO.md §7).

import { addDays, planPrice } from "./billing"
import type {
  Invoice, OrgBilling, OrgSupportAction, PaymentStatus, PlanId, PlatformPayment, PlatformSaasMetrics,
  PlatformSubscription, PlatformTicket, SubscriptionStatus, TicketStatus,
} from "./types"
import { SaasError } from "./types"

export interface MockOrg {
  id: string
  name: string
  plan: PlanId
  status: SubscriptionStatus
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  createdAt: string
}

export interface PlatformState {
  orgs: MockOrg[]
  payments: PlatformPayment[]
  tickets: PlatformTicket[]
  /** Registros por día de los últimos 90 días (el más antiguo primero). */
  signups: { day: string; total: number }[]
  seq: { payment: number }
}

const NAMES = [
  "Café La Montaña", "Restaurante El Fogón", "Pizzería Don Luigi", "Catering Sabor Andino", "Hotel Casa Real",
  "Panadería Trigo Dorado", "Bar La Esquina", "Cocina Oculta MDE", "Sushi Kai", "Parrilla El Gaucho",
  "Heladería Polar", "Food Truck Arepazo", "Pastelería Dulce Luna", "Hamburguesas Bravo", "Cevichería Mar Azul",
  "Cafetería Aroma", "Comidas Doña Rosa", "Bistró Le Petit", "Taquería Tizoc", "Fonda Los Abuelos",
  "Wok Express", "Asadero Pollo Real", "Brunch & Co", "Cocina Fusión Cali", "Dark Kitchen Norte",
]

const iso = (d: Date) => d.toISOString()
const dayKey = (d: Date) => d.toISOString().slice(0, 10)

export function createPlatformState(now: Date = new Date()): PlatformState {
  const orgs: MockOrg[] = NAMES.map((name, i) => {
    const createdAt = addDays(now, -(15 + i * 3))
    // distribución determinista: libres, en prueba, Pro, Academia, un pago pendiente y una cancelada
    let plan: PlanId = "pro"
    let status: SubscriptionStatus = "active"
    if (i % 6 === 0) { plan = "free"; status = "free" }
    else if (i % 11 === 1) { plan = "free"; status = "trialing" }
    else if (i % 4 === 3) plan = "academia"
    if (i === 7) status = "past_due"
    if (i === 14) status = "canceled"
    const paid = plan !== "free"
    return {
      id: `org-${String(i + 1).padStart(3, "0")}`,
      name,
      plan,
      status,
      trialEndsAt: status === "trialing" ? iso(addDays(now, 3 + (i % 8))) : null,
      currentPeriodEnd: paid ? iso(addDays(now, 1 + ((i * 7) % 29))) : null,
      cancelAtPeriodEnd: status === "canceled" || i === 20,
      createdAt: iso(createdAt),
    }
  })

  const payments: PlatformPayment[] = []
  let p = 0
  for (const o of orgs) {
    if (o.plan === "free") continue
    const status: PaymentStatus = o.status === "past_due" ? "failed" : "paid"
    p += 1
    payments.push({
      id: `pay-${p}`,
      organizationId: o.id,
      organizationName: o.name,
      invoiceNumber: `OMG-INV-${String(p).padStart(5, "0")}`,
      amount: planPrice(o.plan),
      status,
      method: p % 3 === 0 ? "pse" : p % 3 === 1 ? "tarjeta •••• 4242" : "nequi",
      createdAt: iso(addDays(now, -((p * 3) % 28))),
    })
  }
  payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const signups = Array.from({ length: 90 }, (_, k) => {
    const d = addDays(now, -(89 - k))
    return { day: dayKey(d), total: (k * 7) % 5 === 0 ? 0 : 1 + ((k * 3) % 4) }
  })

  const tickets: PlatformTicket[] = [
    {
      id: "t-p1", number: "OMG-SUP-04821", name: "Laura Gómez", email: "laura@cafelamontana.co", category: "billing",
      subject: "No me llegó el recibo del último cobro", message: "Pagué el plan Pro ayer y no veo el recibo en mi correo.",
      status: "open", createdAt: iso(addDays(now, -1)), updatedAt: iso(addDays(now, -1)), organizationName: "Café La Montaña",
    },
    {
      id: "t-p2", number: "OMG-SUP-04790", name: "Carlos Ruiz", email: "carlos@elfogon.co", category: "technical",
      subject: "Error al exportar PDF", message: "Al exportar la receta de ajiaco aparece un error.",
      status: "in_progress", createdAt: iso(addDays(now, -3)), updatedAt: iso(addDays(now, -2)), organizationName: "Restaurante El Fogón",
    },
    {
      id: "t-p3", number: "OMG-SUP-04702", name: "Visitante", email: "info@nuevonegocio.co", category: "general",
      subject: "¿Tienen descuento por volumen?", message: "Somos una cadena de 6 locales, ¿hay plan empresarial?",
      status: "closed", createdAt: iso(addDays(now, -9)), updatedAt: iso(addDays(now, -8)), organizationName: null,
    },
  ]

  return { orgs, payments, tickets, signups, seq: { payment: p } }
}

export function computeMetrics(state: PlatformState, now: Date = new Date(), days = 30): PlatformSaasMetrics {
  const since = addDays(now, -days)
  const active = state.orgs.filter((o) => o.plan !== "free" && (o.status === "active" || o.status === "past_due"))
  const mrr = active.reduce((s, o) => s + planPrice(o.plan), 0)
  const mrrPastDue = active.filter((o) => o.status === "past_due").reduce((s, o) => s + planPrice(o.plan), 0)
  const mrrPendingCancellation = active.filter((o) => o.cancelAtPeriodEnd).reduce((s, o) => s + planPrice(o.plan), 0)
  const cancellations = state.orgs.filter((o) => o.status === "canceled").length
  const inWindow = state.signups.filter((s) => s.day >= dayKey(since))
  const windowPayments = state.payments.filter((p) => new Date(p.createdAt) >= since)

  return {
    windowDays: days,
    mrr,
    arr: mrr * 12,
    activeSubscriptions: active.length,
    mrrPastDue,
    mrrPendingCancellation,
    byPlan: (["pro", "academia"] as PlanId[]).map((plan) => {
      const list = active.filter((o) => o.plan === plan)
      return { plan, subscriptions: list.length, mrr: list.length * planPrice(plan) }
    }),
    newSignups: inWindow.reduce((s, x) => s + x.total, 0),
    signupsByDay: inWindow,
    newOrganizations: state.orgs.filter((o) => new Date(o.createdAt) >= since).length,
    cancellations,
    churnRatePercent: active.length + cancellations ? Math.round((cancellations / (active.length + cancellations)) * 1000) / 10 : 0,
    revenue: windowPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0),
    failedPayments: windowPayments.filter((p) => p.status === "failed").length,
    activeTrials: state.orgs.filter((o) => o.status === "trialing").length,
    openSupportTickets: state.tickets.filter((t) => t.status === "open" || t.status === "in_progress").length,
  }
}

function toSubscription(o: MockOrg): PlatformSubscription {
  return {
    id: `sub-${o.id}`,
    organizationId: o.id,
    organizationName: o.name,
    userEmail: null,
    plan: o.plan,
    status: o.status,
    amount: planPrice(o.plan),
    currentPeriodEnd: o.currentPeriodEnd,
    cancelAtPeriodEnd: o.cancelAtPeriodEnd,
    failedAttempts: o.status === "past_due" ? 1 : 0,
    nextRetryAt: o.status === "past_due" ? o.currentPeriodEnd : null,
    createdAt: o.createdAt,
  }
}

export interface SubscriptionFilters {
  status?: SubscriptionStatus | "all"
  plan?: PlanId | "all"
  search?: string
}

export function listSubscriptions(state: PlatformState, f: SubscriptionFilters = {}): PlatformSubscription[] {
  const q = f.search?.trim().toLowerCase()
  return state.orgs
    .filter((o) => (f.status && f.status !== "all" ? o.status === f.status : true))
    .filter((o) => (f.plan && f.plan !== "all" ? o.plan === f.plan : true))
    .filter((o) => (q ? o.name.toLowerCase().includes(q) : true))
    .map(toSubscription)
}

export interface PaymentFilters {
  status?: PaymentStatus | "all"
  search?: string
}

export function listPayments(state: PlatformState, f: PaymentFilters = {}): PlatformPayment[] {
  const q = f.search?.trim().toLowerCase()
  return state.payments
    .filter((p) => (f.status && f.status !== "all" ? p.status === f.status : true))
    .filter((p) => (q ? p.organizationName.toLowerCase().includes(q) || p.invoiceNumber.toLowerCase().includes(q) : true))
}

/** Facturación de una organización: suscripción, facturas (de pagos aprobados) y pagos. */
export function orgBilling(state: PlatformState, orgId: string): OrgBilling {
  const org = state.orgs.find((o) => o.id === orgId)
  if (!org) return { subscriptions: [], invoices: [], payments: [] }
  const payments = state.payments.filter((p) => p.organizationId === orgId)
  const invoices: Invoice[] = payments
    .filter((p) => p.status === "paid")
    .map((p) => ({
      id: p.id, number: p.invoiceNumber, issuedAt: p.createdAt, description: `Plan ${org.plan} — mensual`,
      amount: p.amount, tax: 0, total: p.amount, currency: "COP" as const, status: "paid" as const,
      paymentMethodLabel: p.method, periodStart: p.createdAt, periodEnd: iso(addDays(p.createdAt, 30)),
    }))
  return { subscriptions: org.plan === "free" ? [] : [toSubscription(org)], invoices, payments }
}

function addPayment(state: PlatformState, org: MockOrg, now: Date): PlatformState {
  const n = state.seq.payment + 1
  const payment: PlatformPayment = {
    id: `pay-${n}`,
    organizationId: org.id,
    organizationName: org.name,
    invoiceNumber: `OMG-INV-${String(n).padStart(5, "0")}`,
    amount: planPrice(org.plan),
    status: "paid",
    method: "manual (soporte)",
    createdAt: iso(now),
  }
  return { ...state, seq: { payment: n }, payments: [payment, ...state.payments] }
}

/**
 * Cambio de plan por soporte (cortesía). Como en el API: exige justificación (>= 5 caracteres),
 * cierra la suscripción viva y fija el plan.
 */
export function applyOrgPlan(
  state: PlatformState,
  orgId: string,
  action: OrgSupportAction,
  now: Date,
  seed?: { name: string; plan: PlanId },
): PlatformState {
  if (action.justification.trim().length < 5) {
    throw new SaasError("INVALID_JUSTIFICATION", "Escribe una justificación de al menos 5 caracteres.")
  }
  let org = state.orgs.find((o) => o.id === orgId)
  if (!org && seed) {
    // Organización real que aún no existe en los datos de demostración: se incorpora
    org = {
      id: orgId, name: seed.name, plan: seed.plan, status: seed.plan === "free" ? "free" : "active",
      trialEndsAt: null, currentPeriodEnd: seed.plan === "free" ? null : iso(addDays(now, 30)),
      cancelAtPeriodEnd: false, createdAt: iso(now),
    }
    state = { ...state, orgs: [org, ...state.orgs] }
  }
  if (!org) throw new SaasError("NOT_FOUND", "Organización no encontrada.")
  if (action.plan === org.plan) throw new SaasError("SAME_PLAN", "La organización ya tiene ese plan.")

  const updated: MockOrg =
    action.plan === "free"
      ? { ...org, plan: "free", status: "free", currentPeriodEnd: null, cancelAtPeriodEnd: false, trialEndsAt: null }
      : { ...org, plan: action.plan, status: "active", currentPeriodEnd: iso(addDays(now, 30)), cancelAtPeriodEnd: false, trialEndsAt: null }

  let next: PlatformState = { ...state, orgs: state.orgs.map((o) => (o.id === orgId ? updated : o)) }
  if (action.plan !== "free") next = addPayment(next, updated, now)
  return next
}

export function setTicketStatus(state: PlatformState, id: string, status: TicketStatus, now: Date): PlatformState {
  if (!state.tickets.some((t) => t.id === id)) throw new SaasError("NOT_FOUND", "Ticket no encontrado.")
  return {
    ...state,
    tickets: state.tickets.map((t) => (t.id === id ? { ...t, status, updatedAt: iso(now) } : t)),
  }
}
