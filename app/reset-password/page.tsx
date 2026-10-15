"use client"

import Link from "next/link"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, TriangleAlert } from "lucide-react"
import { authClient } from "@/lib/auth"
import AuthShell, { AuthSpinner } from "@/components/auth/AuthShell"
import PasswordInput from "@/components/auth/PasswordInput"
import Button from "@/components/ui/Button"
import { toast } from "@/lib/toast"
import { validatePassword, authErrorMessage } from "@/lib/auth/validation"

function ResetForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token")
  const linkError = params.get("error")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  if (!token || linkError) {
    return (
      <AuthShell title="Enlace no válido" subtitle="No pudimos validar tu solicitud" showTerms={false}>
        <div className="flex flex-col items-center gap-3 text-center" role="alert">
          <TriangleAlert size={36} style={{ color: "var(--warning)" }} aria-hidden="true" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            El enlace para restablecer la contraseña no es válido o ya venció. Solicita uno nuevo.
          </p>
        </div>
        <Link href="/forgot-password">
          <Button className="w-full">Solicitar un nuevo enlace</Button>
        </Link>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell title="Contraseña actualizada" subtitle="Ya puedes ingresar" showTerms={false}>
        <div className="flex flex-col items-center gap-3 text-center" role="status">
          <CheckCircle2 size={36} style={{ color: "var(--success)" }} aria-hidden="true" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Cambiaste tu contraseña. Por seguridad cerramos tus otras sesiones.
          </p>
        </div>
        <Button onClick={() => router.replace("/login")}>Iniciar sesión</Button>
      </AuthShell>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const next = {
      password: validatePassword(password) ?? undefined,
      confirm: password === confirm ? undefined : "Las contraseñas no coinciden.",
    }
    setErrors(next)
    if (next.password || next.confirm) return
    setSubmitting(true)
    try {
      const { error } = await authClient.resetPassword({ newPassword: password, token: token! })
      if (error) {
        setFormError(authErrorMessage(error))
        return
      }
      toast.success("Contraseña actualizada.")
      setDone(true)
    } catch {
      setFormError("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Nueva contraseña" subtitle="Elige una contraseña segura" showTerms={false}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <PasswordInput
          label="Nueva contraseña"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          showStrength
          error={errors.password}
          hint="Mínimo 10 caracteres, con letras y números."
        />
        <PasswordInput
          label="Confirma la contraseña"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          error={errors.confirm}
        />
        {formError && (
          <p role="alert" className="text-sm" style={{ color: "var(--error)" }}>{formError}</p>
        )}
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Guardar contraseña
        </Button>
      </form>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthSpinner />}>
      <ResetForm />
    </Suspense>
  )
}
