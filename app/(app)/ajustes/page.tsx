"use client"

import useSWR from "swr"
import { useState, useMemo } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Card from "@/components/ui/Card"
import Badge from "@/components/ui/Badge"
import Modal from "@/components/ui/Modal"
import { useUpgradeModal } from "@/components/app/settings/UpgradeModalProvider"
import { usePermissions } from "@/hooks/usePermissions"
import {
  getCurrentOrganization, updateOrganization, getCurrentPlan,
  getMyProfile, updateMyProfile,
  getMembers, updateMemberRole, removeMember,
  getInvitations, sendInvitation, revokeInvitation,
  getAvailableRoles,
} from "@/lib/api"
import type { OrgMember, Invitation, AssignableRole } from "@/lib/api"
import { type Plan } from "@/config/features"
import {
  User, Building2, Mail, CreditCard, Clock, CheckCircle2, Lock,
  ArrowUpRight, Crown, GraduationCap, Zap, Shield, UserMinus,
  Send, XCircle, MoreVertical, ChevronDown,
} from "lucide-react"

// ─── Config ──────────────────────────────────────────────────────────────────

const PLAN_CONFIG: Record<Plan, { label: string; bg: string; color: string; icon: typeof Zap }> = {
  free: { label: "Free", bg: "var(--bg-secondary)", color: "var(--text-muted)", icon: Zap },
  pro: { label: "Pro", bg: "var(--accent-light)", color: "var(--accent-text)", icon: Crown },
  academia: { label: "Academia", bg: "#FEF3C7", color: "#92400E", icon: GraduationCap },
}

// Colores por slug de rol; el label viene de la API (roles.name)
const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  org_owner: { color: "#92400E", bg: "#FEF3C7" },
  org_manager: { color: "#6D28D9", bg: "#EDE9FE" },
  org_chef: { color: "#1E40AF", bg: "#DBEAFE" },
  org_cost_analyst: { color: "#0369A1", bg: "#E0F2FE" },
  org_viewer: { color: "#374151", bg: "#F3F4F6" },
  academic_teacher: { color: "#065F46", bg: "#D1FAE5" },
  academic_assistant: { color: "#065F46", bg: "#ECFDF5" },
  academic_student: { color: "#065F46", bg: "#D1FAE5" },
}

function roleColor(slug: string) {
  return ROLE_COLORS[slug] ?? { color: "var(--text-muted)", bg: "var(--bg-secondary)" }
}

type Tab = "perfil" | "organizacion" | "invitaciones"

const TABS: { key: Tab; label: string; icon: typeof User }[] = [
  { key: "perfil", label: "Perfil", icon: User },
  { key: "organizacion", label: "Organización", icon: Building2 },
  { key: "invitaciones", label: "Invitaciones", icon: Mail },
]

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AjustesPage() {
  const { open: openUpgradeModal } = useUpgradeModal()
  const { can } = usePermissions()
  const [activeTab, setActiveTab] = useState<Tab>("perfil")

  const isAdmin = can("organization", "update")

  const visibleTabs = isAdmin
    ? TABS
    : TABS.filter((t) => t.key === "perfil")

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <PageHeader
        title="Ajustes"
        subtitle={isAdmin ? "Gestiona tu perfil, organización y equipo" : "Gestiona tu perfil"}
      />

      {/* Tabs */}
      <div
        style={{
          display: "inline-flex",
          borderRadius: "14px",
          border: "1px solid var(--border-light)",
          background: "var(--bg-surface)",
          padding: "4px",
          gap: "4px",
        }}
      >
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 18px",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 500,
                border: "none",
                background: active ? "var(--accent)" : "transparent",
                color: active ? "#fff" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      {activeTab === "perfil" && <PerfilTab />}
      {activeTab === "organizacion" && <OrganizacionTab openUpgradeModal={openUpgradeModal} />}
      {activeTab === "invitaciones" && <InvitacionesTab />}
    </div>
  )
}

