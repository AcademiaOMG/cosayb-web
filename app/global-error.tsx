"use client"

import { useEffect } from "react"
import { reportError } from "@/lib/monitoring"

/** Último recurso: falla del layout raíz. Debe incluir su propio <html> y <body>. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError(error, { where: "app/global-error.tsx", digest: error.digest })
  }, [error])

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#F5F0E8", color: "#12213A" }}>
        <main style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1 style={{ fontSize: 24, marginBottom: 8 }}>Algo salió mal</h1>
            <p style={{ fontSize: 14, color: "#4A4438", marginBottom: 16 }}>
              Ocurrió un error inesperado. Intenta de nuevo; si persiste, escríbenos a soporte@academiaomg.com.
            </p>
            {error.digest && <p style={{ fontSize: 12, fontFamily: "monospace", color: "#7A6E60" }}>Código: {error.digest}</p>}
            <button
              onClick={reset}
              style={{ marginTop: 16, background: "#1B4FD8", color: "#fff", border: 0, borderRadius: 12, padding: "12px 20px", fontWeight: 600, cursor: "pointer" }}
            >
              Intentar de nuevo
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
