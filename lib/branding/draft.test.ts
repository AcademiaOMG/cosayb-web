import { describe, it, expect } from "vitest"
import {
  brandDraftReducer,
  createDraftState,
  isDirty,
  isDefaultTheme,
  buildSavePayload,
  parseHexInput,
  analyzeTheme,
  fixTheme,
  validateAssetFile,
  ASSET_MAX_BYTES,
  FONT_OPTIONS,
  derivedInfo,
  isFluorescent,
  softenColor,
} from "./draft"
import { previewCss } from "./platformPreview"
import { BRAND_FONTS, DEFAULT_BRAND_THEME } from "./types"
import { INPUT_KEYS, DERIVED_KEYS } from "./tokens"
import { brandVars, suggestPalette } from "./editorEngine"

const fresh = () => createDraftState(null, null)

describe("brandDraftReducer", () => {
  it("parte limpio con el tema por defecto", () => {
    const s = fresh()
    expect(s.theme).toEqual(DEFAULT_BRAND_THEME)
    expect(isDirty(s)).toBe(false)
  })

  it("setColor marca sucio y normaliza a mayúsculas; volver al valor original limpia", () => {
    let s = brandDraftReducer(fresh(), { type: "setColor", key: "accent", value: "#ff0000" })
    expect(s.theme.colors.accent).toBe("#FF0000")
    expect(isDirty(s)).toBe(true)
    s = brandDraftReducer(s, { type: "setColor", key: "accent", value: DEFAULT_BRAND_THEME.colors.accent })
    expect(isDirty(s)).toBe(false)
  })

  it("radio, sombra, fuente y nombre cuentan como cambios", () => {
    expect(isDirty(brandDraftReducer(fresh(), { type: "setRadius", value: "pill" }))).toBe(true)
    expect(isDirty(brandDraftReducer(fresh(), { type: "setShadow", value: "flat" }))).toBe(true)
    expect(isDirty(brandDraftReducer(fresh(), { type: "setFont", value: "lato" }))).toBe(true)
    expect(isDirty(brandDraftReducer(fresh(), { type: "setDisplayName", value: "Mi marca" }))).toBe(true)
  })

  it("espacios en el nombre no cuentan como cambio", () => {
    expect(isDirty(brandDraftReducer(fresh(), { type: "setDisplayName", value: "   " }))).toBe(false)
  })

  it("discard vuelve a la base", () => {
    let s = brandDraftReducer(fresh(), { type: "setRadius", value: "none" })
    s = brandDraftReducer(s, { type: "setDisplayName", value: "X" })
    s = brandDraftReducer(s, { type: "discard" })
    expect(isDirty(s)).toBe(false)
    expect(s.theme.radius).toBe("md")
  })

  it("resetDefaults deja el borrador en defaults sin tocar la base", () => {
    const saved = { ...DEFAULT_BRAND_THEME, radius: "lg" as const }
    let s = createDraftState(saved, "Marca")
    s = brandDraftReducer(s, { type: "resetDefaults" })
    expect(isDefaultTheme(s.theme)).toBe(true)
    expect(isDirty(s)).toBe(true)
    expect(s.base.theme.radius).toBe("lg")
  })

  it("load rebasa (tras guardar) y limpia el estado sucio", () => {
    let s = brandDraftReducer(fresh(), { type: "setFont", value: "poppins" })
    s = brandDraftReducer(s, { type: "load", theme: s.theme, displayName: null })
    expect(isDirty(s)).toBe(false)
    expect(s.base.theme.font).toBe("poppins")
  })

  it("rebase actualiza la base sin perder el borrador", () => {
    let s = brandDraftReducer(fresh(), { type: "setRadius", value: "lg" })
    s = brandDraftReducer(s, { type: "rebase", theme: { ...DEFAULT_BRAND_THEME, radius: "lg" }, displayName: null })
    expect(s.theme.radius).toBe("lg")
    expect(isDirty(s)).toBe(false)
  })

  it("restore conserva la base", () => {
    const edited = { ...DEFAULT_BRAND_THEME, shadow: "elevated" as const }
    const s = brandDraftReducer(fresh(), { type: "restore", theme: edited, displayName: "" })
    expect(isDirty(s)).toBe(true)
    expect(s.base.theme.shadow).toBe("soft")
  })
})

