import { describe, it, expect } from "vitest"
import { ownsRecipe } from "./recipeOwnership"

const ORG = "org-a"

describe("ownsRecipe", () => {
  it("receta propia de tipo plato: se puede modificar", () => {
    expect(ownsRecipe({ organizationId: ORG, isPublic: false }, ORG)).toBe(true)
  })
  it("las preparaciones base propias no se bloquean (isBase no cuenta)", () => {
    const base = { organizationId: ORG, isPublic: false, isBase: true }
    expect(ownsRecipe(base, ORG)).toBe(true)
  })
  it("receta del banco (sin org, pública): no", () => {
    expect(ownsRecipe({ organizationId: null, isPublic: true }, ORG)).toBe(false)
  })
  it("receta propia marcada pública: no", () => {
    expect(ownsRecipe({ organizationId: ORG, isPublic: true }, ORG)).toBe(false)
  })
  it("receta de otra organización: no", () => {
    expect(ownsRecipe({ organizationId: "org-b", isPublic: false }, ORG)).toBe(false)
  })
  it("sin org activa conocida o sin receta: no", () => {
    expect(ownsRecipe({ organizationId: ORG, isPublic: false }, undefined)).toBe(false)
    expect(ownsRecipe(null, ORG)).toBe(false)
  })
})
