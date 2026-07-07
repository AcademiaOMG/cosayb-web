"use client"

import useSWR from "swr"
import { useState, use } from "react"
import Link from "next/link"
import { usePermissions } from "@/hooks/usePermissions"
import { platformGetUser, platformSetUserPlatformRoles, platformSetUserOrgRole, platformRemoveUserOrgMembership, platformAddUserOrgMembership, platformListOrgs } from "@/lib/api"
import { ArrowLeft, Shield, Building2, Mail, Users, UserPlus } from "lucide-react"

// Roles de plataforma visibles (sin Auditor ni Facturación — demasiado granulares)
const PLATFORM_ROLES = [
  { slug: "platform_owner",    name: "Super Admin",       description: "Control total del SaaS" },
  { slug: "platform_admin",    name: "Administrador",     description: "Administración sin editar permisos" },
  { slug: "platform_support",  name: "Soporte",           description: "Lectura de orgs y usuarios" },
  { slug: "platform_readonly", name: "Lector",            description: "Solo lectura de la plataforma" },
  { slug: "platform_chef",     name: "Chef de contenido", description: "Gestiona los bancos públicos" },
]

// Roles de organización visibles (sin Chef ni Analista de costos)
const ORG_ROLES = [
  { slug: "org_owner",    name: "Propietario", description: "Dueño del negocio" },
  { slug: "org_manager",  name: "Gerente",     description: "Gestión operativa completa" },
  { slug: "org_viewer",   name: "Observador",  description: "Solo lectura" },
]

