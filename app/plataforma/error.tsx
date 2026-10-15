"use client"

import { useEffect } from "react"
import ErrorState from "@/components/ui/ErrorState"
import { reportError } from "@/lib/monitoring"

export default function PlataformaError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Error en la plataforma:", error)
    reportError(error, { where: "app/plataforma/error.tsx", digest: error.digest })
  }, [error])

  return (
    <ErrorState
      title="Algo salió mal en esta página"
      description="No pudimos mostrar esta sección. Inténtalo de nuevo; si sigue fallando, avisa al equipo técnico."
      onRetry={reset}
    />
  )
}
