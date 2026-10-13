import { describe, expect, it } from "vitest"
import { calcularCosto } from "@/lib/menuFicha"
import {
  costPerBaseUnit,
  extraFormFromIngredient,
  extraUnitLabel,
  onlyRecipeIngredients,
  findDuplicateByName,
  menuUnitCost,
  menuUnitOf,
  normalizeName,
  validateExtraForm,
} from "./menuExtras"

const base = { id: "1", costPerUnit: "0", weightGrams: "1", costPerGram: "0" }

describe("normalizeName / duplicados", () => {
  it("ignora tildes, mayúsculas y espacios", () => {
    expect(normalizeName("  Vasos   PLÁSTICOS ")).toBe("vasos plasticos")
    expect(findDuplicateByName("vasos plasticos", [{ name: "Vasos Plásticos" }])).toBeTruthy()
    expect(findDuplicateByName("vaso", [{ name: "Vasos Plásticos" }])).toBeUndefined()
  })
})

describe("validateExtraForm", () => {
  const existing = [{ id: "a", name: "Gaseosa" }]
  it("acepta datos válidos con contenido por defecto 1", () => {
    const r = validateExtraForm({ name: " Cuchara ", unit: "und", cost: "300", content: "" }, existing)
    expect(r).toEqual({
      ok: true,
      payload: { name: "Cuchara", kind: "extra", unit: "und", costPerUnit: 300, weightGrams: 1 },
    })
  })
  it("rechaza duplicados normalizados y devuelve el existente", () => {
    const r = validateExtraForm({ name: "GASEOSA", unit: "und", cost: "2000", content: "1" }, existing)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.errors.name).toMatch(/Ya existe/)
      expect(r.duplicate?.id).toBe("a")
    }
  })
  it("rechaza nombre vacío, costo y contenido no positivos", () => {
    const r = validateExtraForm({ name: " ", unit: "ml", cost: "0", content: "-5" }, existing)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["content", "cost", "name"])
  })
  it("acepta coma decimal", () => {
    const r = validateExtraForm({ name: "Jugo", unit: "ml", cost: "4.500,5".replace(".", ""), content: "1,5" }, [])
    expect(r.ok).toBe(true)
  })
})

describe("costo con extras", () => {
  it("costPerBaseUnit divide empaque entre contenido", () => {
    expect(costPerBaseUnit(15000, 50)).toBe(300)
    expect(() => costPerBaseUnit(1, 0)).toThrow()
  })
  it("extra usa costo por unidad base; ingrediente legado el del empaque", () => {
    const vaso = { ...base, kind: "extra" as const, unit: "und" as const, costPerUnit: "15000", costPerGram: "300" }
    const legado = { ...base, kind: "ingredient" as const, costPerUnit: "3500", costPerGram: "3.5" }
    expect(menuUnitCost(vaso)).toBe(300)
    expect(menuUnitCost(legado)).toBe(3500)
    expect(menuUnitOf(vaso)).toBe("und")
    expect(menuUnitOf({ kind: "extra", unit: "ml" })).toBe("ml")
    expect(menuUnitOf({ kind: "ingredient", unit: "g" })).toBe("und")
  })
  it("suma plato + vaso + jugo en el total por porción", () => {
    const r = calcularCosto(
      [
        { cantidadGramos: 200, costoGramo: 3 }, // 600
        { cantidadGramos: 1, costoGramo: 300 }, // vaso
        { cantidadGramos: 250, costoGramo: 4 }, // 250 ml jugo = 1000
      ],
      10, 0, 31,
    )
    expect(r?.costoTotalPorcion).toBe(1900)
    expect(r?.costoTotalPersonas).toBe(19000)
  })
})

describe("edición de extras", () => {
  const vaso = { ...base, id: "v1", name: "Vaso 9 oz", unit: "und" as const, costPerUnit: "15000.00", weightGrams: "50.00" }

  it("extraFormFromIngredient reproduce la semántica de creación (costo del empaque + contenido)", () => {
    expect(extraFormFromIngredient(vaso)).toEqual({ name: "Vaso 9 oz", unit: "und", cost: "15000", content: "50" })
  })

  it("validateExtraForm no cuenta al propio extra como duplicado al editar, pero sí a otro", () => {
    const input = extraFormFromIngredient(vaso)
    expect(validateExtraForm(input, [vaso]).ok).toBe(false)
    expect(validateExtraForm(input, [vaso], "v1").ok).toBe(true)
    expect(validateExtraForm(input, [{ ...vaso, id: "v2" }], "v1").ok).toBe(false)
  })

  it("extraUnitLabel solo identifica extras; onlyRecipeIngredients los excluye de recetas", () => {
    expect(extraUnitLabel({ kind: "extra", unit: "porcion" })).toBe("porc.")
    expect(extraUnitLabel({ kind: "ingredient", unit: "g" })).toBeNull()
    const list = [{ kind: "extra" as const }, { kind: "ingredient" as const }, { kind: undefined }]
    expect(onlyRecipeIngredients(list)).toHaveLength(2)
  })
})
