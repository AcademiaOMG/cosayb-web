import { describe, it, expect } from "vitest"
import {
  buildItemsPayload,
  costImpact,
  lineError,
  linesChanged,
  linesProblem,
  priceEditLines,
  totalMassG,
  validateYield,
  SECTION_AFFECTS_COST,
  type EditLine,
} from "./recipeEdit"

const harina: EditLine = { key: "a", kind: "ingredient", refId: "ing-harina", name: "Harina", quantity: 500, unit: "g", baseUnit: "g" }
const huevos: EditLine = { key: "b", kind: "ingredient", refId: "ing-huevo", name: "Huevos", quantity: 30, unit: "und", baseUnit: "und" }
const costs: Record<string, number> = { "ing-harina": 3, "ing-huevo": 700 }
const lookup = (_k: string, id: string) => costs[id] ?? null

describe("costos por línea", () => {
  it("30 huevos a $700 = $21.000 (no 3.000 g)", () => {
    const r = priceEditLines([huevos], lookup)
    expect(r.lines[0].cost).toBe(21000)
    expect(r.total).toBe(21000)
  })
  it("500 g de harina a $3/g = $1.500", () => {
    expect(priceEditLines([harina], lookup).total).toBe(1500)
  })
  it("cambiar 500 g → 350 g actualiza el costo", () => {
    const edited = { ...harina, quantity: 350 }
    expect(priceEditLines([edited], lookup).total).toBe(1050)
  })
  it("0,35 kg equivale a 350 g", () => {
    expect(priceEditLines([{ ...harina, quantity: 0.35, unit: "kg" }], lookup).total).toBe(1050)
  })
  it("suma varias líneas y cuenta las que no tienen costo", () => {
    const r = priceEditLines([harina, huevos, { ...harina, key: "c", refId: "x", name: "?" }], lookup)
    expect(r.total).toBe(22500)
    expect(r.unpriced).toBe(1)
  })
  it("costo en carga se cuenta como pendiente", () => {
    expect(priceEditLines([harina], () => undefined).pending).toBe(1)
  })
})

describe("validación de líneas", () => {
  it("gramos en un ingrediente por unidades es inválido (no hay conversión)", () => {
    expect(lineError({ ...huevos, unit: "g" })).toMatch(/unidades/)
  })
  it("cantidad 0 o negativa es inválida", () => {
    expect(lineError({ ...harina, quantity: 0 })).toBeTruthy()
    expect(lineError({ ...harina, quantity: -5 })).toBeTruthy()
    expect(lineError({ ...harina, quantity: NaN })).toBeTruthy()
  })
  it("ingrediente eliminado impide guardar", () => {
    expect(lineError({ ...harina, refId: "" })).toMatch(/ya no existe/)
  })
  it("receta vacía no se puede guardar", () => {
    expect(linesProblem([])).toMatch(/al menos/)
    expect(linesProblem([harina, huevos])).toBeNull()
  })
})

describe("payload de items", () => {
  it("envía lo escrito con su unidad (el API convierte)", () => {
    const p = buildItemsPayload([{ ...harina, quantity: 0.35, unit: "kg" }, huevos])
    expect(p[0]).toMatchObject({ componentType: "ingredient", ingredientId: "ing-harina", quantityG: 0.35, unit: "kg", sortOrder: 0 })
    expect(p[1]).toMatchObject({ ingredientId: "ing-huevo", quantityG: 30, unit: "und", sortOrder: 1 })
  })
  it("las preparaciones base siempre van en gramos", () => {
    const base: EditLine = { key: "s", kind: "recipe", refId: "sub", name: "Salsa", quantity: 200, unit: "g", baseUnit: "g" }
    expect(buildItemsPayload([base])[0]).toMatchObject({ componentType: "recipe", subRecipeId: "sub", unit: "g" })
  })
})

describe("peso total", () => {
  it("las unidades no suman gramos", () => {
    expect(totalMassG([harina, huevos])).toBe(500)
    expect(totalMassG([{ ...harina, quantity: 1, unit: "kg" }, huevos])).toBe(1000)
  })
})

describe("impacto en el costo", () => {
  it("calcula diferencia y porcentaje", () => {
    const i = costImpact(1000, 800)
    expect(i).toMatchObject({ delta: -200, pct: -20, changes: true })
  })
  it("sin cambio real no pide confirmación", () => {
    expect(costImpact(1000, 1000.001).changes).toBe(false)
  })
  it("costo desconocido se trata como cambio (confirma por seguridad)", () => {
    expect(costImpact(null, 500).changes).toBe(true)
  })
  it("solo ingredientes y rendimiento afectan costos", () => {
    expect(SECTION_AFFECTS_COST).toEqual({ general: false, yield: true, ingredients: true })
  })
})

describe("rendimiento", () => {
  it("valida porciones, peso y margen", () => {
    expect(validateYield({ servings: "4", servingWeight: "", margin: "3" })).toEqual({})
    expect(validateYield({ servings: "0", servingWeight: "", margin: "3" }).servings).toBeTruthy()
    expect(validateYield({ servings: "2.5", servingWeight: "", margin: "3" }).servings).toMatch(/entero/)
    expect(validateYield({ servings: "4", servingWeight: "-1", margin: "3" }).servingWeight).toBeTruthy()
    expect(validateYield({ servings: "4", servingWeight: "", margin: "9" }).margin).toBeTruthy()
  })
})

describe("detección de cambios", () => {
  it("detecta cantidad, unidad, componente o cantidad de líneas", () => {
    expect(linesChanged([harina], [harina])).toBe(false)
    expect(linesChanged([harina], [{ ...harina, quantity: 350 }])).toBe(true)
    expect(linesChanged([harina], [{ ...harina, unit: "kg", quantity: 0.5 }])).toBe(true)
    expect(linesChanged([harina], [harina, huevos])).toBe(true)
  })
})
