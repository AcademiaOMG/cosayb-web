"use client"

import { useEffect, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

/**
 * Guard de sesión, con dos responsabilidades independientes:
 *
 * 1. Bypass de autenticación por botón "atrás": tras cerrar sesión, el
 *    navegador puede restaurar la página autenticada desde el bfcache
 *    (back-forward cache) SIN tocar el servidor. Re-valida la sesión
 *    contra el backend cuando la página se restaura desde bfcache o
 *    recupera el foco, y expulsa a /login si ya no hay sesión.
 *
 * 2. Concurrencia de sesiones: si el usuario inicia sesión en otro lugar
 *    (otro navegador/dispositivo), el backend invalida esta sesión y
 *    avisa casi al instante vía Server-Sent Events. Esta pestaña bloquea
 *    la UI con un aviso explícito en vez de expulsar en silencio.
 */
export default function SessionGuard() {
  const [revokedElsewhere, setRevokedElsewhere] = useState(false)

  // ── 1. Bypass por bfcache (comportamiento existente, sin cambios) ──────
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

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void verifySession()
    }
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

  // ── 2. Concurrencia de sesiones vía SSE ─────────────────────────────────
  useEffect(() => {
    let cancelled = false
    let source: EventSource | null = null
    let retryDelay = 1000
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    function connect() {
      if (cancelled) return
      source = new EventSource(`${API}/auth/session-events`, { withCredentials: true })

      source.addEventListener("session-revoked", () => {
        setRevokedElsewhere(true)
        cancelled = true // ya no tiene sentido reconectar: esta sesión murió
        source?.close()
      })

      source.onopen = () => {
        retryDelay = 1000 // conexión sana de nuevo: resetea el backoff
      }

      source.onerror = () => {
        source?.close()
        if (cancelled) return
        // Un corte de red o un redeploy del backend NO se interpreta como
        // revocación — solo el evento explícito session-revoked la dispara.
        // Reintenta indefinidamente con backoff creciente topado en 30s.
        retryDelay = Math.min(retryDelay * 2, 30_000)
        retryTimer = setTimeout(connect, retryDelay)
      }
    }

    connect()

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      source?.close()
    }
  }, [])

  if (revokedElsewhere) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-6"
        style={{ background: "rgba(10,21,32,0.92)" }}
      >
        <div
          className="max-w-sm w-full rounded-2xl p-8 text-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
        >
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Tu sesión se cerró
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Iniciaste sesión en otro lugar, así que cerramos esta sesión por seguridad.
          </p>
          <button
            onClick={() => window.location.replace("/login")}
            className="btn-spx btn-spx-accent"
          >
            Ir a iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  return null
}
