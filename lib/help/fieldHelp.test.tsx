import { describe, it, expect } from "vitest"
import { renderToString } from "react-dom/server"
import { FIELD_HELP as HELP, type FieldHelp, type HelpKey } from "./fieldHelp"

const FIELD_HELP: Record<HelpKey, FieldHelp> = HELP
import InfoTip from "@/components/ui/InfoTip"
import { PLAN_CATALOG, PLAN_COMPARISON, FREE_PERIOD_DAYS } from "@/lib/commerce/catalog"
import { freePeriodNotice } from "@/lib/saas/freePeriod"

describe("diccionario de ayudas", () => {
  it("cada entrada es corta, concreta y sin jerga vacía", () => {
    for (const [key, h] of Object.entries(FIELD_HELP)) {
      expect(h.text.length, key).toBeGreaterThan(15)
      expect(h.text.length, key).toBeLessThan(260)
    }
  })
  it("incluye ejemplos prácticos donde el campo lo necesita", () => {
    const withExample: HelpKey[] = ["recipe.quantity", "recipe.servings", "ingredient.cost", "ingredient.content", "menu.people", "breakEven.fixedCosts"]
    for (const k of withExample) expect(FIELD_HELP[k].example, k).toBeTruthy()
  })
})

describe("InfoTip (accesibilidad)", () => {
  const html = renderToString(<InfoTip help="recipe.servings" label="Porciones" />)
  it("es un botón con nombre accesible y arranca cerrado", () => {
    expect(html).toContain("<button")
    expect(html).toContain('type="button"')
    expect(html).toContain('aria-label="Ayuda sobre Porciones"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('role="tooltip"')
  })
  it("sin texto no renderiza nada", () => {
    expect(renderToString(<InfoTip />)).toBe("")
  })
  it("acepta texto propio", () => {
    expect(renderToString(<InfoTip text="Texto propio" />)).toContain("<button")
  })
})

describe("catálogo comercial", () => {
  it("precios finales con IVA incluido y desglose exacto", () => {
    expect(PLAN_CATALOG.free.amount).toBe(0)
    expect(PLAN_CATALOG.pro).toMatchObject({ amount: 42000, net: 35294, tax: 6706 })
    expect(PLAN_CATALOG.academia).toMatchObject({ amount: 60000, net: 50420, tax: 9580 })
    expect(PLAN_CATALOG.pro.net! + PLAN_CATALOG.pro.tax!).toBe(42000)
    expect(PLAN_CATALOG.academia.net! + PLAN_CATALOG.academia.tax!).toBe(60000)
  })
  it("Free dura 10 días", () => expect(FREE_PERIOD_DAYS).toBe(10))
  it("los límites mostrados coinciden con los del API", () => {
    const get = (label: string) => PLAN_COMPARISON.find((r) => r.label.startsWith(label))!.values
    expect(get("Recetas propias")).toMatchObject({ free: "Hasta 3", pro: "Hasta 50" })
    expect(get("Ingredientes propios")).toMatchObject({ free: "Hasta 3", pro: "Hasta 50" })
    expect(get("Menús")).toMatchObject({ free: "1", pro: "Hasta 50", academia: "Hasta 100" })
    expect(get("Factores")).toMatchObject({ free: "1", pro: "Hasta 30", academia: "Hasta 50" })
    expect(get("Puntos")).toMatchObject({ free: "1", pro: "Hasta 30", academia: "Hasta 50" })
    expect(get("Usuarios")).toMatchObject({ free: "1", pro: "Hasta 2", academia: "Hasta 5" })
  })
  it("lo no definido figura como «por definir», sin inventar cifras", () => {
    const get = (label: string) => PLAN_COMPARISON.find((r) => r.label.startsWith(label))!.values
    expect(get("Recetas propias").academia).toBe("Por definir")
    expect(get("Ingredientes propios").academia).toBe("Por definir")
    expect(String(get("Soporte gastronómico").academia)).toMatch(/por definir/i)
  })
  it("Free declara sus restricciones", () => {
    const r = PLAN_CATALOG.free.restrictions.join(" ")
    expect(r).toMatch(/solo lectura/)
    expect(r).toMatch(/Sin soporte técnico/)
    expect(r).toMatch(/Sin exportación/)
  })
})

describe("aviso del periodo gratuito", () => {
  it("vencido: solo lectura, datos conservados", () => {
    const n = freePeriodNotice({ membership: "free", readOnly: true })
    expect(n?.tone).toBe("warning")
    expect(n?.message).toMatch(/solo lectura/)
    expect(n?.message).toMatch(/conservan/)
  })
  it("últimos 3 días: cuenta regresiva", () => {
    expect(freePeriodNotice({ membership: "free", readOnly: false, freePeriodDaysLeft: 2 })?.message).toMatch(/2 días/)
    expect(freePeriodNotice({ membership: "free", readOnly: false, freePeriodDaysLeft: 1 })?.message).toMatch(/1 día\b/)
  })
  it("con tiempo de sobra o en plan de pago no avisa", () => {
    expect(freePeriodNotice({ membership: "free", readOnly: false, freePeriodDaysLeft: 8 })).toBeNull()
    expect(freePeriodNotice({ membership: "pro", readOnly: false })).toBeNull()
    expect(freePeriodNotice(null)).toBeNull()
  })
})
