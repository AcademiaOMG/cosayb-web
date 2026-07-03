"use client"

import { SWRConfig } from "swr"
import { useMemo } from "react"
import { getActiveOrgId } from "@/lib/surface"

// ═══════════════════════════════════════════════════════════════════════════
// Caché global de datos de Cosayb.
//
// Problema que resuelve: cada navegación mostraba "Cargando…" aunque los
// datos ya se hubieran visto hace segundos. Este provider:
//
//  1. Persiste el caché de SWR en localStorage → al volver a una vista (o
//     recargar la página) los datos aparecen AL INSTANTE desde el caché y
//     se revalidan en segundo plano (patrón stale-while-revalidate).
//  2. Aísla el caché POR ORGANIZACIÓN activa (nunca se pintan datos de otro
//     negocio al cambiar de org).
//  3. Config global: sin revalidación por foco, dedupe de 30s y
//     keepPreviousData para que paginar/filtrar no vacíe la vista.
// ═══════════════════════════════════════════════════════════════════════════

const CACHE_VERSION = "v1"

function cacheKey(): string {
  const org = getActiveOrgId() ?? "sin-org"
  return `cosayb.swr.${CACHE_VERSION}.${org}`
}

function createProvider() {
  return (): Map<string, object> => {
    if (typeof window === "undefined") return new Map()

    let map: Map<string, object>
    try {
      const stored = window.localStorage.getItem(cacheKey())
      map = new Map(stored ? JSON.parse(stored) : [])
    } catch {
      map = new Map()
    }

    const persist = () => {
      try {
        window.localStorage.setItem(
          cacheKey(),
          JSON.stringify(Array.from(map.entries()))
        )
      } catch {
        // localStorage lleno o bloqueado — el caché en memoria sigue funcionando
      }
    }

    window.addEventListener("beforeunload", persist)
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") persist()
    })
    // beforeunload no siempre dispara (dev/hot-reload, cierres bruscos):
    // persistir también periódicamente
    window.setInterval(persist, 4000)

    return map
  }
}

/** Limpia todos los buckets de caché (llamar al cerrar sesión). */
export function clearSWRCache(): void {
  if (typeof window === "undefined") return
  const toRemove: string[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (key?.startsWith("cosayb.swr.")) toRemove.push(key)
  }
  toRemove.forEach((k) => window.localStorage.removeItem(k))
}

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  const provider = useMemo(() => createProvider(), [])

  return (
    <SWRConfig
      value={{
        provider,
        revalidateOnFocus: false,
        revalidateIfStale: true, // pinta el caché y revalida en background
        keepPreviousData: true,
        dedupingInterval: 30_000,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  )
}
