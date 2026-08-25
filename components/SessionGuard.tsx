"use client"

import { useEffect, useRef, useState } from "react"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
const TAB_LOCK_CHANNEL = "cosayb-tab-lock"

/**
 * Guard de sesión, con tres responsabilidades independientes:
 *
 * 1. Bypass de autenticación por botón "atrás": tras cerrar sesión, el
 *    navegador puede restaurar la página autenticada desde el bfcache
 *    (back-forward cache) SIN tocar el servidor. Re-valida la sesión
 *    contra el backend cuando la página se restaura desde bfcache o
 *    recupera el foco, y expulsa a /login si ya no hay sesión.
 *
 * 2. Concurrencia de sesiones: si el usuario inicia sesión en otro lugar
 *    (otro navegador/dispositivo, otro login), el backend invalida esta
 *    sesión y avisa casi al instante vía Server-Sent Events. Esta pestaña
 *    bloquea la UI con un aviso explícito en vez de expulsar en silencio.
 *
 * 3. Bloqueo de pestañas duplicadas del MISMO login: dos pestañas del
 *    mismo navegador comparten la misma cookie de sesión, así que el
 *    backend no las distingue (no hay "otra sesión" que invalidar). Esto
 *    se resuelve 100% en el cliente vía BroadcastChannel: cada pestaña se
 *    anuncia al montar y al recuperar el foco; la que queda en segundo
 *    plano se bloquea con un botón para retomarla ahí mismo.
 */
export default function SessionGuard() {
  const [revokedElsewhere, setRevokedElsewhere] = useState(false)
  const [otherTabActive, setOtherTabActive] = useState(false)
  // Identidad estable de la pestaña, generada UNA sola vez (inicializador
  // perezoso de useState — la forma correcta de generar un valor aleatorio
  // estable en React). Si se generara dentro del efecto, el doble-montaje
  // de Strict Mode en desarrollo (o cualquier remontaje real) crearía un id
  // nuevo en cada corrida — la pestaña terminaría recibiendo su propio
  // mensaje anterior (de la instancia de canal ya cerrada) como si viniera
  // de otra pestaña, y se autobloquearía.
  const [tabId] = useState(() => Math.random().toString(36).slice(2))
  const channelRef = useRef<BroadcastChannel | null>(null)

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

  // ── 3. Bloqueo de pestañas duplicadas del mismo login ───────────────────
  //
  // A propósito NO reclama al recuperar el foco (visibilitychange): si lo
  // hiciera, el simple hecho de hacer clic en la pestaña bloqueada para
  // revisarla ya la desbloquearía sola, antes de que el usuario llegue a
  // verlo sostenido — el bloqueo se volvería imperceptible. Solo el botón
  // explícito "Usar la app en esta pestaña" (reclaimTab) puede reclamar.
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return // navegador muy viejo: sin bloqueo de pestañas

    const channel = new BroadcastChannel(TAB_LOCK_CHANNEL)
    channelRef.current = channel

    channel.onmessage = (e) => {
      if (e.data?.tabId === tabId) return
      // Otra pestaña se anunció como activa: esta pasa a segundo plano.
      setOtherTabActive(true)
    }

    // Al montar, esta pestaña se anuncia como la activa (el estado ya
    // arranca en false, no hace falta reafirmarlo aquí).
    channel.postMessage({ tabId })

    return () => {
      channel.close()
      channelRef.current = null
    }
  }, [tabId])

  function reclaimTab() {
    channelRef.current?.postMessage({ tabId })
    setOtherTabActive(false)
  }

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

  if (otherTabActive) {
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
            CO$AYB está abierto en otra pestaña
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Para evitar conflictos, solo una pestaña puede estar activa a la vez.
          </p>
          <button onClick={reclaimTab} className="btn-spx btn-spx-accent">
            Usar la app en esta pestaña
          </button>
        </div>
      </div>
    )
  }

  return null
}
