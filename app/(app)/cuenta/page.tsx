"use client"

import useSWR from "swr"
import Link from "next/link"
import { useState, useEffect } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import InfoStat from "@/components/ui/InfoStat"
import PlanBadge from "@/components/app/settings/PlanBadge"
import { getMyProfile, updateMyProfile, getOwnedOrganizations } from "@/lib/api"
import { usePermissions } from "@/hooks/usePermissions"
import { authClient } from "@/lib/auth"
import {
  User, Mail, Clock, ShieldCheck, KeyRound, Globe, Building2,
  AlertTriangle, Monitor, LogOut, ExternalLink, Trash2,
} from "lucide-react"
import type { Plan } from "@/types/domain"

/**
 * Mi cuenta — perfil PERSONAL del usuario, organizado en secciones
 * (como /configuracion, pero para la persona en vez del negocio).
 */

const ROLE_LABELS: Record<string, string> = {
  org_owner: "Propietario",
  org_manager: "Gerente",
  org_chef: "Chef",
  org_cost_analyst: "Analista de costos",
  org_viewer: "Solo lectura",
  academic_teacher: "Docente",
  academic_assistant: "Asistente",
  academic_student: "Estudiante",
}

type Tab = "perfil" | "seguridad" | "organizacion" | "cuenta"

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "seguridad", label: "Seguridad", icon: KeyRound },
  { id: "organizacion", label: "Organización", icon: Building2 },
  { id: "cuenta", label: "Cuenta", icon: AlertTriangle },
]

