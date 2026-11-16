/**
 * Generador de paletas: a partir de UN color produce un BrandTheme completo y
 * coherente (11 colores + calculadora) razonando en OKLCH.
 *
 * Decisiones:
 *  - accent = primary "domesticado": croma acotado (sin neones), L ajustada para
 *    contrastar >=4.5 con la superficie (sirve como color de acción y de texto).
 *  - secondary: armonía por rotación de matiz (análogo +30°, complementario
 *    +180°, triádico +120°, monocromo = mismo matiz) con croma contenido y >=4.5.
 *  - bg/surface: neutros con el matiz de marca a croma 0.004-0.012.
 *  - text: contraste >=7 (AAA) sobre bg y surface, tintado con el matiz.
 *  - sidebar: profundo (dark), claro (light) o de marca.
 *  - estados: matices fijos reconocibles (verde/ámbar/rojo/azul) con L/C
 *    armonizados con el croma de la marca.
 */
import {
  clamp,
  contrastRatio,
  ensureContrast,
  fromOklch,
  normalizeHex,
  onColor,
  tameChroma,
  toOklch,
} from "./color"
import { DEFAULT_BRAND_THEME, type BrandTheme } from "./types"

export type PaletteHarmony = "analogous" | "complementary" | "triadic" | "monochrome"
export interface SuggestOptions {
  harmony?: PaletteHarmony
  sidebar?: "dark" | "light" | "brand"
}

const HARMONY_SHIFT: Record<PaletteHarmony, number> = {
  analogous: 30,
  complementary: 180,
  triadic: 120,
  monochrome: 0,
}

const wrap = (h: number) => ((h % 360) + 360) % 360

export function suggestPalette(primary: string, opts?: SuggestOptions): BrandTheme {
  const base = normalizeHex(primary) ?? DEFAULT_BRAND_THEME.colors.primary
  const harmony = opts?.harmony ?? "analogous"
  const sidebarMode = opts?.sidebar ?? "dark"

  const o = toOklch(base)
  const achromatic = o.c < 0.02
  const h = achromatic ? 262 : o.h
  const c = achromatic ? 0 : clamp(o.c, 0, 0.19)
  const tint = achromatic ? 0 : 1

  const bg = fromOklch({ l: 0.962, c: 0.009 * tint, h })
  const surface = fromOklch({ l: 0.995, c: 0.004 * tint, h })

  const text = ensureContrast(fromOklch({ l: 0.22, c: 0.03 * tint, h }), bg, 7)
  const textOk = ensureContrast(text, surface, 7)

  const tamed = tameChroma(base, 0.19)
  const accent = ensureContrast(tamed, surface, 4.5)
  const ac = toOklch(accent)
  // La marca visible (primary) coincide con la acción cuando la original no contrastaba.
  const primaryOut = contrastRatio(tamed, surface) >= 3 ? tamed : accent

  const secH = wrap(h + HARMONY_SHIFT[harmony])
  const secC = achromatic ? 0 : harmony === "monochrome" ? Math.min(c * 0.6, 0.09) : clamp(c * 0.7, 0.06, 0.12)
  const secondary = ensureContrast(fromOklch({ l: 0.45, c: secC, h: secH }), surface, 4.5)

  let sidebarBg: string
  if (sidebarMode === "light") sidebarBg = fromOklch({ l: 0.975, c: 0.012 * tint, h })
  else if (sidebarMode === "brand") sidebarBg = fromOklch({ l: clamp(ac.l, 0.32, 0.45), c: clamp(ac.c, 0.04, 0.15) * tint, h })
  else sidebarBg = fromOklch({ l: 0.25, c: clamp(c * 0.6, 0.02, 0.07) * tint, h })

  // Estados: matiz fijo; croma armonizado con la marca (marcas muy vivas => estados algo más vivos).
  const k = 0.9 + 0.2 * clamp(c / 0.19, 0, 1)
  const success = fromOklch({ l: 0.6, c: 0.14 * k, h: 152 })
  const warning = fromOklch({ l: 0.76, c: 0.15 * k, h: 78 })
  const error = fromOklch({ l: 0.5, c: 0.19 * k, h: 27 })
  const info = fromOklch({ l: 0.55, c: 0.16 * k, h: 245 })

  const calcBase = ac.c < 0.02 ? base : fromOklch({ l: 0.3, c: clamp(ac.c, 0.05, 0.12), h: ac.h })

  return {
    colors: {
      primary: primaryOut,
      secondary,
      accent,
      sidebarBg,
      bg,
      surface,
      text: textOk,
      success,
      warning,
      error,
      info,
    },
    calculator: calcBase,
    radius: DEFAULT_BRAND_THEME.radius,
    shadow: DEFAULT_BRAND_THEME.shadow,
    font: DEFAULT_BRAND_THEME.font,
  }
}

export interface PaletteRole {
  key: string
  label: string
  hex: string
  /** Color que se pinta ENCIMA (texto/icono) */
  onHex: string
  /** Contraste WCAG de onHex sobre hex */
  ratio: number
}

/** Resumen por roles (para el editor): cada color con lo que se pinta encima y su contraste. */
export function describePalette(theme: BrandTheme): PaletteRole[] {
  const c = theme.colors
  const row = (key: string, label: string, hex: string, onHex: string): PaletteRole => ({
    key,
    label,
    hex,
    onHex,
    ratio: Math.round(contrastRatio(onHex, hex) * 100) / 100,
  })
  return [
    row("accent", "Acción (botones)", c.accent, onColor(c.accent)),
    row("secondary", "Secundario", c.secondary, onColor(c.secondary)),
    row("sidebarBg", "Barra lateral", c.sidebarBg, onColor(c.sidebarBg)),
    row("bg", "Fondo de la app", c.bg, c.text),
    row("surface", "Tarjetas", c.surface, c.text),
    row("success", "Éxito", c.success, onColor(c.success)),
    row("warning", "Advertencia", c.warning, onColor(c.warning)),
    row("error", "Error", c.error, onColor(c.error)),
    row("info", "Información", c.info, onColor(c.info)),
  ]
}
