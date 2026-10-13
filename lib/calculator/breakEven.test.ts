import { describe, expect, it } from "vitest"
import {
  contributionMarginOf,
  distributeFixedCosts,
  invalidBreakEvenInputs,
  missingBreakEvenInputs,
  perDay,
  rubrosToFixedCosts,
  solveBreakEven,
  solveBreakEvenAverage,
  sumRubros,
} from "./breakEven"

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

// Valores en caché del Excel (APPAYB002 FINAL22052026.xlsm), leídos de las celdas, no recalculados aquí:
// PUNTOEKILIBRIO E17=6585000 I7=28500 I8=9000 J7=19500 I9=337.6923076923077
// I10=11.256410256410255 I11=9624230.769230768 I12=320807.69230769225
describe("casos derivados del Excel (hoja PUNTOEKILIBRIO)", () => {
  it("coincide con cada celda de resultado, sin redondear", () => {
    const r = solveBreakEven({ fixedCosts: 6585000, salePrice: 28500, variableCost: 9000 })
    if (!r.ok) throw new Error("debía calcular")
    expect(r.contributionMargin).toBe(19500) // J7
    expect(r.unitsPerMonth).toBeCloseTo(337.6923076923077, 10) // I9
    expect(r.unitsPerDay).toBeCloseTo(11.256410256410255, 10) // I10
    expect(r.revenuePerMonth).toBeCloseTo(9624230.769230768, 4) // I11
    expect(r.revenuePerDay).toBeCloseTo(320807.69230769225, 5) // I12
  })

  it("el redondeo que ve el usuario del Excel (2 decimales) es 337,69 unidades", () => {
    const r = solveBreakEven({ fixedCosts: 6585000, salePrice: 28500, variableCost: 9000 })
    expect(r.ok && r.unitsPerMonth.toFixed(2)).toBe("337.69")
    expect(r.ok && r.unitsPerDay.toFixed(2)).toBe("11.26")
  })

  it("venta del mes = unidades × precio y venta del día = unidades por día × precio", () => {
    const r = solveBreakEven({ fixedCosts: 6585000, salePrice: 28500, variableCost: 9000 })
    if (!r.ok) throw new Error("debía calcular")
    expect(r.revenuePerMonth).toBeCloseTo(r.unitsPerMonth * 28500, 6)
    expect(r.revenuePerDay).toBeCloseTo(r.unitsPerDay * 28500, 6)
  })

  it("hoja PUNTOEKILIBRIOPROMEDIO: 338 productos, ventas 9.624.230,77, variables 2.700.000 → 321,44 unidades", () => {
    // I6=28474.055530268546 I7=7988.165680473373 J6=20485.889849795174 H8=321.44075987335447
    const r = solveBreakEvenAverage({ fixedCosts: 6585000, products: 338, totalSales: 9624230.769230768, totalVariableCosts: 2700000 })
    if (!r.ok) throw new Error("debía calcular")
    expect(r.salePrice).toBeCloseTo(28474.055530268546, 8)
    expect(r.variableCost).toBeCloseTo(7988.165680473373, 8)
    expect(r.contributionMargin).toBeCloseTo(20485.889849795174, 8)
    expect(r.unitsPerMonth).toBeCloseTo(321.44075987335447, 8)
  })

  it("promedio sin productos no devuelve cifras", () => {
    expect(solveBreakEvenAverage({ fixedCosts: 1000, products: 0, totalSales: 100, totalVariableCosts: 10 })).toMatchObject({ ok: false, reason: "missing" })
    expect(solveBreakEvenAverage({ fixedCosts: 1000, products: null, totalSales: 100, totalVariableCosts: 10 }).ok).toBe(false)
  })
})

describe("casos que NO deben dar un resultado engañoso", () => {
  const base = { fixedCosts: 6585000, salePrice: 28500, variableCost: 9000 }
  const notOk = (v: Parameters<typeof solveBreakEven>[0]) => {
    const r = solveBreakEven(v)
    expect(r.ok).toBe(false)
    // Un resultado fallido no trae ninguna cifra calculada
    expect(Object.keys(r).sort()).toEqual(["field", "message", "ok", "reason"])
    return r
  }

  it("margen de contribución igual a cero (precio = costo variable): sin resultado, no divide por cero", () => {
    expect(notOk({ ...base, salePrice: 9000 })).toMatchObject({ reason: "invalid", field: "salePrice" })
  })

  it("margen negativo (precio < costo variable): sin unidades negativas", () => {
    expect(notOk({ ...base, salePrice: 5000 })).toMatchObject({ reason: "invalid", field: "salePrice" })
  })

  it("datos incompletos: todos vacíos, solo uno escrito, o ceros donde no se permite", () => {
    expect(notOk({ fixedCosts: null, salePrice: null, variableCost: null })).toMatchObject({ reason: "missing", field: "fixedCosts" })
    expect(notOk({ ...base, fixedCosts: null })).toMatchObject({ reason: "missing", field: "fixedCosts" })
    expect(notOk({ ...base, salePrice: 0 })).toMatchObject({ reason: "missing", field: "salePrice" })
    expect(notOk({ ...base, variableCost: null })).toMatchObject({ reason: "missing", field: "variableCost" })
    expect(notOk({ ...base, fixedCosts: 0 })).toMatchObject({ reason: "missing", field: "fixedCosts" })
  })

  it("valores no numéricos o infinitos cuentan como faltantes (NaN, Infinity)", () => {
    expect(notOk({ ...base, fixedCosts: NaN })).toMatchObject({ reason: "missing", field: "fixedCosts" })
    expect(notOk({ ...base, salePrice: Infinity })).toMatchObject({ reason: "missing", field: "salePrice" })
    expect(notOk({ ...base, variableCost: -Infinity })).toMatchObject({ reason: "missing", field: "variableCost" })
    expect(notOk({ ...base, variableCost: undefined as unknown as number })).toMatchObject({ reason: "missing" })
  })

  it("valores negativos se rechazan con su campo", () => {
    expect(notOk({ ...base, fixedCosts: -1 })).toMatchObject({ reason: "invalid", field: "fixedCosts" })
    expect(notOk({ ...base, variableCost: -5 })).toMatchObject({ reason: "invalid", field: "variableCost" })
    expect(invalidBreakEvenInputs({ ...base, fixedCosts: -1, salePrice: -2 })).toEqual(["fixedCosts", "salePrice"])
  })

  it("un margen diminuto que desborda a Infinity no se muestra como número", () => {
    expect(notOk({ fixedCosts: 1e308, salePrice: 1, variableCost: 1 - 1e-15 })).toMatchObject({ reason: "invalid" })
  })

  it("el costo variable 0 es válido (producto sin insumos): unidades = costos fijos ÷ precio", () => {
    const r = solveBreakEven({ fixedCosts: 1000, salePrice: 100, variableCost: 0 })
    expect(r.ok && r.unitsPerMonth).toBe(10)
    expect(r.ok && r.contributionMargin).toBe(100)
  })

  it("contributionMarginOf: null mientras falte un dato, y puede ser negativo para avisar", () => {
    expect(contributionMarginOf(28500, 9000)).toBe(19500)
    expect(contributionMarginOf(null, 9000)).toBeNull()
    expect(contributionMarginOf(28500, null)).toBeNull()
    expect(contributionMarginOf(5000, 9000)).toBe(-4000)
  })
})
