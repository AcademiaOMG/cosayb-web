"use client"

import useSWR from "swr"
import { useState } from "react"
import { usePermissions } from "@/hooks/usePermissions"
import {
  platformListRoles, platformListPermissions,
  platformGetRolePermissions, platformSetRolePermissions,
} from "@/lib/api"
import { Drama } from "lucide-react"

const SCOPE_LABEL: Record<string, string> = {
  platform: "Plataforma",
  organization: "Organización",
  user: "Usuario",
}

export default function RolesPage() {
  const { platformCan } = usePermissions()
  const { data: roles = [] } = useSWR("platform-roles", () =>
    platformListRoles().then((r) => r.data)
  )
  const { data: permissions = [] } = useSWR("platform-permissions", () =>
    platformListPermissions().then((r) => r.data)
  )

  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null

  const { data: rolePerms, mutate: mutateRolePerms } = useSWR(
    selectedRoleId ? ["role-perms", selectedRoleId] : null,
    () => platformGetRolePermissions(selectedRoleId!).then((r) => r.data)
  )

  const [pending, setPending] = useState<Set<string> | null>(null)
  const [saving, setSaving] = useState(false)
  const canEdit = platformCan("platform_permissions", "update")

  const currentPermIds = pending ?? new Set((rolePerms ?? []).map((p) => p.id))

  function togglePerm(permId: string) {
    if (!canEdit) return
    const base = pending ?? new Set((rolePerms ?? []).map((p) => p.id))
    const next = new Set(base)
    if (next.has(permId)) next.delete(permId)
    else next.add(permId)
    setPending(next)
  }

  async function save() {
    if (!selectedRoleId || !pending) return
    setSaving(true)
    try {
      await platformSetRolePermissions(selectedRoleId, [...pending])
      await mutateRolePerms()
      setPending(null)
    } finally {
      setSaving(false)
    }
  }

  // Permisos agrupados por recurso
  const byResource = new Map<string, typeof permissions>()
  for (const p of permissions) {
    const list = byResource.get(p.resource) ?? []
    list.push(p)
    byResource.set(p.resource, list)
  }

  // Roles agrupados por scope
  const rolesByScope = new Map<string, typeof roles>()
  for (const r of roles) {
    const list = rolesByScope.get(r.scope) ?? []
    list.push(r)
    rolesByScope.set(r.scope, list)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold console-title">Roles y permisos</h1>
        <p className="text-sm console-muted mt-1">
          Reconfigura la matriz rol × permiso del sistema. Los cambios aplican de inmediato a todos los usuarios.
        </p>
      </div>

      <div className="flex gap-6 items-start flex-col lg:flex-row">
        {/* Lista de roles */}
        <div className="flex flex-col gap-4 shrink-0 w-full lg:w-64">
          {[...rolesByScope.entries()].map(([scope, scopeRoles]) => (
            <div key={scope}>
              <p className="text-[10px] font-bold tracking-[0.15em] console-muted mb-1.5 px-1 uppercase">
                {SCOPE_LABEL[scope] ?? scope}
              </p>
              <div className="flex flex-col gap-1">
                {scopeRoles.map((role) => {
                  const active = role.id === selectedRoleId
                  return (
                    <button
                      key={role.id}
                      onClick={() => { setSelectedRoleId(role.id); setPending(null) }}
                      className="text-left px-3 py-2 rounded-lg text-sm transition-colors"
                      style={{
                        background: active ? "var(--accent-light)" : "transparent",
                        color: active ? "var(--accent)" : "var(--text-secondary)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {role.name}
                      <span className="block text-[10px] console-muted">{role.slug}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Matriz de permisos del rol */}
        <div className="flex-1 min-w-0 w-full">
          {!selectedRole ? (
            <div className="console-card flex flex-col items-center gap-3 py-16">
              <Drama size={32} className="console-muted" />
              <p className="text-sm console-muted">Selecciona un rol para ver y editar sus permisos.</p>
            </div>
          ) : (
            <div className="console-card">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div>
                  <p className="text-sm font-bold console-title">{selectedRole.name}</p>
                  <p className="text-xs console-muted">{currentPermIds.size} permisos asignados</p>
                </div>
                {canEdit && pending && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPending(null)}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-xs console-muted"
                      style={{ background: "transparent", border: "1px solid var(--border-light)", cursor: "pointer" }}
                    >
                      Descartar
                    </button>
                    <button
                      onClick={save}
                      disabled={saving}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer" }}
                    >
                      {saving ? "Guardando…" : "Guardar cambios"}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {[...byResource.entries()].map(([resource, perms]) => (
                  <div key={resource}>
                    <p className="text-[10px] font-bold tracking-widest console-muted mb-1.5 uppercase">
                      {resource}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {perms.map((p) => {
                        const active = currentPermIds.has(p.id)
                        return (
                          <button
                            key={p.id}
                            onClick={() => togglePerm(p.id)}
                            className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors"
                            style={{
                              background: active ? "#ECFDF5" : "transparent",
                              color: active ? "#16A34A" : "var(--text-muted)",
                              border: `1px solid ${active ? "#16A34A" : "var(--border-light)"}`,
                              cursor: canEdit ? "pointer" : "default",
                            }}
                          >
                            {p.action}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
