"use client"

import { useEffect } from "react"
import { reportError } from "@/lib/monitoring"

/** Captura errores no controlados del navegador (solo actúa si hay NEXT_PUBLIC_SENTRY_DSN). */
export default function MonitoringInit() {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return
    const onError = (e: ErrorEvent) => reportError(e.error ?? e.message, { where: "window.onerror" })
    const onRejection = (e: PromiseRejectionEvent) => reportError(e.reason, { where: "unhandledrejection" })
    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])
  return null
}
