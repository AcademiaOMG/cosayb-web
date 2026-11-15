import {
  BRAND_FONTS,
  DEFAULT_BRAND_THEME,
  type BrandColors,
  type BrandFont,
  type BrandRadius,
  type BrandShadow,
  type BrandTheme,
} from "./types"

/* ─── Utilidades de color ─────────────────────────────────────────── */

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function isHex(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value)
}

type RGB = [number, number, number]

function parseHex(hex: string): RGB {
  const h = hex.replace("#", "")
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

function toHex([r, g, b]: RGB): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase()
}

function luminance(hex: string): number {
  const lin = parseHex(hex).map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}

/** Relación de contraste WCAG entre dos colores #RRGGBB (1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** Mezcla `a` con `b`; t=0 devuelve a, t=1 devuelve b. */
function mix(a: string, b: string, t: number): string {
  const pa = parseHex(a)
  const pb = parseHex(b)
  return toHex([0, 1, 2].map((i) => pa[i] + (pb[i] - pa[i]) * t) as RGB)
}

const darken = (c: string, t: number) => mix(c, "#000000", t)

/** Oscurece o aclara `fg` (según el fondo) hasta alcanzar `min` contra `bg`. */
function ensureContrast(fg: string, bg: string, min: number): string {
  if (contrastRatio(fg, bg) >= min) return fg
  const toward = luminance(bg) > 0.4 ? "#000000" : "#FFFFFF"
  for (let t = 0.04; t <= 1.0001; t += 0.04) {
    const c = mix(fg, toward, t)
    if (contrastRatio(c, bg) >= min) return c
  }
  return toward
}

/** Garantiza contraste contra varias superficies a la vez. */
function ensureContrastAll(fg: string, bgs: string[], min: number): string {
  let out = fg
  for (let pass = 0; pass < 2; pass++) {
    for (const bg of bgs) out = ensureContrast(out, bg, min)
  }
  return out
}

