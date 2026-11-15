import { cssVarsToStyleString, isHex, normalizeTheme, themeToCssVars } from "./theme"
import type { BrandAssetKind, BrandTheme, BrandingResponse } from "./types"

/** Estado sin marca: la app se ve exactamente como hoy. */
export const DEFAULT_BRANDING: BrandingResponse = {
  enabled: false,
  version: 0,
  theme: null,
  assets: { logoPrimary: null, logoAlt: null, icon: null },
  displayName: null,
}

export const DEFAULT_BRAND_NAME = "ACADEMIA OMG"
export const BRANDING_SWR_KEY = "branding"

const KINDS: BrandAssetKind[] = ["logoPrimary", "logoAlt", "icon"]

function resolveAssetUrl(value: unknown, apiBase: string): string | null {
  if (typeof value !== "string" || !value) return null
  // Solo rutas del propio API (relativas) o URLs https; nunca javascript:/data:.
  if (value.startsWith("/api/")) return `${apiBase.replace(/\/$/, "")}${value}`
  if (/^https:\/\//i.test(value)) return value
  return null
}

/**
 * Convierte la respuesta cruda del API en un BrandingResponse seguro. Cualquier
 * forma inesperada cae al estado por defecto (la app nunca se rompe por la marca).
 */
export function resolveBranding(raw: unknown, apiBase = ""): BrandingResponse {
  try {
    const r = (raw as { data?: unknown } | null)?.data ?? raw
    if (!r || typeof r !== "object") return DEFAULT_BRANDING
    const o = r as Record<string, unknown>
    if (o.enabled !== true) return { ...DEFAULT_BRANDING, version: typeof o.version === "number" ? o.version : 0 }

    const t = o.theme as Partial<BrandTheme> | null | undefined
    const theme = t && typeof t === "object" && t.colors && isHex((t.colors as unknown as Record<string, unknown>).accent)
      ? normalizeTheme(t)
      : null
    const a = (o.assets ?? {}) as Record<string, unknown>
    const assets = Object.fromEntries(KINDS.map((k) => [k, resolveAssetUrl(a[k], apiBase)])) as Record<BrandAssetKind, string | null>
    const name = typeof o.displayName === "string" ? o.displayName.trim().slice(0, 60) : ""
    return {
      enabled: true,
      version: typeof o.version === "number" ? o.version : 0,
      theme,
      assets,
      displayName: name || null,
    }
  } catch {
    return DEFAULT_BRANDING
  }
}

const styleCache = new Map<string, string>()

/** CSS del tema de marca (`:root,.app-theme-neutral{...}`) o null si no hay marca activa. Memoizado por versión+tema. */
export function brandingStyle(b: BrandingResponse): string | null {
  if (!b.enabled || !b.theme) return null
  const key = `${b.version}:${JSON.stringify(b.theme)}`
  let css = styleCache.get(key)
  if (!css) {
    css = cssVarsToStyleString(themeToCssVars(b.theme))
    if (styleCache.size > 50) styleCache.clear()
    styleCache.set(key, css)
  }
  return css
}
