import { describe, it, expect } from "vitest"
import { baseUnitOf, unitOptionsFor, toBaseQuantity, fromBaseQuantity, isMassUnit, quantityText } from "./units"

describe("unidades de línea de receta", () => {
  it("lo heredado sin unidad es gramos", () => {
    expect(baseUnitOf(undefined)).toBe("g")
    expect(baseUnitOf({ unit: null })).toBe("g")
    expect(baseUnitOf({ unit: "und" })).toBe("und")
  })
  it("un ingrediente por unidad solo ofrece 'und' (no gramos)", () => {
    expect(unitOptionsFor("und").map((o) => o.value)).toEqual(["und"])
  })
  it("un ingrediente por peso ofrece g y kg", () => {
    expect(unitOptionsFor("g").map((o) => o.value)).toEqual(["g", "kg"])
  })
  it("0,35 kg → 350 g; 500 g → 500 g", () => {
    expect(toBaseQuantity(0.35, "kg", "g")).toBe(350)
    expect(toBaseQuantity(500, "g", "g")).toBe(500)
    expect(fromBaseQuantity(350, "kg")).toBe(0.35)
  })
  it("nunca convierte entre familias", () => {
    expect(toBaseQuantity(30, "und", "g")).toBeNull()
    expect(toBaseQuantity(100, "g", "und")).toBeNull()
    expect(toBaseQuantity(1, "kg", "und")).toBeNull()
    expect(toBaseQuantity(100, "ml", "g")).toBeNull()
  })
  it("solo los gramos suman peso", () => {
    expect(isMassUnit("g")).toBe(true)
    expect(isMassUnit(null)).toBe(true)
    expect(isMassUnit("und")).toBe(false)
  })
  it("texto de cantidad", () => {
    expect(quantityText(30, "und")).toBe("30 und")
  })
})
