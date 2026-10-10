import { describe, it, expect } from "vitest"
import { buildSteps, computeProgress, type Checklist } from "./onboarding"

const full: Checklist = {
  hasIngredients: true,
  hasRecipes: true,
  hasMenus: true,
  hasTeam: false,
}
const none: Checklist = {
  hasIngredients: false,
  hasRecipes: false,
  hasMenus: false,
  hasTeam: false,
}

const allowAll = () => true
const denyAll = () => false

describe("buildSteps", () => {
  it("devuelve los 3 pasos en el orden sugerido: Inventario → Recetas → Menú", () => {
    const steps = buildSteps(none, allowAll, allowAll)

    expect(steps.map((s) => s.id)).toEqual(["ingredients", "recipes", "menus"])
    expect(steps.map((s) => s.order)).toEqual([1, 2, 3])
    expect(steps.map((s) => s.href)).toEqual(["/inventario", "/recetas", "/menu"])
    expect(steps.every((s) => !s.done)).toBe(true)
  })

  it("marca como done los pasos cuyo checklist está completado", () => {
    const steps = buildSteps(
      { hasIngredients: true, hasRecipes: false, hasMenus: true, hasTeam: false },
      allowAll,
      allowAll,
    )

    expect(steps.find((s) => s.id === "ingredients")?.done).toBe(true)
    expect(steps.find((s) => s.id === "recipes")?.done).toBe(false)
    expect(steps.find((s) => s.id === "menus")?.done).toBe(true)
  })

  it("oculta pasos sin permiso de rol y renumera el resto", () => {
    const can = (resource: string) => resource !== "recipes"
    const steps = buildSteps(none, can as never, allowAll)

    expect(steps.map((s) => s.id)).toEqual(["ingredients", "menus"])
    expect(steps.map((s) => s.order)).toEqual([1, 2])
  })

  it("oculta pasos cuyo módulo está deshabilitado en la membresía", () => {
    const hasFeature = (key: string) => key !== "module_menus"
    const steps = buildSteps(none, allowAll, hasFeature)

    expect(steps.map((s) => s.id)).toEqual(["ingredients", "recipes"])
  })

  it("si el rol no ve ningún módulo, la lista queda vacía", () => {
    expect(buildSteps(none, denyAll, allowAll)).toEqual([])
  })
})

describe("computeProgress", () => {
  it("calcula done/required y porcentaje sobre los pasos visibles", () => {
    const steps = buildSteps(
      { hasIngredients: true, hasRecipes: true, hasMenus: false, hasTeam: false },
      allowAll,
      allowAll,
    )
    const p = computeProgress(steps)

    expect(p.done).toBe(2)
    expect(p.required).toBe(3)
    expect(p.pct).toBe(67)
    expect(p.complete).toBe(false)
  })

  it("complete=true cuando los 3 pasos están hechos (se debe ocultar el bloque)", () => {
    const p = computeProgress(buildSteps(full, allowAll, allowAll))

    expect(p.done).toBe(3)
    expect(p.required).toBe(3)
    expect(p.pct).toBe(100)
    expect(p.complete).toBe(true)
  })

  it("oculta también cuando ningún paso es visible (required=0, sin 0/0)", () => {
    const p = computeProgress([])

    expect(p.required).toBe(0)
    expect(p.pct).toBe(0)
    expect(p.complete).toBe(true)
  })
})
