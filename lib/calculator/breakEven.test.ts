import { describe, expect, it } from "vitest"
import { distributeFixedCosts, missingBreakEvenInputs, perDay, rubrosToFixedCosts, solveBreakEven, sumRubros } from "./breakEven"

describe("solveBreakEven (hoja PUNTOEKILIBRIO)", () => {
  it("reproduce los valores del Excel", () => {
    const r = solveBreakEven({ fixedCosts: 6585000, salePrice: 28500, variableCost: 9000 })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.contributionMargin).toBe(19500)
    expect(r.unitsPerMonth).toBeCloseTo(337.6923, 4)
    expect(r.unitsPerDay).toBeCloseTo(11.2564, 4)
    expect(r.revenuePerMonth).toBeCloseTo(9624230.77, 2)
    expect(r.revenuePerDay).toBeCloseTo(320807.69, 2)
  })

  it("exige que el precio supere el costo variable", () => {
    const r = solveBreakEven({ fixedCosts: 1000, salePrice: 5000, variableCost: 5000 })
    expect(r).toMatchObject({ ok: false, field: "salePrice" })
  })

  it("explica qué falta", () => {
    const inputs = { fixedCosts: null, salePrice: 28500, variableCost: null }
    expect(missingBreakEvenInputs(inputs)).toEqual(["fixedCosts", "variableCost"])
    expect(solveBreakEven(inputs)).toMatchObject({ ok: false, reason: "missing", field: "fixedCosts" })
  })

  it("el costo variable puede ser 0 pero los costos fijos no", () => {
    expect(solveBreakEven({ fixedCosts: 1000, salePrice: 100, variableCost: 0 }).ok).toBe(true)
    expect(solveBreakEven({ fixedCosts: 0, salePrice: 100, variableCost: 0 })).toMatchObject({ ok: false, field: "fixedCosts" })
  })
})

describe("rubros de costos fijos (celdas E7:E16 del Excel)", () => {
  const excel = { rent: 2000000, salaries: 3000000, water: 100000, energy: 350000, gas: 185000, phone: 100000, marketing: 450000, taxes: 250000, other: 150000 }

  it("los 9 rubros del Excel suman 6.585.000 y dan 337,69 unidades con precio 28.500 y variable 9.000", () => {
    expect(sumRubros(excel)).toBe(6585000)
    const r = solveBreakEven({ fixedCosts: sumRubros(excel), salePrice: 28500, variableCost: 9000 })
    expect(r.ok && Number(r.unitsPerMonth.toFixed(2))).toBe(337.69)
  })

  it("solo manda a la API los rubros con monto", () => {
    const items = rubrosToFixedCosts({ ...excel, water: 0, gas: null as unknown as number })
    expect(items.map((i) => i.name)).not.toContain("Agua")
    expect(items.map((i) => i.name)).not.toContain("Gas")
    expect(items).toContainEqual({ name: "Arriendo", amount: 2000000 })
    expect(items.every((i) => i.amount > 0 && i.name.length > 0)).toBe(true)
  })

  it("reparte registros viejos por nombre y suma lo desconocido en Otros sin perder dinero", () => {
    const old = [
      { name: "Alquiler del local", amount: 1000000 },
      { name: "Nómina", amount: 2000000 },
      { name: "Energía eléctrica", amount: 300000 },
      { name: "Impuesto de renta", amount: 100000 },
      { name: "Seguros", amount: 50000 },
      { name: "Contador", amount: 70000 },
    ]
    const d = distributeFixedCosts(old)
    expect(d.rent).toBe(1000000)
    expect(d.salaries).toBe(2000000)
    expect(d.energy).toBe(300000)
    expect(d.taxes).toBe(100000)
    expect(d.other).toBe(120000)
    expect(sumRubros(d)).toBe(old.reduce((s, i) => s + i.amount, 0))
  })

  it("no confunde palabras parecidas: 'gastos' no es Gas, 'renta del local' es Arriendo", () => {
    const d = distributeFixedCosts([
      { name: "Gastos administrativos", amount: 10 },
      { name: "Gasolina", amount: 20 },
      { name: "Gas natural", amount: 30 },
      { name: "Renta del local", amount: 40 },
      { name: "IVA", amount: 50 },
    ])
    expect(d.gas).toBe(30)
    expect(d.rent).toBe(40)
    expect(d.taxes).toBe(50)
    expect(d.other).toBe(30)
  })

  it("por día usa 30 días como el Excel", () => {
    expect(perDay(9624230.769230768)).toBeCloseTo(320807.69, 2)
  })
})