/** Texto legible sobre un color sólido: blanco o casi negro. */
export function onColor(bg: string): string {
  return contrastRatio("#FFFFFF", bg) >= contrastRatio("#12213A", bg) ? "#FFFFFF" : "#12213A"
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/* ─── Mapas de forma y fuente ─────────────────────────────────────── */

const RADIUS: Record<BrandRadius, [string, string, string]> = {
  none: ["0px", "0px", "0px"],
  sm: ["4px", "6px", "10px"],
  md: ["10px", "14px", "20px"], // = tema neutro actual
  lg: ["14px", "20px", "28px"],
  pill: ["16px", "24px", "32px"],
}

const SHADOW: Record<BrandShadow, [string, string, string]> = {
  flat: ["none", "none", "none"],
  soft: [
    "0 1px 2px rgba(16, 24, 40, 0.04)",
    "0 4px 12px rgba(16, 24, 40, 0.08)",
    "0 8px 20px rgba(16, 24, 40, 0.1)",
  ], // = tema neutro actual
  elevated: [
    "0 2px 6px rgba(16, 24, 40, 0.1)",
    "0 10px 24px rgba(16, 24, 40, 0.16)",
    "0 18px 40px rgba(16, 24, 40, 0.22)",
  ],
}

/** BrandFont → variable CSS que next/font define en <html> (ver app/layout.tsx). */
export const BRAND_FONT_VARIABLE: Record<BrandFont, string> = {
  manrope: "--font-manrope",
  inter: "--font-inter",
  poppins: "--font-poppins",
  "dm-sans": "--font-dm-sans",
  nunito: "--font-nunito",
  lato: "--font-lato",
  montserrat: "--font-montserrat",
  "source-sans-3": "--font-source-sans-3",
}

export function fontStack(font: BrandFont): string {
  const v = BRAND_FONT_VARIABLE[font] ?? BRAND_FONT_VARIABLE.manrope
  // Si la fuente curada aún no está cargada, cae a Manrope (siempre cargada).
  return `var(${v}, var(--font-manrope))`
}

/* ─── Derivación de tokens ────────────────────────────────────────── */

/** Normaliza un tema parcial/inválido: lo que no sea válido toma el valor por defecto. */
export function normalizeTheme(input: Partial<BrandTheme> | null | undefined): BrandTheme {
  const d = DEFAULT_BRAND_THEME
  const colors = { ...d.colors }
  for (const k of Object.keys(colors) as (keyof BrandColors)[]) {
    const v = input?.colors?.[k]
    if (isHex(v)) colors[k] = v.toUpperCase()
  }
  return {
    colors,
    radius: input?.radius && input.radius in RADIUS ? input.radius : d.radius,
    shadow: input?.shadow && input.shadow in SHADOW ? input.shadow : d.shadow,
    font: input?.font && (BRAND_FONTS as readonly string[]).includes(input.font) ? input.font : d.font,
  }
}

/** Deriva TODOS los tokens CSS (--accent, --bg-*, --sidebar-*, estados, radios, sombras, fuentes). */
export function themeToCssVars(input: BrandTheme): Record<string, string> {
  const theme = normalizeTheme(input)
  const c = theme.colors
  const bgs = [c.bg, c.surface]
  const bgSecondary = mix(c.bg, c.text, 0.04)

  const accentHover = darken(c.accent, 0.14)
  const accentLight = mix(c.accent, "#FFFFFF", 0.88)
  const accentText = ensureContrastAll(c.accent, [accentLight, ...bgs], 4.5)

  const textSecondary = ensureContrastAll(c.secondary, [...bgs, bgSecondary], 4.5)
  const textMuted = ensureContrastAll(mix(c.text, c.bg, 0.4), [...bgs, bgSecondary], 4.5)

  const sidebarText = onColor(c.sidebarBg)
  const sidebarMuted = ensureContrast(mix(sidebarText, c.sidebarBg, 0.35), c.sidebarBg, 4.5)
  const sidebarLabel = ensureContrast(mix(sidebarText, c.sidebarBg, 0.5), c.sidebarBg, 3)

  const family = (base: string, bgT: number, bgStrongT: number, borderT: number) => {
    const bg = mix(base, "#FFFFFF", bgT)
    const bgStrong = mix(base, "#FFFFFF", bgStrongT)
    const border = mix(base, "#FFFFFF", borderT)
    const text = ensureContrastAll(darken(base, 0.35), [bg, bgStrong], 4.5)
    const textStrong = ensureContrastAll(darken(base, 0.55), [bg, bgStrong], 7)
    return { bg, bgStrong, border, text, textStrong }
  }
  const err = family(c.error, 0.94, 0.86, 0.78)
  const warn = family(c.warning, 0.94, 0.85, 0.7)
  const ok = family(c.success, 0.93, 0.84, 0.7)
  const [rSm, rMd, rLg] = RADIUS[theme.radius]
  const [sSm, sMd, sLg] = SHADOW[theme.shadow]
  const font = fontStack(theme.font)

  return {
    "--bg-primary": c.bg,
    "--bg-secondary": bgSecondary,
    "--bg-surface": c.surface,
    "--bg-inverse": c.primary,

    "--text-primary": c.text,
    "--text-secondary": textSecondary,
    "--text-muted": textMuted,

    "--accent": c.accent,
    "--accent-hover": accentHover,
    "--accent-light": accentLight,
    "--accent-text": accentText,
    "--on-accent": onColor(c.accent),
    "--on-inverse": onColor(c.primary),

    "--border-light": mix(c.bg, c.text, 0.1),
    "--border-medium": mix(c.bg, c.text, 0.2),

    "--sidebar-bg": c.sidebarBg,
    "--sidebar-text": sidebarText,
    "--sidebar-muted": sidebarMuted,
    "--sidebar-label": sidebarLabel,
    "--sidebar-hairline": rgba(sidebarText, 0.08),

    "--success": c.success,
    "--warning": c.warning,
    "--error": c.error,
    "--error-hover": darken(c.error, 0.2),
    "--info": c.info,

    "--error-bg": err.bg,
    "--error-border": err.border,
    "--error-text": err.text,
    "--warning-bg": warn.bg,
    "--warning-bg-strong": warn.bgStrong,
    "--warning-border": warn.border,
    "--warning-text": warn.text,
    "--warning-text-strong": warn.textStrong,
    "--warning-solid": darken(c.warning, 0.15),
    "--success-bg": ok.bg,
    "--success-bg-strong": ok.bgStrong,
    "--success-text": ok.text,
    "--success-text-strong": ok.textStrong,

    "--glass-tint": rgba(c.accent, 0.16),

    "--radius-sm": rSm,
    "--radius-md": rMd,
    "--radius-lg": rLg,
    "--shadow-sm": sSm,
    "--shadow-md": sMd,
    "--shadow-lg": sLg,

    "--font-display": font,
    "--font-body": font,
    "--font-mono": font,
  }
}

/**
 * Serializa las variables a `:root,.app-theme-neutral{ ... }`. Se incluye
 * .app-theme-neutral porque ese wrapper redefine los mismos tokens más abajo
 * en el árbol y, sin esto, taparía a :root. Solo contiene nombres --token y
 * valores generados por nosotros (hex/rgba/px/var()), nunca CSS libre.
 */
export function cssVarsToStyleString(vars: Record<string, string>): string {
  const body = Object.entries(vars)
    .filter(([k, v]) => /^--[a-z0-9-]+$/.test(k) && !/[;{}<>]/.test(v))
    .map(([k, v]) => `${k}:${v}`)
    .join(";")
  return `:root,.app-theme-neutral{${body}}`
}

/* ─── Validación y auto-corrección ────────────────────────────────── */

export interface ThemeIssue {
  field: string
  message: string
  fix?: string
}

export function validateTheme(theme: BrandTheme): { ok: boolean; issues: ThemeIssue[] } {
  const issues: ThemeIssue[] = []
  const c = theme.colors
  for (const k of Object.keys(DEFAULT_BRAND_THEME.colors) as (keyof BrandColors)[]) {
    if (!isHex(c?.[k])) issues.push({ field: `colors.${k}`, message: "Debe ser un color #RRGGBB válido." })
  }
  if (issues.length) return { ok: false, issues }

  const check = (field: string, fg: string, bg: string, min: number, label: string) => {
    const ratio = contrastRatio(fg, bg)
    if (ratio < min) {
      issues.push({
        field,
        message: `${label}: contraste ${ratio.toFixed(2)}:1, se requiere al menos ${min}:1.`,
        fix: ensureContrast(fg, bg, min),
      })
    }
  }
  check("colors.text", c.text, c.bg, 4.5, "Texto sobre fondo")
  check("colors.text", c.text, c.surface, 4.5, "Texto sobre superficie")
  check("colors.secondary", c.secondary, c.bg, 4.5, "Texto secundario sobre fondo")
  check("colors.secondary", c.secondary, c.surface, 4.5, "Texto secundario sobre superficie")
  check("colors.accent", c.accent, c.surface, 3, "Color de acento sobre superficie")
  check("colors.primary", c.primary, c.surface, 3, "Color primario sobre superficie")
  // El texto sobre el acento se elige blanco/oscuro automáticamente (siempre
  // >= 4.5:1); se comprueba por si cambia la regla de on-accent.
  if (contrastRatio(onColor(c.accent), c.accent) < 4.5) {
    issues.push({ field: "colors.accent", message: "El texto sobre el acento no alcanza 4.5:1." })
  }
  return { ok: issues.length === 0, issues }
}

/** Devuelve un tema con los colores ajustados para cumplir los mínimos AA. */
export function autoFixTheme(input: BrandTheme): BrandTheme {
  const theme = normalizeTheme(input)
  const c = { ...theme.colors }
  c.text = ensureContrastAll(c.text, [c.bg, c.surface], 4.5)
  c.secondary = ensureContrastAll(c.secondary, [c.bg, c.surface], 4.5)
  c.accent = ensureContrast(c.accent, c.surface, 3)
  c.primary = ensureContrast(c.primary, c.surface, 3)
  return { ...theme, colors: c }
}
