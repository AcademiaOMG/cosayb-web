"use client"

import Link from "next/link"
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { authClient } from "@/lib/auth"
import { getPendingCheckout, pendingToPath, pendingContextLine } from "@/lib/commerce/pending"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const returnTo = useMemo(() => {
    const rt = searchParams.get("returnTo") || searchParams.get("redirect")
    return rt && rt.startsWith("/") ? rt : null
  }, [searchParams])

  const pending = useMemo(() => (typeof window !== "undefined" ? getPendingCheckout() : null), [])
  const destination = useMemo(
    () => returnTo ?? (pending ? pendingToPath(pending) : "/onboarding"),
    [returnTo, pending]
  )

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data?.session) router.replace(destination)
    })
  }, [router, destination])

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: authError } = await authClient.signIn.email({ email: email.trim(), password })
    setLoading(false)
    if (authError) {
      setError("Correo o contraseña incorrectos. Verifica e intenta de nuevo.")
      return
    }
    router.replace(destination)
  }

  async function handleGoogleLogin() {
    setError(null)
    setGoogleLoading(true)
    const callbackURL =
      typeof window !== "undefined" ? `${window.location.origin}${destination}` : destination
    const { error: authError } = await authClient.signIn.social({ provider: "google", callbackURL })
    if (authError) {
      setError("No se pudo iniciar sesión con Google. Intenta de nuevo.")
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh bg-[#F5F0E8]">
      <aside className="relative hidden flex-col justify-between bg-[#12213A] p-12 text-white lg:flex lg:w-[45%]">
        <span className="font-display text-3xl font-bold">CO$AYB</span>
        <div className="max-w-sm">
          <h1 className="text-3xl font-extrabold leading-tight">
            {pending ? "Ya casi terminas tu compra" : "Controla los costos de tu restaurante"}
          </h1>
          <p className="mt-3 text-sm text-white/60">
            {pending
              ? "Ingresa a tu cuenta y retomamos el checkout exactamente donde lo dejaste."
              : "Calcula costos reales por porción, analiza rentabilidad y decide mejor."}
          </p>
        </div>
        <p className="text-xs text-white/30">Software de costos para restaurantes en Colombia</p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[400px]">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#7A6E60]">
            <ArrowLeft size={14} /> Volver al inicio
          </Link>

          <h2 className="text-2xl font-extrabold text-[#12213A]">
            {pending ? "Ingresa a tu cuenta para continuar" : "Inicia sesión"}
          </h2>
          <p className="mt-2 text-sm text-[#4A4438]">
            {pending ? pendingContextLine(pending) : "Accede a tu plataforma de costos."}
          </p>

          <div className="mt-6 space-y-4 rounded-2xl border border-[#DDD6C8] bg-white p-6 shadow-sm">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-[#12213A]">Correo electrónico</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#DDD6C8] bg-[#F7F5F2] px-3 py-3 text-sm outline-none focus:border-[#1B4FD8]"
                  placeholder="correo@ejemplo.com"
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-[#12213A]">Contraseña</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[#DDD6C8] bg-[#F7F5F2] px-3 py-3 text-sm outline-none focus:border-[#1B4FD8]"
                  placeholder="Tu contraseña"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1B4FD8] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#163FB9] disabled:opacity-70"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Iniciar sesión
              </button>
            </form>

            <div className="flex items-center gap-3 text-xs text-[#7A6E60]">
              <span className="h-px flex-1 bg-[#DDD6C8]" /> o <span className="h-px flex-1 bg-[#DDD6C8]" />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#DDD6C8] bg-white px-4 py-3 text-sm font-semibold text-[#12213A] transition hover:shadow-sm disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {googleLoading ? "Redirigiendo…" : "Continuar con Google"}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-[#4A4438]">
            ¿No tienes una cuenta?{" "}
            <Link
              href={`/register${
                returnTo
                  ? `?returnTo=${encodeURIComponent(returnTo)}`
                  : pending
                    ? `?returnTo=${encodeURIComponent(pendingToPath(pending))}`
                    : ""
              }`}
              className="font-semibold text-[#1B4FD8]"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#F5F0E8]">
          <Loader2 className="h-6 w-6 animate-spin text-[#1B4FD8]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
