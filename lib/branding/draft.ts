/**
 * Lógica pura del editor de marca: borrador local, "cambios sin guardar",
 * validación de logotipos y opciones de la identidad visual. Sin React ni DOM
 * para poder probarla con vitest (ver draft.test.ts).
 */
import {
  DEFAULT_BRAND_THEME,
  type BrandAssetKind,
  type BrandColors,
  type BrandFont,
  type BrandRadius,
  type BrandShadow,
  type BrandTheme,
} from "./types"
import { autoFixTheme, isHex, normalizeTheme, validateTheme, type ThemeIssue } from "./theme"

/* ─── Borrador ────────────────────────────────────────────────────── */

export interface BrandDraftState {
  /** Lo que se está editando. */
  theme: BrandTheme
  displayName: string
  /** Última versión guardada (referencia para "sin guardar" y Descartar). */
  base: { theme: BrandTheme; displayName: string }
}

export type BrandDraftAction =
  | { type: "setColor"; key: keyof BrandColors; value: string }
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
  return { theme: t, displayName: n, base: { theme: t, displayName: n } }
}

export function brandDraftReducer(state: BrandDraftState, action: BrandDraftAction): BrandDraftState {
  switch (action.type) {
    case "setColor":
      return {
        ...state,
        theme: { ...state.theme, colors: { ...state.theme.colors, [action.key]: action.value.toUpperCase() } },
      }
    case "setRadius":
      return { ...state, theme: { ...state.theme, radius: action.value } }
    case "setShadow":
      return { ...state, theme: { ...state.theme, shadow: action.value } }
    case "setFont":
      return { ...state, theme: { ...state.theme, font: action.value } }
    case "setDisplayName":
      return { ...state, displayName: action.value }
    case "replaceTheme":
      return { ...state, theme: action.theme }
    case "discard":
      return { ...state, theme: state.base.theme, displayName: state.base.displayName }
    case "resetDefaults":
      return { ...state, theme: DEFAULT_BRAND_THEME }
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
  return keys.every((k) => a.colors[k].toUpperCase() === b.colors[k].toUpperCase())
}

/** Hay cambios sin guardar (tema o nombre visible). El nombre se compara recortado. */
export function isDirty(state: BrandDraftState): boolean {
  return !themesEqual(state.theme, state.base.theme) || state.displayName.trim() !== state.base.displayName.trim()
}

/** El borrador ya es igual a los valores por defecto (Restablecer no haría nada). */
export function isDefaultTheme(theme: BrandTheme): boolean {
  return themesEqual(theme, DEFAULT_BRAND_THEME)
}

/** Payload del PUT: displayName vacío se omite (el API lo trata como "sin nombre"). */
export function buildSavePayload(state: BrandDraftState): { theme: BrandTheme; displayName?: string } {
  const name = state.displayName.trim()
  return name ? { theme: state.theme, displayName: name } : { theme: state.theme }
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

/* ─── Validación del tema (contraste) ─────────────────────────────── */

export interface FieldContrast {
  issues: ThemeIssue[]
  /** Problemas agrupados por clave de color (colors.text → "text"). */
  byColor: Partial<Record<keyof BrandColors, ThemeIssue[]>>
  ok: boolean
}

export function analyzeTheme(theme: BrandTheme): FieldContrast {
  const { ok, issues } = validateTheme(theme)
  const byColor: FieldContrast["byColor"] = {}
  for (const issue of issues) {
    const key = issue.field.replace(/^colors\./, "") as keyof BrandColors
    ;(byColor[key] ??= []).push(issue)
  }
  return { ok, issues, byColor }
}

export function fixTheme(theme: BrandTheme): BrandTheme {
  return autoFixTheme(theme)
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

export interface ColorFieldMeta {
  key: keyof BrandColors
  label: string
  hint: string
}

export const COLOR_GROUPS: { id: string; title: string; fields: ColorFieldMeta[] }[] = [
  {
    id: "brand",
    title: "Marca",
    fields: [
      { key: "primary", label: "Primario", hint: "Color institucional (superficies oscuras y énfasis)." },
      { key: "accent", label: "Acento", hint: "Botones, enlaces y elementos activos." },
      { key: "secondary", label: "Secundario", hint: "Texto secundario y detalles." },
      { key: "sidebarBg", label: "Barra lateral", hint: "Fondo del menú de navegación." },
    ],
  },
  {
    id: "surfaces",
    title: "Superficies",
    fields: [
      { key: "bg", label: "Fondo", hint: "Fondo general de la app." },
      { key: "surface", label: "Superficie", hint: "Tarjetas, tablas y formularios." },
      { key: "text", label: "Texto", hint: "Texto principal." },
    ],
  },
  {
    id: "states",
    title: "Estados",
    fields: [
      { key: "success", label: "Éxito", hint: "Confirmaciones y valores positivos." },
      { key: "warning", label: "Advertencia", hint: "Avisos y atención." },
      { key: "error", label: "Error", hint: "Errores y acciones destructivas." },
      { key: "info", label: "Información", hint: "Mensajes informativos." },
    ],
  },
]
