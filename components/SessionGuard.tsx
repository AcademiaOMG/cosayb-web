"use client"

import { useEffect } from "react"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

/**
 * Guard contra el bypass de autenticación por botón "atrás".
 *
 * Tras cerrar sesión, el navegador puede restaurar la página autenticada
 * desde el bfcache (back-forward cache) SIN tocar el servidor — el proxy
 * nunca corre y la vista aparece "logueada". Este guard re-valida la sesión
 * contra el backend cuando la página se restaura desde bfcache y expulsa
 * a /login si ya no hay sesión.
 */
export default function SessionGuard() {
  useEffect(() => {
    let checking = false

    async function verifySession() {
      if (checking) return
      checking = true
      try {
        const res = await fetch(`${API}/api/v1/me`, {
          credentials: "include",
          cache: "no-store",
        })
        if (res.status === 401) {
          window.location.replace("/login")
        }
      } catch {
        // Red caída — no expulsar al usuario por un fallo transitorio
      } finally {
        checking = false
      }
    }

    // pageshow con persisted=true ⇒ restaurada desde bfcache
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void verifySession()
    }
    // Al volver a la pestaña después de un rato, re-validar también
    const onVisible = () => {
      if (document.visibilityState === "visible") void verifySession()
    }

    window.addEventListener("pageshow", onPageShow)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.removeEventListener("pageshow", onPageShow)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])

  return null
}
