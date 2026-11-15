import { fetchAPI } from "@/lib/api"
import type { BrandAssetKind, BrandingResponse, BrandTheme } from "./types"

export const BRANDING_SWR_KEY = "organization-branding"

/** El API puede responder el objeto directo o envuelto en { data }. */
function unwrap(res: BrandingResponse | { data: BrandingResponse }): BrandingResponse {
  return "data" in res && res.data ? res.data : (res as BrandingResponse)
}

export function getBranding(): Promise<BrandingResponse> {
  return fetchAPI<BrandingResponse | { data: BrandingResponse }>("/api/v1/organizations/me/branding").then(unwrap)
}

export function saveBranding(payload: { theme: BrandTheme; displayName?: string }): Promise<BrandingResponse> {
  return fetchAPI<BrandingResponse | { data: BrandingResponse }>("/api/v1/organizations/me/branding", {
    method: "PUT",
    body: JSON.stringify(payload),
  }).then(unwrap)
}

export function uploadBrandAsset(kind: BrandAssetKind, file: File): Promise<unknown> {
  const body = new FormData()
  body.append("kind", kind)
  body.append("file", file)
  return fetchAPI("/api/v1/organizations/me/branding/assets", { method: "POST", body })
}

export function deleteBrandAsset(kind: BrandAssetKind): Promise<unknown> {
  return fetchAPI(`/api/v1/organizations/me/branding/assets/${kind}`, { method: "DELETE" })
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

/** URL absoluta de un asset (el API puede devolver rutas relativas) con cache-bust por versión. */
export function assetUrl(url: string | null, version: number): string | null {
  if (!url) return null
  const abs = url.startsWith("/") ? `${API_BASE}${url}` : url
  if (abs.startsWith("data:")) return abs
  return `${abs}${abs.includes("?") ? "&" : "?"}v=${version}`
}
