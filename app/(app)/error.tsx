"use client"

import { useEffect } from "react"
import Button from "@/components/ui/Button"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 text-center">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
        Algo salió mal
      </h2>
      <p className="text-sm max-w-md" style={{ color: "var(--text-muted)" }}>
        {error.message || "Ocurrió un error inesperado. Intenta de nuevo."}
      </p>
      {error.digest && (
        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
          Error ID: {error.digest}
        </p>
      )}
      <Button variant="primary" onClick={reset}>
        Intentar de nuevo
      </Button>
    </div>
  )
}
