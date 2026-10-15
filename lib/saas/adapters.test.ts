import { describe, it, expect } from "vitest"
import {
  PAYMENT_STATUS_TO_API, SUB_STATUS_TO_API, invoiceFromApi, metricsFromApi, notificationFromApi, notificationKind,
  orgBillingFromApi, overviewFromApi, platformPaymentFromApi, platformSubscriptionFromApi, platformTicketFromApi, ticketFromApi,
  type RawMySubscription,
} from "./adapters"
import { billingNotice } from "./billing"

const NOW = new Date("2026-10-15T12:00:00Z")

const baseSub: NonNullable<RawMySubscription["subscription"]> = {
  status: "ACTIVE",
  amount: 30000,
  method: "tarjeta",
  cardLast4: "4242",
  currentPeriodStart: "2026-10-01T00:00:00Z",
  currentPeriodEnd: "2026-10-31T00:00:00Z",
  cancelAtPeriodEnd: false,
}

const raw = (over: Partial<RawMySubscription> = {}): RawMySubscription => ({
  membership: "pro",
  effectiveMembership: "pro",
  isTrialing: false,
  trialExpired: false,
  trialEndsAt: null,
  subscription: baseSub,
  ...over,
})

describe("overviewFromApi", () => {
  it("suscripción activa con tarjeta", () => {
    const o = overviewFromApi(raw())
    expect(o).toMatchObject({ plan: "pro", status: "active", amount: 30000, cancelAtPeriodEnd: false, scheduledPlan: null })
    expect(o.paymentMethod).toMatchObject({ type: "tarjeta", last4: "4242" })
    expect(o.pastDue).toBeNull()
  })

  it("sin suscripción: prueba o gratis", () => {
    expect(overviewFromApi(raw({ membership: "free", isTrialing: true, trialEndsAt: "2026-10-20T00:00:00Z", subscription: null }))).toMatchObject({
      plan: "free", status: "trialing", trialEndsAt: "2026-10-20T00:00:00Z",
    })
    expect(overviewFromApi(raw({ membership: "free", subscription: null })).status).toBe("free")
  })

  it("cancelación programada", () => {
    const o = overviewFromApi(raw({ subscription: { ...baseSub, cancelAtPeriodEnd: true } }))
    expect(o.cancelAtPeriodEnd).toBe(true)
    expect(o.scheduledPlan).toBe("free")
    expect(billingNotice(o, NOW)?.message).toMatch(/termina en 16 días/)
  })

  it("PAST_DUE usa nextRetryAt cuando no hay fecha de gracia", () => {
    const o = overviewFromApi(raw({ subscription: { ...baseSub, status: "PAST_DUE", failedAttempts: 2, nextRetryAt: "2026-10-18T00:00:00Z" } }))
    expect(o.status).toBe("past_due")
    expect(o.pastDue).toMatchObject({ attempts: 2, graceEndsAt: null, nextRetryAt: "2026-10-18T00:00:00Z" })
    const notice = billingNotice(o, NOW)
    expect(notice?.tone).toBe("warning")
    expect(notice?.message).toMatch(/Reintentaremos el cobro el/)
  })

  it("PENDING y CANCELLED", () => {
    expect(overviewFromApi(raw({ subscription: { ...baseSub, status: "PENDING" } })).status).toBe("pending")
    expect(overviewFromApi(raw({ subscription: { ...baseSub, status: "CANCELLED" } })).status).toBe("canceled")
  })

  it("método PSE sin últimos 4", () => {
    const o = overviewFromApi(raw({ subscription: { ...baseSub, method: "pse", cardLast4: null } }))
    expect(o.paymentMethod).toMatchObject({ brand: "PSE", last4: null })
  })
})

describe("invoiceFromApi", () => {
  it("mapea la factura del contrato", () => {
    const inv = invoiceFromApi({
      id: "i1", invoiceNo: "OMG-INV-00001", description: "Plan Pro", subtotal: 30000, tax: 0, total: 30000, status: "PAID",
      paymentMethod: "tarjeta", cardLast4: "4242", periodStart: "2026-10-01", periodEnd: "2026-10-31", issuedAt: "2026-10-01T10:00:00Z",
    })
    expect(inv).toMatchObject({ number: "OMG-INV-00001", amount: 30000, total: 30000, status: "paid", paymentMethodLabel: "Tarjeta •••• 4242" })
    expect(invoiceFromApi({ ...{ id: "i2", invoiceNo: "X", description: "", subtotal: 1, tax: 0, total: 1, issuedAt: "" }, status: "VOID" }).status).toBe("void")
  })
})

