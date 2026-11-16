/**
 * Puente entre el editor y el motor de color (agente A).
 *
 * Todo lo que el editor necesita del motor pasa por aquí: así hay UN solo sitio
 * que cambiar cuando el motor real esté disponible.
 *
 * !!! SHIM TEMPORAL !!! `suggestPalette` y `calcPaletteVars` de abajo son
 * implementaciones locales mínimas con las MISMAS firmas que el contrato de A
 * (lib/branding/palette.ts y lib/branding/calcPalette.ts). Al hacer
 * `git merge feat/white-label` con el motor real, reemplazar los dos bloques
 * marcados por:
 *   export { suggestPalette } from "./palette"
 *   export { calcPaletteVars } from "./calcPalette"
 */
import { TOKEN_GROUPS } from "./tokens"
import { DEFAULT_BRAND_THEME, type BrandOverrides, type BrandTheme } from "./types"
import { autoFixTheme, contrastRatio, isHex, onColor, themeToCssVars } from "./theme"

/* ─── Variables de la vista previa ───────────────────────────────── */

/** Variables que pintan la vista previa y la vista en toda la plataforma: tema + calculadora. */
export function brandVars(theme: BrandTheme): Record<string, string> {
  return { ...themeToCssVars(theme), ...calcPaletteVars(theme.calculator ?? theme.colors.primary) }
}

const DERIVED_FALLBACK: Record<keyof BrandOverrides, (t: BrandTheme) => string> = {
  sidebarText: (t) => onColor(t.colors.sidebarBg),
  sidebarActiveBg: (t) => t.colors.accent,
  sidebarActiveText: (t) => onColor(t.overrides?.sidebarActiveBg ?? t.colors.accent),
  headerBg: (t) => t.colors.surface,
  headerText: (t) => onColor(t.overrides?.headerBg ?? t.colors.surface),
  textSecondary: (t) => t.colors.secondary,
  border: (t) => t.colors.surface,
}

/** Valor calculado por el motor para un derivado (primera variable CSS del token), con respaldo local. */
export function derivedAutoValue(theme: BrandTheme, key: keyof BrandOverrides, vars: Record<string, string>): string | null {
  const spec = TOKEN_GROUPS.flatMap((g) => g.tokens).find((t) => t.key === key)
  const v = spec ? vars[spec.cssVars[0]] : undefined
  if (v && isHex(v)) return v.toUpperCase()
  const fb = DERIVED_FALLBACK[key](theme)
  return isHex(fb) ? fb.toUpperCase() : null
}

/* ─── HSL mínimo (solo para el shim) ─────────────────────────────── */

function toHsl(hex: string): [number, number, number] {
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

function fromHsl(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360
  const a = Math.max(0, Math.min(1, s)) * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + hh / 30) % 12
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, "0")
  }
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase()
}

/* ─── SHIM 1/2: calcPaletteVars (real: lib/branding/calcPalette.ts) ─ */

export function calcPaletteVars(base: string): Record<string, string> {
  const b = isHex(base) ? base : DEFAULT_BRAND_THEME.colors.primary
  const [h, s] = toHsl(b)
  const sat = Math.min(Math.max(s, 0.25), 0.7)
  const body = fromHsl(h, sat, 0.28)
  const key = fromHsl(h, Math.min(sat, 0.25), 0.93)
  const op = fromHsl(h, sat, 0.42)
  const eq = fromHsl(h, sat, 0.5)
  const display = fromHsl(h, Math.min(sat, 0.3), 0.86)
  return {
    "--calc-body": body,
    "--calc-body-2": fromHsl(h, sat, 0.2),
    "--calc-key": key,
    "--calc-key-text": onColor(key),
    "--calc-key-op": op,
    "--calc-key-op-text": onColor(op),
    "--calc-key-equals": eq,
    "--calc-key-equals-text": onColor(eq),
    "--calc-display-bg": display,
    "--calc-display-text": onColor(display),
    "--calc-accent": fromHsl(h, sat, 0.6),
    "--calc-ring": fromHsl(h, sat, 0.7),
  }
}

/* ─── SHIM 2/2: suggestPalette (real: lib/branding/palette.ts) ────── */

export type PaletteHarmony = "analogous" | "complementary" | "triadic" | "monochrome"
export type SidebarStyle = "dark" | "light" | "brand"

export function suggestPalette(
  primary: string,
  opts: { harmony?: PaletteHarmony; sidebar?: SidebarStyle } = {},
): BrandTheme {
  const p = isHex(primary) ? primary.toUpperCase() : DEFAULT_BRAND_THEME.colors.primary
  const [h, s] = toHsl(p)
  const shift = { analogous: 30, complementary: 180, triadic: 120, monochrome: 0 }[opts.harmony ?? "analogous"]
  const secondary = opts.harmony === "monochrome" ? fromHsl(h, 0.2, 0.35) : fromHsl(h + shift, Math.min(s, 0.45), 0.35)
  const sidebar = opts.sidebar ?? "dark"
  const sidebarBg = sidebar === "dark" ? fromHsl(h, Math.min(s, 0.5), 0.14) : sidebar === "light" ? fromHsl(h, 0.25, 0.96) : p
  const theme: BrandTheme = {
    ...DEFAULT_BRAND_THEME,
    colors: {
      ...DEFAULT_BRAND_THEME.colors,
      primary: p,
      accent: p,
      secondary,
      sidebarBg,
      bg: fromHsl(h, 0.25, 0.95),
      surface: "#FFFFFF",
      text: fromHsl(h, 0.35, 0.15),
    },
  }
  return autoFixTheme(theme)
}

/** Ratio de contraste (reexportado para los componentes del editor). */
export { contrastRatio }
