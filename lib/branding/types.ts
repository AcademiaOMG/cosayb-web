/**
 * Contrato de marca blanca (white label) por negocio. Compartido entre el
 * editor de marca, el ThemeProvider/SSR y la API (el API valida el mismo
 * formato con zod). Todos los colores son #RRGGBB.
 */
export type BrandRadius = "none" | "sm" | "md" | "lg" | "pill"
export type BrandShadow = "flat" | "soft" | "elevated"
export const BRAND_FONTS = [
  "manrope",
  "inter",
  "poppins",
  "dm-sans",
  "nunito",
  "lato",
  "montserrat",
  "source-sans-3",
] as const
export type BrandFont = (typeof BRAND_FONTS)[number]

export interface BrandColors {
  primary: string
  secondary: string
  accent: string
  sidebarBg: string
  bg: string
  surface: string
  text: string
  success: string
  warning: string
  error: string
  info: string
}

/**
 * Colores derivados que el usuario PUEDE fijar a mano. Todos opcionales: si falta
 * uno, el motor lo calcula (contraste WCAG + armonía OKLCH) a partir de las 11
 * entradas de BrandColors. Ver lib/branding/tokens.ts para el alcance de cada uno.
 */
export interface BrandOverrides {
  sidebarText?: string
  sidebarActiveBg?: string
  sidebarActiveText?: string
  headerBg?: string
  headerText?: string
  textSecondary?: string
  border?: string
}
export const BRAND_OVERRIDE_KEYS = [
  "sidebarText",
  "sidebarActiveBg",
  "sidebarActiveText",
  "headerBg",
  "headerText",
  "textSecondary",
  "border",
] as const satisfies readonly (keyof BrandOverrides)[]

export interface BrandTheme {
  colors: BrandColors
  /** Color base de la calculadora (carcasa/teclas). Opcional: por defecto sigue a `primary`. */
  calculator?: string
  overrides?: BrandOverrides
  radius: BrandRadius
  shadow: BrandShadow
  font: BrandFont
}

export type BrandAssetKind = "logoPrimary" | "logoAlt" | "icon"

export interface BrandingResponse {
  enabled: boolean
  version: number
  theme: BrandTheme | null
  assets: Record<BrandAssetKind, string | null>
  displayName: string | null
}

/** Equivalente al tema actual de la app autenticada (sin marca blanca). */
export const DEFAULT_BRAND_THEME: BrandTheme = {
  colors: {
    primary: "#12213A",
    secondary: "#4B5563",
    accent: "#1B4FD8",
    sidebarBg: "#12213A",
    bg: "#EFF2F6",
    surface: "#FFFFFF",
    text: "#12213A",
    success: "#10B981",
    warning: "#F59E0B",
    error: "#B42020",
    info: "#1B4FD8",
  },
  radius: "md",
  shadow: "soft",
  font: "manrope",
}