// ─── Tab: Perfil ─────────────────────────────────────────────────────────────

function PerfilTab() {
  const { data: profile, mutate: mutateProfile } = useSWR(
    "my-profile",
    () => getMyProfile().then((r) => r.data),
    { revalidateOnFocus: false }
  )

  const [name, setName] = useState("")
  const [nameInit, setNameInit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  if (profile?.name && !nameInit) {
    setName(profile.name)
    setNameInit(true)
  }

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

  return (
    <Card>
      <div className="flex items-center gap-3 mb-5">
        <User size={18} style={{ color: "var(--accent)" }} />
        <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
          MI PERFIL
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Avatar + nombre */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: "var(--accent-light)", color: "var(--accent)" }}
          >
            {profile?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1">
            <Input
              label="Nombre"
              value={name}
              onChange={(e) => { setName(e.target.value); setMsg(null) }}
              placeholder="Tu nombre"
            />
          </div>
        </div>

        {/* Email (read-only) */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <Mail size={14} style={{ color: "var(--text-muted)" }} />
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Correo electrónico</p>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {profile?.email ?? "—"}
            </p>
          </div>
        </div>

        {/* Miembro desde */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
        >
          <Clock size={14} style={{ color: "var(--text-muted)" }} />
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Miembro desde</p>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })
                : "—"}
            </p>
          </div>
        </div>

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
  )
}

// ─── Tab: Organización ───────────────────────────────────────────────────────