export default function CuentaPage() {
  const [tab, setTab] = useState<Tab>("perfil")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Mi cuenta" subtitle="Tu información personal" />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <nav
          className="flex lg:flex-col gap-1 shrink-0 lg:w-52 w-full overflow-x-auto"
          aria-label="Secciones de mi cuenta"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors"
                style={{
                  background: active ? "var(--accent-light)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  border: `1px solid ${active ? "var(--accent)" : "transparent"}`,
                }}
              >
                <Icon size={16} />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="flex-1 min-w-0 w-full max-w-2xl">
          {tab === "perfil" && <PerfilTab />}
          {tab === "seguridad" && <SeguridadTab />}
          {tab === "organizacion" && <OrganizacionTab />}
          {tab === "cuenta" && <CuentaTab />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PERFIL
// ═══════════════════════════════════════════════════════════════════════════
function PerfilTab() {
  const { data: profile, mutate: mutateProfile } = useSWR(
    "my-profile",
    () => getMyProfile().then((r) => r.data),
    { revalidateOnFocus: false }
  )
  const { organization, roles } = usePermissions()

  const [name, setName] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.name) setName(profile.name)
  }, [profile?.name])

  async function handleSave() {
    if (!name.trim() || name === profile?.name) return
    setSaving(true)
    setMsg(null)
    try {
      await updateMyProfile({ name: name.trim() })
      await mutateProfile()
      setMsg("Nombre actualizado")
      setTimeout(() => setMsg(null), 3000)
    } catch {
      setMsg("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  const roleLabel = roles.map((r) => ROLE_LABELS[r]).find(Boolean)

  return (
    <div className="flex flex-col gap-6">
      {/* ── Identidad ─────────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 flex items-center gap-5"
        style={{
          background: "linear-gradient(135deg, var(--accent-light) 0%, var(--bg-surface) 65%)",
          border: "1px solid var(--border-light)",
        }}
      >
        {profile?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.image}
            alt=""
            className="w-[72px] h-[72px] rounded-2xl object-cover shrink-0"
            style={{ border: "2px solid var(--bg-surface)", boxShadow: "0 2px 8px rgba(18,33,58,0.12)" }}
          />
        ) : (
          <div
            className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ background: "var(--accent)", color: "#fff", boxShadow: "0 2px 8px rgba(18,33,58,0.12)" }}
          >
            {profile?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-xl font-bold truncate" style={{ color: "var(--text-primary)" }}>
              {profile?.name || "…"}
            </h2>
            {organization && <PlanBadge plan={organization.membership as Plan} />}
          </div>
          <p className="text-sm truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
            {profile?.email ?? "—"}
          </p>
          {roleLabel && (
            <span
              className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", border: "1px solid var(--border-light)" }}
            >
              <ShieldCheck size={12} style={{ color: "var(--accent)" }} />
              {roleLabel} en {organization?.name}
            </span>
          )}
        </div>
      </div>

      {/* ── Editar nombre ─────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <User size={18} style={{ color: "var(--accent)" }} />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
            EDITAR PERFIL
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => { setName(e.target.value); setMsg(null) }}
            placeholder="Tu nombre"
          />

          {msg && (
            <p className="text-xs" style={{ color: msg.includes("Error") ? "#EF4444" : "#16A34A" }}>
              {msg}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving || !name.trim() || name === profile?.name}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Datos de la cuenta ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoStat
          icon={<Mail size={12} style={{ color: "var(--text-muted)" }} />}
          label="Correo electrónico"
          value={profile?.email ?? "—"}
        />
        <InfoStat
          icon={<Clock size={12} style={{ color: "var(--text-muted)" }} />}
          label="Miembro desde"
          value={
            profile?.createdAt
              ? new Date(profile.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })
              : "—"
          }
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SEGURIDAD
// ═══════════════════════════════════════════════════════════════════════════
function useAuthAccounts() {
  const { data } = useSWR(
    "auth-accounts",
    () => authClient.listAccounts().then((r) => r.data ?? []),
    { revalidateOnFocus: false }
  )
  return {
    loaded: data !== undefined,
    hasPassword: data?.some((a) => a.providerId === "credential") ?? false,
    hasGoogle: data?.some((a) => a.providerId === "google") ?? false,
  }
}

function SeguridadTab() {
  return (
    <div className="flex flex-col gap-6">
      <PasswordCard />
      <SessionsCard />
    </div>
  )
}

function PasswordCard() {
  const { loaded, hasPassword, hasGoogle } = useAuthAccounts()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function handleChangePassword() {
    setMsg(null)
    if (newPassword.length < 8) {
      setMsg("La nueva contraseña debe tener al menos 8 caracteres.")
      return
    }
    if (newPassword !== confirmPassword) {
      setMsg("Las contraseñas no coinciden.")
      return
    }
    setSaving(true)
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })
      if (error) {
        setMsg(error.message ?? "No se pudo cambiar la contraseña.")
      } else {
        setMsg("Contraseña actualizada")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch {
      setMsg("No se pudo cambiar la contraseña.")
    } finally {
      setSaving(false)
    }
  }

  if (!loaded) return null

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <KeyRound size={18} style={{ color: "var(--accent)" }} />
        <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
          CONTRASEÑA
        </p>
      </div>

      {hasPassword ? (
        <div className="flex flex-col gap-4">
          <Input
            label="Contraseña actual"
            type="password"
            value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); setMsg(null) }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nueva contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); setMsg(null) }}
              hint="Mínimo 8 caracteres"
            />
            <Input
              label="Confirmar nueva contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setMsg(null) }}
            />
          </div>

          {msg && (
            <p className="text-xs" style={{ color: msg.includes("actualizada") ? "#16A34A" : "#EF4444" }}>
              {msg}
            </p>
          )}

          {hasGoogle && (
            <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
              <Globe size={12} />
              También puedes iniciar sesión con Google.
            </p>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={handleChangePassword}
              disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            >
              {saving ? "Guardando..." : "Cambiar contraseña"}
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <Globe size={16} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Inicias sesión con Google — no tienes una contraseña que gestionar aquí.
          </p>
        </div>
      )}
    </Card>
  )
}

function parseUserAgent(ua: string | null | undefined): string {
  if (!ua) return "Dispositivo desconocido"
  const os = /Windows/.test(ua) ? "Windows"
    : /Mac OS X/.test(ua) ? "macOS"
    : /Android/.test(ua) ? "Android"
    : /iPhone|iPad/.test(ua) ? "iOS"
    : /Linux/.test(ua) ? "Linux"
    : "dispositivo"
  const browser = /Edg\//.test(ua) ? "Edge"
    : /Chrome\//.test(ua) ? "Chrome"
    : /Firefox\//.test(ua) ? "Firefox"
    : /Safari\//.test(ua) ? "Safari"
    : "Navegador"
  return `${browser} en ${os}`
}

function timeAgo(value: string | Date): string {
  const diffMs = Date.now() - new Date(value).getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return "Ahora mismo"
  if (min < 60) return `Hace ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `Hace ${hr} h`
  const days = Math.floor(hr / 24)
  return `Hace ${days} d`
}

function SessionsCard() {
  const { data: sessionData } = authClient.useSession()
  const { data: sessions, mutate } = useSWR(
    "auth-sessions",
    () => authClient.listSessions().then((r) => r.data ?? []),
    { revalidateOnFocus: false }
  )
  const [revokingToken, setRevokingToken] = useState<string | null>(null)
  const [revokingOthers, setRevokingOthers] = useState(false)

  async function handleRevoke(token: string) {
    setRevokingToken(token)
    try {
      await authClient.revokeSession({ token })
      await mutate()
    } finally {
      setRevokingToken(null)
    }
  }

  async function handleRevokeOthers() {
    setRevokingOthers(true)
    try {
      await authClient.revokeOtherSessions()
      await mutate()
    } finally {
      setRevokingOthers(false)
    }
  }

  const currentToken = sessionData?.session?.token
  const sorted = sessions
    ? [...sessions].sort((a, b) => (a.token === currentToken ? -1 : b.token === currentToken ? 1 : 0))
    : []
  const hasOthers = sorted.some((s) => s.token !== currentToken)

  return (
    <Card>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <Monitor size={18} style={{ color: "var(--accent)" }} />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
            SESIONES ACTIVAS
          </p>
        </div>
        {hasOthers && (
          <Button variant="ghost" size="sm" onClick={handleRevokeOthers} loading={revokingOthers}>
            Cerrar las demás
          </Button>
        )}
      </div>

      {!sessions ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Cargando…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((s) => {
            const isCurrent = s.token === currentToken
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
              >
                <Monitor size={16} style={{ color: "var(--text-muted)" }} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {parseUserAgent(s.userAgent)}
                    {isCurrent && (
                      <span
                        className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                        style={{ background: "#DCFCE7", color: "#166534" }}
                      >
                        Esta sesión
                      </span>
                    )}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {timeAgo(s.updatedAt ?? s.createdAt)}
                  </p>
                </div>
                {!isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(s.token)}
                    loading={revokingToken === s.token}
                  >
                    Cerrar
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// ORGANIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════
function OrganizacionTab() {
  const { organization, roles, memberships } = usePermissions()
  const roleLabel = roles.map((r) => ROLE_LABELS[r]).find(Boolean) ?? roles[0]
  const activeMembership = memberships.find((m) => m.organizationId === organization?.id)

  if (!organization) {
    return (
      <Card>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No perteneces a ninguna organización todavía.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <Building2 size={18} style={{ color: "var(--accent)" }} />
        <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
          NEGOCIO ACTUAL
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-5">
        <h3 className="font-display text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          {organization.name}
        </h3>
        <PlanBadge plan={organization.membership as Plan} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <InfoStat
          icon={<ShieldCheck size={12} style={{ color: "var(--text-muted)" }} />}
          label="Tu rol"
          value={roleLabel ?? "—"}
        />
        <InfoStat
          icon={<Clock size={12} style={{ color: "var(--text-muted)" }} />}
          label="Fecha de ingreso"
          value={
            activeMembership?.joinedAt
              ? new Date(activeMembership.joinedAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })
              : "—"
          }
        />
      </div>

      <Link href="/configuracion/equipo">
        <Button variant="ghost">
          Ver organización
          <ExternalLink size={14} />
        </Button>
      </Link>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CUENTA (acciones sensibles)
// ═══════════════════════════════════════════════════════════════════════════
function CuentaTab() {
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOutEverywhere() {
    setSigningOut(true)
    try {
      await authClient.revokeSessions()
      window.location.replace("/login")
    } catch {
      setSigningOut(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <LogOut size={18} style={{ color: "var(--text-muted)" }} />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
            SESIÓN
          </p>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Cierra tu sesión en todos los dispositivos, incluido este. Tendrás que volver a iniciar sesión.
        </p>
        <Button variant="ghost" onClick={handleSignOutEverywhere} loading={signingOut}>
          <LogOut size={14} />
          Cerrar sesión en todos los dispositivos
        </Button>
      </Card>

      <div
        className="rounded-2xl p-6 flex flex-col gap-4"
        style={{ background: "var(--bg-surface)", border: "1px solid #FECACA" }}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} style={{ color: "#EF4444" }} />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "#991B1B" }}>
            ZONA DE RIESGO
          </p>
        </div>
        <DeleteAccountSection />
      </div>
    </div>
  )
}

function DeleteAccountSection() {
  const { data: ownedOrgs } = useSWR(
    "owned-organizations",
    () => getOwnedOrganizations().then((r) => r.data),
    { revalidateOnFocus: false }
  )
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (ownedOrgs === undefined) {
    return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Verificando…</p>
  }

  if (ownedOrgs.length > 0) {
    const names = ownedOrgs.map((o) => o.name).join(", ")
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold" style={{ color: "#991B1B" }}>
          No puedes eliminar tu cuenta todavía
        </p>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Eres el propietario de {ownedOrgs.length === 1 ? "este negocio" : "estos negocios"}:{" "}
          <strong style={{ color: "var(--text-primary)" }}>{names}</strong>. Antes debes transferir la
          propiedad a otro miembro del equipo, o eliminar completamente la organización.
        </p>
        <div>
          <Link href="/configuracion/equipo">
            <Button variant="ghost" size="sm">
              Ir a Equipo
              <ExternalLink size={13} />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const { error: err } = await authClient.deleteUser()
      if (err) {
        setError(err.message ?? "No se pudo eliminar la cuenta.")
        return
      }
      window.location.replace("/login")
    } catch {
      setError("No se pudo eliminar la cuenta.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Esto elimina tu cuenta personal de forma permanente. No se puede deshacer.
      </p>

      {!confirming ? (
        <div>
          <Button variant="danger" onClick={() => setConfirming(true)}>
            <Trash2 size={14} />
            Eliminar cuenta
          </Button>
        </div>
      ) : (
        <div
          className="flex flex-col gap-3 p-4 rounded-xl"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
        >
          <p className="text-sm" style={{ color: "#7F1D1D" }}>
            Escribe <strong>ELIMINAR</strong> para confirmar. Esta acción no se puede deshacer.
          </p>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="ELIMINAR" />
          {error && <p className="text-xs" style={{ color: "#EF4444" }}>{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => { setConfirming(false); setConfirmText(""); setError(null) }}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              disabled={confirmText !== "ELIMINAR" || deleting}
              onClick={handleDelete}
            >
              {deleting ? "Eliminando..." : "Eliminar mi cuenta definitivamente"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
