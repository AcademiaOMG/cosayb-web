"use client"

import { useEffect } from "react"

/**
 * Avisa antes de que el usuario abandone el checkout con progreso sin confirmar.
 * Cubre recarga / cierre de pestaña (beforeunload). La confirmación de
 * navegación interna la maneja <ExitConfirm> con un modal propio.
 */
export function useBeforeUnloadGuard(active: boolean) {
  useEffect(() => {
    if (!active) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [active])
}
