"use client"

import Link from "next/link"
import { Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MailCheck } from "lucide-react"
import { authClient } from "@/lib/auth"
import AuthShell, { AuthSpinner } from "@/components/auth/AuthShell"
import GoogleButton, { startGoogleSignIn } from "@/components/auth/GoogleButton"
import PasswordInput from "@/components/auth/PasswordInput"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { toast } from "@/lib/toast"
import { getPendingCheckout, pendingToPath, pendingContextLine } from "@/lib/commerce/pending"
import {
  resolvePostLoginPath, checkServerSession, fetchOrgState, resolveAuthenticatedDestination, safeReturnTo,
} from "@/lib/authRedirect"
import {
  validateEmail, validateName, validatePassword, normalizeEmail, authErrorMessage,
} from "@/lib/auth/validation"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

type Errors = Partial<Record<"name" | "email" | "password" | "terms", string>>

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = safeReturnTo(searchParams.get("returnTo") || searchParams.get("redirect"))
  const pending = useMemo(() => (typeof window !== "undefined" ? getPendingCheckout() : null), [])
  const destination = useMemo(
    () => resolvePostLoginPath({ returnTo, pendingPath: pending ? pendingToPath(pending) : null }),
    [returnTo, pending],
  )

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [accepted, setAccepted] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  function origin() {
    return typeof window === "undefined" ? "" : window.location.origin
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const next: Errors = {
      name: validateName(name) ?? undefined,
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
      terms: accepted ? undefined : "Debes aceptar los términos y la política de privacidad.",
    }
    setErrors(next)
    if (Object.values(next).some(Boolean)) return

    setSubmitting(true)
    try {
      const verifyReturn = destination === "/dashboard" ? "" : `&returnTo=${encodeURIComponent(destination)}`
      const { error } = await authClient.signUp.email({
        name: name.trim(),
        email: normalizeEmail(email),
        password,
        callbackURL: `${origin()}/verify-email?verified=1${verifyReturn}`,
      })
      if (error) {
        setFormError(authErrorMessage(error))
        return
      }
      // Si el API no exige verificación ya hay sesión: continuar. Si la exige: pantalla «revisa tu correo».
      const session = await checkServerSession(API)
      if (session === "valid") {
        const org = await fetchOrgState(API)
        router.replace(org.status === "ok" ? resolveAuthenticatedDestination(org.state, destination) : destination)
        return
      }
      setSentTo(normalizeEmail(email))
    } catch {
      setFormError("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      await startGoogleSignIn(`${origin()}${destination}`)
    } catch {
      toast.error("No se pudo continuar con Google. Intenta de nuevo.")
      setGoogleLoading(false)
    }
  }

  async function resend() {
    if (!sentTo) return
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: sentTo,
        callbackURL: `${origin()}/verify-email?verified=1`,
      })
      if (error) throw new Error(error.message)
      toast.success("Te enviamos un nuevo correo de verificación.")
    } catch {
      toast.error("No pudimos reenviar el correo. Inténtalo más tarde.")
    }
  }

  const loginHref = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"

  if (sentTo) {
    return (
      <AuthShell title="Revisa tu correo" subtitle="Un último paso para activar tu cuenta" showTerms={false}>
        <div className="flex flex-col items-center gap-3 text-center" role="status">
          <MailCheck size={36} style={{ color: "var(--accent)" }} aria-hidden="true" />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Enviamos un enlace de verificación a <strong style={{ color: "var(--text-primary)" }}>{sentTo}</strong>.
            Ábrelo para activar tu cuenta y empezar tu prueba gratuita.
          </p>
        </div>
        <Button variant="ghost" onClick={resend}>Reenviar correo</Button>
        <Link href={loginHref} className="text-center text-sm font-medium underline" style={{ color: "var(--accent)" }}>
          Ya verifiqué mi correo, iniciar sesión
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Crea tu cuenta"
      subtitle={pending ? pendingContextLine(pending) : "14 días de prueba gratis, sin tarjeta"}
      showTerms={false}
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href={loginHref} className="font-semibold underline" style={{ color: "var(--accent)" }}>
            Inicia sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Nombre"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <Input
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <PasswordInput
          label="Contraseña"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          showStrength
          error={errors.password}
          hint="Mínimo 10 caracteres, con letras y números."
        />
        <div className="flex flex-col gap-1">
          <label className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              aria-invalid={!!errors.terms}
              className="mt-0.5 h-4 w-4 shrink-0"
            />
            <span>
              Acepto los{" "}
              <Link href="/terms" target="_blank" className="underline">términos y condiciones</Link>, la{" "}
              <Link href="/privacy" target="_blank" className="underline">política de privacidad</Link> y la{" "}
              <Link href="/refunds" target="_blank" className="underline">política de reembolso</Link>.
            </span>
          </label>
          {errors.terms && <p role="alert" className="text-xs" style={{ color: "var(--error)" }}>{errors.terms}</p>}
        </div>
        {formError && (
          <p role="alert" className="text-sm" style={{ color: "var(--error)" }}>{formError}</p>
        )}
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Crear cuenta
        </Button>
      </form>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1" style={{ background: "var(--border-light)" }} />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>o</span>
        <span className="h-px flex-1" style={{ background: "var(--border-light)" }} />
      </div>
      <GoogleButton onClick={handleGoogle} loading={googleLoading} label="Registrarme con Google" />
    </AuthShell>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthSpinner />}>
      <RegisterForm />
    </Suspense>
  )
}
