"use client"

import useSWR from "swr"
import { useState, useMemo } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"
import { usePermissions } from "@/hooks/usePermissions"
import {
  getMembers, updateMemberRole, removeMember,
  getInvitations, sendInvitation, revokeInvitation,
  getAvailableRoles,
} from "@/lib/api"
import type { OrgMember, Invitation } from "@/lib/api"
import {
  Shield, UserMinus, Send, XCircle, MoreVertical, ChevronDown,
  Mail, Clock, CheckCircle2, Users,
} from "lucide-react"

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

export default function EquipoPage() {
  const { can, featureLimit } = usePermissions()
  const canManage = can("members", "update")
  const canInvite = can("invitations", "create")

  const { data: members = [], mutate: mutateMembers } = useSWR(
    "org-members",
    () => getMembers().then((r) => r.data ?? []),
    { revalidateOnFocus: false }
  )
  const { data: availableRoles = [] } = useSWR(
    canManage || canInvite ? "roles-available" : null,
    () => getAvailableRoles().then((r) => r.data ?? []),
    { revalidateOnFocus: false }
  )
  const { data: invitations = [], mutate: mutateInvitations } = useSWR(
    canInvite ? "invitations" : null,
    () => getInvitations().then((r) => r.data ?? []),
    { revalidateOnFocus: false }
  )

  const maxUsers = featureLimit("max_users")

  // ── Cambiar rol ──
  const [roleTarget, setRoleTarget] = useState<OrgMember | null>(null)
  const [newRole, setNewRole] = useState("")
  const [roleSaving, setRoleSaving] = useState(false)

  async function handleRoleChange() {
    if (!roleTarget || !newRole) return
    setRoleSaving(true)
    try {
      await updateMemberRole(roleTarget.userId, newRole)
      await mutateMembers()
      setRoleTarget(null)
    } finally {
      setRoleSaving(false)
    }
  }

  // ── Expulsar ──
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null)
  const [removeSaving, setRemoveSaving] = useState(false)

  async function handleRemove() {
    if (!removeTarget) return
    setRemoveSaving(true)
    try {
      await removeMember(removeTarget.userId)
      await mutateMembers()
      setRemoveTarget(null)
    } finally {
      setRemoveSaving(false)
    }
  }

  // ── Invitar ──
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<{ type: "ok" | "error"; text: string } | null>(null)
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [now] = useState(() => Date.now())

  const effectiveRole = role || availableRoles[0]?.slug || ""
  const pending = useMemo(
    () => invitations
      .filter((i) => i.status === "pending")
      .map((i) => ({
        ...i,
        daysLeft: Math.max(0, Math.ceil((new Date(i.expiresAt).getTime() - now) / 86400000)),
      })),
    [invitations, now]
  )

  async function handleInvite() {
    if (!email.trim() || !email.includes("@") || !effectiveRole) return
    setSending(true)
    setMsg(null)
    try {
      await sendInvitation(email.trim(), effectiveRole)
      await mutateInvitations()
      setEmail("")
      setMsg({ type: "ok", text: "Invitación enviada" })
      setTimeout(() => setMsg(null), 4000)
    } catch (err) {
      const text =
        err instanceof Error && err.message && !err.message.startsWith("HTTP")
          ? err.message
          : "Error al enviar la invitación."
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
      await mutateInvitations()
      setRevokeTarget(null)
    } finally {
      setRevoking(false)
    }
  }

  const seatsUsed = members.length + pending.length

  return (
    <div className="flex flex-col gap-5">
      {/* Uso del límite de usuarios */}
      {maxUsers != null && (
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Users size={16} style={{ color: "var(--accent)" }} />
            <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
              CUPO DE TU MEMBRESÍA
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-secondary)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (seatsUsed / maxUsers) * 100)}%`,
                  background: seatsUsed >= maxUsers ? "#EF4444" : "var(--accent)",
                }}
              />
            </div>
            <span className="text-sm font-semibold shrink-0" style={{ color: "var(--text-primary)" }}>
              {seatsUsed}/{maxUsers} usuarios
            </span>
          </div>
          {pending.length > 0 && (
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              Incluye {pending.length} invitación{pending.length !== 1 ? "es" : ""} pendiente{pending.length !== 1 ? "s" : ""}.
            </p>
          )}
        </Card>
      )}

      {/* Invitar (solo con permiso) */}
      {canInvite && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <Send size={18} style={{ color: "var(--accent)" }} />
            <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
              INVITAR MIEMBRO
            </p>
          </div>

          <div className="flex gap-3 items-end flex-wrap">
            <div className="flex-1" style={{ minWidth: 200 }}>
              <Input
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setMsg(null) }}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div style={{ width: 170 }}>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                Rol
              </label>
              <div className="relative">
                <select
                  value={effectiveRole}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full appearance-none"
                  style={{
                    height: "40px", paddingLeft: "12px", paddingRight: "32px",
                    borderRadius: "10px", border: "1px solid var(--border-light)",
                    background: "var(--bg-surface)", color: "var(--text-primary)",
                    fontSize: "14px", outline: "none", cursor: "pointer",
                  }}
                >
                  {availableRoles.map((r) => (
                    <option key={r.slug} value={r.slug}>{r.name}</option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: "absolute", right: "10px", top: "50%",
                    transform: "translateY(-50%)", color: "var(--text-muted)",
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
            <p className="text-xs mt-3" style={{ color: msg.type === "error" ? "#EF4444" : "#16A34A" }}>
              {msg.text}
            </p>
          )}
        </Card>
      )}

      {/* Miembros */}
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
                className="flex items-center gap-3 p-3 rounded-xl"
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
                {canManage && !m.isOwner && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { setRoleTarget(m); setNewRole(m.roles[0]?.slug ?? "") }}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: "var(--text-muted)", border: "none", background: "transparent", cursor: "pointer" }}
                      title="Cambiar rol"
                    >
                      <MoreVertical size={14} />
                    </button>
                    <button
                      onClick={() => setRemoveTarget(m)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: "#EF4444", border: "none", background: "transparent", cursor: "pointer" }}
                      title="Expulsar"
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

      {/* Invitaciones pendientes */}
      {canInvite && pending.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <Clock size={18} style={{ color: "#D97706" }} />
            <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
              INVITACIONES PENDIENTES ({pending.length})
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
                    className="p-1.5 rounded-lg shrink-0"
                    style={{ color: "#EF4444", border: "none", background: "transparent", cursor: "pointer" }}
                    title="Revocar"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Historial de invitaciones */}
      {canInvite && invitations.some((i) => i.status !== "pending") && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <CheckCircle2 size={18} style={{ color: "var(--text-muted)" }} />
            <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
              HISTORIAL
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {invitations.filter((i) => i.status !== "pending").map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", opacity: 0.7 }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: inv.status === "accepted" ? "#ECFDF5" : "var(--bg-secondary)",
                    color: inv.status === "accepted" ? "#16A34A" : "var(--text-muted)",
                  }}>
                  {inv.status === "accepted" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ color: "var(--text-primary)" }}>{inv.email}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {inv.status === "accepted" ? "Aceptada" : "Revocada"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

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
                  cursor: "pointer",
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

      {/* Modal: expulsar */}
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

      {/* Modal: revocar invitación */}
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
          ¿Revocar la invitación a <strong style={{ color: "var(--text-primary)" }}>{revokeTarget?.email}</strong>?
        </p>
      </Modal>
    </div>
  )
}
