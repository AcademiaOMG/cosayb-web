/**
 * Lógica pura del editor de marca: borrador local, "cambios sin guardar",
 * overrides de colores derivados, paleta sugerida, validación de logotipos y
 * opciones de la identidad visual. Sin React ni DOM para poder probarla con
 * vitest (ver draft.test.ts).
 */
import {
  BRAND_OVERRIDE_KEYS,
  DEFAULT_BRAND_THEME,
  type BrandAssetKind,
  type BrandColors,
  type BrandFont,
  type BrandOverrides,
  type BrandRadius,
  type BrandShadow,
  type BrandTheme,
} from "./types"
import {
  autoFixTheme,
  contrastRatio,
  isHex,
  normalizeTheme as baseNormalizeTheme,
  validateTheme,
  type ThemeIssue,
} from "./theme"
import { derivedAutoValue } from "./editorEngine"

/* ─── Normalización con calculator y overrides ───────────────────── */

/** Overrides válidos (#RRGGBB en mayúsculas); undefined si no queda ninguno (nunca se envían vacíos). */
export function cleanOverrides(input: BrandOverrides | undefined | null): BrandOverrides | undefined {
  const out: BrandOverrides = {}
  for (const k of BRAND_OVERRIDE_KEYS) {
    const v = input?.[k]
    if (isHex(v)) out[k] = v.toUpperCase()
  }
  return Object.keys(out).length ? out : undefined
}

/** normalizeTheme del motor + conserva `calculator` y `overrides` válidos (independiente de si el motor ya los trata). */
export function normalizeTheme(input: Partial<BrandTheme> | null | undefined): BrandTheme {
  const out: BrandTheme = { ...baseNormalizeTheme(input) }
  const calc = input?.calculator
  if (isHex(calc)) out.calculator = calc.toUpperCase()
  else delete out.calculator
  const ov = cleanOverrides(input?.overrides)
  if (ov) out.overrides = ov
  else delete out.overrides
  return out
}

/* ─── Borrador ────────────────────────────────────────────────────── */

export interface BrandDraftState {
  /** Lo que se está editando. */
  theme: BrandTheme
  displayName: string
  /** Última versión guardada (referencia para "sin guardar" y Descartar). */
  base: { theme: BrandTheme; displayName: string }
  /** Tema previo a la última paleta sugerida (para «Deshacer»); null si no hay nada que deshacer. */
  undoTheme: BrandTheme | null
}

export type BrandDraftAction =
  | { type: "setColor"; key: keyof BrandColors; value: string }
  /** Color de la calculadora; undefined = sigue al color principal. */
  | { type: "setCalculator"; value: string | undefined }
  /** Fija a mano un color derivado (override). */
  | { type: "setOverride"; key: keyof BrandOverrides; value: string }
  /** «Volver a automático»: quita el override. */
  | { type: "clearOverride"; key: keyof BrandOverrides }
  /** Reemplaza la paleta con una sugerencia (conserva radio, sombra y fuente) y permite deshacer. */
  | { type: "applySuggestion"; theme: BrandTheme }
  | { type: "undoSuggestion" }
  | { type: "setRadius"; value: BrandRadius }
  | { type: "setShadow"; value: BrandShadow }
  | { type: "setFont"; value: BrandFont }
  | { type: "setDisplayName"; value: string }
  /** Reemplaza todo el tema del borrador (p. ej. al corregir automáticamente). */
  | { type: "replaceTheme"; theme: BrandTheme }
  /** Vuelve a la última versión guardada. */
  | { type: "discard" }
  /** Pone los valores por defecto en el borrador (no guarda). */
  | { type: "resetDefaults" }
  /** Tras guardar o recibir datos nuevos del servidor: el borrador pasa a ser la base. */
  | { type: "load"; theme: BrandTheme | null; displayName: string | null }
  /** Llegan datos nuevos del servidor mientras hay cambios sin guardar: actualiza la base y conserva el borrador. */
  | { type: "rebase"; theme: BrandTheme | null; displayName: string | null }
  /** Restaura un borrador a medias (vista previa global) conservando la base. */
  | { type: "restore"; theme: BrandTheme; displayName: string }

export function createDraftState(theme: BrandTheme | null, displayName: string | null): BrandDraftState {
  const t = normalizeTheme(theme ?? DEFAULT_BRAND_THEME)
  const n = displayName ?? ""
  return { theme: t, displayName: n, base: { theme: t, displayName: n }, undoTheme: null }
}

