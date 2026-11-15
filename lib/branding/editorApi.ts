import { fetchAPI } from "@/lib/api"
import { BRANDING_SWR_KEY, resolveBranding } from "./resolve"
import type { BrandAssetKind, BrandingResponse, BrandTheme } from "./types"

// Misma clave SWR que usa BrandProvider: así guardar desde el editor (mutate)
// refresca también el tema aplicado a la app, sin recargar.
export { BRANDING_SWR_KEY }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

/** Respuesta cruda del API ({ data: BrandingResponse }) → BrandingResponse saneado con URLs absolutas. */
const resolve = (raw: unknown): BrandingResponse => resolveBranding(raw, API_BASE_URL)

export function getBranding(): Promise<BrandingResponse> {
  return fetchAPI<unknown>("/api/v1/organizations/me/branding").then(resolve)
}

export function saveBranding(payload: { theme: BrandTheme; displayName?: string }): Promise<BrandingResponse> {
  return fetchAPI<unknown>("/api/v1/organizations/me/branding", {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then(resolve)
}

/** El API recibe el archivo como cuerpo binario crudo (no multipart), con el MIME como Content-Type. */
export function uploadBrandAsset(kind: BrandAssetKind, file: File): Promise<BrandingResponse> {
  return fetchAPI<unknown>(`/api/v1/organizations/me/branding/assets?kind=${encodeURIComponent(kind)}`, {
    method: "POST",
    body: file,
    headers: { "Content-Type": file.type },
  }).then(resolve)
}

export function deleteBrandAsset(kind: BrandAssetKind): Promise<BrandingResponse> {
  return fetchAPI<unknown>(`/api/v1/organizations/me/branding/assets/${kind}`, { method: "DELETE" }).then(resolve)
}

/** URL absoluta de un asset (el API puede devolver rutas relativas) con cache-bust por versión. */
export function assetUrl(url: string | null, version: number): string | null {
  if (!url) return null
  const abs = url.startsWith("/") ? `${API_BASE_URL}${url}` : url
  if (abs.startsWith("data:")) return abs
  return `${abs}${abs.includes("?") ? "&" : "?"}v=${version}`
}
