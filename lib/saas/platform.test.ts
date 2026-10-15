import { describe, it, expect } from "vitest"
import {
  applyOrgAction, computeMetrics, createPlatformState, listPayments, listSubscriptions, setTicketStatus,
} from "./mockPlatform"
import { SaasError } from "./types"

const NOW = new Date("2026-10-15T12:00:00Z")

describe("mockPlatform · métricas", () => {
  const state = createPlatformState(NOW)

  it("MRR = suma de planes de pago activos o con pago pendiente", () => {
    const m = computeMetrics(state, NOW)
    const expected = state.orgs
      .filter((o) => o.plan !== "free" && (o.status === "active" || o.status === "past_due"))
      .reduce((s, o) => s + (o.plan === "pro" ? 30000 : 50000), 0)
    expect(m.mrr).toBe(expected)
    expect(m.arr).toBe(expected * 12)
    expect(m.byPlan.reduce((s, p) => s + p.mrr, 0)).toBe(m.mrr)
    expect(m.arpa).toBe(Math.round(m.mrr / m.activeSubscriptions))
  })

  it("la serie tiene 12 meses y el último es el actual", () => {
    const m = computeMetrics(state, NOW)
    expect(m.series).toHaveLength(12)
    expect(m.series.at(-1)?.month).toBe("2026-10")
    expect(m.series.at(-1)?.mrr).toBe(m.mrr)
    expect(m.churnRate).toBeGreaterThanOrEqual(0)
    expect(m.churnRate).toBeLessThan(1)
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
})

describe("mockPlatform · acciones de soporte", () => {
  const base = createPlatformState(NOW)
  const pastDue = base.orgs.find((o) => o.status === "past_due")!
  const trial = base.orgs.find((o) => o.status === "trialing")!
  const free = base.orgs.find((o) => o.status === "free")!

  it("extiende la prueba", () => {
    const next = applyOrgAction(base, trial.id, { type: "extend_trial", days: 7 }, NOW)
    const o = next.orgs.find((x) => x.id === trial.id)!
    expect(new Date(o.trialEndsAt!).getTime()).toBe(new Date(trial.trialEndsAt!).getTime() + 7 * 86400000)
    expect(() => applyOrgAction(base, trial.id, { type: "extend_trial", days: 0 }, NOW)).toThrowError(SaasError)
  })

  it("cambia de plan y registra el pago", () => {
    const next = applyOrgAction(base, free.id, { type: "change_plan", plan: "pro" }, NOW)
    expect(next.orgs.find((x) => x.id === free.id)).toMatchObject({ plan: "pro", status: "active" })
    expect(next.payments.length).toBe(base.payments.length + 1)
    expect(() => applyOrgAction(base, free.id, { type: "change_plan", plan: "free" }, NOW)).toThrowError(/ya tiene/)
  })

  it("marca el pago pendiente como recibido", () => {
    const next = applyOrgAction(base, pastDue.id, { type: "mark_paid" }, NOW)
    expect(next.orgs.find((x) => x.id === pastDue.id)?.status).toBe("active")
    expect(next.payments.some((p) => p.organizationId === pastDue.id && p.status === "failed")).toBe(false)
    expect(() => applyOrgAction(base, free.id, { type: "mark_paid" }, NOW)).toThrowError(SaasError)
  })

  it("actualiza tickets", () => {
    const t = base.tickets[0]
    const next = setTicketStatus(base, t.id, "closed", NOW)
    expect(next.tickets.find((x) => x.id === t.id)?.status).toBe("closed")
    expect(() => setTicketStatus(base, "nope", "closed", NOW)).toThrowError(SaasError)
  })
})
