"use client"

import useSWR from "swr"
import { getCurrentPlan } from "@/lib/api"

/**
 * Estado del plan de la organización activa: periodo gratuito de Free y solo lectura.
 * Comparte la clave SWR "current-plan" con /planes y configuración/membresía.
 */
export function usePlanStatus() {
  const { data, isLoading } = useSWR(
    "current-plan",
    () => getCurrentPlan().then((r) => r.data).catch(() => null),
    { revalidateOnFocus: false },
  )
  return {
    plan: data ?? null,
    isLoading,
    readOnly: data?.readOnly === true,
    freePeriodDaysLeft: data?.freePeriodDaysLeft ?? null,
  }
}
