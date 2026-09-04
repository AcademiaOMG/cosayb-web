"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

/**
 * La plataforma usa autenticación solo con Google (ver commit
 * "fix: eliminar formulario email/contraseña del login, solo Google").
 * Crear cuenta e iniciar sesión son el mismo flujo: Google crea la cuenta
 * automáticamente en el primer acceso. Esta ruta redirige a /login
 * conservando returnTo para no perder la intención de compra.
 */
function RegisterRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const rt = searchParams.get("returnTo") || searchParams.get("redirect")
    const qs = rt && rt.startsWith("/") ? `?returnTo=${encodeURIComponent(rt)}` : ""
    router.replace(`/login${qs}`)
  }, [router, searchParams])

  return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
      />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterRedirect />
    </Suspense>
  )
}
