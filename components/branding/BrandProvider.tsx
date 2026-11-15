"use client"

import { createContext, useContext, useEffect, useMemo } from "react"
import useSWR from "swr"
import { fetchAPI } from "@/lib/api"
import { getActiveOrgId } from "@/lib/activeOrg"
import { BRANDING_SWR_KEY, DEFAULT_BRANDING, brandingStyle, resolveBranding } from "@/lib/branding/resolve"
import { DEFAULT_BRAND_THEME, type BrandTheme, type BrandingResponse } from "@/lib/branding/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

export interface BrandValue {
  enabled: boolean
  displayName: string | null
  logoPrimary: string | null
  logoAlt: string | null
  icon: string | null
  /** Tema efectivo (el de marca si está activa; si no, el equivalente al actual). */
  theme: BrandTheme
  version: number
}

function toValue(b: BrandingResponse): BrandValue {
  return {
    enabled: b.enabled,
    displayName: b.displayName,
    logoPrimary: b.assets.logoPrimary,
    logoAlt: b.assets.logoAlt,
    icon: b.assets.icon,
    theme: b.enabled && b.theme ? b.theme : DEFAULT_BRAND_THEME,
    version: b.version,
  }
}

const BrandContext = createContext<BrandValue>(toValue(DEFAULT_BRANDING))

/** Marca del negocio activo. Fuera del provider (o sin marca) devuelve los valores por defecto. */
export function useBrand(): BrandValue {
  return useContext(BrandContext)
}

function applyStyle(css: string | null) {
  let el = document.getElementById("brand-theme") as HTMLStyleElement | null
  if (!css) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement("style")
    el.id = "brand-theme"
    document.body.appendChild(el)
  }
  if (el.textContent !== css) el.textContent = css
}

function applyFavicon(href: string | null) {
  if (!href) return
  document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((l) => l.remove())
  const link = document.createElement("link")
  link.rel = "icon"
  link.href = href
  document.head.appendChild(link)
}

/**
 * Recibe la marca resuelta en el servidor (sin parpadeo) y la reconcilia en el
 * cliente con la organización activa (X-Organization-Id) y tras cambios del
 * editor (mutate(BRANDING_SWR_KEY)). El <style id="brand-theme"> del SSR lo
 * pinta el layout; aquí solo se actualiza si el cliente obtiene otra versión.
 */
export default function BrandProvider({ initial, children }: { initial: BrandingResponse; children: React.ReactNode }) {
  const { data } = useSWR<BrandingResponse>(
    BRANDING_SWR_KEY,
    () => fetchAPI<unknown>("/api/v1/organizations/me/branding").then((r) => resolveBranding(r, API_BASE_URL)),
    {
      fallbackData: initial,
      // Revalida al montar solo si hay org activa elegida (puede diferir de la del SSR); si falla, se conserva lo actual.
      revalidateOnMount: !!getActiveOrgId(),
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  )
  const brand = data ?? initial
  const value = useMemo(() => toValue(brand), [brand])

  useEffect(() => {
    if (brand !== initial) applyStyle(brandingStyle(brand))
  }, [brand, initial])

  useEffect(() => {
    if (brand.enabled) applyFavicon(brand.assets.icon)
  }, [brand])

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}
