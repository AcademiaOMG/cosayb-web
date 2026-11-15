"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { fetchAPI } from "@/lib/api"
import { getActiveOrgId } from "@/lib/activeOrg"
import { BRANDING_EVENT, DEFAULT_BRANDING, brandingStyle, resolveBranding } from "@/lib/branding/resolve"
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
 * cliente: (1) con la organización activa (X-Organization-Id), que puede diferir
 * de la que vio el SSR, y (2) tras cambios hechos en el editor (evento
 * BRANDING_EVENT). Sin SWR a propósito (ver resolve.ts). El <style id="brand-theme">
 * del SSR lo pinta el layout; aquí solo se actualiza si el cliente obtiene otra versión.
 */
export default function BrandProvider({ initial, children }: { initial: BrandingResponse; children: React.ReactNode }) {
  const [brand, setBrand] = useState<BrandingResponse>(initial)

  useEffect(() => {
    const onChange = (e: Event) => setBrand((e as CustomEvent<BrandingResponse>).detail)
    window.addEventListener(BRANDING_EVENT, onChange)
    return () => window.removeEventListener(BRANDING_EVENT, onChange)
  }, [])

  useEffect(() => {
    // Solo si hay org activa elegida (multi-org); si falla, se conserva lo actual.
    if (!getActiveOrgId()) return
    let cancelled = false
    fetchAPI<unknown>("/api/v1/organizations/me/branding")
      .then((r) => { if (!cancelled) setBrand(resolveBranding(r, API_BASE_URL)) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const value = useMemo(() => toValue(brand), [brand])

  useEffect(() => {
    if (brand !== initial) applyStyle(brandingStyle(brand))
  }, [brand, initial])

  useEffect(() => {
    if (brand.enabled) applyFavicon(brand.assets.icon)
  }, [brand])

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}
