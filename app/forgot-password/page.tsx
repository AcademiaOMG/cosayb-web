"use client"

import Link from "next/link"
import { useState } from "react"
import { MailCheck } from "lucide-react"
import { authClient } from "@/lib/auth"
import AuthShell from "@/components/auth/AuthShell"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { validateEmail, normalizeEmail, authErrorMessage } from "@/lib/auth/validation"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validateEmail(email)
    setError(err)
    if (err) return
    setSubmitting(true)
    try {
      const { error: apiError } = await authClient.requestPasswordReset({
        email: normalizeEmail(email),
        redirectTo: `${window.location.origin}/reset-password`,
      })
      // No revelamos si el correo existe: solo se muestran errores de límite/servidor.
      if (apiError && (apiError.status === 429 || (apiError.status ?? 0) >= 500)) {
        setError(authErrorMessage(apiError))
        return
      }
      setSent(true)
    } catch {
      setError("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <AuthShell title="Revisa tu correo" subtitle="Instrucciones enviadas" showTerms={false}>
        <div className="flex flex-col items-center gap-3 text-center" role="status">
          <MailCheck size={36} style={{ color: "var(--accent)" }} aria-hidden="true" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Si existe una cuenta con <strong style={{ color: "var(--text-primary)" }}>{normalizeEmail(email)}</strong>,
            recibirás un enlace para crear una nueva contraseña. El enlace vence en 1 hora.
          </p>
        </div>
        <Link href="/login" className="text-center text-sm font-medium underline" style={{ color: "var(--accent)" }}>
          Volver a iniciar sesión
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Recupera tu contraseña"
      subtitle="Te enviaremos un enlace para crear una nueva"
      showTerms={false}
      footer={
        <Link href="/login" className="font-semibold underline" style={{ color: "var(--accent)" }}>
          Volver a iniciar sesión
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error ?? undefined}
        />
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Enviar enlace
        </Button>
      </form>
    </AuthShell>
  )
}
