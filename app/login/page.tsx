"use client"

import { authClient } from "@/lib/auth"

export default function LoginPage() {
  async function handleGoogleLogin() {
    await authClient.signIn.social({ provider: "google", callbackURL: "/inventario" })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        className="w-full max-w-sm flex flex-col items-center gap-8 rounded-2xl p-10"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          boxShadow: "0 4px 24px rgba(18, 33, 58, 0.08)",
        }}
      >
        {/* Logo */}
        <div className="text-center">
          <span
            className="font-display text-4xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            CO$AYB
          </span>
        </div>

        {/* Copy */}
        <div className="text-center flex flex-col gap-2">
          <h1
            className="text-2xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Inicia sesión en CO$AYB
          </h1>
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            Gestiona los costos de tu cocina desde cualquier lugar
          </p>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-xl px-5 h-12 text-base font-medium transition-colors"
          style={{
            background: "#fff",
            border: "1px solid var(--border-light)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-inter)",
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "var(--border-medium)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "var(--border-light)")
          }
        >
          <GoogleIcon />
          Continuar con Google
        </button>

        {/* Legal */}
        <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
          Al continuar aceptas los{" "}
          <a
            href="/terminos"
            className="underline"
            style={{ color: "var(--accent-text)" }}
          >
            términos y condiciones
          </a>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
