"use client"

import { useEffect, useRef, useState } from "react"
import { authClient } from "@/lib/auth"
import { createIdleTracker } from "@/lib/sessionIdle"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
const TAB_LOCK_CHANNEL = "cosayb-tab-lock"

/** Inactividad (sin tocar la app) tras la cual se cierra la sesión. Debe ser menor que SESSION_IDLE_MINUTES + 10 de la API. */
const IDLE_MS = (Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES) > 0 ? Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES) : 120) * 60_000
/** Mientras haya actividad, se avisa a la API para renovar la sesión como mucho cada tanto. */
const KEEPALIVE_MS = 5 * 60_000
const ACTIVITY_KEY = "cosayb-last-activity"

/**
 * Sale hacia /login limpiando ANTES la cookie de sesión huérfana. Sin esto,
 * la cookie obsoleta seguía pareciendo "válida" (cookieCache de Better Auth)
 * y /login devolvía al usuario al dashboard → bucle (ver lib/authRedirect.ts).
 */
/** Por qué se sale: cada motivo muestra un aviso distinto en /login (así se sabe qué pasó). */
type LeaveReason = "idle" | "invalid" | null

async function leaveToLogin(reason: LeaveReason) {
  try {
    await authClient.signOut()
  } catch {
    // ya no hay sesión que cerrar
  }
  window.location.replace(reason ? `/login?expired=${reason}` : "/login")
}

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
 * 3. Inactividad: la sesión se cierra tras IDLE_MS sin que la persona toque la
 *    app (clics, teclas, scroll, toques). La última actividad se guarda en
 *    localStorage para que valga entre pestañas y recargas. Mientras hay
 *    actividad, se renueva la sesión en el servidor (ventana deslizante), así
 *    que usar la app NUNCA la hace caducar.
 *
 * 4. Bloqueo de pestañas duplicadas del MISMO login: dos pestañas del
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
          await leaveToLogin("invalid")
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

  // ── 3. Cierre por inactividad ───────────────────────────────────────────
  // La lógica vive en lib/sessionIdle.ts (probada en sessionIdle.test.ts); aquí solo se conecta al navegador.
  useEffect(() => {
    const tracker = createIdleTracker({
      idleMs: IDLE_MS,
      keepAliveMs: KEEPALIVE_MS,
      now: () => Date.now(),
      storage: {
        get: () => {
          try {
            return Number(localStorage.getItem(ACTIVITY_KEY)) || null
          } catch {
            return null
          }
        },
        set: (v) => {
          try {
            localStorage.setItem(ACTIVITY_KEY, String(v))
          } catch {
            // sin almacenamiento: queda el contador en memoria de esta pestaña
          }
        },
      },
      // Va por el proxy de Next (/api/auth), no directo a la API: así la cookie renovada queda en
      // el navegador. disableCookieCache fuerza leer la BD, que es donde se decide renovar.
      ping: () => {
        fetch("/api/auth/get-session?disableCookieCache=true", { credentials: "include", cache: "no-store" }).catch(() => {})
      },
      onExpire: () => void leaveToLogin("idle"),
    })

    const onActivity = () => tracker.activity()
    const events = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true, capture: true }))
    const onVisible = () => {
      if (document.visibilityState === "visible") tracker.check()
    }
    document.addEventListener("visibilitychange", onVisible)
    const timer = setInterval(() => tracker.check(), 30_000)

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, onActivity, { capture: true }))
      document.removeEventListener("visibilitychange", onVisible)
      clearInterval(timer)
    }
  }, [])

  // ── 4. Bloqueo de pestañas duplicadas del mismo login ───────────────────
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-guard-title-1"
        className="modal-overlay-in fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto"
        style={{ background: "rgba(10,21,32,0.92)" }}
      >
        <div
          className="modal-panel-in max-w-sm w-full rounded-2xl p-8 text-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
        >
          <h2 id="session-guard-title-1" className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Tu sesión se cerró
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Iniciaste sesión en otro lugar, así que cerramos esta sesión por seguridad.
          </p>
          <button
            autoFocus
            onClick={() => void leaveToLogin(null)}
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-guard-title-2"
        className="modal-overlay-in fixed inset-0 z-[100] flex items-center justify-center p-6 overflow-y-auto"
        style={{ background: "rgba(10,21,32,0.92)" }}
      >
        <div
          className="modal-panel-in max-w-sm w-full rounded-2xl p-8 text-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
        >
          <h2 id="session-guard-title-2" className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            CO$AYB está abierto en otra pestaña
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Para evitar conflictos, solo una pestaña puede estar activa a la vez.
          </p>
          <button autoFocus onClick={reclaimTab} className="btn-spx btn-spx-accent">
            Usar la app en esta pestaña
          </button>
        </div>
      </div>
    )
  }

  return null
}
