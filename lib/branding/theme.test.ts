import { describe, expect, it } from "vitest"
import {
  autoFixTheme,
  contrastRatio,
  cssVarsToStyleString,
  normalizeTheme,
  themeToCssVars,
  validateTheme,
} from "./theme"
import { DEFAULT_BRAND_THEME, type BrandTheme } from "./types"

const clone = (): BrandTheme => JSON.parse(JSON.stringify(DEFAULT_BRAND_THEME))

describe("contrastRatio", () => {
  it("negro/blanco = 21 y mismo color = 1", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0)
    expect(contrastRatio("#1B4FD8", "#1B4FD8")).toBeCloseTo(1, 5)
  })
  it("es simétrico", () => {
    expect(contrastRatio("#12213A", "#EFF2F6")).toBeCloseTo(contrastRatio("#EFF2F6", "#12213A"), 8)
  })
})

describe("themeToCssVars", () => {
  const vars = themeToCssVars(DEFAULT_BRAND_THEME)
  it("deriva los tokens base del tema por defecto", () => {
    expect(vars["--accent"]).toBe("#1B4FD8")
    expect(vars["--bg-primary"]).toBe("#EFF2F6")
    expect(vars["--bg-surface"]).toBe("#FFFFFF")
    expect(vars["--sidebar-bg"]).toBe("#12213A")
    expect(vars["--on-accent"]).toBe("#FFFFFF")
    expect(vars["--radius-md"]).toBe("14px")
    expect(vars["--font-display"]).toContain("--font-manrope")
  })
  it("incluye todas las familias de tokens", () => {
    for (const k of [
      "--accent-hover", "--accent-light", "--accent-text", "--on-inverse", "--text-secondary",
      "--text-muted", "--border-light", "--border-medium", "--sidebar-text", "--sidebar-muted",
      "--sidebar-label", "--sidebar-hairline", "--error-bg", "--error-border", "--error-text",
      "--warning-bg", "--warning-bg-strong", "--warning-border", "--warning-text",
      "--warning-text-strong", "--warning-solid", "--success-bg", "--success-bg-strong",
      "--success-text", "--success-text-strong", "--shadow-sm", "--shadow-md", "--shadow-lg",
      "--radius-sm", "--radius-lg", "--font-body", "--font-mono",
    ]) expect(vars[k], k).toBeTruthy()
  })
  it("on-accent cambia a oscuro con un acento claro", () => {
    const t = clone()
    t.colors.accent = "#FDE047"
    expect(themeToCssVars(t)["--on-accent"]).toBe("#12213A")
  })
  it("el texto derivado cumple AA sobre sus fondos", () => {
    const t = clone()
    t.colors.accent = "#7DD3FC"
    t.colors.bg = "#FFF7ED"
    const v = themeToCssVars(t)
    expect(contrastRatio(v["--accent-text"], v["--accent-light"])).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(v["--text-muted"], v["--bg-primary"])).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(v["--sidebar-muted"], v["--sidebar-bg"])).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(v["--error-text"], v["--error-bg"])).toBeGreaterThanOrEqual(4.5)
  })
  it("sidebar claro usa texto oscuro", () => {
    const t = clone()
    t.colors.sidebarBg = "#FFFFFF"
    expect(themeToCssVars(t)["--sidebar-text"]).toBe("#12213A")
  })
  it("radius y shadow cambian los tokens", () => {
    const t = clone()
    t.radius = "none"
    t.shadow = "flat"
    const v = themeToCssVars(t)
    expect(v["--radius-lg"]).toBe("0px")
    expect(v["--shadow-md"]).toBe("none")
  })
  it("tolera un tema inválido sin lanzar", () => {
    const bad = { colors: { accent: "red" }, radius: "xx", font: "comic" } as unknown as BrandTheme
    expect(themeToCssVars(bad)["--accent"]).toBe("#1B4FD8")
    expect(normalizeTheme(bad).font).toBe("manrope")
  })
})

describe("cssVarsToStyleString", () => {
  it("genera un bloque :root + .app-theme-neutral", () => {
    const s = cssVarsToStyleString({ "--accent": "#1B4FD8", "--radius-sm": "4px" })
    expect(s).toBe(":root,.app-theme-neutral{--accent:#1B4FD8;--radius-sm:4px}")
  })
  it("descarta nombres/valores que podrían inyectar CSS", () => {
    const s = cssVarsToStyleString({ "--ok": "#fff", "color:red;--x": "1", "--y": "red;}body{display:none" })
    expect(s).toBe(":root,.app-theme-neutral{--ok:#fff}")
  })
})

describe("validateTheme / autoFixTheme", () => {
  it("el tema por defecto es válido", () => {
    expect(validateTheme(DEFAULT_BRAND_THEME)).toEqual({ ok: true, issues: [] })
  })
  it("detecta texto ilegible y propone arreglo", () => {
    const t = clone()
    t.colors.text = "#BBBBBB"
    const r = validateTheme(t)
    expect(r.ok).toBe(false)
    const issue = r.issues.find((i) => i.field === "colors.text")
    expect(issue?.fix).toMatch(/^#[0-9A-F]{6}$/)
    expect(contrastRatio(issue!.fix!, t.colors.bg)).toBeGreaterThanOrEqual(4.5)
  })
  it("detecta hex inválido", () => {
    const t = clone()
    t.colors.accent = "azul"
    expect(validateTheme(t).issues[0].field).toBe("colors.accent")
  })
  it("autoFixTheme deja un tema válido", () => {
    const t = clone()
    t.colors.text = "#CCCCCC"
    t.colors.accent = "#FFFF99"
    t.colors.secondary = "#DDDDDD"
    expect(validateTheme(autoFixTheme(t)).ok).toBe(true)
  })
})