function withOverrides(theme: BrandTheme, overrides: BrandOverrides | undefined): BrandTheme {
  const next = { ...theme }
  if (overrides) next.overrides = overrides
  else delete next.overrides
  return next
}

export function brandDraftReducer(state: BrandDraftState, action: BrandDraftAction): BrandDraftState {
  switch (action.type) {
    case "setColor":
      return {
        ...state,
        theme: { ...state.theme, colors: { ...state.theme.colors, [action.key]: action.value.toUpperCase() } },
      }
    case "setCalculator": {
      const theme = { ...state.theme }
      if (action.value && isHex(action.value)) theme.calculator = action.value.toUpperCase()
      else delete theme.calculator
      return { ...state, theme }
    }
    case "setOverride": {
      if (!isHex(action.value)) return state
      return { ...state, theme: withOverrides(state.theme, cleanOverrides({ ...state.theme.overrides, [action.key]: action.value })) }
    }
    case "clearOverride": {
      const rest = { ...state.theme.overrides }
      delete rest[action.key]
      return { ...state, theme: withOverrides(state.theme, cleanOverrides(rest)) }
    }
    case "applySuggestion": {
      const s = normalizeTheme(action.theme)
      const theme: BrandTheme = { ...s, radius: state.theme.radius, shadow: state.theme.shadow, font: state.theme.font }
      return { ...state, theme, undoTheme: state.undoTheme ?? state.theme }
    }
    case "undoSuggestion":
      return state.undoTheme ? { ...state, theme: state.undoTheme, undoTheme: null } : state
    case "setRadius":
      return { ...state, theme: { ...state.theme, radius: action.value } }
    case "setShadow":
      return { ...state, theme: { ...state.theme, shadow: action.value } }
    case "setFont":
      return { ...state, theme: { ...state.theme, font: action.value } }
    case "setDisplayName":
      return { ...state, displayName: action.value }
    case "replaceTheme":
      return { ...state, theme: normalizeTheme(action.theme) }
    case "discard":
      return { ...state, theme: state.base.theme, displayName: state.base.displayName, undoTheme: null }
    case "resetDefaults":
      return { ...state, theme: DEFAULT_BRAND_THEME, undoTheme: null }
    case "load":
      return createDraftState(action.theme, action.displayName)
    case "rebase": {
      const b = createDraftState(action.theme, action.displayName)
      return { ...state, base: b.base }
    }
    case "restore":
      return { ...state, theme: normalizeTheme(action.theme), displayName: action.displayName }
  }
}

export function themesEqual(a: BrandTheme, b: BrandTheme): boolean {
  if (a.radius !== b.radius || a.shadow !== b.shadow || a.font !== b.font) return false
  const keys = Object.keys(DEFAULT_BRAND_THEME.colors) as (keyof BrandColors)[]
  if (!keys.every((k) => a.colors[k].toUpperCase() === b.colors[k].toUpperCase())) return false
  if ((a.calculator ?? "").toUpperCase() !== (b.calculator ?? "").toUpperCase()) return false
  const oa = cleanOverrides(a.overrides)
  const ob = cleanOverrides(b.overrides)
  return BRAND_OVERRIDE_KEYS.every((k) => (oa?.[k] ?? "") === (ob?.[k] ?? ""))
}

/** Hay cambios sin guardar (tema o nombre visible). El nombre se compara recortado. */
export function isDirty(state: BrandDraftState): boolean {
  return !themesEqual(state.theme, state.base.theme) || state.displayName.trim() !== state.base.displayName.trim()
}

/** El borrador ya es igual a los valores por defecto (Restablecer no haría nada). */
export function isDefaultTheme(theme: BrandTheme): boolean {
  return themesEqual(theme, DEFAULT_BRAND_THEME)
}

/** Payload del PUT: displayName vacío se omite; `calculator` y `overrides` vacíos nunca se envían. */
export function buildSavePayload(state: BrandDraftState): { theme: BrandTheme; displayName?: string } {
  const name = state.displayName.trim()
  const theme = normalizeTheme(state.theme)
  return name ? { theme, displayName: name } : { theme }
}

/* ─── Color: entrada de hex tolerante ─────────────────────────────── */

/**
 * Normaliza lo que escribe el usuario a #RRGGBB: acepta sin "#", en minúscula
 * y la forma corta #RGB. Devuelve null si no es un color completo todavía.
 */
