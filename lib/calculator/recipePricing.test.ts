import { describe, expect, it } from "vitest"
import { calcPricing } from "@/app/(app)/valoracion/lib"
import { solveRecipePricing } from "./recipePricing"

describe("solveRecipePricing (hoja FORMATORECETA)", () => {
  it("aplica las fórmulas del Excel (sin descontar impuestos ni otros)", () => {
    // costo 10.000, margen 3 %, MP 35 %
    const r = solveRecipePricing({ cost: 10000, pctMP: 35, margin: 3 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.costWithMargin).toBeCloseTo(10300, 6)
    expect(r.suggestedPrice).toBeCloseTo(29428.57, 2)
    expect(r.pctFixedCosts).toBeCloseTo(36.1111, 4)
    expect(r.pctProfit).toBeCloseTo(28.8889, 4)
    expect(r.indicator).toBe("REGULAR")
  })

  it("los porcentajes suman 100 %", () => {
    const r = solveRecipePricing({ cost: 5000, pctMP: 30, margin: 0 })
    expect(r.ok && r.pctFixedCosts + r.pctProfit + 30).toBeCloseTo(100, 6)
  })

  it("indicador: <32 MUY BUENO, >37 MALO", () => {
    expect(solveRecipePricing({ cost: 1000, pctMP: 30, margin: 0 })).toMatchObject({ indicator: "MUY BUENO" })
    expect(solveRecipePricing({ cost: 1000, pctMP: 40, margin: 0 })).toMatchObject({ indicator: "MALO" })
  })

  it("explica qué falta o qué revisar", () => {
    expect(solveRecipePricing({ cost: null, pctMP: 35, margin: 3 })).toMatchObject({ ok: false, field: "cost" })
    expect(solveRecipePricing({ cost: 1000, pctMP: null, margin: 3 })).toMatchObject({ ok: false, field: "pctMP" })
    expect(solveRecipePricing({ cost: 1000, pctMP: 100, margin: 3 })).toMatchObject({ ok: false, reason: "invalid", field: "pctMP" })
  })
})

describe("calcPricing con descuentos por defecto", () => {
  it("Valoración conserva su resultado (resta 5 % + 5 %)", () => {
    const withDefaults = calcPricing(10000, 35, 3)!
    const explicit = calcPricing(10000, 35, 3, { impuestos: 5, otros: 5 })!
    expect(withDefaults).toEqual(explicit)
    expect(withDefaults.pctProfit).toBeCloseTo(18.8889, 4)
    expect(withDefaults.pctImpuestos).toBe(5)
  })
})
