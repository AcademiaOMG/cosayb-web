import { cache } from "react"
import { DEFAULT_BRANDING, resolveBranding } from "./resolve"
import type { BrandingResponse } from "./types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
const TIMEOUT_MS = 2000

/**
 * Obtiene la marca de la organización activa en el servidor, reenviando la
 * cookie de sesión del navegador. Tolerante a fallos: ante cualquier error,
 * timeout o `enabled=false` devuelve la marca por defecto (la app nunca se
 * rompe). Se deduplica por request con React cache(); la respuesta depende de
 * la sesión, por eso no se comparte entre usuarios (no-store).
 *
 * Nota: el servidor no conoce la org activa elegida en el cliente (vive en
 * localStorage), así que usa la org por defecto del usuario; BrandProvider
 * reconcilia en el cliente si la activa es otra.
 */
export const getServerBranding = cache(async (): Promise<BrandingResponse> => {
  try {
    const { cookies } = await import("next/headers")
    const cookieHeader = (await cookies()).toString()
    if (!cookieHeader) return DEFAULT_BRANDING
    const res = await fetch(`${API_BASE_URL}/api/v1/organizations/me/branding`, {
      headers: { cookie: cookieHeader, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return DEFAULT_BRANDING
    return resolveBranding(await res.json(), API_BASE_URL)
  } catch {
    return DEFAULT_BRANDING
  }
})