export function parseHexInput(raw: string): string | null {
  let v = raw.trim().replace(/^#/, "")
  if (/^[0-9a-fA-F]{3}$/.test(v)) v = v.split("").map((ch) => ch + ch).join("")
  const hex = `#${v}`
  return isHex(hex) ? hex.toUpperCase() : null
}

/* ─── Utilidades HSL (fluorescentes) ──────────────────────────────── */

/** Hex a HSL (h 0-360, s/l 0-1). */
export function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}

export function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360
  const a = Math.max(0, Math.min(1, s)) * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + hh / 30) % 12
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, "0")
  }
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase()
}

/** Color «fluorescente»: saturación casi máxima en luminosidad media (vibra y cansa la vista). */
export function isFluorescent(hex: string): boolean {
  if (!isHex(hex)) return false
  const [, s, l] = hexToHsl(hex)
  return s >= 0.92 && l >= 0.42 && l <= 0.72
}

/** Versión más suave del mismo tono. */
export function softenColor(hex: string): string {
  const [h, s, l] = hexToHsl(hex)
  return hslToHex(h, Math.min(s, 0.72), Math.min(l, 0.5))
}

/* ─── Validación del tema (contraste y avisos) ───────────────────── */

export interface FieldContrast {
  issues: ThemeIssue[]
  /** Problemas agrupados por clave (colors.text → "text"; calculator; overrides.x → "x"). */
  byColor: Record<string, ThemeIssue[]>
  ok: boolean
}

const FLUOR_FIELDS: { key: string; label: string }[] = [
  { key: "primary", label: "Color principal" },
  { key: "accent", label: "Color de acción" },
  { key: "secondary", label: "Color secundario" },
  { key: "sidebarBg", label: "Fondo de la barra lateral" },
  { key: "calculator", label: "Color de la calculadora" },
]

/** Avisos propios del editor (no son errores de contraste): colores fluorescentes, con color sugerido. */
export function colorWarnings(theme: BrandTheme): ThemeIssue[] {
  const out: ThemeIssue[] = []
  for (const f of FLUOR_FIELDS) {
    const v = f.key === "calculator" ? theme.calculator : theme.colors[f.key as keyof BrandColors]
    if (v && isFluorescent(v)) {
      out.push({
        field: f.key === "calculator" ? "calculator" : `colors.${f.key}`,
        message: `${f.label}: es un color fluorescente; cansa la vista y los textos se leen mal sobre él.`,
        fix: softenColor(v),
      })
    }
  }
  return out
}

export function analyzeTheme(theme: BrandTheme): FieldContrast {
  const engine = validateTheme(theme)
  const warnings = colorWarnings(theme)
  const issues = [...engine.issues, ...warnings]
  const byColor: FieldContrast["byColor"] = {}
  for (const issue of issues) {
    const key = issue.field.replace(/^colors\./, "").replace(/^overrides\./, "")
    ;(byColor[key] ??= []).push(issue)
  }
  return { ok: engine.ok && warnings.length === 0, issues, byColor }
}

/** Corrige el contraste (motor) y suaviza los fluorescentes. Conserva calculadora y overrides. */
export function fixTheme(theme: BrandTheme): BrandTheme {
  const t = normalizeTheme(theme)
  const colors = { ...t.colors }
  for (const k of ["primary", "accent", "secondary", "sidebarBg"] as const) {
    if (isFluorescent(colors[k])) colors[k] = softenColor(colors[k])
  }
  const softened: BrandTheme = { ...t, colors }
  if (t.calculator && isFluorescent(t.calculator)) softened.calculator = softenColor(t.calculator)
  const fixed = autoFixTheme(softened)
  return normalizeTheme({ ...fixed, calculator: softened.calculator, overrides: softened.overrides })
}

/* ─── Derivados: valor automático y contraste en vivo ────────────── */

/** Contra qué se mide cada derivado, con su mínimo WCAG (3 para iconos/UI, 4.5 texto). */
export const DERIVED_CONTRAST: Partial<Record<keyof BrandOverrides, { bg: "sidebarBg" | "sidebarActiveBg" | "headerBg" | "surface"; min: number; what: string }>> = {
  sidebarText: { bg: "sidebarBg", min: 4.5, what: "el fondo de la barra lateral" },
  sidebarActiveBg: { bg: "sidebarBg", min: 3, what: "la barra lateral" },
  sidebarActiveText: { bg: "sidebarActiveBg", min: 4.5, what: "el fondo del ítem activo" },
  headerText: { bg: "headerBg", min: 4.5, what: "el fondo del encabezado" },
  textSecondary: { bg: "surface", min: 4.5, what: "las tarjetas" },
  border: { bg: "surface", min: 1.15, what: "las tarjetas" },
}

