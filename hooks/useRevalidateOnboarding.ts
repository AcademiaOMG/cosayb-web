"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { DASHBOARD_SUMMARY_KEY } from "@/lib/onboarding"

/**
 * Devuelve un callback que revalida el checklist al instante desde cualquier
 * flujo que cree o borre inventario, recetas o menús (sin depender de la
 * navegación).
 *
 * OJO: hay que usar `mutate` de `useSWRConfig()`, NUNCA el `mutate` importado
 * de "swr". Ese export está ligado al cache por defecto (un Map sin datos ni
 * revalidators — ver initCache(new Map()) en swr), mientras que los hooks de
 * la app corren sobre el provider con localStorage de SWRProvider: el mutate
 * global era un no-op y el progreso solo se actualizaba al navegar de ruta.
 */
export function useRevalidateOnboarding() {
  const { mutate } = useSWRConfig()
  return useCallback(() => {
    void mutate(DASHBOARD_SUMMARY_KEY)
  }, [mutate])
}
