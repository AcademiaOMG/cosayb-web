import { describe, expect, it } from "vitest"
import { missingYieldInputs, placeWastes, solveYieldFactor } from "./yieldFactor"

const pollo = { totalCost: 56000, totalWeight: 5420, waste1: 1230, waste2: 345, waste3: 234, waste4: 120 }

describe("solveYieldFactor (hoja FDRPROTEINAS)", () => {
  it("reproduce los valores del Excel (pollo)", () => {
    const r = solveYieldFactor(pollo)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.costPerGram).toBeCloseTo(10.3321, 4)
    expect(r.wasteWeight).toBe(1929)
    expect(r.wasteCost).toBeCloseTo(19930.63, 2)
    expect(r.wasteCosts.waste1).toBeCloseTo(12708.49, 2)
    expect(r.wasteCosts.waste2).toBeCloseTo(3564.58, 2)
    expect(r.netWeight).toBe(3491)
    expect(r.newCostPerGram).toBeCloseTo(16.0412, 4)
    expect(r.yieldFactor).toBeCloseTo(0.6441, 4)
  })

  it("reproduce los valores del Excel (papa, hoja FDRVEGETALES)", () => {
    const r = solveYieldFactor({ totalCost: 19000, totalWeight: 6000, waste1: 700, waste2: 0, waste3: 80, waste4: 55 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.costPerGram).toBeCloseTo(3.1667, 4)
    expect(r.wasteWeight).toBe(835)
    expect(r.wasteCost).toBeCloseTo(2644.17, 2)
    expect(r.netWeight).toBe(5165)
    expect(r.newCostPerGram).toBeCloseTo(3.6786, 4)
    expect(r.yieldFactor).toBeCloseTo(0.8608, 4)
  })

  it("sin bajas el rendimiento es 100 %", () => {
    const r = solveYieldFactor({ totalCost: 1000, totalWeight: 500, waste1: null, waste2: null, waste3: null, waste4: null })
    expect(r.ok && r.yieldFactor).toBe(1)
    expect(r.ok && r.newCostPerGram).toBe(2)
  })

  it("las bajas no pueden igualar o superar el peso total", () => {
    const r = solveYieldFactor({ ...pollo, waste1: 5420 })
    expect(r).toMatchObject({ ok: false, reason: "invalid" })
  })

  it("explica qué falta", () => {
    const inputs = { ...pollo, totalCost: null }
    expect(missingYieldInputs(inputs)).toEqual(["totalCost"])
    expect(solveYieldFactor(inputs)).toMatchObject({ ok: false, reason: "missing", field: "totalCost" })
  })
})

describe("placeWastes (historial → calculadora)", () => {
  it("ubica por nombre y deja libres los demás espacios", () => {
    const r = placeWastes("bfactor", [{ name: "grasa", weightGrams: 345 }, { name: "Cueros", weightGrams: 234 }])
    expect(r.grams).toEqual([null, 345, 234, null])
    expect(r.names[1]).toBe("Grasa")
  })

  it("conserva el nombre de un desperdicio que no coincide", () => {
    const r = placeWastes("bfactor", [{ name: "Piel", weightGrams: 50 }])
    expect(r.grams).toEqual([50, null, null, null])
    expect(r.names[0]).toBe("Piel")
  })

  it("no pierde gramos cuando hay más de cuatro", () => {
    const items = ["A", "B", "C", "D", "E"].map((name, i) => ({ name, weightGrams: 10 * (i + 1) }))
    const r = placeWastes("bfactorveg", items)
    expect(r.grams.reduce<number>((s, g) => s + (g ?? 0), 0)).toBe(150)
    expect(r.names[3]).toBe("Otros desperdicios")
  })
})
