"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth"
import {
  getInvitationById,
  acceptInvitation,
  type InvitationDetail,
} from "@/lib/api/settings"

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  chef: { label: "Cocinero", color: "#059669", bg: "#ecfdf5" },
  student: { label: "Estudiante", color: "#2563eb", bg: "#eff6ff" },
  owner: { label: "Propietario", color: "#e94560", bg: "#fff1f2" },
}

export default function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: sessionData } = authClient.useSession()

  const [invitation, setInvitation] = useState<InvitationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [accepted, setAccepted] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userEmail: string | null = (sessionData as any)?.user?.email ?? null

  useEffect(() => {
    async function load() {
      try {
        const res = await getInvitationById(id)
        setInvitation(res.data)
      } catch {
        setError("Invitación no encontrada o expirada")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleAccept = async () => {
    setAccepting(true)
    setError(null)
    try {
      const res = await acceptInvitation(id)
      setAccepted(true)
      setTimeout(() => router.push("/inventario"), 3000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al aceptar la invitación"
      setError(msg)
    } finally {
      setAccepting(false)
    }
  }

  const handleGoLogin = () => {
    router.push(`/login?redirect=/accept-invitation/${id}`)
  }

  const handleLogout = async () => {
    await authClient.signOut()
    window.location.href = `/login?redirect=/accept-invitation/${id}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary, #faf9f7)" }}>
        <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary, #faf9f7)" }}>
        <div style={{ textAlign: "center", padding: 48, maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#9888;&#65039;</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary, #1c1917)", marginBottom: 8 }}>
            Invitación no disponible
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted, #78716c)", marginBottom: 24 }}>
            {error}
          </p>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "1px solid var(--border, #e7e5e4)",
              background: "white",
              color: "var(--text-primary, #1c1917)",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary, #faf9f7)" }}>
        <div style={{ textAlign: "center", padding: 48, maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>&#10004;&#65039;</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary, #1c1917)", marginBottom: 8 }}>
            ¡Invitación aceptada!
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted, #78716c)", marginBottom: 24 }}>
            Redirigiendo al inventario...
          </p>
        </div>
      </div>
    )
  }

  if (!invitation) return null

  const roleInfo = ROLE_LABELS[invitation.role] ?? { label: invitation.role, color: "#78716c", bg: "#f5f5f4" }
  const isLoggedIn = !!userEmail
  const emailMatch = isLoggedIn && userEmail?.toLowerCase() === invitation.email.toLowerCase()

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary, #faf9f7)" }}>
      <div style={{ textAlign: "center", padding: 48, maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ marginBottom: 32 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary, #1c1917)", letterSpacing: "-0.5px" }}>CO</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: "var(--accent, #e94560)", letterSpacing: "-0.5px" }}>$</span>
          <span style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary, #1c1917)", letterSpacing: "-0.5px" }}>AYB</span>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-primary, #1c1917)", marginBottom: 12 }}>
          Te han invitado a un equipo
        </h1>
        <p style={{ fontSize: 15, color: "var(--text-muted, #78716c)", marginBottom: 32, lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text-primary, #1c1917)" }}>{invitation.invitedByName}</strong> te
          invitó a formar parte de
        </p>

        {/* Invitation card */}
        <div style={{
          background: "white",
          border: "1px solid var(--border, #e7e5e4)",
          borderRadius: 16,
          padding: "28px 32px",
          marginBottom: 32,
          textAlign: "left",
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted, #78716c)", letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 4 }}>
              Organización
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary, #1c1917)" }}>
              {invitation.organizationName}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted, #78716c)", letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 4 }}>
              Tu rol
            </div>
            <span style={{
              display: "inline-block",
              fontSize: 13,
              fontWeight: 600,
              color: roleInfo.color,
              background: roleInfo.bg,
              padding: "4px 12px",
              borderRadius: 100,
            }}>
              {roleInfo.label}
            </span>
          </div>
        </div>

        {/* Not logged in */}
        {!isLoggedIn && (
          <div style={{
            background: "#fff7ed",
            border: "1px solid #fde68a",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
            textAlign: "left",
          }}>
            <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6, margin: 0 }}>
              Necesitas iniciar sesión o crear una cuenta para aceptar esta invitación.
            </p>
          </div>
        )}

        {/* Logged in but different email */}
        {isLoggedIn && !emailMatch && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 24,
            textAlign: "left",
          }}>
            <p style={{ fontSize: 13, color: "#991b1b", lineHeight: 1.6, margin: 0 }}>
              La invitación es para <strong>{invitation.email}</strong>, pero tu sesión es{" "}
              <strong>{userEmail}</strong>. Cierra sesión e inicia con la cuenta correcta.
            </p>
          </div>
        )}

        {/* CTA */}
        {!isLoggedIn ? (
          <button
            onClick={handleGoLogin}
            style={{
              width: "100%",
              padding: "14px 24px",
              borderRadius: 12,
              border: "none",
              background: "var(--accent, #e94560)",
              color: "white",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(233, 69, 96, 0.30)",
              transition: "all 0.15s ease",
            }}
          >
            Iniciar sesión para aceptar →
          </button>
        ) : emailMatch ? (
          <button
            onClick={handleAccept}
            disabled={accepting}
            style={{
              width: "100%",
              padding: "14px 24px",
              borderRadius: 12,
              border: "none",
              background: accepting ? "var(--text-muted, #a8a29e)" : "var(--accent, #e94560)",
              color: "white",
              fontWeight: 700,
              fontSize: 15,
              cursor: accepting ? "not-allowed" : "pointer",
              boxShadow: accepting ? "none" : "0 4px 14px rgba(233, 69, 96, 0.30)",
              transition: "all 0.15s ease",
            }}
          >
            {accepting ? "Procesando..." : "Aceptar Invitación →"}
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "14px 24px",
                borderRadius: 12,
                border: "none",
                background: "var(--accent, #e94560)",
                color: "white",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(233, 69, 96, 0.30)",
                transition: "all 0.15s ease",
              }}
            >
              Cerrar sesión y entrar con otra cuenta →
            </button>
          </div>
        )}

        {error && (
          <p style={{ fontSize: 13, color: "#dc2626", marginTop: 16 }}>{error}</p>
        )}
      </div>
    </div>
  )
}
