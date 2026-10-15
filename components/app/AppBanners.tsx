"use client"

import Link from "next/link"
import { useState } from "react"
import { AlertTriangle, Info, MailWarning, X } from "lucide-react"
import { authClient } from "@/lib/auth"
import { billingNotice } from "@/lib/saas/billing"
import { useBillingOverview } from "@/lib/saas/hooks"
import { toast } from "@/lib/toast"

const DISMISS_KEY = "cosayb.banner.dismissed"

function readDismissed(): string[] {
  try {
    return JSON.parse(window.sessionStorage.getItem(DISMISS_KEY) ?? "[]")
  } catch {
    return []
  }
}

/**
 * Avisos globales sobre el contenido: pago pendiente, fin de prueba, cancelación
 * programada y correo sin verificar. Los informativos se pueden descartar durante
 * la sesión; el de pago pendiente no.
 */
export default function AppBanners() {
  const { data: overview } = useBillingOverview()
  const { data: session } = authClient.useSession()
  const [dismissed, setDismissed] = useState<string[]>(() => (typeof window === "undefined" ? [] : readDismissed()))
  const [sending, setSending] = useState(false)

  const notice = billingNotice(overview)
  const unverified = session?.user && session.user.emailVerified === false

  function dismiss(id: string) {
    const next = [...dismissed, id]
    setDismissed(next)
    try {
      window.sessionStorage.setItem(DISMISS_KEY, JSON.stringify(next))
    } catch {
      /* sin almacenamiento: solo se oculta en esta vista */
    }
  }

  async function resend() {
    if (!session?.user) return
    setSending(true)
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: session.user.email,
        callbackURL: `${window.location.origin}/verify-email?verified=1`,
      })
      if (error) throw new Error(error.message)
      toast.success("Te enviamos un nuevo correo de verificación.")
    } catch {
      toast.error("No pudimos reenviar el correo. Inténtalo más tarde.")
    } finally {
      setSending(false)
    }
  }

  const showBilling = notice && (notice.tone === "warning" || !dismissed.includes("billing"))
  const showVerify = unverified && !dismissed.includes("verify")
  if (!showBilling && !showVerify) return null

  return (
    <div className="flex flex-col gap-px" role="region" aria-label="Avisos">
      {showBilling && notice && (
        <div
          role={notice.tone === "warning" ? "alert" : "status"}
          className="flex items-center gap-3 px-4 py-2.5 text-sm"
          style={
            notice.tone === "warning"
              ? { background: "#FEF3C7", color: "#78350F" }
              : { background: "var(--accent-light)", color: "var(--accent-text)" }
          }
        >
          {notice.tone === "warning" ? <AlertTriangle size={16} aria-hidden="true" /> : <Info size={16} aria-hidden="true" />}
          <p className="flex-1">{notice.message}</p>
          <Link href={notice.cta.href} className="font-semibold underline whitespace-nowrap">{notice.cta.label}</Link>
          {notice.tone !== "warning" && (
            <button type="button" aria-label="Cerrar aviso" onClick={() => dismiss("billing")}>
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      {showVerify && (
        <div
          role="status"
          className="flex items-center gap-3 px-4 py-2.5 text-sm"
          style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}
        >
          <MailWarning size={16} aria-hidden="true" />
          <p className="flex-1">Verifica tu correo para proteger tu cuenta y recibir tus recibos.</p>
          <button type="button" onClick={resend} disabled={sending} className="font-semibold underline whitespace-nowrap disabled:opacity-60">
            {sending ? "Enviando…" : "Reenviar correo"}
          </button>
          <button type="button" aria-label="Cerrar aviso" onClick={() => dismiss("verify")}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  )
}
