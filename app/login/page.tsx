"use client"

import Link from "next/link"
import { authClient } from "@/lib/auth"
import { useState, useEffect, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getPendingCheckout, pendingToPath, pendingContextLine } from "@/lib/commerce/pending"
import { resolvePostLoginPath, checkServerSession, fetchOrgState, resolveAuthenticatedDestination, fetchHasActiveCourses, fetchLmsHome, needsOnboarding } from "@/lib/authRedirect"
import { toast } from "@/lib/toast"
import AuthShell, { AuthSpinner } from "@/components/auth/AuthShell"
import GoogleButton, { startGoogleSignIn } from "@/components/auth/GoogleButton"
import PasswordInput from "@/components/auth/PasswordInput"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { validateEmail, normalizeEmail, authErrorMessage } from "@/lib/auth/validation"
import { AUTH_ACTION_TIMEOUT_MS, authFailureMessage } from "@/lib/auth/timeouts"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Intención de compra pendiente (planes → login → checkout). Se conserva el
  // soporte del viejo ?redirect= y se añade ?returnTo=.
  const returnTo = searchParams.get("returnTo") || searchParams.get("redirect")
  const pending = useMemo(
    () => (typeof window !== "undefined" ? getPendingCheckout() : null),
    []
  )
  // Tras autenticarse: ruta pedida > compra pendiente > dashboard (sin pasar por onboarding)
  const destination = useMemo(
    () => resolvePostLoginPath({ returnTo, pendingPath: pending ? pendingToPath(pending) : null }),
    [returnTo, pending]
  )

  const [loading, setLoading] = useState(false)
  // true mientras se verifica si ya hay sesión: evita el parpadeo del formulario antes de redirigir
  const [checking, setChecking] = useState(true)
  const callbackURL = useMemo(() => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}${destination}`
  }, [destination])

  // Desde una invitación el correo viene precargado (?email=)
  const [email, setEmail] = useState(searchParams.get("email") ?? "")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState<string | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [notVerified, setNotVerified] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function verify() {
      // Misma autoridad que SessionGuard (el API, no la cookie caché de Better Auth):
      // si no, una cookie obsoleta provoca el bucle login → dashboard → 401 → login.
      const state = await checkServerSession(API)
      if (cancelled) return
      if (state === "valid") {
        // Sin organización → onboarding (conserva returnTo); si el contexto falla, destino normal
        const org = await fetchOrgState(API)
        if (cancelled) return
        const noBusiness = org.status === "ok" && needsOnboarding(org.state)
        const [hasActiveCourses, lmsHome] = noBusiness ? await Promise.all([fetchHasActiveCourses(API), fetchLmsHome(API)]) : [false, null]
        if (cancelled) return
        router.replace(
          org.status === "ok" ? resolveAuthenticatedDestination(org.state, destination, { hasActiveCourses, lmsHome }) : destination,
        )
        return // se mantiene el estado de carga hasta que la navegación ocurra
      }
      if (state === "invalid") {
        // Cookie huérfana (sesión borrada en servidor): limpiarla para no rebotar
        try { await authClient.signOut() } catch { /* sin sesión que cerrar */ }
        const reason = searchParams.get("expired")
        if (!cancelled && reason === "idle") {
          const minutes = Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES) > 0 ? Number(process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES) : 120
          toast.info(`Cerramos tu sesión porque pasaron ${minutes} minutos sin actividad.`, {
            description: "Inicia sesión de nuevo para continuar.",
          })
        } else if (!cancelled && reason) {
          toast.info("Tu sesión ya no es válida.", {
            description: "Se cerró en el servidor (por ejemplo, iniciaste sesión en otro lugar). Inicia sesión de nuevo.",
          })
        }
      }
      if (!cancelled) setChecking(false)
    }
    void verify()
    return () => { cancelled = true }
  }, [router, destination, searchParams])

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      await startGoogleSignIn(callbackURL)
    } catch (err) {
      toast.error(authFailureMessage(err, "No se pudo iniciar sesión con Google. Intenta de nuevo."))
      setLoading(false)
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setNotVerified(false)
    const emailErr = validateEmail(email)
    setEmailError(emailErr ?? undefined)
    if (emailErr) return
    if (!password) {
      setFormError("Ingresa tu contraseña.")
      return
    }
    setSubmitting(true)
    try {
      // Sin callbackURL: Better Auth no navega por su cuenta (iría directo a /dashboard y se saltaría la portada del rol).
      // El destino lo decide resolveAuthenticatedDestination con los datos de la cuenta.
      const { error } = await authClient.signIn.email(
        { email: normalizeEmail(email), password },
        { signal: AbortSignal.timeout(AUTH_ACTION_TIMEOUT_MS) },
      )
      if (error) {
        setNotVerified((error.code ?? "").toUpperCase() === "EMAIL_NOT_VERIFIED")
        setFormError(authErrorMessage(error))
        return
      }
      const org = await fetchOrgState(API)
      const noBusiness = org.status === "ok" && needsOnboarding(org.state)
      const [hasActiveCourses, lmsHome] = noBusiness ? await Promise.all([fetchHasActiveCourses(API), fetchLmsHome(API)]) : [false, null]
      router.replace(org.status === "ok" ? resolveAuthenticatedDestination(org.state, destination, { hasActiveCourses, lmsHome }) : destination)
    } catch (err) {
      setFormError(authFailureMessage(err, "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo."))
    } finally {
      setSubmitting(false)
    }
  }

  async function resendVerification() {
    try {
      const { error } = await authClient.sendVerificationEmail({ email: normalizeEmail(email), callbackURL })
      if (error) throw new Error(error.message)
      toast.success("Te enviamos un nuevo correo de verificación.")
    } catch {
      toast.error("No pudimos reenviar el correo. Inténtalo más tarde.")
    }
  }

  const registerHref = returnTo ? `/register?returnTo=${encodeURIComponent(returnTo)}` : "/register"

  if (checking) return <AuthSpinner />

  return (
    <AuthShell
      title={pending ? "Ingresa a tu cuenta para continuar" : "Bienvenido"}
      subtitle={pending ? pendingContextLine(pending) : "Inicia sesión para continuar"}
      brandHeadline={
        pending ? (
          <>
            Ya casi terminas
            <br />
            tu compra
          </>
        ) : undefined
      }
      brandText={
        pending ? "Ingresa a tu cuenta y retomamos el checkout exactamente donde lo dejaste." : undefined
      }
      footer={
        <>
          ¿Aún no tienes cuenta?{" "}
          <Link href={registerHref} className="font-semibold underline" style={{ color: "var(--accent)" }}>
            Crea una gratis
          </Link>
        </>
      }
    >
      <form onSubmit={handleEmailLogin} noValidate className="flex flex-col gap-4">
        <Input
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
        />
        <PasswordInput label="Contraseña" value={password} onChange={setPassword} />
        <div className="flex justify-end -mt-2">
          <Link href="/forgot-password" className="text-xs font-medium underline" style={{ color: "var(--accent)" }}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        {formError && (
          <p role="alert" className="text-sm" style={{ color: "var(--error)" }}>
            {formError}{" "}
            {notVerified && (
              <button type="button" onClick={resendVerification} className="underline font-medium">
                Reenviar correo
              </button>
            )}
          </p>
        )}
        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Iniciar sesión
        </Button>
      </form>

      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1" style={{ background: "var(--border-light)" }} />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>o</span>
        <span className="h-px flex-1" style={{ background: "var(--border-light)" }} />
      </div>

      <GoogleButton onClick={handleGoogleLogin} loading={loading} />
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthSpinner />}>
      <LoginForm />
    </Suspense>
  )
}