describe("buildSavePayload", () => {
  it("omite displayName vacío y recorta el nombre", () => {
    expect(buildSavePayload(fresh())).toEqual({ theme: DEFAULT_BRAND_THEME })
    const s = brandDraftReducer(fresh(), { type: "setDisplayName", value: "  Café  " })
    expect(buildSavePayload(s).displayName).toBe("Café")
  })
})

describe("parseHexInput", () => {
  it("acepta con/sin # y forma corta", () => {
    expect(parseHexInput("1b4fd8")).toBe("#1B4FD8")
    expect(parseHexInput("#fff")).toBe("#FFFFFF")
    expect(parseHexInput(" #12213a ")).toBe("#12213A")
  })
  it("rechaza incompletos o inválidos", () => {
    expect(parseHexInput("#12")).toBeNull()
    expect(parseHexInput("zzzzzz")).toBeNull()
    expect(parseHexInput("")).toBeNull()
  })
})

describe("validación de tema", () => {
  it("el tema por defecto cumple AA", () => {
    expect(analyzeTheme(DEFAULT_BRAND_THEME).ok).toBe(true)
  })
  it("detecta bajo contraste, lo agrupa por color y autoFix lo corrige", () => {
    const bad = {
      ...DEFAULT_BRAND_THEME,
      colors: { ...DEFAULT_BRAND_THEME.colors, text: "#EEEEEE" },
    }
    const r = analyzeTheme(bad)
    expect(r.ok).toBe(false)
    expect(r.byColor.text?.length).toBeGreaterThan(0)
    expect(analyzeTheme(fixTheme(bad)).ok).toBe(true)
  })
})

describe("validateAssetFile", () => {
  it("acepta imágenes permitidas dentro del límite", () => {
    expect(validateAssetFile({ type: "image/png", size: 1000 })).toBeNull()
    expect(validateAssetFile({ type: "image/svg+xml", size: ASSET_MAX_BYTES })).toBeNull()
  })
  it("rechaza tipo, vacío y tamaño excesivo", () => {
    expect(validateAssetFile({ type: "application/pdf", size: 10 })).toMatch(/Formato/)
    expect(validateAssetFile({ type: "image/png", size: 0 })).toMatch(/vacío/)
    expect(validateAssetFile({ type: "image/png", size: ASSET_MAX_BYTES + 1 })).toMatch(/máximo/)
  })
})

describe("catálogos del editor", () => {
  it("las opciones de fuente cubren exactamente BRAND_FONTS", () => {
    expect(FONT_OPTIONS.map((f) => f.value).sort()).toEqual([...BRAND_FONTS].sort())
  })
  it("el catálogo de tokens cubre las 11 entradas de color + calculadora", () => {
    expect([...INPUT_KEYS].sort()).toEqual([...Object.keys(DEFAULT_BRAND_THEME.colors), "calculator"].sort())
    expect(DERIVED_KEYS.length).toBe(7)
  })
})

describe("calculadora y overrides", () => {
  it("setCalculator fija y quita (sigue al principal); cuenta como cambio", () => {
    let s = brandDraftReducer(fresh(), { type: "setCalculator", value: "#aa5500" })
    expect(s.theme.calculator).toBe("#AA5500")
    expect(isDirty(s)).toBe(true)
    s = brandDraftReducer(s, { type: "setCalculator", value: undefined })
    expect("calculator" in s.theme).toBe(false)
    expect(isDirty(s)).toBe(false)
  })

  it("setOverride guarda en overrides, ignora hex inválido y volver a automático lo quita", () => {
    let s = brandDraftReducer(fresh(), { type: "setOverride", key: "sidebarText", value: "#ffffff" })
    expect(s.theme.overrides).toEqual({ sidebarText: "#FFFFFF" })
    expect(isDirty(s)).toBe(true)
    expect(brandDraftReducer(s, { type: "setOverride", key: "border", value: "rojo" })).toBe(s)
    s = brandDraftReducer(s, { type: "clearOverride", key: "sidebarText" })
    expect("overrides" in s.theme).toBe(false)
    expect(isDirty(s)).toBe(false)
  })

  it("el payload nunca lleva overrides ni calculator vacíos", () => {
    let s = brandDraftReducer(fresh(), { type: "setOverride", key: "border", value: "#cccccc" })
    s = brandDraftReducer(s, { type: "clearOverride", key: "border" })
    const t = buildSavePayload(s).theme as unknown as Record<string, unknown>
    expect("overrides" in t).toBe(false)
    expect("calculator" in t).toBe(false)
    const withOv = brandDraftReducer(fresh(), { type: "setOverride", key: "border", value: "#cccccc" })
    expect(buildSavePayload(withOv).theme.overrides).toEqual({ border: "#CCCCCC" })
  })

  it("load conserva calculator y overrides del servidor", () => {
    const saved = { ...DEFAULT_BRAND_THEME, calculator: "#336699", overrides: { headerBg: "#EEEEEE" } }
    const s = createDraftState(saved, null)
    expect(s.theme.calculator).toBe("#336699")
    expect(s.theme.overrides).toEqual({ headerBg: "#EEEEEE" })
    expect(isDirty(s)).toBe(false)
  })
})

