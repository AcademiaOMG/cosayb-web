// Persiste la organización activa (multi-org) enviada como header
// X-Organization-Id por el cliente API.

const ORG_KEY = "cosayb.activeOrg"

export function getActiveOrgId(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(ORG_KEY)
}

export function setActiveOrgId(orgId: string | null): void {
  if (typeof window === "undefined") return
  if (orgId) window.localStorage.setItem(ORG_KEY, orgId)
  else window.localStorage.removeItem(ORG_KEY)
}
