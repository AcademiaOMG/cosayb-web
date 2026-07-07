"use client"

import useSWR from "swr"
import { getAuthzContext, type Resource, type Action, type AuthzContext } from "@/lib/api"

/**
 * Hook: contexto de autorización del usuario (org activa, roles, permisos,
 * membresía y features). Respaldado por GET /api/v1/me/context.
 *
 * Uso:
 *   const { can, hasFeature, roles, isPlatform, organization } = usePermissions()
 *   if (can("recipes", "create")) { ... }
 *   if (hasFeature("exports")) { ... }
 */
export function usePermissions() {
  const { data, error, isLoading, mutate } = useSWR(
    "me/context",
    () => getAuthzContext().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  const ctx: AuthzContext | undefined = data
  const permissions = ctx?.permissions ?? []
  const roles = ctx?.roles ?? []
  const platformRoles = ctx?.platformRoles ?? []
  const platformPermissions = ctx?.platformPermissions ?? []
  const organization = ctx?.organization ?? null

  /** ¿Tiene el permiso action:resource en la organización activa? */
  function can(resource: Resource, action: Action): boolean {
    return permissions.includes(`${action}:${resource}`)
  }

  /** ¿Tiene el permiso action:resource en el scope PLATAFORMA? */
  function platformCan(resource: string, action: string): boolean {
    return platformPermissions.includes(`${action}:${resource}`)
  }

  /** ¿La membresía de la org activa tiene esta feature habilitada? */
  function hasFeature(key: string): boolean {
    return organization?.features.some((f) => f.key === key && f.enabled) ?? false
  }

  /** Límite numérico de una feature (null = ilimitado, undefined = sin org) */
  function featureLimit(key: string): number | null | undefined {
    return organization?.features.find((f) => f.key === key)?.limit
  }

  return {
    // Datos
    scope: ctx?.scope,
    identityType: ctx?.identityType,
    roles,
    permissions,
    organization,
    memberships: ctx?.memberships ?? [],
    platformRoles,
    platformPermissions,
    impersonation: ctx?.impersonation ?? null,
    // Helpers
    can,
    platformCan,
    hasFeature,
    featureLimit,
    isOwner: roles.includes("org_owner"),
    isPlatform: platformRoles.length > 0,
    hasOrganization: !!organization,
    // Estado
    isLoading,
    error,
    mutate,
  }
}
