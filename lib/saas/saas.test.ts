import { describe, it, expect } from "vitest"
import {
  addDays, billingNotice, brandFromCardNumber, daysUntil, luhnValid, parseExpiry, previewPlanChange,
} from "./billing"
import {
  cancelSubscription, changePlan, createInitialState, markAllNotificationsRead, markNotificationRead,
  resumeSubscription, retryPayment, setPaymentMethod, simulatePaymentFailure, submitTicket, syncFromReal,
} from "./mockEngine"
import { SaasError } from "./types"
import type { PaymentMethodInput } from "./types"

const NOW = new Date("2026-10-15T12:00:00Z")
const CARD: PaymentMethodInput = { type: "tarjeta", brand: "Visa", last4: "4242", expMonth: 12, expYear: 2030 }

function paidState(plan: "pro" | "academia" = "pro") {
  let s = createInitialState(NOW)
  s = setPaymentMethod(s, CARD, NOW)
  return changePlan(s, plan, NOW)
}

describe("billing helpers", () => {
  it("daysUntil redondea hacia arriba y no baja de 0", () => {
    expect(daysUntil(addDays(NOW, 2.2), NOW)).toBe(3)
    expect(daysUntil(addDays(NOW, -3), NOW)).toBe(0)
    expect(daysUntil(null, NOW)).toBe(0)
  })

  it("valida tarjetas con Luhn y detecta la marca", () => {
    expect(luhnValid("4242 4242 4242 4242")).toBe(true)
    expect(luhnValid("4242 4242 4242 4241")).toBe(false)
    expect(luhnValid("123")).toBe(false)
    expect(brandFromCardNumber("4242424242424242")).toBe("Visa")
    expect(brandFromCardNumber("5555555555554444")).toBe("Mastercard")
    expect(brandFromCardNumber("378282246310005")).toBe("American Express")
  })

  it("parseExpiry acepta futuro y rechaza vencidas o inválidas", () => {
    expect(parseExpiry("12/30", NOW)).toEqual([12, 2030])
    expect(parseExpiry("01/20", NOW)).toBeNull()
    expect(parseExpiry("13/30", NOW)).toBeNull()
    expect(parseExpiry("1230", NOW)).toBeNull()
  })
})

describe("previewPlanChange", () => {
  it("upgrade desde prueba cobra el plan completo y pide método de pago", () => {
    const s = createInitialState(NOW)
    const p = previewPlanChange(s.billing, "pro", NOW)
    expect(p.kind).toBe("upgrade")
    expect(p.chargeNow).toBe(30000)
    expect(p.requiresPaymentMethod).toBe(true)
    expect(p.immediate).toBe(true)
  })

  it("downgrade no cobra y aplica al final del periodo", () => {
    const s = paidState("academia")
    const p = previewPlanChange(s.billing, "pro", NOW)
    expect(p.kind).toBe("downgrade")
    expect(p.chargeNow).toBe(0)
    expect(p.immediate).toBe(false)
    expect(p.effectiveAt).toBe(s.billing.currentPeriodEnd)
  })

  it("mismo plan activo es «same»", () => {
    expect(previewPlanChange(paidState().billing, "pro", NOW).kind).toBe("same")
  })
})

