"use client"

import { useEffect } from "react"
import useSWR from "swr"
import { usePathname } from "next/navigation"
import { getDashboardSummary, type DashboardSummary } from "@/lib/api"
import { DASHBOARD_SUMMARY_KEY } from "@/lib/onboarding"

export { useRevalidateOnboarding } from "./useRevalidateOnboarding"

/**
 * Checklist de onboarding respaldado por GET /api/v1/dashboard/summary
 * (checklist derivado de conteos reales, sin campos en DB).
 *
 * La clave es compartida: Sidebar y chip móvil leen la misma caché.
 * Revalida en cada cambio de ruta como red de seguridad; la actualización
 * inmediata al crear/borrar viene de useRevalidateOnboarding() en los
 * flujos de inventario, recetas y menús.
 */
export function useOnboardingChecklist() {
  const pathname = usePathname()
  const swr = useSWR<DashboardSummary>(
    DASHBOARD_SUMMARY_KEY,
    () => getDashboardSummary().then((r) => r.data),
    { revalidateOnFocus: false },
  )
  const { mutate } = swr

  useEffect(() => {
    void mutate()
  }, [pathname, mutate])

  return swr
}
