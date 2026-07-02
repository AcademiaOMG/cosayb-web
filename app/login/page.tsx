"use client"

import { authClient } from "@/lib/auth"
import { useState, useEffect, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = useMemo(() => searchParams.get("redirect"), [searchParams])
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [callbackURL, setCallbackURL] = useState("")

  useEffect(() => {
    const base = window.location.origin
    setCallbackURL(redirectTo ? `${base}${redirectTo}` : `${base}/onboarding`)
  }, [redirectTo])

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data?.session) {
        router.replace(redirectTo || "/onboarding")
      } else {
        setChecking(false)
      }
    }).catch(() => setChecking(false))
  }, [router, redirectTo])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"
      const res = await fetch(`${apiURL}/auth/sign-in/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider: "google", callbackURL }),
      })
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error("No se recibió URL de redirección")
      }
    } catch {
      setError("No se pudo iniciar sesión con Google. Intenta de nuevo.")
      setLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signInError } = await authClient.signIn.email({
      email,
      password,
      callbackURL,
    })

    if (signInError) {
      setError("Correo o contraseña incorrectos.")
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
        />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          border: "1px solid var(--border-light)",
          boxShadow: "0 8px 32px rgba(18, 33, 58, 0.10)",
        }}
      >
        <div
          className="px-8 py-8 flex flex-col items-center gap-1"
          style={{ background: "var(--bg-inverse)" }}
        >
          <span
            className="font-display text-4xl font-bold tracking-tight"
            style={{ color: "#FFFFFF" }}
          >
            CO$AYB
          </span>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            Software de Costos A&amp;B
          </p>
        </div>

        <div className="px-8 py-8 flex flex-col gap-5" style={{ background: "var(--bg-surface)" }}>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50"
            style={{
              border: "1px solid var(--border-medium)",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-surface)")}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? "Redirigiendo\u2026" : "Continuar con Google"}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: "var(--border-light)" }} />
            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              o con tu correo
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border-light)" }} />
          </div>

          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#7F1D1D",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                required
                className="h-10 w-full rounded-xl px-3 text-sm outline-none transition-colors"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-light)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-light)")}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
                required
                className="h-10 w-full rounded-xl px-3 text-sm outline-none transition-colors"
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-light)",
                  color: "var(--text-primary)",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border-light)")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-10 w-full rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 mt-1"
              style={{
                background: loading ? "var(--accent-hover)" : "var(--accent)",
                color: "#FFFFFF",
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "var(--accent-hover)" }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "var(--accent)" }}
            >
              {loading ? "Iniciando\u2026" : "Iniciar sesi\u00f3n"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
