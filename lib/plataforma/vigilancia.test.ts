import { describe, expect, it } from "vitest"
import { alertLinkTarget, failureTone, latencyTone, severityTone, statusHeadline, uptimeLabel } from "./vigilancia"
import { alertSeverityLabel, blockedActionLabel, emailProviderLabel, paymentModeLabel, systemAreaLabel } from "./labels"

describe("statusHeadline", () => {
  it("sin alertas activas dice «Todo en orden»", () => {
    const h = statusHeadline({ ok: true, activeCount: 0, critical: 0, warning: 0, info: 0 })
    expect(h.title).toBe("Todo en orden")
    expect(h.tone).toBe("success")
  })
  it("las informativas no rompen el «Todo en orden»", () => {
    const h = statusHeadline({ ok: true, activeCount: 0, critical: 0, warning: 0, info: 2 })
    expect(h.title).toBe("Todo en orden")
    expect(h.detail).toContain("2 avisos informativos")
  })
  it("cuenta alertas con singular y plural", () => {
    expect(statusHeadline({ ok: false, activeCount: 1, critical: 0, warning: 1, info: 0 }).title).toBe("1 alerta activa")
    const h = statusHeadline({ ok: false, activeCount: 3, critical: 1, warning: 2, info: 0 })
    expect(h.title).toBe("3 alertas activas")
    expect(h.tone).toBe("danger")
    expect(h.detail).toBe("1 crítica · 2 de atención")
  })
})

describe("alertLinkTarget", () => {
  it("lleva a la ficha, el negocio y las pantallas", () => {
    expect(alertLinkTarget({ type: "user", id: "u1" }).href).toBe("/plataforma/usuarios/u1")
    expect(alertLinkTarget({ type: "organization", id: "o1" }).href).toBe("/plataforma/organizaciones/o1")
    expect(alertLinkTarget({ type: "accesos" }).href).toBe("/plataforma/accesos")
    expect(alertLinkTarget({ type: "auditoria" }).href).toBe("/plataforma/auditoria")
    expect(alertLinkTarget({ type: "salud" }).internal).toBe("salud")
  })
})

describe("tiempos y tonos", () => {
  it("uptimeLabel", () => {
    expect(uptimeLabel(20)).toBe("menos de 1 min")
    expect(uptimeLabel(8 * 60)).toBe("8 min")
    expect(uptimeLabel(5 * 3600 + 12 * 60)).toBe("5 h 12 min")
    expect(uptimeLabel(3 * 86400 + 4 * 3600)).toBe("3 días 4 h")
    expect(uptimeLabel(86400)).toBe("1 día 0 h")
  })
  it("latencyTone", () => {
    expect(latencyTone(5)).toBe("success")
    expect(latencyTone(149)).toBe("success")
    expect(latencyTone(150)).toBe("warning")
    expect(latencyTone(800)).toBe("danger")
  })
  it("failureTone y severityTone", () => {
    expect(failureTone(0, 3, 10)).toBe("success")
    expect(failureTone(3, 3, 10)).toBe("warning")
    expect(failureTone(10, 3, 10)).toBe("danger")
    expect(severityTone("critical")).toBe("danger")
    expect(severityTone("warning")).toBe("warning")
    expect(severityTone("info")).toBe("info")
  })
})

describe("textos de vigilancia", () => {
  it("severidad, bloqueos y áreas se leen en español claro", () => {
    expect(alertSeverityLabel("critical")).toBe("Crítica")
    expect(blockedActionLabel("POST /auth/sign-in/email")).toBe("Inicio de sesión")
    expect(blockedActionLabel("POST /api/v1/billing/checkout/subscription")).toBe("Intento de pago")
    expect(blockedActionLabel(null)).toBe("Uso general de la plataforma")
    expect(systemAreaLabel("/api/v1/recipes/abc")).toBe("Recetas")
    expect(systemAreaLabel("/api/v1/platform/organizations/x")).toBe("Panel de plataforma")
    expect(systemAreaLabel("/auth/sign-in/email")).toBe("Inicio de sesión y cuentas")
    expect(systemAreaLabel("/algo/raro")).toBe("Otra parte de la plataforma")
  })
  it("proveedores", () => {
    expect(emailProviderLabel("console")).toContain("no envía")
    expect(paymentModeLabel("simulated")).toContain("simulado")
    expect(paymentModeLabel("real")).toBe("Pasarela real")
  })
})