// ─── Agregar a un negocio ────────────────────────────────────────────────────
function AddOrgMembership({
  userId,
  canUpdate,
  onAdded,
}: {
  userId: string
  canUpdate: boolean
  onAdded: () => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedOrgId, setSelectedOrgId] = useState("")
  const [selectedRole, setSelectedRole] = useState("org_owner")
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const { data: orgsData } = useSWR(
    open ? ["platform-orgs-search", search] : null,
    () => platformListOrgs(search || undefined)
  )
  const orgs = orgsData?.data ?? []

  async function add() {
    if (!selectedOrgId) { setErr("Selecciona una organización"); return }
    setSaving(true); setErr(null)
    try {
      await platformAddUserOrgMembership(userId, selectedOrgId, selectedRole)
      setOpen(false); setSearch(""); setSelectedOrgId(""); setSelectedRole("org_owner")
      onAdded()
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al agregar")
    } finally {
      setSaving(false)
    }
  }

  if (!canUpdate) return null

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
        style={{ background: "var(--accent-light)", color: "var(--accent)", border: "1px solid var(--accent)", cursor: "pointer" }}
      >
        <UserPlus size={14} /> Agregar a un negocio
      </button>
    )
  }

  return (
    <div className="console-card">
      <p className="text-[11px] font-bold tracking-widest console-muted mb-4">AGREGAR A UN NEGOCIO</p>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs console-muted">Buscar organización</label>
          <input
            type="text"
            placeholder="Nombre del negocio…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedOrgId("") }}
            className="console-input text-sm px-3"
            style={{ height: 38 }}
          />
          {orgs.length > 0 && (
            <div className="rounded-xl overflow-hidden mt-1" style={{ border: "1px solid var(--border-light)" }}>
              {orgs.slice(0, 6).map((org) => (
                <button
                  key={org.id}
                  onClick={() => { setSelectedOrgId(org.id); setSearch(org.name) }}
                  className="w-full text-left px-3 py-2 text-sm transition-colors"
                  style={{
                    background: selectedOrgId === org.id ? "var(--accent-light)" : "transparent",
                    color: selectedOrgId === org.id ? "var(--accent)" : "var(--text-primary)",
                    border: "none",
                    borderBottom: "1px solid var(--border-light)",
                    cursor: "pointer",
                  }}
                >
                  {org.name}
                  <span className="text-xs console-muted ml-2">{org.membership}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs console-muted">Rol en la organización</label>
          <div className="grid grid-cols-3 gap-2">
            {ORG_ROLES.map((role) => (
              <button
                key={role.slug}
                onClick={() => setSelectedRole(role.slug)}
                className="text-left px-3 py-2.5 rounded-xl text-sm transition-colors"
                style={{
                  background: selectedRole === role.slug ? "var(--accent-light)" : "transparent",
                  border: `1px solid ${selectedRole === role.slug ? "var(--accent)" : "var(--border-light)"}`,
                  color: selectedRole === role.slug ? "var(--accent)" : "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                <p className="text-sm font-semibold">{role.name}</p>
              </button>
            ))}
          </div>
        </div>

        {err && <p className="text-xs" style={{ color: "#B91C1C" }}>{err}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => { setOpen(false); setErr(null) }}
            className="px-4 py-2 rounded-lg text-sm console-muted"
            style={{ background: "transparent", border: "1px solid var(--border-light)", cursor: "pointer" }}
          >
            Cancelar
          </button>
          <button
            onClick={add}
            disabled={saving || !selectedOrgId}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#fff", border: "none", cursor: saving || !selectedOrgId ? "not-allowed" : "pointer", opacity: !selectedOrgId ? 0.5 : 1 }}
          >
            {saving ? "Agregando…" : "Agregar al negocio"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tarjeta de rol de organización ──────────────────────────────────────────
// pending: undefined = sin cambios | string = rol seleccionado | null = sin rol (quitar del negocio)
function OrgRoleCard({
  userId,
  membership,
  currentSlug,
  canUpdate,
  onChanged,
}: {
  userId: string
  membership: { organizationId: string; organizationName: string; isDefault: boolean }
  currentSlug: string | undefined
  canUpdate: boolean
  onChanged: () => void
}) {
  const [pending, setPending] = useState<string | null | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const dirty = pending !== undefined
  const displayed = dirty ? pending : currentSlug

  function toggle(slug: string) {
    if (!canUpdate) return
    // Clic en el activo → deseleccionar (null = sin rol)
    setPending(slug === displayed ? null : slug)
    setMsg(null)
  }

  function discard() {
    setPending(undefined)
    setMsg(null)
  }

  async function save() {
    if (!dirty) return
    setSaving(true)
    setMsg(null)
    try {
      if (pending === null) {
        await platformRemoveUserOrgMembership(userId, membership.organizationId)
      } else {
        await platformSetUserOrgRole(userId, membership.organizationId, pending!)
      }
      await onChanged()
      setPending(undefined)
      setMsg(pending === null ? "Usuario quitado del negocio" : "Rol actualizado")
      setTimeout(() => setMsg(null), 3000)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="console-card">
      <div className="flex items-center gap-2 mb-1">
        <Users size={14} className="console-muted" />
        <p className="text-[11px] font-bold tracking-widest console-muted">ROL EN ORGANIZACIÓN</p>
      </div>
      <Link
        href={`/plataforma/organizaciones/${membership.organizationId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline mb-4"
        style={{ color: "var(--accent)" }}
      >
        {membership.organizationName}
        {membership.isDefault && (
          <span className="text-[10px] console-muted font-normal ml-1">(principal)</span>
        )}
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {ORG_ROLES.map((role) => {
          const active = role.slug === displayed
          return (
            <button
              key={role.slug}
              disabled={!canUpdate || saving}
              onClick={() => toggle(role.slug)}
              className="text-left px-3.5 py-3 rounded-xl transition-colors"
              style={{
                background: active ? "var(--accent-light)" : "transparent",
                border: `1px solid ${active ? "var(--accent)" : "var(--border-light)"}`,
                cursor: canUpdate && !saving ? "pointer" : "default",
                opacity: !canUpdate ? 0.5 : 1,
              }}
            >
              <p className="text-sm font-semibold" style={{ color: active ? "var(--accent)" : "var(--text-primary)" }}>
                {role.name}
              </p>
              <p className="text-xs console-muted mt-0.5">{role.description}</p>
            </button>
          )
        })}
      </div>

      {pending === null && (
        <p className="text-xs mt-3 console-muted">
          Sin rol seleccionado — guardar quitará al usuario de este negocio.
        </p>
      )}

      {msg && (
        <p className="text-xs mt-3" style={{ color: msg.includes("Error") ? "#B91C1C" : "#16A34A" }}>
          {msg}
        </p>
      )}

      {canUpdate && dirty && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={discard}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm console-muted"
            style={{ background: "transparent", border: "1px solid var(--border-light)", cursor: "pointer" }}
          >
            Descartar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: pending === null ? "#DC2626" : "var(--accent)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            {saving ? "Guardando…" : pending === null ? "Quitar del negocio" : "Guardar rol"}
          </button>
        </div>
      )}

      {!canUpdate && (
        <p className="text-xs console-muted mt-3">Tu rol no permite cambiar el rol de organización.</p>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function UsuarioDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { platformCan } = usePermissions()
  const { data: user, mutate } = useSWR(["platform-user", id], () =>
    platformGetUser(id).then((r) => r.data)
  )

  const canUpdate = platformCan("platform_users", "update")
  const [selected, setSelected] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const currentPlatformRoles = selected ?? user?.platformRoles ?? []

  function toggleRole(slug: string) {
    const base = selected ?? user?.platformRoles ?? []
    setSelected(base.includes(slug) ? base.filter((r) => r !== slug) : [...base, slug])
    setMsg(null)
  }

  async function savePlatformRoles() {
    if (selected == null) return
    setSaving(true)
    setMsg(null)
    try {
      await platformSetUserPlatformRoles(id, selected)
      await mutate()
      setSelected(null)
      setMsg("Roles actualizados")
      setTimeout(() => setMsg(null), 3000)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error al actualizar roles")
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return <p className="text-sm console-muted animate-pulse">Cargando usuario…</p>
  }

  const dirty =
    selected != null &&
    JSON.stringify([...selected].sort()) !== JSON.stringify([...user.platformRoles].sort())

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera */}
      <div>
        <Link
          href="/plataforma/usuarios"
          className="inline-flex items-center gap-1.5 text-xs console-muted mb-3 hover:underline"
        >
          <ArrowLeft size={12} /> Usuarios
        </Link>
        <h1 className="text-2xl font-bold console-title">{user.name}</h1>
        <p className="text-sm console-muted mt-1 inline-flex items-center gap-1.5">
          <Mail size={12} /> {user.email}
        </p>
      </div>

      {/* Negocios — solo info + link */}
      <div className="console-card">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={14} className="console-muted" />
          <p className="text-[11px] font-bold tracking-widest console-muted">
            NEGOCIOS ({user.memberships.length})
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {user.memberships.map((m) => (
            <Link
              key={m.organizationId}
              href={`/plataforma/organizaciones/${m.organizationId}`}
              className="console-row flex items-center gap-3 px-3.5 py-2.5 hover:underline"
            >
              <span className="text-sm console-title flex-1 truncate">
                {m.organizationName}
                {m.isDefault && (
                  <span className="ml-2 text-[10px] console-accent">DEFAULT</span>
                )}
              </span>
            </Link>
          ))}
          {user.memberships.length === 0 && (
            <p className="text-sm console-muted">Sin organizaciones — usuario básico.</p>
          )}
        </div>
        <div className="mt-4">
          <AddOrgMembership userId={user.id} canUpdate={canUpdate} onAdded={mutate} />
        </div>
      </div>

      {/* Rol de organización — grid seleccionable por cada negocio */}
      {user.memberships.map((m) => {
        const orgRole = user.orgRoles.find((r) => r.organizationId === m.organizationId)
        return (
          <OrgRoleCard
            key={m.organizationId}
            userId={id}
            membership={m}
            currentSlug={orgRole?.roleSlug}
            canUpdate={canUpdate}
            onChanged={() => void mutate()}
          />
        )
      })}

      {/* Roles de plataforma */}
      <div className="console-card">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={14} className="console-muted" />
          <p className="text-[11px] font-bold tracking-widest console-muted">ROLES DE PLATAFORMA</p>
          <p className="text-xs console-muted ml-auto">
            Sin rol = usuario de negocio normal
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PLATFORM_ROLES.map((role) => {
            const active = currentPlatformRoles.includes(role.slug)
            return (
              <button
                key={role.slug}
                disabled={!canUpdate}
                onClick={() => toggleRole(role.slug)}
                className="text-left px-3.5 py-3 rounded-xl transition-colors"
                style={{
                  background: active ? "var(--accent-light)" : "transparent",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border-light)"}`,
                  cursor: canUpdate ? "pointer" : "default",
                  opacity: !canUpdate && !active ? 0.45 : 1,
                }}
              >
                <p
                  className="text-sm font-semibold"
                  style={{ color: active ? "var(--accent)" : "var(--text-primary)" }}
                >
                  {role.name}
                </p>
                <p className="text-xs console-muted mt-0.5">{role.description}</p>
              </button>
            )
          })}
        </div>

        {msg && (
          <p
            className="text-xs mt-3"
            style={{
              color: msg.includes("Error") || msg.includes("puedes") ? "#B91C1C" : "#16A34A",
            }}
          >
            {msg}
          </p>
        )}

        {canUpdate && dirty && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => { setSelected(null); setMsg(null) }}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm console-muted"
              style={{
                background: "transparent",
                border: "1px solid var(--border-light)",
                cursor: "pointer",
              }}
            >
              Descartar
            </button>
            <button
              onClick={savePlatformRoles}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}
            >
              {saving ? "Guardando…" : "Guardar roles de plataforma"}
            </button>
          </div>
        )}
        {!canUpdate && (
          <p className="text-xs console-muted mt-3">
            Tu rol no permite modificar roles de plataforma.
          </p>
        )}
      </div>
    </div>
  )
}
