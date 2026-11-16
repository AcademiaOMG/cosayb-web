"use client"

import { useCallback, useEffect, useState } from "react"
import { getBranding } from "./editorApi"
import { BRANDING_EVENT } from "./resolve"
import type { BrandingResponse } from "./types"

/**
 * Estado de la marca para el editor, SIN SWR a propósito.
 *
 * SWRProvider persiste el caché en localStorage y lo cambia después de hidratar:
 * el resultado del primer fetch se pierde en el caché descartado y la pantalla se
 * queda con el dato obsoleto guardado (p. ej. `enabled:false`) hasta que se
 * remonte, lo que dejaba el editor bloqueado aunque el plan ya incluyera la marca.
 * Aquí el dato siempre viene de la API al montar y se mantiene sincronizado con
 * los cambios hechos en esta pestaña (evento brand:changed).
 */
export function useBrandingData() {
  const [data, setData] = useState<BrandingResponse | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [isLoading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setData(await getBranding())
      setError(null)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Carga inicial: el setState ocurre en los callbacks (no síncrono en el efecto).
  useEffect(() => {
    let cancelled = false
    getBranding()
      .then((b) => {
        if (cancelled) return
        setData(b)
        setError(null)
      })
      .catch((e) => {
        if (!cancelled) setError(e)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onChange = (e: Event) => setData((e as CustomEvent<BrandingResponse>).detail)
    window.addEventListener(BRANDING_EVENT, onChange)
    return () => window.removeEventListener(BRANDING_EVENT, onChange)
  }, [])

  /** Sin argumento vuelve a pedir la marca a la API; con argumento fija el dato ya conocido. */
  const mutate = useCallback(
    async (next?: BrandingResponse) => {
      if (next) {
        setData(next)
        return next
      }
      await load()
      return undefined
    },
    [load],
  )

  return { data, error, isLoading, mutate }
}
