"use client"

import useSWR from "swr"
import { useState, use } from "react"
import Link from "next/link"
import { usePermissions } from "@/hooks/usePermissions"
import { platformGetUser, platformSetUserPlatformRoles } from "@/lib/api"
import { ArrowLeft, Shield, Building2, Mail } from "lucide-react"

const PLATFORM_ROLES = [
  { slug: "platform_owner", name: "Platform Owner", description: "Control total del SaaS" },
  { slug: "platform_admin", name: "Platform Admin", description: "Administración sin edición de permisos" },
  { slug: "platform_support", name: "Support", description: "Lectura de orgs y usuarios" },
  { slug: "platform_billing", name: "Billing", description: "Planes y facturación" },
  { slug: "platform_auditor", name: "Auditor", description: "Lectura de auditoría" },
  { slug: "platform_readonly", name: "Readonly", description: "Solo lectura" },
  { slug: "platform_chef", name: "Chef Global", description: "Alimenta los bancos públicos" },
]

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

  const currentRoles = selected ?? user?.platformRoles ?? []

  function toggleRole(slug: string) {
    const base = selected ?? user?.platformRoles ?? []
    setSelected(base.includes(slug) ? base.filter((r) => r !== slug) : [...base, slug])
    setMsg(null)
  }

  async function saveRoles() {
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

  const dirty = selected != null &&
    JSON.stringify([...selected].sort()) !== JSON.stringify([...user.platformRoles].sort())

  return (
    <div className="flex flex-col gap-6">
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

      {/* Negocios del usuario */}
      <div className="console-card">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={14} className="console-muted" />
          <p className="text-[11px] font-bold tracking-widest console-muted">
            NEGOCIOS ({user.memberships.length})
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {user.memberships.map((m) => {
            const orgRole = user.orgRoles.find((r) => r.organizationId === m.organizationId)
            return (
              <Link
                key={m.organizationId}
                href={`/plataforma/organizaciones/${m.organizationId}`}
                className="console-row flex items-center gap-3 px-3.5 py-2.5"
              >
                <span className="text-sm console-title flex-1 truncate">
                  {m.organizationName}
                  {m.isDefault && <span className="ml-2 text-[10px] console-accent">DEFAULT</span>}
                </span>
                {orgRole && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider"
                    style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                  >
                    {orgRole.roleName.toUpperCase()}
                  </span>
                )}
              </Link>
            )
          })}
          {user.memberships.length === 0 && (
            <p className="text-sm console-muted">Sin organizaciones — usuario básico.</p>
          )}
        </div>
      </div>

      {/* Roles de plataforma */}
      <div className="console-card">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={14} className="console-muted" />
          <p className="text-[11px] font-bold tracking-widest console-muted">ROLES DE PLATAFORMA</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PLATFORM_ROLES.map((role) => {
            const active = currentRoles.includes(role.slug)
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
                <p className="text-sm font-semibold" style={{ color: active ? "var(--accent)" : "var(--text-primary)" }}>
                  {role.name}
                </p>
                <p className="text-xs console-muted mt-0.5">{role.description}</p>
              </button>
            )
          })}
        </div>

        {msg && (
          <p className="text-xs mt-3" style={{ color: msg.includes("Error") || msg.includes("puedes") ? "#B91C1C" : "#16A34A" }}>
            {msg}
          </p>
        )}

        {canUpdate && dirty && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => { setSelected(null); setMsg(null) }}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm console-muted"
              style={{ background: "transparent", border: "1px solid var(--border-light)", cursor: "pointer" }}
            >
              Descartar
            </button>
            <button
              onClick={saveRoles}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}
            >
              {saving ? "Guardando…" : "Guardar roles"}
            </button>
          </div>
        )}
        {!canUpdate && (
          <p className="text-xs console-muted mt-3">Tu rol no permite modificar roles de plataforma.</p>
        )}
      </div>
    </div>
  )
}
