// Contrato web↔API con respuestas REALES del API (capturadas con el servidor local, datos sintéticos).
// Si el API cambia la forma de una respuesta, el adaptador deja de entenderla y esto falla en CI.
// Para refrescar: levantar el API, repetir las llamadas del contrato y sobrescribir __fixtures__/api/*.json.

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  invoiceFromApi, metricsFromApi, notificationFromApi, orgBillingFromApi, overviewFromApi,
  platformPaymentFromApi, platformSubscriptionFromApi, platformTicketFromApi, ticketFromApi, usageFromApi,
  type RawInvoice, type RawMySubscription, type RawNotification, type RawPlatformPayment,
  type RawPlatformSubscription, type RawSaasMetrics, type RawTicket,
} from "./adapters"

function fx<T>(name: string): T {
  return JSON.parse(readFileSync(join(__dirname, "__fixtures__", "api", `${name}.json`), "utf8")) as T
}

/** Ningún campo del resultado puede quedar undefined/NaN: la UI lo pintaría tal cual. */
function expectComplete(value: unknown, path = "$") {
  if (value === undefined) throw new Error(`${path} es undefined`)
  if (typeof value === "number" && Number.isNaN(value)) throw new Error(`${path} es NaN`)
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) expectComplete(v, `${path}.${k}`)
  }
}

describe("contrato real web↔API", () => {
  it("GET /billing/me/subscription → overview", () => {
    const o = overviewFromApi(fx<{ data: RawMySubscription }>("mysub").data)
    expectComplete(o)
    expect(o).toMatchObject({ plan: "pro", status: "active", amount: 30000, cancelAtPeriodEnd: false })
    expect(o.paymentMethod?.last4).toBe("4242")
    expect(o.currentPeriodEnd).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it("GET /billing/invoices → recibos", () => {
    const rows = fx<{ data: RawInvoice[] }>("invoices").data.map(invoiceFromApi)
    expect(rows.length).toBeGreaterThan(0)
    for (const r of rows) {
      expectComplete(r)
      expect(r.number).toMatch(/^OMG-INV-\d+$/)
      expect(r.total).toBe(r.amount + r.tax)
      expect(r.paymentMethodLabel).toContain("4242")
    }
  })

  it("GET /billing/usage → uso del plan", () => {
    const u = usageFromApi(fx<{ data: Parameters<typeof usageFromApi>[0] }>("usage").data)
    expect(u.membership).toBe("pro")
    expect(u.items.length).toBeGreaterThan(0)
    for (const it of u.items) {
      expect(typeof it.feature).toBe("string")
      expect(it.limit === null || typeof it.limit === "number").toBe(true)
    }
  })

  it("GET /notifications → solo enlaces internos y válidos", () => {
    const rows = fx<{ data: RawNotification[] }>("notifs").data.map(notificationFromApi)
    expect(rows.length).toBeGreaterThan(0)
    for (const n of rows) {
      expectComplete(n)
      expect(n.kind).toBe("billing")
      expect(n.href).toBe("/configuracion/facturacion")
    }
  })

  it("GET /support/tickets → tickets del usuario", () => {
    const rows = fx<{ data: RawTicket[] }>("tickets").data.map(ticketFromApi)
    expect(rows.length).toBeGreaterThan(0)
    for (const t of rows) {
      expectComplete(t)
      expect(t.number).toMatch(/^OMG-SUP-\d+$/)
      expect(t.status).toBe("open")
    }
  })

  it("GET /platform/support/tickets → incluye el nombre del negocio", () => {
    const rows = fx<{ data: RawTicket[] }>("ptickets").data.map(platformTicketFromApi)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.some((t) => t.organizationName === "Negocio E2E")).toBe(true)
  })

  it("GET /platform/subscriptions", () => {
    const rows = fx<{ data: RawPlatformSubscription[] }>("psubs").data.map(platformSubscriptionFromApi)
    expect(rows.length).toBeGreaterThan(0)
    for (const s of rows) {
      expectComplete(s)
      expect(s.status).toBe("active")
      expect(s.organizationName).toBe("Negocio E2E")
    }
  })

  it("GET /platform/payments → muestra el negocio, no un id recortado", () => {
    const rows = fx<{ data: RawPlatformPayment[] }>("ppays").data.map(platformPaymentFromApi)
    expect(rows.length).toBeGreaterThan(0)
    for (const p of rows) {
      expectComplete(p)
      expect(p.status).toBe("paid")
      expect(p.organizationName).toBe("Negocio E2E")
    }
  })

  it("GET /platform/organizations/:id/billing", () => {
    const b = orgBillingFromApi(fx<{ data: Parameters<typeof orgBillingFromApi>[0] }>("porgbilling").data)
    expect(b.subscriptions.length).toBeGreaterThan(0)
    expect(b.invoices.length).toBeGreaterThan(0)
    expect(b.payments.length).toBeGreaterThan(0)
    expectComplete(b)
  })

  it("GET /platform/metrics/saas", () => {
    const m = metricsFromApi(fx<{ data: RawSaasMetrics }>("pmetrics").data)
    expectComplete(m)
    expect(m.arr).toBe(m.mrr * 12)
    expect(m.byPlan.reduce((a, p) => a + p.mrr, 0)).toBe(m.mrr)
    expect(m.signupsByDay.length).toBeGreaterThan(0)
  })
})

describe("errores del API", () => {
  it("un 403 de permisos llega como SaasError HTTP_403 (la consola lo distingue de un fallo de red)", async () => {
    const { saasFetch } = await import("./real")
    const { SaasError } = await import("./types")
    const original = globalThis.fetch
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ error: "Sin permisos de plataforma", required: "read:platform_metrics" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch
    try {
      const err = await saasFetch("/api/v1/platform/metrics/saas").catch((e: unknown) => e)
      expect(err).toBeInstanceOf(SaasError)
      expect((err as InstanceType<typeof SaasError>).code).toBe("HTTP_403")
      expect((err as Error).message).toBe("Sin permisos de plataforma")
    } finally {
      globalThis.fetch = original
    }
  })
})
