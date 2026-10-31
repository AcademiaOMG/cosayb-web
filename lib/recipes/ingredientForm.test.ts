import { describe, it, expect } from "vitest"
import {
  contentLabel,
  costPerBase,
  findDuplicateIngredient,
  validateIngredientForm,
  type IngredientFormValues,
} from "./ingredientForm"

const form = (over: Partial<IngredientFormValues>): IngredientFormValues => ({
  name: "Huevos",
  costPerUnit: "21000",
  weightGrams: "30",
  unit: "und",
  ...over,
})

describe("formulario de ingrediente", () => {
  it("la etiqueta del contenido depende de la unidad", () => {
    expect(contentLabel("g")).toBe("Peso del empaque (g)")
    expect(contentLabel("und")).toBe("Unidades por empaque")
  })
  it("costo por unidad: bandeja de 30 huevos a $21.000 → $700 cada uno", () => {
    expect(costPerBase(form({}))).toBe(700)
  })
  it("costo por gramo: 1 kg a $3.500 → $3,5/g", () => {
    expect(costPerBase(form({ unit: "g", costPerUnit: "3500", weightGrams: "1000" }))).toBe(3.5)
  })
  it("sin datos válidos no hay costo", () => {
    expect(costPerBase(form({ weightGrams: "0" }))).toBeNull()
    expect(costPerBase(form({ costPerUnit: "" }))).toBeNull()
  })
  it("valida campos obligatorios", () => {
    const e = validateIngredientForm(form({ name: " ", costPerUnit: "", weightGrams: "" }))
    expect(e.name).toBeTruthy()
    expect(e.costPerUnit).toBeTruthy()
    expect(e.weightGrams).toMatch(/unidades/)
  })
  it("las unidades por empaque deben ser enteras", () => {
    expect(validateIngredientForm(form({ weightGrams: "2.5" })).weightGrams).toMatch(/entero/)
    expect(validateIngredientForm(form({ unit: "g", weightGrams: "2.5" })).weightGrams).toBeUndefined()
  })
  it("formulario correcto no tiene errores", () => {
    expect(validateIngredientForm(form({}))).toEqual({})
  })
  it("detecta duplicados sin importar tildes, mayúsculas o signos", () => {
    const existing = [{ name: "Plátano maduro" }, { name: "Harina" }]
    expect(findDuplicateIngredient("platano  MADURO!", existing)).toEqual({ name: "Plátano maduro" })
    expect(findDuplicateIngredient("Azúcar", existing)).toBeUndefined()
    expect(findDuplicateIngredient("   ", existing)).toBeUndefined()
  })
})
