"use client"

import Link from "next/link"
import { authClient } from "@/lib/auth"
import { useState, useEffect, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, BarChart3, ChefHat, TrendingUp } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = useMemo(() => searchParams.get("redirect"), [searchParams])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const callbackURL = useMemo(() => {
    if (typeof window === "undefined") return ""
    const base = window.location.origin
    return redirectTo ? `${base}${redirectTo}` : `${base}/onboarding`
  }, [redirectTo])

  useEffect(() => {
    authClient.getSession().then(({ data }) => {
      if (data?.session) router.replace(redirectTo || "/onboarding")
    })
  }, [router, redirectTo])

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
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

  return (
    <div className="min-h-dvh flex" style={{ background: "var(--bg-primary)" }}>
      {/* ── Left panel – brand (desktop only) ──────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "var(--bg-inverse)" }}
      >
        {/* Decorative background layers */}
        <div className="absolute inset-0">
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
          />
          {/* Glow orbs */}
          <div
            className="absolute top-[-120px] left-[-80px] w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)", opacity: 0.08 }}
          />
          <div
            className="absolute bottom-[-100px] right-[-60px] w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, #10B981 0%, transparent 70%)", opacity: 0.06 }}
          />
        </div>

        {/* Top: brand */}
        <div className="relative z-10">
          <span className="font-display text-4xl font-bold tracking-tight" style={{ color: "#fff" }}>
            CO$AYB
          </span>
        </div>

        {/* Center: headline + features */}
        <div className="relative z-10 flex flex-col gap-10 max-w-lg">
          <div className="flex flex-col gap-3">
            <h1
              className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight"
              style={{ color: "#fff", fontFamily: "var(--font-barlow-condensed)" }}
            >
              Controla los costos
              <br />
              de tu restaurante
            </h1>
            <p className="text-base leading-relaxed max-w-md" style={{ color: "rgba(255,255,255,0.5)" }}>
              Calcula costos reales por porción, analiza rentabilidad y toma mejores decisiones para tu negocio.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {[
              { icon: ChefHat, label: "Costos reales por porción", desc: "Ingredientes, rendimiento y recetas" },
              { icon: BarChart3, label: "Análisis de rentabilidad", desc: "Precios sugeridos al instante" },
              { icon: TrendingUp, label: "Menús para eventos", desc: "Planifica y cotiza servicios" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <Icon size={18} style={{ color: "var(--accent)" }} />
                </div>
                <div className="flex flex-col gap-0.5 pt-1">
                  <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
                    {label}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {desc}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: subtle footer */}
        <div className="relative z-10">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            Software de costos para restaurantes en Colombia
          </p>
        </div>
      </div>

      {/* ── Right panel – login form ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-[400px] flex flex-col">
          {/* Mobile brand header */}
          <div className="lg:hidden flex flex-col items-center mb-10 gap-2">
            <span
              className="font-display text-4xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              CO$AYB
            </span>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Software de Costos para Restaurantes
            </p>
          </div>

          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-8 text-sm font-medium transition-colors self-start"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft size={14} />
            Volver al inicio
          </Link>

          {/* Welcome heading */}
          <div className="mb-8">
            <h2
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-barlow-condensed)" }}
            >
              Bienvenido
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Inicia sesión para continuar
            </p>
          </div>

          {/* Login card */}
          <div
            className="rounded-2xl"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              boxShadow: "0 1px 3px rgba(18,33,58,0.04), 0 8px 24px rgba(18,33,58,0.06)",
            }}
          >
            <div className="px-6 py-7 flex flex-col gap-5 sm:px-8">
              {/* Error */}
              {error && (
                <div
                  className="px-4 py-3 rounded-xl text-sm flex items-start gap-2.5"
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    color: "#991B1B",
                  }}
                >
                  <span className="text-sm mt-0.5">⚠</span>
                  {error}
                </div>
              )}

              {/* Google button */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
                style={{
                  border: "1px solid var(--border-medium)",
                  background: "#fff",
                  color: "var(--text-primary)",
                  boxShadow: "0 1px 2px rgba(18,33,58,0.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(18,33,58,0.08)"
                  e.currentTarget.style.borderColor = "var(--border-medium)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 1px 2px rgba(18,33,58,0.04)"
                  e.currentTarget.style.borderColor = "var(--border-medium)"
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {loading ? "Redirigiendo…" : "Continuar con Google"}
              </button>
            </div>
          </div>

          {/* Terms */}
          <p className="text-center text-xs mt-6 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Al continuar, aceptas nuestros{" "}
            <Link href="/terms" className="underline transition-colors hover:text-[var(--text-secondary)]">
              términos
            </Link>{" "}
            y{" "}
            <Link href="/privacy" className="underline transition-colors hover:text-[var(--text-secondary)]">
              política de privacidad
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