function OrganizacionTab({ openUpgradeModal }: { openUpgradeModal: () => void }) {
  const { data: orgData, mutate: mutateOrg } = useSWR(
    "organization-me",
    () => getCurrentOrganization().then((r) => r.data),
    { revalidateOnFocus: false }
  )
  const { data: planData } = useSWR(
    "current-plan",
    () => getCurrentPlan().then((r) => r.data),
    { revalidateOnFocus: false }
  )
  const { data: members = [], mutate: mutateMembers } = useSWR(
    "org-members",
    () => getMembers().then((r) => r.data ?? []),
    { revalidateOnFocus: false }
  )
  const { data: availableRoles = [] } = useSWR(
    "roles-available",
    () => getAvailableRoles().then((r) => r.data ?? []),
    { revalidateOnFocus: false }
  )

  const [orgName, setOrgName] = useState("")
  const [nameInit, setNameInit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [confirmNameOpen, setConfirmNameOpen] = useState(false)
  const [pendingName, setPendingName] = useState("")

  // Role change state
  const [roleTarget, setRoleTarget] = useState<OrgMember | null>(null)
  const [newRole, setNewRole] = useState("")
  const [roleSaving, setRoleSaving] = useState(false)

  // Remove state
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null)
  const [removeSaving, setRemoveSaving] = useState(false)

  if (orgData?.name && !nameInit) {
    setOrgName(orgData.name)
    setNameInit(true)
  }

  const plan = planData
  const displayPlan: Plan = (plan?.membership as Plan) ?? "free"
  const planConfig = PLAN_CONFIG[displayPlan]
  const PlanIcon = planConfig.icon
  const includedFeatures = plan?.features.filter((f) => f.enabled) ?? []

  function handleRequestSaveName() {
    if (!orgName.trim() || orgName === orgData?.name) return
    setPendingName(orgName.trim())
    setConfirmNameOpen(true)
  }

  async function confirmSaveName() {
    if (!orgData) return
    setSaving(true)
    setMsg(null)
    try {
      await updateOrganization(orgData.id, { name: pendingName })
      await mutateOrg()
      setMsg("Nombre actualizado")
      setConfirmNameOpen(false)
      setTimeout(() => setMsg(null), 3000)
    } catch {
      setMsg("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleRoleChange() {
    if (!roleTarget || !newRole) return
    setRoleSaving(true)
    try {
      await updateMemberRole(roleTarget.userId, newRole)
      await mutateMembers()
      setRoleTarget(null)
    } catch {
      // silent
    } finally {
      setRoleSaving(false)
    }
  }

  async function handleRemove() {
    if (!removeTarget) return
    setRemoveSaving(true)
    try {
      await removeMember(removeTarget.userId)
      await mutateMembers()
      setRemoveTarget(null)
    } catch {
      // silent
    } finally {
      setRemoveSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Datos del negocio */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <Building2 size={18} style={{ color: "var(--accent)" }} />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
            NEGOCIO
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label="Nombre del negocio"
                value={orgName}
                onChange={(e) => { setOrgName(e.target.value); setMsg(null) }}
                placeholder="Mi restaurante"
              />
            </div>
            <Button
              variant="primary"
              onClick={handleRequestSaveName}
              disabled={saving || !orgName.trim() || orgName === orgData?.name}
              className="mb-0.5"
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
          {msg && (
            <p className="text-xs" style={{ color: msg.includes("Error") ? "#EF4444" : "#16A34A" }}>
              {msg}
            </p>
          )}
        </div>
      </Card>

      {/* Suscripción */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <CreditCard size={18} style={{ color: "var(--accent)" }} />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
            SUSCRIPCIÓN
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: planConfig.bg, border: `1px solid ${planConfig.color}30` }}>
            <div className="flex items-center gap-3">
              <PlanIcon size={20} style={{ color: planConfig.color }} />
              <div>
                <p className="text-sm font-bold" style={{ color: planConfig.color }}>
                  Plan {planConfig.label}
                </p>
                {plan && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {plan.planInfo.priceLabel}
                    {plan.planInfo.price > 0 && <span className="ml-1">/mes</span>}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={displayPlan === "free" ? "muted" : "accent"}>
              {displayPlan === "free" ? "Actual" : "Activo"}
            </Badge>
          </div>

          {plan?.isTrialing && plan.daysLeft > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "var(--accent-light)", border: "1px solid var(--accent)" }}>
              <Clock size={16} style={{ color: "var(--accent)" }} />
              <div className="flex-1">
                <p className="text-sm" style={{ color: "var(--accent-text)" }}>
                  Tu prueba Pro termina en <strong>{plan.daysLeft} días</strong>
                </p>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border-light)" }}>
                  <div className="h-full rounded-full" style={{
                    width: `${Math.max(5, (plan.daysLeft / 14) * 100)}%`,
                    background: "var(--accent)",
                  }} />
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              FUNCIONES INCLUIDAS
            </p>
            <div className="grid grid-cols-2 gap-2">
              {includedFeatures.map((f) => (
                <div key={f.key} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "#ECFDF5" }}>
                    <CheckCircle2 size={12} style={{ color: "#16A34A" }} />
                  </div>
                  <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                    {f.label}
                    {f.limit != null && (
                      <span className="ml-1" style={{ color: "var(--text-muted)" }}>
                        (hasta {f.limit})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={() => openUpgradeModal()} className="flex items-center gap-2">
              <ArrowUpRight size={14} />
              {displayPlan === "free" ? "Mejorar plan" : "Cambiar plan"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Miembros del equipo */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <Shield size={18} style={{ color: "var(--accent)" }} />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
            EQUIPO ({members.length})
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {members.map((m) => {
            const primaryRole = m.roles[0]
            const roleInfo = primaryRole
              ? { label: primaryRole.name, ...roleColor(primaryRole.slug) }
              : { label: "Sin rol", color: "var(--text-muted)", bg: "var(--bg-secondary)" }
            return (
              <div
                key={m.userId}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                >
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                    {m.name}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                    {m.email}
                  </p>
                </div>
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                  style={{ background: roleInfo.bg, color: roleInfo.color }}
                >
                  {roleInfo.label}
                </span>
                {!m.isOwner && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { setRoleTarget(m); setNewRole(m.roles[0]?.slug ?? "") }}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: "var(--text-muted)" }}
                      title="Cambiar rol"
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-secondary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <MoreVertical size={14} />
                    </button>
                    <button
                      onClick={() => setRemoveTarget(m)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: "#EF4444" }}
                      title="Expulsar"
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {members.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
              No hay miembros registrados.
            </p>
          )}
        </div>
      </Card>

      {/* Modal: cambiar rol */}
      <Modal
        open={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        title="Cambiar rol"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRoleTarget(null)} disabled={roleSaving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleRoleChange} disabled={roleSaving || !newRole}>
              {roleSaving ? "Guardando..." : "Confirmar"}
            </Button>
          </div>
        }
      >
        <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
          Cambiar el rol de <strong style={{ color: "var(--text-primary)" }}>{roleTarget?.name}</strong>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {availableRoles.map((r) => {
            const info = roleColor(r.slug)
            const selected = newRole === r.slug
            return (
              <button
                key={r.slug}
                onClick={() => setNewRole(r.slug)}
                className="p-3 rounded-xl text-sm font-medium transition-all text-left"
                style={{
                  border: `2px solid ${selected ? info.color : "var(--border-light)"}`,
                  background: selected ? info.bg : "var(--bg-primary)",
                  color: selected ? info.color : "var(--text-secondary)",
                }}
              >
                <span className="block">{r.name}</span>
                {r.description && (
                  <span className="block text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {r.description}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </Modal>

      {/* Modal: expulsar miembro */}
      <Modal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Expulsar miembro"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRemoveTarget(null)} disabled={removeSaving}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleRemove} disabled={removeSaving}>
              {removeSaving ? "Expulsando..." : "Expulsar"}
            </Button>
          </div>
        }
      >
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          ¿Expulsar a <strong style={{ color: "var(--text-primary)" }}>{removeTarget?.name}</strong> de la organización?
          Esta persona perderá acceso a todos los datos.
        </p>
      </Modal>

      {/* Modal: confirmar nombre */}
      <Modal
        open={confirmNameOpen}
        onClose={() => setConfirmNameOpen(false)}
        title="Cambiar nombre del negocio"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmNameOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirmSaveName} disabled={saving}>
              {saving ? "Guardando..." : "Confirmar"}
            </Button>
          </div>
        }
      >
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          ¿Estás seguro de cambiar el nombre a{" "}
          <strong style={{ color: "var(--text-primary)" }}>&ldquo;{pendingName}&rdquo;</strong>?
        </p>
      </Modal>
    </div>
  )
}

// ─── Tab: Invitaciones ───────────────────────────────────────────────────────

function InvitacionesTab() {
  const { data: invitations = [], mutate } = useSWR(
    "invitations",
    () => getInvitations().then((r) => r.data ?? []),
    { revalidateOnFocus: false }
  )
  const { data: availableRoles = [] } = useSWR(
    "roles-available",
    () => getAvailableRoles().then((r) => r.data ?? []),
    { revalidateOnFocus: false }
  )

  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [now] = useState(() => Date.now())
  const pending = useMemo(
    () => invitations
      .filter((i) => i.status === "pending")
      .map((i) => ({
        ...i,
        daysLeft: Math.max(0, Math.ceil((new Date(i.expiresAt).getTime() - now) / 86400000)),
      })),
    [invitations, now]
  )
  const processed = useMemo(() => invitations.filter((i) => i.status !== "pending"), [invitations])

  // Rol por defecto: el primero disponible según la membresía
  const effectiveRole = role || availableRoles[0]?.slug || ""

  async function handleInvite() {
    if (!email.trim() || !email.includes("@") || !effectiveRole) return
    setSending(true)
    setMsg(null)
    try {
      await sendInvitation(email.trim(), effectiveRole)
      await mutate()
      setEmail("")
      setMsg({ type: "ok", text: "Invitación enviada" })
      setTimeout(() => setMsg(null), 4000)
    } catch (err) {
      const text =
        err instanceof Error && err.message !== "" && !err.message.startsWith("HTTP")
          ? err.message
          : "Error al enviar invitación. Puede que ya exista una invitación pendiente o hayas alcanzado el límite de tu membresía."
      setMsg({ type: "error", text })
    } finally {
      setSending(false)
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      await revokeInvitation(revokeTarget.id)
      await mutate()
      setRevokeTarget(null)
    } catch {
      // silent
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Formulario de invitación */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <Send size={18} style={{ color: "var(--accent)" }} />
          <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
            INVITAR MIEMBRO
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Invita a un colega por correo electrónico. Recibirá un enlace para unirse a tu organización.
          </p>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setMsg(null) }}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div style={{ width: 140 }}>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                Rol
              </label>
              <div className="relative">
                <select
                  value={effectiveRole}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full appearance-none"
                  style={{
                    height: "40px",
                    paddingLeft: "12px",
                    paddingRight: "32px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-light)",
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    fontSize: "14px",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  {availableRoles.map((r) => (
                    <option key={r.slug} value={r.slug}>{r.name}</option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
            <Button
              variant="primary"
              onClick={handleInvite}
              disabled={sending || !email.trim() || !email.includes("@")}
            >
              {sending ? "Enviando..." : "Invitar"}
            </Button>
          </div>

          {msg && (
            <p className="text-xs" style={{ color: msg.type === "error" ? "#EF4444" : "#16A34A" }}>
              {msg.text}
            </p>
          )}

          <div
            className="flex items-start gap-2 p-3 rounded-xl text-xs"
            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}
          >
            <Lock size={12} className="mt-0.5 shrink-0" style={{ color: "#D97706" }} />
            <p style={{ color: "#92400E" }}>
              Si el correo ya tiene una cuenta registrada, se le notificará que se eliminarán sus datos actuales si acepta la invitación.
            </p>
          </div>
        </div>
      </Card>

      {/* Invitaciones pendientes */}
      {pending.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <Clock size={18} style={{ color: "#D97706" }} />
            <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
              PENDIENTES ({pending.length})
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {pending.map((inv) => {
              const roleInfo = { label: inv.roleName ?? inv.roleSlug, ...roleColor(inv.roleSlug) }
              return (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "#FEF3C7", color: "#D97706" }}>
                    <Mail size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {inv.email}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Enviada por {inv.invitedByName} · Expira en {inv.daysLeft}d
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: roleInfo.bg, color: roleInfo.color }}>
                    {roleInfo.label}
                  </span>
                  <button
                    onClick={() => setRevokeTarget(inv)}
                    className="p-1.5 rounded-lg transition-colors shrink-0"
                    style={{ color: "#EF4444" }}
                    title="Revocar"
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Historial */}
      {processed.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <CheckCircle2 size={18} style={{ color: "var(--text-muted)" }} />
            <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
              HISTORIAL
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {processed.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", opacity: 0.7 }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: inv.status === "accepted" ? "#ECFDF5" : "var(--bg-secondary)", color: inv.status === "accepted" ? "#16A34A" : "var(--text-muted)" }}>
                  {inv.status === "accepted" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                    {inv.email}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {inv.status === "accepted" ? "Aceptada" : "Revocada"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal: revocar */}
      <Modal
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="Revocar invitación"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRevokeTarget(null)} disabled={revoking}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleRevoke} disabled={revoking}>
              {revoking ? "Revocando..." : "Revocar"}
            </Button>
          </div>
        }
      >
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          ¿Revocar la invitación de{" "}
          <strong style={{ color: "var(--text-primary)" }}>{revokeTarget?.email}</strong>?
          Ya no podrá unirse con este enlace.
        </p>
      </Modal>
    </div>
  )
}
