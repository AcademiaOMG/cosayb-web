import { describe, expect, it } from "vitest"
import { FILL_MIN, contrastRatio, onFill } from "./color"
import { themeToCssVars } from "./theme"
import { DEFAULT_BRAND_THEME } from "./types"

const withAccent = (accent: string) =>
  themeToCssVars({ ...DEFAULT_BRAND_THEME, colors: { ...DEFAULT_BRAND_THEME.colors, accent } })

describe("onFill: texto sobre rellenos de marca (botones, ítem activo)", () => {
  it("prefiere BLANCO cuando alcanza el mínimo de texto semibold/UI (3:1)", () => {
    // naranja/rojo vivos: el navy tendría más contraste, pero el usuario espera letras blancas
    for (const bg of ["#FF4A00", "#FF5A1F", "#E8590C", "#DC2626", "#1B4FD8", "#0B2A6F"]) {
      expect(onFill(bg), bg).toBe("#FFFFFF")
      expect(contrastRatio("#FFFFFF", bg)).toBeGreaterThanOrEqual(FILL_MIN)
    }
  })

  it("usa tinta oscura cuando el blanco no llega (amarillos, verdes claros, ámbar)", () => {
    for (const bg of ["#FACC15", "#22C55E", "#F59E0B", "#A3E635"]) {
      expect(onFill(bg), bg).not.toBe("#FFFFFF")
      expect(contrastRatio(onFill(bg), bg), bg).toBeGreaterThanOrEqual(4.5)
    }
  })

  it("el tema emite on-accent y texto del ítem activo en blanco con un naranja vivo", () => {
    const v = withAccent("#FF4A00")
    expect(v["--on-accent"]).toBe("#FFFFFF")
    expect(v["--sidebar-active-bg"]).toBe("#FF4A00")
    expect(v["--sidebar-active-text"]).toBe("#FFFFFF")
  })

  it("con amarillo el texto del botón y del ítem activo es oscuro y legible", () => {
    const v = withAccent("#FACC15")
    expect(contrastRatio(v["--on-accent"], "#FACC15")).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(v["--sidebar-active-text"], v["--sidebar-active-bg"])).toBeGreaterThanOrEqual(FILL_MIN)
  })
})