describe("paleta sugerida", () => {
  it("applySuggestion reemplaza colores, conserva radio/sombra/fuente y se puede deshacer", () => {
    let s = brandDraftReducer(fresh(), { type: "setRadius", value: "pill" })
    s = brandDraftReducer(s, { type: "setOverride", key: "border", value: "#cccccc" })
    const before = s.theme
    s = brandDraftReducer(s, { type: "applySuggestion", theme: suggestPalette("#C2410C", { harmony: "complementary", sidebar: "dark" }) })
    expect(s.theme.colors.primary).toBe("#C2410C")
    expect(s.theme.radius).toBe("pill")
    expect(s.theme.overrides).toBeUndefined()
    expect(isDirty(s)).toBe(true)
    expect(s.undoTheme).toBe(before)
    s = brandDraftReducer(s, { type: "undoSuggestion" })
    expect(s.theme).toBe(before)
    expect(s.undoTheme).toBeNull()
  })
  it("Descartar limpia el deshacer y vuelve a la base", () => {
    let s = brandDraftReducer(fresh(), { type: "applySuggestion", theme: suggestPalette("#0F766E") })
    s = brandDraftReducer(s, { type: "discard" })
    expect(isDirty(s)).toBe(false)
    expect(s.undoTheme).toBeNull()
  })
})

describe("derivados en vivo y avisos", () => {
  it("derivedInfo da valor automático y ratio; un override malo falla el mínimo", () => {
    const vars = brandVars(DEFAULT_BRAND_THEME)
    const auto = derivedInfo(DEFAULT_BRAND_THEME, "sidebarText", vars)
    expect(auto.isOverride).toBe(false)
    expect(auto.ok).toBe(true)
    expect(auto.ratio).toBeGreaterThan(4.5)
    const bad = { ...DEFAULT_BRAND_THEME, overrides: { sidebarText: "#14243C" } }
    const info = derivedInfo(bad, "sidebarText", brandVars(bad))
    expect(info.isOverride).toBe(true)
    expect(info.ok).toBe(false)
  })
  it("detecta fluorescentes, ofrece color suave y fixTheme lo suaviza", () => {
    expect(isFluorescent("#00FF00")).toBe(true)
    expect(isFluorescent("#1B4FD8")).toBe(false)
    expect(isFluorescent(softenColor("#00FF00"))).toBe(false)
    const neon = { ...DEFAULT_BRAND_THEME, colors: { ...DEFAULT_BRAND_THEME.colors, accent: "#00FF00" }, calculator: "#FF00FF" }
    const r = analyzeTheme(neon)
    expect(r.ok).toBe(false)
    expect(r.byColor.accent?.some((i) => i.fix)).toBe(true)
    expect(r.byColor.calculator?.length).toBeGreaterThan(0)
    const fixed = fixTheme(neon)
    expect(isFluorescent(fixed.colors.accent)).toBe(false)
    expect(isFluorescent(fixed.calculator!)).toBe(false)
  })
})

describe("previewCss", () => {
  it("todas las declaraciones son !important y limitadas a tokens", () => {
    const css = previewCss(DEFAULT_BRAND_THEME)
    expect(css.startsWith(":root,body,.app-theme-neutral{")).toBe(true)
    const decls = css.slice(css.indexOf("{") + 1, -1).split(";")
    expect(decls.length).toBeGreaterThan(30)
    expect(decls.every((d) => d.startsWith("--") && d.endsWith(" !important"))).toBe(true)
    expect(css).toContain("--accent:#1B4FD8 !important")
  })
})
