/**
 * Motor de tema de marca: convierte un BrandTheme (11 colores + calculadora +
 * derivados opcionales) en TODAS las variables CSS del contrato
 * (REQUIRED_CSS_VARS de tokens.ts). Cada token de texto/icono se calcula contra
 * el fondo sobre el que se pinta (WCAG 2.x: >=4.5 texto, >=3 iconos/UI), con
 * ajustes en OKLCH que conservan el matiz. Los `overrides` del usuario se usan
 * como punto de partida pero, al pintar, se corrigen si no llegan al mínimo
 * (red de seguridad); `validateTheme` los reporta antes de guardar.
 */
import {
  clamp,
  contrastRatio,
  ensureContrast,
  ensureContrastAll,
  fromOklch,
  isHexColor,
  mix,
  FILL_MIN,
  onColor,
  onFill,
  parseHex,
  toOklch,
  withOklch,
} from "./color"
import { calcPaletteVars } from "./calcPalette"
import {
  BRAND_FONTS,
  BRAND_OVERRIDE_KEYS,
  DEFAULT_BRAND_THEME,
  type BrandColors,
  type BrandFont,
  type BrandOverrides,
  type BrandRadius,
  type BrandShadow,
  type BrandTheme,
} from "./types"

export { contrastRatio, onColor }

export function isHex(value: unknown): value is string {
  return isHexColor(value)
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
  const out: BrandTheme = {
    colors,
    radius: input?.radius && input.radius in RADIUS ? input.radius : d.radius,
    shadow: input?.shadow && input.shadow in SHADOW ? input.shadow : d.shadow,
    font: input?.font && (BRAND_FONTS as readonly string[]).includes(input.font) ? input.font : d.font,
  }
  if (isHex(input?.calculator)) out.calculator = input.calculator.toUpperCase()
  const ov: BrandOverrides = {}
  for (const k of BRAND_OVERRIDE_KEYS) {
    const v = input?.overrides?.[k]
    if (isHex(v)) ov[k] = v.toUpperCase()
  }
  if (Object.keys(ov).length) out.overrides = ov
  return out
}

/** Familia de un estado (éxito/aviso/error/info): fondos tenues, borde y textos por contraste. */
function stateFamily(base: string) {
  const { c, h } = toOklch(base)
  const bg = fromOklch({ l: 0.97, c: Math.min(c * 0.25, 0.03), h })
  const bgStrong = fromOklch({ l: 0.93, c: Math.min(c * 0.45, 0.06), h })
  const border = fromOklch({ l: 0.85, c: Math.min(c * 0.7, 0.1), h })
  const text = ensureContrastAll(fromOklch({ l: 0.42, c: Math.min(c, 0.14), h }), [bg, bgStrong], 4.5)
  const textStrong = ensureContrastAll(fromOklch({ l: 0.33, c: Math.min(c, 0.12), h }), [bg, bgStrong], 7)
  return { bg, bgStrong, border, text, textStrong }
}

/** Hover del sidebar: se acerca al color del texto (aclara en sidebars oscuros) mientras el texto siga >=4.5; si no, se aleja. */
function sidebarHoverOf(sbBg: string, text: string): string {
  const toward = mix(sbBg, text, 0.1)
  if (contrastRatio(text, toward) >= 4.5) return toward
  return mix(sbBg, isDark(text) ? "#FFFFFF" : "#000000", 0.1)
}

const isDark = (hex: string) => contrastRatio(hex, "#000000") < contrastRatio(hex, "#FFFFFF")

