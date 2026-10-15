"use client"

import Link from "next/link"
import { useEffect, useState, useSyncExternalStore } from "react"
import { Cookie } from "lucide-react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import {
  OPEN_PREFERENCES_EVENT, getConsent, getServerConsent, setConsent, subscribeConsent,
} from "@/lib/consent"

/**
 * Banner de cookies (montado una sola vez en el layout raíz). Se muestra hasta
 * que haya una decisión; las preferencias pueden reabrirse con
 * `openCookiePreferences()` (enlace del pie de página).
 */
export default function CookieBanner() {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, getServerConsent)
  const [mounted, setMounted] = useState(false)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [analytics, setAnalytics] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    const open = () => {
      setAnalytics(getConsent()?.analytics ?? false)
      setPrefsOpen(true)
    }
    window.addEventListener(OPEN_PREFERENCES_EVENT, open)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener(OPEN_PREFERENCES_EVENT, open)
    }
  }, [])

  if (!mounted) return null

  return (
    <>
      {!consent && !prefsOpen && (
        <div
          role="region"
          aria-label="Aviso de cookies"
          className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center"
          style={{
            background: "var(--bg-surface, #fff)",
            border: "1px solid var(--border-light, #E2E5EA)",
            boxShadow: "var(--shadow-lg, 0 12px 32px rgba(18,33,58,0.18))",
          }}
        >
          <Cookie size={22} aria-hidden="true" className="hidden sm:block shrink-0" style={{ color: "var(--accent, #1B4FD8)" }} />
          <p className="flex-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary, #4B5563)" }}>
            Usamos cookies necesarias para que la plataforma funcione y, si lo permites, cookies de medición para
            mejorarla. Más en la{" "}
            <Link href="/cookies" className="underline" style={{ color: "var(--accent, #1B4FD8)" }}>
              política de cookies
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            <Button variant="ghost" size="sm" onClick={() => { setAnalytics(false); setPrefsOpen(true) }}>
              Personalizar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConsent(false)}>
              Solo necesarias
            </Button>
            <Button size="sm" onClick={() => setConsent(true)}>
              Aceptar todas
            </Button>
          </div>
        </div>
      )}

      <Modal open={prefsOpen} onClose={() => setPrefsOpen(false)} title="Preferencias de cookies">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Necesarias</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Sesión, seguridad, organización activa y esta preferencia. Siempre activas.
              </p>
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Siempre</span>
          </div>
          <label className="flex items-start justify-between gap-4 cursor-pointer">
            <span>
              <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Medición</span>
              <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                Datos agregados de uso para mejorar el producto. Opcional.
              </span>
            </span>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="mt-1 h-5 w-5 shrink-0"
              aria-label="Permitir cookies de medición"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setPrefsOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                setConsent(analytics)
                setPrefsOpen(false)
              }}
            >
              Guardar preferencias
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
