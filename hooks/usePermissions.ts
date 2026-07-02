"use client"

import useSWR from "swr"
import { getMyPermissions, type Resource, type Action } from "@/lib/api"

/**
 * Hook: retorna roles y permisos del usuario autenticado.
 *
 * Uso:
 *   const { can, roles, permissions, isLoading } = usePermissions()
 *   if (can("recipes", "create")) { ... }
 */
export function usePermissions() {
  const { data, error, isLoading } = useSWR(
    "auth/permissions",
    () => getMyPermissions().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  const permissions = data?.permissions ?? []
  const roles = data?.roles ?? []
  const isSuperAdmin = roles.includes("super_admin")

  function can(resource: Resource, action: Action): boolean {
    if (isSuperAdmin) return true
    return permissions.includes("*:*") || permissions.includes(`${action}:${resource}`)
  }

  return { roles, permissions, isLoading, error, can }
}
