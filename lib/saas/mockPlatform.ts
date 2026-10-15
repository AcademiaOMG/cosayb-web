// Datos y reglas del panel de plataforma en modo mock. Determinista (sin Math.random)
// para que las demos y las pruebas sean reproducibles.

import { addDays, planLabel, planPrice } from "./billing"
import type {
  MrrPoint, OrgSupportAction, PaymentStatus, PlanId, PlatformPayment, PlatformSaasMetrics,
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
  /** Historia de meses anteriores al actual. */
  history: MrrPoint[]
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
const monthKey = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`

export function createPlatformState(now: Date = new Date()): PlatformState {
  const orgs: MockOrg[] = NAMES.map((name, i) => {
    const createdAt = addDays(now, -(15 + i * 11))
    // distribución determinista: 4 free, 2 en prueba, 12 pro, 5 academia, 1 pago pendiente, 1 cancelada
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
      method: p % 3 === 0 ? "PSE" : p % 3 === 1 ? "Visa •••• 4242" : "Nequi",
      createdAt: iso(addDays(now, -((p * 3) % 28))),
    })
  }
  payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const history: MrrPoint[] = []
  const base = [180000, 240000, 300000, 390000, 450000, 540000, 630000, 720000, 810000, 930000, 1020000]
  for (let m = 11; m >= 1; m--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - m, 1))
    const idx = 11 - m
    history.push({
      month: monthKey(d),
      mrr: base[idx],
      newSubscriptions: 2 + (idx % 4),
      canceledSubscriptions: idx % 3 === 0 ? 1 : 0,
    })
  }

  const tickets: PlatformTicket[] = [
    {
      id: "t-p1", number: "SUP-0101", name: "Laura Gómez", email: "laura@cafelamontana.co", category: "facturacion",
      subject: "No me llegó el recibo del último cobro", message: "Pagué el plan Pro ayer y no veo el recibo en mi correo.",
      status: "open", createdAt: iso(addDays(now, -1)), updatedAt: iso(addDays(now, -1)), organizationName: "Café La Montaña",
    },
    {
      id: "t-p2", number: "SUP-0102", name: "Carlos Ruiz", email: "carlos@elfogon.co", category: "tecnico",
      subject: "Error al exportar PDF", message: "Al exportar la receta de ajiaco aparece un error.",
      status: "pending", createdAt: iso(addDays(now, -3)), updatedAt: iso(addDays(now, -2)), organizationName: "Restaurante El Fogón",
    },
    {
      id: "t-p3", number: "SUP-0103", name: "Visitante", email: "info@nuevonegocio.co", category: "otro",
      subject: "¿Tienen descuento por volumen?", message: "Somos una cadena de 6 locales, ¿hay plan empresarial?",
      status: "closed", createdAt: iso(addDays(now, -9)), updatedAt: iso(addDays(now, -8)), organizationName: null,
    },
  ]

  return { orgs, payments, tickets, history, seq: { payment: p } }
}

export function computeMetrics(state: PlatformState, now: Date = new Date()): PlatformSaasMetrics {
  const paying = state.orgs.filter((o) => o.plan !== "free" && (o.status === "active" || o.status === "past_due"))
  const mrr = paying.reduce((sum, o) => sum + planPrice(o.plan), 0)
  const activeSubscriptions = paying.length
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const newThisMonth = state.orgs.filter(
    (o) => o.plan !== "free" && new Date(o.createdAt) >= monthStart && o.status !== "canceled",
  ).length
  const canceledThisMonth = state.orgs.filter((o) => o.status === "canceled").length
  const startOfMonthActive = Math.max(1, activeSubscriptions - newThisMonth + canceledThisMonth)
  const byPlan = (["pro", "academia"] as PlanId[]).map((plan) => {
    const list = paying.filter((o) => o.plan === plan)
    return { plan, subscriptions: list.length, mrr: list.length * planPrice(plan) }
  })
  const series: MrrPoint[] = [
    ...state.history,
    { month: monthKey(now), mrr, newSubscriptions: newThisMonth, canceledSubscriptions: canceledThisMonth },
  ]
  return {
    mrr,
    arr: mrr * 12,
    arpa: activeSubscriptions ? Math.round(mrr / activeSubscriptions) : 0,
    activeSubscriptions,
    trialing: state.orgs.filter((o) => o.status === "trialing").length,
    pastDue: state.orgs.filter((o) => o.status === "past_due").length,
    newThisMonth,
    canceledThisMonth,
    churnRate: canceledThisMonth / startOfMonthActive,
    byPlan,
    series,
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
    .map((o) => ({
      id: `sub-${o.id}`,
      organizationId: o.id,
      organizationName: o.name,
      plan: o.plan,
      status: o.status,
      amount: planPrice(o.plan),
      currentPeriodEnd: o.currentPeriodEnd,
      cancelAtPeriodEnd: o.cancelAtPeriodEnd,
      createdAt: o.createdAt,
    }))
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

function addPayment(state: PlatformState, org: MockOrg, status: PaymentStatus, now: Date): PlatformState {
  const n = state.seq.payment + 1
  const payment: PlatformPayment = {
    id: `pay-${n}`,
    organizationId: org.id,
    organizationName: org.name,
    invoiceNumber: `OMG-INV-${String(n).padStart(5, "0")}`,
    amount: planPrice(org.plan),
    status,
    method: "Manual (soporte)",
    createdAt: iso(now),
  }
  return { ...state, seq: { payment: n }, payments: [payment, ...state.payments] }
}

/** Acciones de soporte sobre una organización (extender prueba, cambiar plan, marcar pago). */
export function applyOrgAction(state: PlatformState, orgId: string, action: OrgSupportAction, now: Date): PlatformState {
  const org = state.orgs.find((o) => o.id === orgId)
  if (!org) throw new SaasError("NOT_FOUND", "Organización no encontrada.")
  let updated: MockOrg = org
  let next = state

  if (action.type === "extend_trial") {
    if (!Number.isInteger(action.days) || action.days < 1 || action.days > 90) {
      throw new SaasError("INVALID_DAYS", "Indica entre 1 y 90 días.")
    }
    const from = org.trialEndsAt && new Date(org.trialEndsAt) > now ? org.trialEndsAt : iso(now)
    updated = { ...org, status: "trialing", plan: org.plan === "free" ? "free" : org.plan, trialEndsAt: iso(addDays(from, action.days)) }
  } else if (action.type === "change_plan") {
    if (action.plan === org.plan) throw new SaasError("SAME_PLAN", "La organización ya tiene ese plan.")
    updated = action.plan === "free"
      ? { ...org, plan: "free", status: "free", currentPeriodEnd: null, cancelAtPeriodEnd: false, trialEndsAt: null }
      : { ...org, plan: action.plan, status: "active", currentPeriodEnd: iso(addDays(now, 30)), cancelAtPeriodEnd: false, trialEndsAt: null }
  } else if (action.type === "mark_paid") {
    if (org.status !== "past_due") throw new SaasError("NOT_PAST_DUE", "La organización no tiene un pago pendiente.")
    updated = { ...org, status: "active", currentPeriodEnd: iso(addDays(now, 30)) }
    next = {
      ...next,
      payments: next.payments.map((p) => (p.organizationId === orgId && p.status === "failed" ? { ...p, status: "paid" as const } : p)),
    }
  }

  next = { ...next, orgs: next.orgs.map((o) => (o.id === orgId ? updated : o)) }
  if (action.type === "change_plan" && action.plan !== "free") next = addPayment(next, updated, "paid", now)
  return next
}

export function setTicketStatus(state: PlatformState, id: string, status: TicketStatus, now: Date): PlatformState {
  if (!state.tickets.some((t) => t.id === id)) throw new SaasError("NOT_FOUND", "Ticket no encontrado.")
  return {
    ...state,
    tickets: state.tickets.map((t) => (t.id === id ? { ...t, status, updatedAt: iso(now) } : t)),
  }
}

export function describeAction(action: OrgSupportAction): string {
  switch (action.type) {
    case "extend_trial": return `Extender prueba ${action.days} días`
    case "change_plan": return `Cambiar a plan ${planLabel(action.plan)}`
    case "mark_paid": return "Marcar pago como recibido"
  }
}