/** Fondo del ítem activo del sidebar: accent si contrasta >=3 con el sidebar; si no, se ajusta L o se usa un tono claro/oscuro del sidebar. */
function deriveSidebarActive(accent: string, sidebarBg: string): string {
  if (contrastRatio(accent, sidebarBg) >= 3) return accent
  const adj = ensureContrast(accent, sidebarBg, 3)
  const a = toOklch(accent)
  const b = toOklch(adj)
  if (Math.abs(a.l - b.l) <= 0.22 && (a.c < 0.05 || b.c >= a.c * 0.5)) return adj
  const sb = toOklch(sidebarBg)
  const tint = fromOklch({ l: isDark(sidebarBg) ? 0.93 : 0.25, c: clamp(sb.c, 0.02, 0.05), h: sb.h })
  return ensureContrast(tint, sidebarBg, 3)
}

/** Deriva TODOS los tokens CSS del contrato (colores, estados, calculadora, radios, sombras, fuentes). */
export function themeToCssVars(input: BrandTheme): Record<string, string> {
  const theme = normalizeTheme(input)
  const c = theme.colors
  const ov = theme.overrides ?? {}

  /* Superficies y texto */
  const text0 = ensureContrastAll(c.text, [c.bg, c.surface], 4.5)
  // bg-secondary se acerca al texto un 4%; si eso rompe el contraste (fondos de luminosidad media) se atenua o se omite.
  let bgSecondary = mix(c.bg, text0, 0.04)
  for (let i = 0; i < 3 && contrastRatio(text0, bgSecondary) < 4.5; i++) bgSecondary = mix(c.bg, bgSecondary, 0.5)
  if (contrastRatio(text0, bgSecondary) < 4.5) bgSecondary = c.bg
  const surfaces = [c.bg, c.surface, bgSecondary]
  const text = ensureContrastAll(text0, surfaces, 4.5)
  const onSurface = ensureContrast(text, c.surface, 4.5)
  const secondaryNeutral = withOklch(c.secondary, { c: Math.min(toOklch(c.secondary).c, 0.03) })
  const textSecondary = ensureContrastAll(ov.textSecondary ?? secondaryNeutral, surfaces, 4.5)
  const textMuted = ensureContrastAll(mix(text, c.bg, 0.4), surfaces, 4.5)
  const borderLight = ov.border ?? mix(c.bg, c.text, 0.1)
  const borderMedium = ov.border ? mix(ov.border, c.text, 0.12) : mix(c.bg, c.text, 0.2)

  /* Acción */
  const onAccent = onFill(c.accent)
  const ac = toOklch(c.accent)
  let accentHover = withOklch(c.accent, { l: clamp(ac.l - 0.06, 0, 1) })
  if (contrastRatio(onAccent, accentHover) < FILL_MIN) accentHover = withOklch(c.accent, { l: clamp(ac.l + 0.06, 0, 1) })
  if (contrastRatio(onAccent, accentHover) < FILL_MIN) accentHover = c.accent
  const darkSurface = isDark(c.surface)
  const tintL = darkSurface ? 0.3 : 0.95
  const accentLight = fromOklch({ l: tintL, c: Math.min(ac.c * (darkSurface ? 0.4 : 0.25), 0.05), h: ac.h })
  const accentText = ensureContrastAll(c.accent, [accentLight, ...surfaces], 4.5)
  const focusRing = ensureContrastAll(c.accent, [c.surface, c.bg], 3)

  /* Secundario */
  const sc = toOklch(c.secondary)
  const secondaryLight = fromOklch({ l: tintL, c: Math.min(sc.c * (darkSurface ? 0.4 : 0.25), 0.05), h: sc.h })
  const secondaryText = ensureContrastAll(c.secondary, [secondaryLight, ...surfaces], 4.5)

  /* Sidebar */
  const sbBg = c.sidebarBg
  const sidebarText = ensureContrast(ov.sidebarText ?? onColor(sbBg), sbBg, 4.5)
  const sidebarHover = sidebarHoverOf(sbBg, sidebarText)
  const sbSurfaces = [sbBg, sidebarHover]
  const sidebarMuted = ensureContrastAll(mix(sidebarText, sbBg, 0.35), sbSurfaces, 4.5)
  const sidebarLabel = ensureContrastAll(mix(sidebarText, sbBg, 0.45), sbSurfaces, 4.5)
  const activeBg = ensureContrast(ov.sidebarActiveBg ?? deriveSidebarActive(c.accent, sbBg), sbBg, 3)
  const activeText = ensureContrast(ov.sidebarActiveText ?? onFill(activeBg), activeBg, FILL_MIN)

  /* Encabezado y chip */
  const headerBg = ov.headerBg ?? c.surface
  const headerText = ensureContrast(
    ov.headerText ?? (contrastRatio(text, headerBg) >= 4.5 ? text : onColor(headerBg)),
    headerBg,
    4.5,
  )
  const headerBorder = mix(headerBg, headerText, 0.12)
  const chipBg = contrastRatio(accentLight, headerBg) >= 1.15 ? accentLight : mix(headerBg, headerText, 0.12)
  const chipText = ensureContrast(accentText, chipBg, 4.5)
  const chipBorder = mix(chipBg, chipText, 0.2)

  /* Estados */
  const err = stateFamily(c.error)
  const warn = stateFamily(c.warning)
  const ok = stateFamily(c.success)
  const inf = stateFamily(c.info)
  const [rSm, rMd, rLg] = RADIUS[theme.radius]
  const [sSm, sMd, sLg] = SHADOW[theme.shadow]
  const font = fontStack(theme.font)

  return {
    "--brand-primary": c.primary,
    "--brand-secondary": c.secondary,
    "--secondary-light": secondaryLight,
    "--secondary-text": secondaryText,
    "--on-secondary": onFill(c.secondary),

    "--bg-primary": c.bg,
    "--bg-secondary": bgSecondary,
    "--bg-surface": c.surface,
    "--on-surface": onSurface,
    "--bg-inverse": c.primary,
    "--on-inverse": onFill(c.primary),

    "--text-primary": text,
    "--text-secondary": textSecondary,
    "--text-muted": textMuted,

    "--accent": c.accent,
    "--accent-hover": accentHover,
    "--accent-light": accentLight,
    "--accent-text": accentText,
    "--on-accent": onAccent,
    "--focus-ring": focusRing,

    "--border-light": borderLight,
    "--border-medium": borderMedium,

    "--sidebar-bg": sbBg,
    "--sidebar-text": sidebarText,
    "--sidebar-muted": sidebarMuted,
    "--sidebar-label": sidebarLabel,
    "--sidebar-hairline": rgba(sidebarText, 0.1),
    "--sidebar-hover-bg": sidebarHover,
    "--sidebar-active-bg": activeBg,
    "--sidebar-active-text": activeText,

    "--header-bg": headerBg,
    "--header-text": headerText,
    "--header-border": headerBorder,
    "--chip-bg": chipBg,
    "--chip-text": chipText,
    "--chip-border": chipBorder,

    "--success": c.success,
    "--warning": c.warning,
    "--error": c.error,
    "--error-hover": withOklch(c.error, { l: clamp(toOklch(c.error).l * 0.88, 0, 1) }),
    "--info": c.info,

    "--error-bg": err.bg,
    "--error-border": err.border,
    "--error-text": err.text,
    "--warning-bg": warn.bg,
    "--warning-bg-strong": warn.bgStrong,
    "--warning-border": warn.border,
    "--warning-text": warn.text,
    "--warning-text-strong": warn.textStrong,
    "--warning-solid": ensureContrast(c.warning, c.surface, 3),
    "--success-bg": ok.bg,
    "--success-bg-strong": ok.bgStrong,
    "--success-border": ok.border,
    "--success-text": ok.text,
    "--success-text-strong": ok.textStrong,
    "--info-bg": inf.bg,
    "--info-border": inf.border,
    "--info-text": inf.text,

    "--glass-tint": rgba(c.accent, 0.16),

    ...calcPaletteVars(theme.calculator ?? c.primary),

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

/* ─── Auditoría de contraste de las variables emitidas ───────────────── */

export interface ContrastPair {
  fg: string
  bg: string
  min: number
}
const P = (fg: string, bg: string | string[], min: number): ContrastPair[] =>
  (Array.isArray(bg) ? bg : [bg]).map((b) => ({ fg, bg: b, min }))

/** Todas las parejas (texto/icono sobre fondo) que el motor garantiza, por nombre de variable. */
export const CONTRAST_PAIRS: ContrastPair[] = [
  ...P("--text-primary", ["--bg-primary", "--bg-surface", "--bg-secondary"], 4.5),
  ...P("--on-surface", "--bg-surface", 4.5),
  ...P("--text-secondary", ["--bg-primary", "--bg-surface", "--bg-secondary"], 4.5),
  ...P("--text-muted", ["--bg-primary", "--bg-surface", "--bg-secondary"], 4.5),
  ...P("--on-accent", ["--accent", "--accent-hover"], FILL_MIN),
  ...P("--accent-text", ["--accent-light", "--bg-surface", "--bg-primary", "--bg-secondary"], 4.5),
  ...P("--focus-ring", ["--bg-surface", "--bg-primary"], 3),
  ...P("--on-secondary", "--brand-secondary", FILL_MIN),
  ...P("--secondary-text", ["--secondary-light", "--bg-surface", "--bg-primary"], 4.5),
  ...P("--on-inverse", "--bg-inverse", FILL_MIN),
  ...P("--sidebar-text", ["--sidebar-bg", "--sidebar-hover-bg"], 4.5),
  ...P("--sidebar-muted", ["--sidebar-bg", "--sidebar-hover-bg"], 4.5),
  ...P("--sidebar-label", ["--sidebar-bg", "--sidebar-hover-bg"], 4.5),
  ...P("--sidebar-active-text", "--sidebar-active-bg", FILL_MIN),
  ...P("--sidebar-active-bg", "--sidebar-bg", 3),
  ...P("--header-text", "--header-bg", 4.5),
  ...P("--chip-text", "--chip-bg", 4.5),
  ...P("--success-text", ["--success-bg", "--success-bg-strong"], 4.5),
  ...P("--success-text-strong", ["--success-bg", "--success-bg-strong"], 7),
  ...P("--warning-text", ["--warning-bg", "--warning-bg-strong"], 4.5),
  ...P("--warning-text-strong", ["--warning-bg", "--warning-bg-strong"], 7),
  ...P("--warning-solid", "--bg-surface", 3),
  ...P("--error-text", "--error-bg", 4.5),
  ...P("--info-text", "--info-bg", 4.5),
  ...P("--calc-key-text", "--calc-key", 4.5),
  ...P("--calc-key-op-text", "--calc-key-op", 4.5),
  ...P("--calc-key-equals-text", "--calc-key-equals", 4.5),
  ...P("--calc-display-text", "--calc-display-bg", 4.5),
  ...P("--calc-accent", "--calc-body", 3),
  ...P("--calc-ring", "--calc-body", 3),
  ...P("--calc-key", "--calc-body", 3),
  ...P("--calc-key-op", "--calc-body", 3),
  ...P("--calc-key-equals", "--calc-body", 3),
]

/** Devuelve las parejas del contrato que NO cumplen su mínimo (vacío = todo bien). */
export function auditCssVars(vars: Record<string, string>): (ContrastPair & { ratio: number })[] {
  const bad: (ContrastPair & { ratio: number })[] = []
  for (const p of CONTRAST_PAIRS) {
    const f = vars[p.fg]
    const b = vars[p.bg]
    if (!isHex(f) || !isHex(b)) continue
    const ratio = contrastRatio(f, b)
    if (ratio < p.min) bad.push({ ...p, ratio })
  }
  return bad
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
  if (theme.calculator !== undefined && !isHex(theme.calculator)) {
    issues.push({ field: "calculator", message: "Debe ser un color #RRGGBB válido." })
  }
  for (const k of BRAND_OVERRIDE_KEYS) {
    const v = theme.overrides?.[k]
    if (v !== undefined && !isHex(v)) issues.push({ field: `overrides.${k}`, message: "Debe ser un color #RRGGBB válido." })
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
  check("colors.secondary", c.secondary, c.bg, 3, "Color secundario sobre fondo")
  check("colors.secondary", c.secondary, c.surface, 3, "Color secundario sobre superficie")
  check("colors.accent", c.accent, c.surface, 3, "Color de acción sobre superficie")
  check("colors.primary", c.primary, c.surface, 3, "Color principal sobre superficie")

  // Derivados fijados a mano: cada pareja contra el fondo en que se pinta.
  const ov = theme.overrides
  if (ov) {
    const base = { ...theme, overrides: undefined }
    const activeBg = ov.sidebarActiveBg ?? themeToCssVars(base)["--sidebar-active-bg"]
    const headerBg = ov.headerBg ?? c.surface
    if (ov.sidebarText) check("overrides.sidebarText", ov.sidebarText, c.sidebarBg, 4.5, "Texto del sidebar sobre su fondo")
    if (ov.sidebarActiveBg) check("overrides.sidebarActiveBg", ov.sidebarActiveBg, c.sidebarBg, 3, "Ítem activo sobre el sidebar")
    if (ov.sidebarActiveText) check("overrides.sidebarActiveText", ov.sidebarActiveText, activeBg, 4.5, "Texto del ítem activo")
    if (ov.headerText) check("overrides.headerText", ov.headerText, headerBg, 4.5, "Texto del encabezado")
    if (ov.textSecondary) {
      check("overrides.textSecondary", ov.textSecondary, c.bg, 4.5, "Texto secundario sobre fondo")
      check("overrides.textSecondary", ov.textSecondary, c.surface, 4.5, "Texto secundario sobre superficie")
    }
  }
  // Red final: lo que el motor emite debe cumplir el contrato completo.
  for (const p of auditCssVars(themeToCssVars(theme))) {
    issues.push({ field: "theme", message: `${p.fg} sobre ${p.bg}: ${p.ratio.toFixed(2)}:1 (mínimo ${p.min}:1).` })
  }
  return { ok: issues.length === 0, issues }
}

/** Devuelve un tema con los colores ajustados (conservando matiz) para cumplir los mínimos. */
export function autoFixTheme(input: BrandTheme): BrandTheme {
  const theme = normalizeTheme(input)
  const c = { ...theme.colors }
  c.text = ensureContrastAll(c.text, [c.bg, c.surface], 4.5)
  c.secondary = ensureContrastAll(c.secondary, [c.bg, c.surface], 3)
  c.accent = ensureContrast(c.accent, c.surface, 3)
  c.primary = ensureContrast(c.primary, c.surface, 3)
  const out: BrandTheme = { ...theme, colors: c }
  const ov = theme.overrides
  if (ov) {
    const o: BrandOverrides = { ...ov }
    if (o.sidebarText) o.sidebarText = ensureContrast(o.sidebarText, c.sidebarBg, 4.5)
    if (o.sidebarActiveBg) o.sidebarActiveBg = ensureContrast(o.sidebarActiveBg, c.sidebarBg, 3)
    if (o.sidebarActiveText) {
      const abg = o.sidebarActiveBg ?? themeToCssVars({ ...out, overrides: undefined })["--sidebar-active-bg"]
      o.sidebarActiveText = ensureContrast(o.sidebarActiveText, abg, 4.5)
    }
    if (o.headerText) o.headerText = ensureContrast(o.headerText, o.headerBg ?? c.surface, 4.5)
    if (o.textSecondary) o.textSecondary = ensureContrastAll(o.textSecondary, [c.bg, c.surface], 4.5)
    out.overrides = o
  }
  return out
}
