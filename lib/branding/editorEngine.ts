/**
 * Puente entre el editor y el motor de color (lib/branding/{theme,palette,calcPalette}.ts).
 * Todo lo que el editor necesita del motor pasa por aquí.
 */
import { calcPaletteVars } from "./calcPalette"
import { suggestPalette, type PaletteHarmony, type SuggestOptions } from "./palette"
import { TOKEN_GROUPS } from "./tokens"
import type { BrandOverrides, BrandTheme } from "./types"
import { contrastRatio, isHex, onColor, themeToCssVars } from "./theme"

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

/* ─── Motor real (agente A) ───────────────────────────────────────── */

export { calcPaletteVars }
export { suggestPalette }
export type { PaletteHarmony }
export type SidebarStyle = NonNullable<SuggestOptions["sidebar"]>

/** Ratio de contraste (reexportado para los componentes del editor). */
export { contrastRatio }
