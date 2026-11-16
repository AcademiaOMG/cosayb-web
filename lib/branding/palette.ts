import { DEFAULT_BRAND_THEME, type BrandTheme } from "./types"

export type PaletteHarmony = "analogous" | "complementary" | "triadic" | "monochrome"
export interface SuggestOptions {
  harmony?: PaletteHarmony
  sidebar?: "dark" | "light" | "brand"
}

/** STUB (se implementa en el siguiente commit): devuelve un BrandTheme completo desde UN color. */
export function suggestPalette(primary: string, _opts?: SuggestOptions): BrandTheme {
  const t: BrandTheme = JSON.parse(JSON.stringify(DEFAULT_BRAND_THEME))
  t.colors.primary = primary
  t.colors.accent = primary
  t.calculator = primary
  return t
}

export interface PaletteRole {
  key: string
  label: string
  hex: string
  onHex: string
  ratio: number
}
/** STUB: lista de roles con su color "encima" y contraste, para el editor. */
export function describePalette(_theme: BrandTheme): PaletteRole[] {
  return []
}