describe("notificaciones", () => {
  it("deduce el tipo por prefijo y solo acepta rutas internas", () => {
    expect(notificationKind("billing.payment_failed")).toBe("billing")
    expect(notificationKind("team.member_joined")).toBe("team")
    expect(notificationKind("otro")).toBe("system")
    const base = { id: "1", type: "billing.payment_approved", title: "t", body: "b", readAt: null, createdAt: "2026-10-15T00:00:00Z" }
    expect(notificationFromApi({ ...base, data: { url: "/configuracion/facturacion" } }).href).toBe("/configuracion/facturacion")
    expect(notificationFromApi({ ...base, data: { url: "https://malo.example" } }).href).toBeNull()
    expect(notificationFromApi({ ...base, data: { url: "//malo.example" } }).href).toBeNull()
    expect(notificationFromApi({ ...base, data: null }).href).toBeNull()
  })
})

describe("soporte", () => {
  const t = {
    id: "t1", ticketNo: "OMG-SUP-04821", name: "Ana", email: "a@x.co", category: "billing", subject: "Hola", message: "Mensaje largo",
    status: "in_progress", createdAt: "2026-10-15", updatedAt: "2026-10-15", organizationName: "Café",
  }
  it("mapea tickets y valida enums", () => {
    expect(ticketFromApi(t)).toMatchObject({ number: "OMG-SUP-04821", status: "in_progress", category: "billing" })
    expect(ticketFromApi({ ...t, category: "rara", status: "rara" })).toMatchObject({ category: "other", status: "open" })
    expect(platformTicketFromApi(t).organizationName).toBe("Café")
  })
})

describe("plataforma", () => {
  it("suscripciones y pagos", () => {
    const s = platformSubscriptionFromApi({
      id: "s1", organizationId: "o1", organizationName: "Café", plan: "academia", amount: 50000, status: "PAST_DUE", createdAt: "2026-10-01",
    })
    expect(s).toMatchObject({ plan: "academia", status: "past_due", cancelAtPeriodEnd: false })
    expect(platformPaymentFromApi({ id: "p1", operationNo: "OP-1", organizationId: "12345678-aaaa", method: "pse", amount: 30000, status: "APPROVED", createdAt: "" })).toMatchObject({
      status: "paid", invoiceNumber: "OP-1", organizationName: "Org 12345678",
    })
    expect(platformPaymentFromApi({ id: "p2", operationNo: "OP-2", method: "tarjeta", amount: 1, status: "PROCESSING", createdAt: "" }).status).toBe("pending")
  })

  it("filtros hacia el API", () => {
    expect(SUB_STATUS_TO_API.past_due).toBe("PAST_DUE")
    expect(PAYMENT_STATUS_TO_API.paid).toBe("APPROVED")
  })

  it("métricas: byPlan de objeto a lista", () => {
    const m = metricsFromApi({
      windowDays: 30, mrr: 80000, arr: 960000, activeSubscriptions: 2, mrrPastDue: 0, mrrPendingCancellation: 0,
      byPlan: { pro: { subscriptions: 1, mrr: 30000 }, academia: { subscriptions: 1, mrr: 50000 } },
      newSignups: 5, signupsByDay: [{ day: "2026-10-14", total: 2 }], newOrganizations: 3, cancellations: 1, churnRatePercent: 33.3,
      revenue: 80000, failedPayments: 0, activeTrials: 1, openSupportTickets: 2,
    })
    expect(m.byPlan).toEqual([
      { plan: "pro", subscriptions: 1, mrr: 30000 },
      { plan: "academia", subscriptions: 1, mrr: 50000 },
    ])
  })

  it("facturación de la organización", () => {
    const b = orgBillingFromApi({ subscriptions: [], invoices: [], payments: [] })
    expect(b).toEqual({ subscriptions: [], invoices: [], payments: [] })
  })
})
