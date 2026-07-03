// ─── Contexto de superficie y organización activa ────────────────────────────
//
// Cosayb es un conjunto de superficies de producto separadas:
//   - "tenant":   Restaurant Tenant Workspace (roles org_*)
//   - "platform": Platform Console (/plataforma/*, roles platform_*)
//
// Estas utilidades persisten la organización activa (enviada como header
// X-Organization-Id por el cliente API) y la última superficie usada
// (para el landing post-login).

export type Surface = "tenant" | "platform"

const ORG_KEY = "cosayb.activeOrg"
const SURFACE_KEY = "cosayb.surface"

export function getActiveOrgId(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(ORG_KEY)
}

export function setActiveOrgId(orgId: string | null): void {
  if (typeof window === "undefined") return
  if (orgId) window.localStorage.setItem(ORG_KEY, orgId)
  else window.localStorage.removeItem(ORG_KEY)
}

export function getLastSurface(): Surface | null {
  if (typeof window === "undefined") return null
  const v = window.localStorage.getItem(SURFACE_KEY)
  return v === "tenant" || v === "platform" ? v : null
}

export function setLastSurface(surface: Surface): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(SURFACE_KEY, surface)
}

/**
 * Cambio de superficie = cambio de aplicación: recarga el shell completo.
 */
export function switchSurface(surface: Surface): void {
  setLastSurface(surface)
  window.location.href = surface === "platform" ? "/plataforma" : "/dashboard"
}