describe("mockEngine · ciclo de suscripción", () => {
  it("el estado inicial es una prueba sin facturas", () => {
    const s = createInitialState(NOW)
    expect(s.billing.status).toBe("trialing")
    expect(s.invoices).toHaveLength(0)
    expect(daysUntil(s.billing.trialEndsAt, NOW)).toBe(9)
  })

  it("no permite subir de plan sin método de pago", () => {
    const s = createInitialState(NOW)
    expect(() => changePlan(s, "pro", NOW)).toThrowError(SaasError)
    try {
      changePlan(s, "pro", NOW)
    } catch (e) {
      expect((e as SaasError).code).toBe("NO_PAYMENT_METHOD")
    }
  })

  it("upgrade genera factura pagada con consecutivo y notificación", () => {
    const s = paidState("pro")
    expect(s.billing.status).toBe("active")
    expect(s.billing.plan).toBe("pro")
    expect(s.invoices[0]).toMatchObject({ number: "OMG-INV-00001", status: "paid", total: 30000 })
    expect(s.invoices[0].paymentMethodLabel).toBe("Visa •••• 4242")
    expect(s.notifications[0].kind).toBe("billing")
    expect(daysUntil(s.billing.currentPeriodEnd, NOW)).toBe(30)
  })

  it("downgrade queda programado sin cobrar y se puede reanudar", () => {
    let s = paidState("academia")
    s = changePlan(s, "pro", NOW)
    expect(s.billing.plan).toBe("academia")
    expect(s.billing.scheduledPlan).toBe("pro")
    expect(s.invoices).toHaveLength(1)
    s = resumeSubscription(s, NOW)
    expect(s.billing.scheduledPlan).toBeNull()
  })

  it("cancelar mantiene el plan hasta el fin del periodo", () => {
    let s = paidState("pro")
    s = cancelSubscription(s, NOW)
    expect(s.billing.plan).toBe("pro")
    expect(s.billing.cancelAtPeriodEnd).toBe(true)
    expect(s.billing.scheduledPlan).toBe("free")
    const notice = billingNotice(s.billing, NOW)
    expect(notice?.message).toMatch(/termina en 30 días/)
  })

  it("no se cancela ni reanuda lo que no corresponde", () => {
    expect(() => cancelSubscription(createInitialState(NOW), NOW)).toThrowError(SaasError)
    expect(() => resumeSubscription(paidState(), NOW)).toThrowError(SaasError)
  })

  it("pago fallido → past_due con gracia; reintento lo regulariza", () => {
    let s = simulatePaymentFailure(paidState("pro"), NOW)
    expect(s.billing.status).toBe("past_due")
    expect(s.invoices[0].status).toBe("failed")
    expect(daysUntil(s.billing.pastDue?.graceEndsAt, NOW)).toBe(5)
    expect(billingNotice(s.billing, NOW)?.tone).toBe("warning")
    expect(() => changePlan(s, "academia", NOW)).toThrowError(/pago pendiente/)

    s = retryPayment(s, NOW)
    expect(s.billing.status).toBe("active")
    expect(s.billing.pastDue).toBeNull()
    expect(s.invoices[0].status).toBe("paid")
    expect(billingNotice(s.billing, NOW)).toBeNull()
  })

  it("aviso de fin de prueba solo en los últimos 3 días", () => {
    const s = createInitialState(NOW)
    expect(billingNotice(s.billing, NOW)).toBeNull()
    const late = billingNotice(s.billing, addDays(NOW, 7))
    expect(late?.message).toMatch(/termina en 2 días/)
  })
})

describe("mockEngine · sincronización con la suscripción real", () => {
  const real = {
    isTrialing: false,
    trialExpired: false,
    trialEndsAt: null,
    subscription: { operationNo: "SUB-1", plan: "pro", amount: 30000, status: "ACTIVE", method: "pse", createdAt: "2026-10-01T10:00:00Z" },
  }

  it("incorpora la suscripción activa una sola vez", () => {
    let s = syncFromReal(createInitialState(NOW), real, NOW)
    expect(s.billing).toMatchObject({ plan: "pro", status: "active", amount: 30000 })
    expect(s.billing.paymentMethod?.brand).toBe("PSE")
    expect(s.invoices).toHaveLength(1)
    expect(s.invoices[0].description).toMatch(/SUB-1/)
    expect(daysUntil(s.billing.currentPeriodEnd, NOW)).toBe(16)
    s = syncFromReal(s, real, NOW)
    expect(s.invoices).toHaveLength(1)
  })

  it("avanza el periodo si la compra es más vieja que 30 días", () => {
    const old = { ...real, subscription: { ...real.subscription, createdAt: "2026-08-01T10:00:00Z" } }
    const s = syncFromReal(createInitialState(NOW), old, NOW)
    expect(daysUntil(s.billing.currentPeriodEnd, NOW)).toBeGreaterThan(0)
    expect(daysUntil(s.billing.currentPeriodEnd, NOW)).toBeLessThanOrEqual(30)
  })

  it("refleja la prueba real cuando no hay plan de pago", () => {
    const trial = { isTrialing: true, trialExpired: false, trialEndsAt: "2026-10-20T00:00:00Z", subscription: null }
    expect(syncFromReal(createInitialState(NOW), trial, NOW).billing.trialEndsAt).toBe("2026-10-20T00:00:00Z")
    const expired = { isTrialing: false, trialExpired: true, trialEndsAt: null, subscription: null }
    expect(syncFromReal(createInitialState(NOW), expired, NOW).billing.status).toBe("free")
  })
})

describe("mockEngine · notificaciones y soporte", () => {
  it("marca leídas una y todas", () => {
    let s = paidState()
    const unread = () => s.notifications.filter((n) => !n.readAt).length
    expect(unread()).toBeGreaterThan(1)
    s = markNotificationRead(s, s.notifications[0].id, NOW)
    const after = unread()
    s = markAllNotificationsRead(s, NOW)
    expect(unread()).toBe(0)
    expect(after).toBeGreaterThan(0)
  })

  it("crea tickets con consecutivo", () => {
    const { state, ticket } = submitTicket(
      createInitialState(NOW),
      { name: "Ana", email: "ana@x.co", category: "tecnico", subject: "Falla", message: "No carga" },
      NOW,
    )
    expect(ticket.number).toBe("SUP-0001")
    expect(ticket.status).toBe("open")
    expect(state.tickets).toHaveLength(1)
    expect(state.notifications[0].kind).toBe("support")
  })
})
