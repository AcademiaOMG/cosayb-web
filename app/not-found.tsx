"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth"
import { FileQuestion, ArrowLeft } from "lucide-react"

export default function NotFound() {
  const { data: session } = authClient.useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const homeHref = mounted && session?.user ? "/dashboard" : "/"

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 text-center px-4">
      {/* Icon */}
      <div
        className="relative flex items-center justify-center w-24 h-24 rounded-3xl"
        style={{
          background: "var(--accent-light)",
          border: "2px solid var(--accent)",
          borderStyle: "dashed",
        }}
      >
        <FileQuestion size={40} style={{ color: "var(--accent)" }} />
        <span
          className="absolute -bottom-3 -right-2 text-4xl font-black"
          style={{ color: "var(--accent)", opacity: 0.3 }}
        >
          ?
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-2">
        <h1
          className="text-6xl font-black tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          404
        </h1>
        <h2
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Página no encontrada
        </h2>
        <p
          className="text-sm max-w-sm mx-auto leading-relaxed"
          style={{ color: "var(--text-secondary)" }}
        >
          La ruta que intentas visitar no existe o fue movida a otra ubicación.
          Verifica la URL en la barra de direcciones.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Link
          href={homeHref}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-150"
          style={{
            background: "var(--accent)",
            color: "#fff",
            boxShadow: "0 4px 12px rgba(var(--accent-rgb, 59,130,246), 0.3)",
          }}
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-150"
          style={{
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-light)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-secondary)"
            e.currentTarget.style.borderColor = "var(--border-medium)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--bg-surface)"
            e.currentTarget.style.borderColor = "var(--border-light)"
          }}
        >
          Volver atrás
        </button>
      </div>
    </div>
  )
}
