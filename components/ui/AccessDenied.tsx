"use client"

import { ShieldAlert } from "lucide-react"
import Button from "@/components/ui/Button"
import { useRouter } from "next/navigation"

interface AccessDeniedProps {
  message?: string
}

export default function AccessDenied({
  message = "No tienes permisos para acceder a este recurso.",
}: AccessDeniedProps) {
  const router = useRouter()

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "16px",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "16px",
          background: "#FEE2E2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ShieldAlert size={32} style={{ color: "#DC2626" }} />
      </div>
      <h2
        className="text-lg font-semibold"
        style={{ color: "var(--text-primary)" }}
      >
        Acceso denegado
      </h2>
      <p
        className="text-sm"
        style={{ color: "var(--text-muted)", maxWidth: 400 }}
      >
        {message}
      </p>
      <Button variant="ghost" onClick={() => router.back()}>
        Volver
      </Button>
    </div>
  )
}
