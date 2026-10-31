import { describe, it, expect } from "vitest"
import {
  applyOrgPlan, computeMetrics, createPlatformState, listPayments, listSubscriptions, orgBilling, setTicketStatus,
} from "./mockPlatform"
import { SaasError } from "./types"
import { PLAN_CATALOG } from "@/lib/commerce/catalog"

const NOW = new Date("2026-10-15T12:00:00Z")

describe("mockPlatform · métricas (forma del contrato)", () => {
  const state = createPlatformState(NOW)

  it("MRR = suma de planes de pago activos o con pago pendiente", () => {
    const m = computeMetrics(state, NOW)
    const expected = state.orgs
      .filter((o) => o.plan !== "free" && (o.status === "active" || o.status === "past_due"))
      .reduce((s, o) => s + (o.plan === "pro" ? PLAN_CATALOG.pro.amount : PLAN_CATALOG.academia.amount), 0)
    expect(m.mrr).toBe(expected)
    expect(m.arr).toBe(expected * 12)
    expect(m.byPlan.reduce((s, p) => s + p.mrr, 0)).toBe(m.mrr)
    expect(m.mrrPastDue).toBeGreaterThan(0)
    expect(m.mrrPastDue).toBeLessThan(m.mrr)
  })

  it("la ventana limita los registros por día", () => {
    const m30 = computeMetrics(state, NOW, 30)
    const m7 = computeMetrics(state, NOW, 7)
    expect(m30.windowDays).toBe(30)
    expect(m30.signupsByDay.length).toBeGreaterThanOrEqual(30)
    expect(m7.signupsByDay.length).toBeLessThan(m30.signupsByDay.length)
    expect(m30.newSignups).toBe(m30.signupsByDay.reduce((s, d) => s + d.total, 0))
    expect(m7.newSignups).toBeLessThanOrEqual(m30.newSignups)
  })

  it("churn en porcentaje y tickets abiertos incluyen «en curso»", () => {
    const m = computeMetrics(state, NOW)
    expect(m.churnRatePercent).toBeGreaterThan(0)
    expect(m.churnRatePercent).toBeLessThan(100)
    expect(m.openSupportTickets).toBe(2)
    expect(m.activeTrials).toBeGreaterThan(0)
  })

  it("hay organizaciones en todos los estados relevantes", () => {
    const statuses = new Set(state.orgs.map((o) => o.status))
    for (const s of ["free", "trialing", "active", "past_due", "canceled"]) expect(statuses.has(s as never)).toBe(true)
  })
})

describe("mockPlatform · listados", () => {
  const state = createPlatformState(NOW)

  it("filtra suscripciones por estado, plan y texto", () => {
    expect(listSubscriptions(state, { status: "past_due" })).toHaveLength(1)
    expect(listSubscriptions(state, { plan: "academia" }).every((s) => s.plan === "academia")).toBe(true)
    expect(listSubscriptions(state, { search: "fogón" })[0]?.organizationName).toMatch(/Fogón/)
    expect(listSubscriptions(state)).toHaveLength(state.orgs.length)
  })

  it("filtra pagos por estado", () => {
    expect(listPayments(state, { status: "failed" }).length).toBeGreaterThan(0)
    expect(listPayments(state, { status: "paid" }).every((p) => p.status === "paid")).toBe(true)
  })

  it("arma la facturación de una organización", () => {
    const paid = state.payments.find((p) => p.status === "paid")!
    const b = orgBilling(state, paid.organizationId)
    expect(b.subscriptions).toHaveLength(1)
    expect(b.payments.length).toBeGreaterThan(0)
    expect(b.invoices.every((i) => i.status === "paid")).toBe(true)
    expect(orgBilling(state, "no-existe")).toEqual({ subscriptions: [], invoices: [], payments: [] })
  })
})

describe("mockPlatform · cambio de plan por soporte", () => {
  const base = createPlatformState(NOW)
  const free = base.orgs.find((o) => o.status === "free")!
  const paid = base.orgs.find((o) => o.plan === "pro" && o.status === "active")!

  it("exige justificación de al menos 5 caracteres", () => {
    expect(() => applyOrgPlan(base, free.id, { plan: "pro", justification: "ok" }, NOW)).toThrowError(/al menos 5/)
  })

  it("sube de plan, registra el pago y deja la org activa", () => {
    const next = applyOrgPlan(base, free.id, { plan: "pro", justification: "cortesía soporte" }, NOW)
    expect(next.orgs.find((x) => x.id === free.id)).toMatchObject({ plan: "pro", status: "active" })
    expect(next.payments.length).toBe(base.payments.length + 1)
  })

  it("bajar a free limpia el periodo; mismo plan es error", () => {
    const next = applyOrgPlan(base, paid.id, { plan: "free", justification: "cierre solicitado" }, NOW)
    expect(next.orgs.find((x) => x.id === paid.id)).toMatchObject({ plan: "free", status: "free", currentPeriodEnd: null })
    expect(() => applyOrgPlan(base, paid.id, { plan: "pro", justification: "mismo plan" }, NOW)).toThrowError(/ya tiene/)
  })

  it("incorpora una organización real desconocida al actuar sobre ella", () => {
    const next = applyOrgPlan(base, "org-real", { plan: "pro", justification: "alta manual" }, NOW, { name: "Mi Negocio", plan: "free" })
    expect(next.orgs[0]).toMatchObject({ id: "org-real", name: "Mi Negocio", plan: "pro" })
    expect(() => applyOrgPlan(base, "org-real", { plan: "pro", justification: "alta manual" }, NOW)).toThrowError(/no encontrada/)
  })
})

describe("mockPlatform · tickets", () => {
  const base = createPlatformState(NOW)

  it("actualiza el estado", () => {
    const t = base.tickets[0]
    const next = setTicketStatus(base, t.id, "resolved", NOW)
    expect(next.tickets.find((x) => x.id === t.id)?.status).toBe("resolved")
    expect(() => setTicketStatus(base, "nope", "closed", NOW)).toThrowError(SaasError)
  })
})
