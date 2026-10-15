"use client"

import Link from "next/link"
import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, MailCheck, TriangleAlert } from "lucide-react"
import { authClient } from "@/lib/auth"
import AuthShell, { AuthSpinner } from "@/components/auth/AuthShell"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { toast } from "@/lib/toast"
import { safeReturnTo } from "@/lib/authRedirect"
import { validateEmail, normalizeEmail } from "@/lib/auth/validation"

/**
 * Destino del enlace de verificación (callbackURL de Better Auth):
 *  - ?verified=1            → correo verificado
 *  - ?error=...             → enlace inválido/vencido (permite reenviar)
 *  - ?sent=1&email=...      → «revisa tu correo» (tras el registro o desde el aviso en la app)
 */
function VerifyContent() {
  const params = useSearchParams()
  const error = params.get("error")
  const verified = params.get("verified") === "1" && !error
  const returnTo = safeReturnTo(params.get("returnTo")) ?? "/dashboard"
  const [email, setEmail] = useState(params.get("email") ?? "")
  const [emailError, setEmailError] = useState<string | undefined>()
  const [sending, setSending] = useState(false)

  async function resend(e: React.FormEvent) {
    e.preventDefault()
    const err = validateEmail(email)
    setEmailError(err ?? undefined)
    if (err) return
    setSending(true)
    try {
      const { error: apiError } = await authClient.sendVerificationEmail({
        email: normalizeEmail(email),
        callbackURL: `${window.location.origin}/verify-email?verified=1`,
      })
      if (apiError) throw new Error(apiError.message)
      toast.success("Te enviamos un nuevo correo de verificación.")
    } catch {
      toast.error("No pudimos reenviar el correo. Inténtalo más tarde.")
    } finally {
      setSending(false)
    }
  }

  if (verified) {
    return (
      <AuthShell title="Correo verificado" subtitle="Tu cuenta está activa" showTerms={false}>
        <div className="flex flex-col items-center gap-3 text-center" role="status">
          <CheckCircle2 size={36} style={{ color: "var(--success)" }} aria-hidden="true" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Listo, confirmamos tu correo. Ya puedes usar CO$AYB.
          </p>
        </div>
        <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>
          <Button className="w-full">Continuar</Button>
        </Link>
      </AuthShell>
    )
  }

  const failed = !!error
  return (
    <AuthShell
      title={failed ? "Enlace no válido" : "Verifica tu correo"}
      subtitle={failed ? "No pudimos confirmar tu correo" : "Te enviamos un enlace de confirmación"}
      showTerms={false}
    >
      <div className="flex flex-col items-center gap-3 text-center" role={failed ? "alert" : "status"}>
        {failed ? (
          <TriangleAlert size={36} style={{ color: "var(--warning)" }} aria-hidden="true" />
        ) : (
          <MailCheck size={36} style={{ color: "var(--accent)" }} aria-hidden="true" />
        )}
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {failed
            ? "El enlace no es válido o ya venció. Pide uno nuevo con tu correo."
            : "Abre el enlace que te enviamos para activar tu cuenta. Si no lo ves, revisa la carpeta de spam."}
        </p>
      </div>
      <form onSubmit={resend} noValidate className="flex flex-col gap-3">
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
        />
        <Button type="submit" variant="ghost" loading={sending}>Reenviar correo</Button>
      </form>
      <Link href="/login" className="text-center text-sm font-medium underline" style={{ color: "var(--accent)" }}>
        Volver a iniciar sesión
      </Link>
    </AuthShell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthSpinner />}>
      <VerifyContent />
    </Suspense>
  )
}
