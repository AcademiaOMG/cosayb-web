"use client"

import { usePermissions } from "@/hooks/usePermissions"
import { NAV_GROUPS, type NavGroup } from "@/lib/navigation"

/**
 * Ítems de navegación visibles para el usuario actual: un módulo requiere
 * permiso de rol Y feature de membresía habilitada. Mientras carga el
 * contexto se muestran todos (evita parpadeo de estructura).
 */
export function useNavItems(): { groups: NavGroup[]; showConfig: boolean; isLoading: boolean } {
  const { can, hasFeature, isLoading } = usePermissions()

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: isLoading
      ? group.items
      : group.items.filter((i) => can(i.resource, i.action) && (!i.feature || hasFeature(i.feature))),
  })).filter((group) => group.items.length > 0)

  const showConfig = !isLoading && (can("organization", "update") || can("members", "list"))

  return { groups, showConfig, isLoading }
}