export interface DerivedInfo {
  /** Valor efectivo (override o calculado); null si el motor aún no lo expone. */
  value: string | null
  isOverride: boolean
  /** Ratio de contraste contra su fondo (null si no aplica). */
  ratio: number | null
  min: number | null
  ok: boolean
  /** Contra qué se mide («el fondo de la barra lateral»). */
  against: string | null
}

/** Valor efectivo de una entrada o derivado como hex, para usarlo como fondo. */
function effectiveHex(theme: BrandTheme, key: "sidebarBg" | "sidebarActiveBg" | "headerBg" | "surface", vars: Record<string, string>): string | null {
  if (key === "sidebarBg") return theme.colors.sidebarBg
  if (key === "surface") return theme.colors.surface
  const v = theme.overrides?.[key] ?? derivedAutoValue(theme, key, vars)
  return v && isHex(v) ? v : null
}

/** Estado en vivo de un derivado: valor automático/manual y su contraste. */
export function derivedInfo(theme: BrandTheme, key: keyof BrandOverrides, vars: Record<string, string>): DerivedInfo {
  const ov = theme.overrides?.[key]
  const value = ov ?? derivedAutoValue(theme, key, vars)
  const spec = DERIVED_CONTRAST[key]
  const none = { value: value ?? null, isOverride: !!ov, ratio: null, min: null, ok: true, against: spec?.what ?? null }
  if (!spec || !value || !isHex(value)) return none
  // Un fondo derivado se mide contra su propio contexto: headerBg contra surface, etc.
  const bg = key === "headerBg" ? theme.colors.surface : effectiveHex(theme, spec.bg, vars)
  if (!bg) return none
  const ratio = contrastRatio(value, bg)
  return { ...none, ratio, min: spec.min, ok: ratio >= spec.min }
}

/* ─── Logotipos ───────────────────────────────────────────────────── */

export const ASSET_MAX_BYTES = 1024 * 1024 // 1 MB
export const ASSET_ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"] as const

export const ASSET_LABELS: Record<BrandAssetKind, { title: string; hint: string }> = {
  logoPrimary: { title: "Logotipo principal", hint: "Se muestra en la barra lateral y en los encabezados." },
  logoAlt: { title: "Logotipo alternativo", hint: "Versión para fondos oscuros o claros contrarios al principal." },
  icon: { title: "Icono", hint: "Cuadrado, para pestañas y la barra lateral contraída." },
}

export const ASSET_KINDS: BrandAssetKind[] = ["logoPrimary", "logoAlt", "icon"]

/** Valida tipo y tamaño en cliente. Devuelve un mensaje de error o null si es válido. */
export function validateAssetFile(file: { type: string; size: number }): string | null {
  if (!(ASSET_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return "Formato no admitido. Usa PNG, JPG, WebP o SVG."
  }
  if (file.size <= 0) return "El archivo está vacío."
  if (file.size > ASSET_MAX_BYTES) {
    return `El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El máximo es 1 MB.`
  }
  return null
}

/* ─── Identidad visual: opciones ──────────────────────────────────── */

export const RADIUS_OPTIONS: { value: BrandRadius; label: string }[] = [
  { value: "none", label: "Rectos" },
  { value: "sm", label: "Sutiles" },
  { value: "md", label: "Medios" },
  { value: "lg", label: "Amplios" },
  { value: "pill", label: "Píldora" },
]

export const SHADOW_OPTIONS: { value: BrandShadow; label: string }[] = [
  { value: "flat", label: "Planas" },
  { value: "soft", label: "Suaves" },
  { value: "elevated", label: "Elevadas" },
]

export const FONT_OPTIONS: { value: BrandFont; label: string }[] = [
  { value: "manrope", label: "Manrope" },
  { value: "inter", label: "Inter" },
  { value: "poppins", label: "Poppins" },
  { value: "dm-sans", label: "DM Sans" },
  { value: "nunito", label: "Nunito" },
  { value: "lato", label: "Lato" },
  { value: "montserrat", label: "Montserrat" },
  { value: "source-sans-3", label: "Source Sans 3" },
]
