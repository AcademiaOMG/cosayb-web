import { describe, expect, it } from "vitest"
import { contrastRatio, toOklch } from "./color"
import { PRIMARIES } from "./testColors"
import { auditCssVars, autoFixTheme, normalizeTheme, themeToCssVars, validateTheme } from "./theme"
import { REQUIRED_CSS_VARS } from "./tokens"
import { DEFAULT_BRAND_THEME, type BrandTheme } from "./types"

const clone = (): BrandTheme => JSON.parse(JSON.stringify(DEFAULT_BRAND_THEME))
const ratio = (v: Record<string, string>, f: string, b: string) => contrastRatio(v[f], v[b])

describe("contrato de variables", () => {
  it("emite SIEMPRE todas las REQUIRED_CSS_VARS (tema por defecto)", () => {
    const v = themeToCssVars(DEFAULT_BRAND_THEME)
    for (const k of REQUIRED_CSS_VARS) expect(v[k], k).toBeTruthy()
  })
  it("tambien con overrides y con un tema roto", () => {
    const t = clone()
    t.overrides = { sidebarText: "#FFFFFF", headerBg: "#000000" }
    t.calculator = "#FF6A00"
    const v = themeToCssVars(t)
    for (const k of REQUIRED_CSS_VARS) expect(v[k], k).toBeTruthy()
    const bad = themeToCssVars({ colors: { accent: "x" } } as unknown as BrandTheme)
    for (const k of REQUIRED_CSS_VARS) expect(bad[k], k).toBeTruthy()
  })
  it("todos los valores de color son hex/rgba/px validos (sin CSS libre)", () => {
    const v = themeToCssVars(DEFAULT_BRAND_THEME)
    for (const [k, val] of Object.entries(v)) {
      if (k.startsWith("--radius") || k.startsWith("--shadow") || k.startsWith("--font") || k === "--glass-tint" || k === "--sidebar-hairline") continue
      expect(val, k).toMatch(/^#[0-9A-F]{6}$/)
    }
  })
})

describe("compatibilidad hacia atras", () => {
  it("un tema guardado SIN calculator/overrides funciona y el defecto sigue valido", () => {
    const legacy = JSON.parse(JSON.stringify(DEFAULT_BRAND_THEME)) as BrandTheme
    expect(legacy.calculator).toBeUndefined()
    expect(legacy.overrides).toBeUndefined()
    expect(validateTheme(legacy)).toEqual({ ok: true, issues: [] })
    expect(normalizeTheme(legacy).calculator).toBeUndefined()
    expect(normalizeTheme(legacy).overrides).toBeUndefined()
  })
  it("el tema por defecto conserva sus tokens clave", () => {
    const v = themeToCssVars(DEFAULT_BRAND_THEME)
    expect(v["--accent"]).toBe("#1B4FD8")
    expect(v["--on-accent"]).toBe("#FFFFFF")
    expect(v["--sidebar-text"]).toBe("#FFFFFF")
    expect(v["--bg-surface"]).toBe("#FFFFFF")
    expect(v["--text-primary"]).toBe("#12213A")
  })
  it("calculator por defecto = primary", () => {
    const a = themeToCssVars(DEFAULT_BRAND_THEME)
    const t = clone()
    t.calculator = DEFAULT_BRAND_THEME.colors.primary
    expect(themeToCssVars(t)["--calc-body"]).toBe(a["--calc-body"])
    t.calculator = "#B45309"
    expect(themeToCssVars(t)["--calc-body"]).not.toBe(a["--calc-body"])
  })
  it("normalizeTheme descarta overrides y calculator invalidos", () => {
    const n = normalizeTheme({ ...clone(), calculator: "rojo", overrides: { sidebarText: "x", border: "#abcdef" } as never })
    expect(n.calculator).toBeUndefined()
    expect(n.overrides).toEqual({ border: "#ABCDEF" })
  })
})

describe("escenarios del pedido", () => {
  it("sidebar azul oscuro: texto claro, item activo y chip legibles", () => {
    const v = themeToCssVars(DEFAULT_BRAND_THEME)
    expect(ratio(v, "--sidebar-text", "--sidebar-bg")).toBeGreaterThanOrEqual(7)
    expect(ratio(v, "--sidebar-active-text", "--sidebar-active-bg")).toBeGreaterThanOrEqual(4.5)
    expect(ratio(v, "--sidebar-active-bg", "--sidebar-bg")).toBeGreaterThanOrEqual(3)
    expect(ratio(v, "--chip-text", "--chip-bg")).toBeGreaterThanOrEqual(4.5)
  })
  it("accent igual al sidebar: el activo se separa del fondo y sigue legible", () => {
    const t = clone()
    t.colors.accent = t.colors.sidebarBg
    const v = themeToCssVars(t)
    expect(v["--sidebar-active-bg"]).not.toBe(v["--sidebar-bg"])
    expect(auditCssVars(v)).toEqual([])
  })
  it("encabezado oscuro por override: texto y chip legibles", () => {
    const t = clone()
    t.overrides = { headerBg: "#0B1220" }
    const v = themeToCssVars(t)
    expect(v["--header-bg"]).toBe("#0B1220")
    expect(ratio(v, "--header-text", "--header-bg")).toBeGreaterThanOrEqual(4.5)
    expect(ratio(v, "--chip-text", "--chip-bg")).toBeGreaterThanOrEqual(4.5)
  })
  it("naranja intenso como accent: texto encima por contraste", () => {
    const t = clone()
    t.colors.accent = "#FF6A00"
    const v = themeToCssVars(t)
    expect(ratio(v, "--on-accent", "--accent")).toBeGreaterThanOrEqual(4.5)
  })
  it("override respetado si cumple; corregido al pintar si no", () => {
    const t = clone()
    t.overrides = { sidebarText: "#E0E7FF" }
    expect(themeToCssVars(t)["--sidebar-text"]).toBe("#E0E7FF")
    t.overrides = { sidebarText: "#1A2540" } // oscuro sobre sidebar oscuro
    const v = themeToCssVars(t)
    expect(ratio(v, "--sidebar-text", "--sidebar-bg")).toBeGreaterThanOrEqual(4.5)
  })
  it("border override se aplica", () => {
    const t = clone()
    t.overrides = { border: "#FF00AA" }
    expect(themeToCssVars(t)["--border-light"]).toBe("#FF00AA")
  })
})

describe("validateTheme / autoFixTheme con overrides", () => {
  it("reporta cada derivado ilegible con fix", () => {
    const t = clone()
    t.overrides = { sidebarText: "#1A2540", headerText: "#EEEEEE", textSecondary: "#DDDDDD", sidebarActiveBg: "#12213B", sidebarActiveText: "#223355" }
    const r = validateTheme(t)
    expect(r.ok).toBe(false)
    for (const f of ["overrides.sidebarText", "overrides.headerText", "overrides.textSecondary", "overrides.sidebarActiveBg"]) {
      const issue = r.issues.find((i) => i.field === f)
      expect(issue, f).toBeTruthy()
      expect(issue?.fix).toMatch(/^#[0-9A-F]{6}$/)
    }
  })
  it("autoFixTheme deja el tema valido", () => {
    const t = clone()
    t.overrides = { sidebarText: "#1A2540", headerText: "#EEEEEE", textSecondary: "#DDDDDD", sidebarActiveBg: "#12213B", sidebarActiveText: "#223355" }
    expect(validateTheme(autoFixTheme(t))).toEqual({ ok: true, issues: [] })
  })
  it("calculator invalido es un issue", () => {
    const t = clone()
    t.calculator = "azul"
    expect(validateTheme(t).issues[0].field).toBe("calculator")
  })
})

describe("estres: todas las parejas del contrato con 40+ colores en cada entrada", () => {
  const entries: ((t: BrandTheme, p: string) => void)[] = [
    (t, p) => (t.colors.accent = p),
    (t, p) => (t.colors.sidebarBg = p),
    // bg y surface de polaridad opuesta no admiten un unico texto: se prueban juntos (mismo tono)
    (t, p) => {
      t.colors.bg = p
      t.colors.surface = p
    },
    (t, p) => (t.colors.text = p),
    (t, p) => (t.colors.secondary = p),
    (t, p) => (t.colors.primary = p),
    (t, p) => (t.colors.error = p),
    (t, p) => (t.colors.warning = p),
    (t, p) => (t.colors.success = p),
    (t, p) => (t.colors.info = p),
    (t, p) => (t.calculator = p),
    (t, p) => (t.overrides = { headerBg: p }),
    (t, p) => (t.overrides = { sidebarActiveBg: p }),
    (t, p) => (t.overrides = { sidebarText: p, headerText: p, textSecondary: p, sidebarActiveText: p }),
  ]
  it.each(PRIMARIES)("color %s en cada entrada", (p) => {
    for (const apply of entries) {
      const t = clone()
      apply(t, p)
      const bad = auditCssVars(themeToCssVars(t))
      expect(bad, `${apply.toString()} ${p}`).toEqual([])
    }
  })
  it("accent y sidebar extremos combinados", () => {
    for (const a of PRIMARIES) {
      for (const s of ["#000000", "#FFFFFF", "#808080", "#12213A", "#FF6A00", "#F5F0E8"]) {
        const t = clone()
        t.colors.accent = a
        t.colors.sidebarBg = s
        expect(auditCssVars(themeToCssVars(t)), `${a}/${s}`).toEqual([])
      }
    }
  })
  it("bg y surface de polaridad opuesta: validateTheme lo avisa", () => {
    const t = clone()
    t.colors.bg = "#12213A"
    expect(validateTheme(t).ok).toBe(false)
  })
  it("el item activo sobre sidebar claro con accent claro sigue separado", () => {
    const t = clone()
    t.colors.sidebarBg = "#FFFFFF"
    t.colors.accent = "#FDE047"
    const v = themeToCssVars(t)
    expect(ratio(v, "--sidebar-active-bg", "--sidebar-bg")).toBeGreaterThanOrEqual(3)
    expect(toOklch(v["--sidebar-active-bg"]).l).toBeLessThan(0.8)
  })
})
