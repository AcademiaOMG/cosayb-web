import { describe, expect, it } from "vitest"
import {
  defaultServingWeight,
  moveLine,
  priceTape,
  solveRecipeTape,
  validateSafetyMargin,
  type CostLookup,
  type TapeLine,
} from "./recipeTape"

const line = (key: string, kind: TapeLine["kind"], refId: string, grams: number): TapeLine => ({
  key,
  kind,
  refId,
  name: refId,
  grams,
})

const COSTS: Record<string, number | null> = { A: 10, B: 4, SUB: 8, NOPRICE: null }
const lookup: CostLookup = (_k, id) => (id in COSTS ? COSTS[id] : undefined)

// 500 g × 10 + 250 g × 4 + 250 g (receta base) × 8 = 5.000 + 1.000 + 2.000
const LINES = [line("1", "ingredient", "A", 500), line("2", "ingredient", "B", 250), line("3", "recipe", "SUB", 250)]

describe("priceTape", () => {
  it("suma costo y peso, incluidas las recetas base", () => {
    const t = priceTape(LINES, lookup)
    expect(t.rawCost).toBe(8000)
    expect(t.totalGrams).toBe(1000)
    expect(t.unpriced).toBe(0)
    expect(t.pending).toBe(0)
    expect(t.lines.map((l) => l.cost)).toEqual([5000, 1000, 2000])
  })

  it("separa líneas sin costo y líneas cargando", () => {
    const t = priceTape([...LINES, line("4", "recipe", "NOPRICE", 100), line("5", "recipe", "LOADING", 100)], lookup)
    expect(t.rawCost).toBe(8000)
    expect(t.unpriced).toBe(1)
    expect(t.pending).toBe(1)
    expect(t.totalGrams).toBe(1200)
  })

  it("la firma cambia al cambiar gramos o costos", () => {
    const a = priceTape(LINES, lookup).signature
    const b = priceTape([{ ...LINES[0], grams: 600 }, ...LINES.slice(1)], lookup).signature
    const c = priceTape(LINES, (k, id) => (id === "A" ? 11 : lookup(k, id))).signature
    expect(new Set([a, b, c]).size).toBe(3)
  })
})

describe("solveRecipeTape (hoja FORMATORECETA)", () => {
  const tape = priceTape(LINES, lookup)

  it("costo por porción, por gramo, con margen, precio potencial y porcentajes", () => {
    // 4 porciones, margen 3 %, materia prima 35 %
    const r = solveRecipeTape({ grams: null, servings: 4, pctMP: 35, margin: 3 }, tape)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.rawCostTotal).toBe(8000)
    expect(r.rawCostPerServing).toBe(2000)
    expect(r.costPerGram).toBe(8)
    expect(r.servingWeightG).toBe(250)
    expect(r.costWithMarginPerServing).toBeCloseTo(2060, 6)
    expect(r.costWithMarginTotal).toBeCloseTo(8240, 6)
    expect(r.pricePerServing).toBeCloseTo(5885.714, 3) // 2060 / 0,35
    expect(r.priceTotal).toBeCloseTo(23542.857, 3)
    expect(r.pricing.pctFixedCosts).toBeCloseTo(36.1111, 4) // (1 − 0,35) / 1,8
    expect(r.pricing.pctProfit).toBeCloseTo(28.8889, 4)
    expect(r.pricing.indicator).toBe("REGULAR")
  })

  it("reproduce los números de la hoja COSTORECETA (1.250 por persona, 25 personas, 3 %)", () => {
    const t = priceTape([line("1", "ingredient", "X", 1)], () => 31250)
    const r = solveRecipeTape({ grams: null, servings: 25, pctMP: 35, margin: 3 }, t)
    expect(r.ok && r.costWithMarginPerServing).toBeCloseTo(1287.5, 6)
    expect(r.ok && r.costWithMarginTotal).toBeCloseTo(32187.5, 6)
  })

  it("explica qué falta", () => {
    expect(solveRecipeTape({ grams: null, servings: 4, pctMP: 35, margin: 3 }, priceTape([], lookup))).toMatchObject({ ok: false, field: "grams" })
    expect(solveRecipeTape({ grams: null, servings: null, pctMP: 35, margin: 3 }, tape)).toMatchObject({ ok: false, field: "servings" })
    expect(solveRecipeTape({ grams: null, servings: 2.5, pctMP: 35, margin: 3 }, tape)).toMatchObject({ ok: false, field: "servings" })
    expect(solveRecipeTape({ grams: null, servings: 4, pctMP: null, margin: 3 }, tape)).toMatchObject({ ok: false, field: "pctMP" })
    expect(solveRecipeTape({ grams: null, servings: 4, pctMP: 35, margin: 6 }, tape)).toMatchObject({ ok: false, field: "margin" })
  })

  it("no calcula con costos pendientes ni con cinta sin costo", () => {
    const pend = priceTape([...LINES, line("9", "recipe", "LOADING", 10)], lookup)
    expect(solveRecipeTape({ grams: null, servings: 4, pctMP: 35, margin: 3 }, pend)).toMatchObject({ ok: false, field: "grams" })
    const none = priceTape([line("9", "recipe", "NOPRICE", 10)], lookup)
    expect(solveRecipeTape({ grams: null, servings: 4, pctMP: 35, margin: 3 }, none)).toMatchObject({ ok: false, field: "grams" })
  })
})

describe("utilidades", () => {
  it("margen de seguridad 0–5 %", () => {
    expect(validateSafetyMargin(0)).toBeNull()
    expect(validateSafetyMargin(5)).toBeNull()
    expect(validateSafetyMargin(null)).toBeNull()
    expect(validateSafetyMargin(5.5)).not.toBeNull()
    expect(validateSafetyMargin(-1)).not.toBeNull()
  })

  it("peso por porción = peso total / porciones", () => {
    expect(defaultServingWeight(1000, 3)).toBe(333.3)
    expect(defaultServingWeight(0, 3)).toBeNull()
    expect(defaultServingWeight(1000, 0)).toBeNull()
  })

  it("reordena sin mutar", () => {
    const a = [1, 2, 3]
    expect(moveLine(a, 0, 2)).toEqual([2, 3, 1])
    expect(a).toEqual([1, 2, 3])
    expect(moveLine(a, 0, 5)).toBe(a)
  })
})
