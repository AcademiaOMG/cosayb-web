"use client"

import Link from "next/link"
import { useEffect } from "react"
import { reportError } from "@/lib/monitoring"

/** Error de ruta fuera de la app autenticada (marketing, auth, planes…). */
export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Error de ruta:", error)
    reportError(error, { where: "app/error.tsx", digest: error.digest })
  }, [error])

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F5F0E8] px-4">
      <div className="w-full max-w-md rounded-3xl border border-[#DDD6C8] bg-white p-8 text-center shadow-sm">
        <p className="text-4xl" aria-hidden="true">⚠️</p>
        <h1 className="mt-4 text-2xl font-extrabold text-[#12213A]">Algo salió mal</h1>
        <p className="mt-2 text-sm text-[#4A4438]">
          Tuvimos un problema al cargar esta página. Puedes intentarlo de nuevo o volver al inicio.
        </p>
        {error.digest && <p className="mt-2 font-mono text-xs text-[#7A6E60]">Código: {error.digest}</p>}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={reset} className="rounded-xl bg-[#1B4FD8] px-5 py-3 text-sm font-semibold text-white">
            Intentar de nuevo
          </button>
          <Link href="/" className="rounded-xl border border-[#DDD6C8] bg-white px-5 py-3 text-sm font-semibold text-[#12213A]">
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  )
}
