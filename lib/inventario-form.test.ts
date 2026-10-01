import { describe, it, expect } from "vitest"

describe("Inventario form - input value handling logic", () => {
  it("parses formatted number input correctly (legacy function behavior)", () => {
    function parseFormattedNumber(value: string): string {
      return value.replace(/\./g, "").replace(/,/g, "")
    }

    expect(parseFormattedNumber("1.800")).toBe("1800")
    expect(parseFormattedNumber("18.000")).toBe("18000")
    expect(parseFormattedNumber("125.000")).toBe("125000")
    expect(parseFormattedNumber("3.500")).toBe("3500")
    expect(parseFormattedNumber("1.000")).toBe("1000")
  })

  it("simulates onChange handler for raw number input (new behavior)", () => {
    type FormState = { name: string; costPerUnit: string; weightGrams: string }
    const initialForm: FormState = { name: "", costPerUnit: "", weightGrams: "" }

    function updateForm(form: FormState, field: keyof FormState, value: string): FormState {
      return { ...form, [field]: value }
    }

    let form = initialForm

    form = updateForm(form, "costPerUnit", "1")
    expect(form.costPerUnit).toBe("1")

    form = updateForm(form, "costPerUnit", "18")
    expect(form.costPerUnit).toBe("18")

    form = updateForm(form, "costPerUnit", "180")
    expect(form.costPerUnit).toBe("180")

    form = updateForm(form, "costPerUnit", "1800")
    expect(form.costPerUnit).toBe("1800")

    form = updateForm(form, "costPerUnit", "18000")
    expect(form.costPerUnit).toBe("18000")
  })

  it("simulates onChange handler for text input (Nombre field)", () => {
    type FormState = { name: string; costPerUnit: string; weightGrams: string }
    const initialForm: FormState = { name: "", costPerUnit: "", weightGrams: "" }

    function updateForm(form: FormState, field: keyof FormState, value: string): FormState {
      return { ...form, [field]: value }
    }

    let form = initialForm

    form = updateForm(form, "name", "a")
    expect(form.name).toBe("a")

    form = updateForm(form, "name", "ab")
    expect(form.name).toBe("ab")

    form = updateForm(form, "name", "abc")
    expect(form.name).toBe("abc")

    form = updateForm(form, "name", "Harina de trigo")
    expect(form.name).toBe("Harina de trigo")
  })

  it("calculates cost per gram correctly from raw values", () => {
    function calculateCostPerGram(costPerUnit: string, weightGrams: string): number | null {
      const cost = parseFloat(costPerUnit)
      const weight = parseFloat(weightGrams)
      if (isNaN(cost) || isNaN(weight) || weight <= 0) return null
      return cost / weight
    }

    expect(calculateCostPerGram("18000", "1000")).toBe(18)
    expect(calculateCostPerGram("5000", "500")).toBe(10)
    expect(calculateCostPerGram("10000", "2000")).toBe(5)
    expect(calculateCostPerGram("3500", "1000")).toBe(3.5)
    expect(calculateCostPerGram("", "1000")).toBeNull()
    expect(calculateCostPerGram("18000", "")).toBeNull()
  })

  it("validates required fields for submission", () => {
    function validateForm(form: { name: string; costPerUnit: string; weightGrams: string }): string | null {
      if (!form.name.trim()) return "Nombre es requerido"
      if (!form.costPerUnit) return "Precio es requerido"
      if (!form.weightGrams) return "Peso es requerido"
      return null
    }

    expect(validateForm({ name: "", costPerUnit: "18000", weightGrams: "1000" })).toBe("Nombre es requerido")
    expect(validateForm({ name: "Harina", costPerUnit: "", weightGrams: "1000" })).toBe("Precio es requerido")
    expect(validateForm({ name: "Harina", costPerUnit: "18000", weightGrams: "" })).toBe("Peso es requerido")
    expect(validateForm({ name: "Harina", costPerUnit: "18000", weightGrams: "1000" })).toBeNull()
  })
})