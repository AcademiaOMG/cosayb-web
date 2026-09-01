"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useCommerceSession } from "@/lib/commerce/session"
import { setPendingCheckout, type PendingCheckout } from "@/lib/commerce/pending"

/**
 * Protege una ruta de checkout que EXIGE sesión (suscripciones).
 * Si no hay sesión: guarda la intención y manda a /login con returnTo.
 */
export default function CheckoutGuard({
  pending,
  returnTo,
  children,
}: {
  pending: PendingCheckout
  returnTo: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const { isPending, isAuthenticated } = useCommerceSession()
  const redirected = useRef(false)

  useEffect(() => {
    if (isPending || isAuthenticated || redirected.current) return
    redirected.current = true
    setPendingCheckout(pending)
    router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }, [isPending, isAuthenticated, pending, returnTo, router])

  if (isPending || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B4FD8]" />
      </div>
    )
  }

  return <>{children}</>
}
