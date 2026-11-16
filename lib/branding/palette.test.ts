import { describe, expect, it } from "vitest"
import { contrastRatio, isFluorescent, toOklch } from "./color"
import { describePalette, suggestPalette, type PaletteHarmony } from "./palette"
import { PRIMARIES } from "./testColors"
import { auditCssVars, themeToCssVars, validateTheme } from "./theme"

const HARMONIES: PaletteHarmony[] = ["analogous", "complementary", "triadic", "monochrome"]
const SIDEBARS = ["dark", "light", "brand"] as const

describe("suggestPalette", () => {
  it("hay al menos 40 primarios de prueba", () => expect(PRIMARIES.length).toBeGreaterThanOrEqual(40))

  describe.each(PRIMARIES)("primario %s", (p) => {
    it("nunca produce fallos de validateTheme ni de contraste en ninguna combinacion", () => {
      for (const harmony of HARMONIES) {
        for (const sidebar of SIDEBARS) {
          const t = suggestPalette(p, { harmony, sidebar })
          expect(validateTheme(t).issues, `${harmony}/${sidebar}`).toEqual([])
          expect(auditCssVars(themeToCssVars(t))).toEqual([])
        }
      }
    })
    it("accent contrasta con la superficie y no es fluorescente; neutros casi sin croma", () => {
      const t = suggestPalette(p)
      const c = t.colors
      expect(contrastRatio(c.accent, c.surface)).toBeGreaterThanOrEqual(3)
      expect(isFluorescent(c.accent)).toBe(false)
      expect(toOklch(c.bg).c).toBeLessThanOrEqual(0.013)
      expect(toOklch(c.surface).c).toBeLessThanOrEqual(0.013)
      expect(contrastRatio(c.text, c.surface)).toBeGreaterThanOrEqual(7)
      expect(contrastRatio(c.text, c.bg)).toBeGreaterThanOrEqual(7)
      expect(t.calculator).toMatch(/^#[0-9A-F]{6}$/)
    })
  })

  it("sidebar dark es oscuro y light es claro", () => {
    expect(toOklch(suggestPalette("#1B4FD8", { sidebar: "dark" }).colors.sidebarBg).l).toBeLessThan(0.3)
    expect(toOklch(suggestPalette("#1B4FD8", { sidebar: "light" }).colors.sidebarBg).l).toBeGreaterThan(0.9)
  })
  it("la armonia cambia el matiz del secundario", () => {
    const hue = (h: PaletteHarmony) => toOklch(suggestPalette("#1B4FD8", { harmony: h }).colors.secondary).h
    const base = toOklch("#1B4FD8").h
    expect(Math.abs(hue("monochrome") - base)).toBeLessThan(10)
    expect(Math.abs(hue("complementary") - base)).toBeGreaterThan(140)
  })
  it("estados reconocibles (matiz) y entrada invalida cae al azul por defecto", () => {
    const t = suggestPalette("#FF6A00")
    expect(toOklch(t.colors.error).h).toBeLessThan(45)
    expect(toOklch(t.colors.success).h).toBeGreaterThan(130)
    expect(toOklch(t.colors.success).h).toBeLessThan(170)
    expect(toOklch(t.colors.info).h).toBeGreaterThan(220)
    expect(suggestPalette("rojo").colors.primary).toMatch(/^#[0-9A-F]{6}$/)
  })
  it("describePalette devuelve contraste por rol", () => {
    const rows = describePalette(suggestPalette("#1B4FD8"))
    expect(rows.length).toBeGreaterThan(5)
    for (const r of rows) expect(r.ratio).toBeGreaterThanOrEqual(4.5)
  })
})
