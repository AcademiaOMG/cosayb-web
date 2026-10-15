import { describe, it, expect } from "vitest"
import {
  ageLabel, changeText, changeTone, compare, csvCell, failureReasonLabel, fetchAll, paymentCsv, slaState, subscriptionCsv, toCsv,
  type PaymentRow, type SubscriptionRow,
} from "./negocio"

describe("comparación de periodos", () => {
  it("calcula el porcentaje con un decimal y la dirección", () => {
    expect(compare(110, 100)).toEqual({ kind: "pct", percent: 10, direction: "up" })
    expect(compare(80, 100)).toEqual({ kind: "pct", percent: 20, direction: "down" })
    expect(compare(100, 100)).toEqual({ kind: "pct", percent: 0, direction: "flat" })
    expect(compare(210000, 80000)).toEqual({ kind: "pct", percent: 162.5, direction: "up" })
  })
  it("sin base (anterior en 0) no inventa un porcentaje", () => {
    expect(compare(5, 0)).toEqual({ kind: "new" })
    expect(compare(0, 0)).toEqual({ kind: "none" })
    expect(changeText(compare(5, 0))).toMatch(/Sin base de comparación/)
  })
  it("redacta la variación en español", () => {
    expect(changeText(compare(110, 100))).toBe("Subió 10 % frente al periodo anterior")
    expect(changeText(compare(80, 100))).toBe("Bajó 20 % frente al periodo anterior")
  })
  it("subir es bueno salvo en bajas, churn y fallos", () => {
    expect(changeTone(compare(110, 100), true)).toBe("good")
    expect(changeTone(compare(110, 100), false)).toBe("bad")
    expect(changeTone(compare(80, 100), false)).toBe("good")
    expect(changeTone(compare(3, 0), false)).toBe("bad")
    expect(changeTone(compare(0, 0), false)).toBe("neutral")
  })
})

describe("antigüedad y plazo de tickets", () => {
  it("formatea horas y días", () => {
    expect(ageLabel(0)).toBe("menos de 1 h")
    expect(ageLabel(5)).toBe("5 h")
    expect(ageLabel(47)).toBe("47 h")
    expect(ageLabel(72)).toBe("3 días")
  })
  it("solo corren contra el plazo los tickets abiertos", () => {
    expect(slaState({ status: "open", ageHours: 30 }, 24).tone).toBe("late")
    expect(slaState({ status: "open", ageHours: 20 }, 24).tone).toBe("warning")
    expect(slaState({ status: "open", ageHours: 2 }, 24).tone).toBe("ok")
    expect(slaState({ status: "in_progress", ageHours: 200 }, 24)).toEqual({ tone: "done", label: "En atención" })
    expect(slaState({ status: "closed", ageHours: 200 }, 24).tone).toBe("done")
  })
})

describe("CSV", () => {
  it("escapa comillas, separadores y saltos de línea", () => {
    expect(csvCell('Cafe "El Sol"')).toBe('"Cafe ""El Sol"""')
    expect(csvCell("a;b")).toBe('"a;b"')
    expect(csvCell("línea1\nlínea2")).toBe('"línea1\nlínea2"')
    expect(csvCell(null)).toBe("")
    expect(csvCell(30000)).toBe("30000")
  })
  it("neutraliza fórmulas pero deja pasar números negativos", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe(`"'=HYPERLINK(""x"")"`)
    expect(csvCell("+57 300")).toBe("'+57 300")
    expect(csvCell(-5)).toBe("-5")
  })
  it("arma el archivo con BOM, punto y coma y CRLF", () => {
    expect(toCsv(["A", "B"], [[1, "x;y"]])).toBe('﻿A;B\r\n1;"x;y"\r\n')
  })
  it("exporta suscripciones y pagos en español, sin códigos técnicos", () => {
    const sub = {
      organizationName: "Cafetería", userName: "Ana", userEmail: "a@x.co", plan: "pro", amount: 30000, status: "PAST_DUE",
      method: "tarjeta", cardLast4: "0002", createdAt: "2026-10-01T10:00:00Z", currentPeriodEnd: "2026-11-01T10:00:00Z",
      cancelAtPeriodEnd: false, failedAttempts: 1,
    } as unknown as SubscriptionRow
    expect(subscriptionCsv([sub]).split("\r\n")[1]).toContain("Tarjeta •••• 0002")
    const pay = {
      createdAt: "2026-10-15T15:55:16.279Z", organizationName: null, userEmail: null, kind: "renewal", method: "tarjeta",
      cardLast4: "0002", amount: 30000, status: "FAILED", failureReason: "Tarjeta rechazada (simulación)", operationNo: "OMG-PAY-1",
    } as unknown as PaymentRow
    const line = paymentCsv([pay]).split("\r\n")[1]
    expect(line).toContain("Negocio eliminado")
    expect(line).toContain("Renovación")
    expect(line).toContain("Rechazado")
    expect(line).toContain("La tarjeta fue rechazada por el banco")
  })
})

describe("motivos de rechazo", () => {
  it("traduce lo conocido y no deja vacío", () => {
    expect(failureReasonLabel("Tarjeta rechazada (simulación)")).toBe("La tarjeta fue rechazada por el banco")
    expect(failureReasonLabel("Pago rechazado por la pasarela")).toBe("El pago fue rechazado")
    expect(failureReasonLabel("error")).toBe("Error al procesar el cobro")
    expect(failureReasonLabel(null)).toBe("La pasarela no informó el motivo")
  })
})

describe("fetchAll", () => {
  it("recorre las páginas hasta el total", async () => {
    const all = Array.from({ length: 1200 }, (_, i) => i)
    const calls: number[] = []
    const out = await fetchAll(async (offset, limit) => {
      calls.push(offset)
      return { data: all.slice(offset, offset + limit), total: all.length }
    })
    expect(out).toHaveLength(1200)
    expect(calls).toEqual([0, 500, 1000])
  })
  it("respeta el tope", async () => {
    const out = await fetchAll(async (offset, limit) => ({ data: Array(limit).fill(offset), total: 99999 }), 1000)
    expect(out).toHaveLength(1000)
  })
})
