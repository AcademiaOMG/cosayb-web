import { describe, expect, it } from "vitest"
import { calcPaletteVars } from "./calcPalette"
import { contrastRatio, toOklch } from "./color"
import { PRIMARIES } from "./testColors"
import { REQUIRED_CSS_VARS } from "./tokens"

const CALC_VARS = REQUIRED_CSS_VARS.filter((v) => v.startsWith("--calc-"))

describe("calcPaletteVars", () => {
  it("emite exactamente las variables --calc-* del contrato", () => {
    expect(Object.keys(calcPaletteVars("#12213A")).sort()).toEqual([...CALC_VARS].sort())
  })
  it("con el azul por defecto conserva la identidad: carcasa azul oscura, teclas marfil, igual azul, LCD verdoso", () => {
    const v = calcPaletteVars("#12213A")
    const body = toOklch(v["--calc-body"])
    expect(body.l).toBeLessThan(0.32)
    expect(body.h).toBeGreaterThan(240)
    expect(body.h).toBeLessThan(285)
    expect(toOklch(v["--calc-key"]).l).toBeGreaterThan(0.93)
    expect(toOklch(v["--calc-key-equals"]).h).toBeGreaterThan(240)
    expect(toOklch(v["--calc-display-bg"]).h).toBeGreaterThan(105)
    expect(toOklch(v["--calc-display-bg"]).h).toBeLessThan(145)
  })
  describe.each(PRIMARIES)("base %s", (base) => {
    const v = calcPaletteVars(base)
    it("todas las parejas cumplen contraste", () => {
      const ge = (f: string, b: string, m: number) => expect(contrastRatio(v[f], v[b]), `${f}/${b}`).toBeGreaterThanOrEqual(m)
      ge("--calc-key-text", "--calc-key", 4.5)
      ge("--calc-key-op-text", "--calc-key-op", 4.5)
      ge("--calc-key-equals-text", "--calc-key-equals", 4.5)
      ge("--calc-display-text", "--calc-display-bg", 7)
      ge("--calc-accent", "--calc-body", 3)
      ge("--calc-ring", "--calc-body", 3)
    })
    it("las teclas se distinguen de la carcasa y la carcasa siempre es oscura", () => {
      for (const k of ["--calc-key", "--calc-key-op", "--calc-key-equals"]) {
        expect(contrastRatio(v[k], v["--calc-body"]), k).toBeGreaterThanOrEqual(3)
      }
      expect(toOklch(v["--calc-body"]).l).toBeLessThan(0.35)
    })
    it("sin colores neon (croma de carcasa y teclas contenido)", () => {
      expect(toOklch(v["--calc-body"]).c).toBeLessThanOrEqual(0.1)
      expect(toOklch(v["--calc-key-equals"]).c).toBeLessThanOrEqual(0.2)
    })
  })
})
