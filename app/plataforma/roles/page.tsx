"use client"

import useSWR from "swr"
import { useState } from "react"
import { usePermissions } from "@/hooks/usePermissions"
import {
  platformListRoles, platformListPermissions,
  platformGetRolePermissions, platformSetRolePermissions,
  platformListOrganizationRoles, platformDeleteOrganizationRole, platformCreateSystemRole,
} from "@/lib/api"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { Drama, Plus, Trash2, Building2 } from "lucide-react"

const SCOPE_LABEL: Record<string, string> = {
  platform: "Plataforma",
  organization: "Organización",
  user: "Usuario",
}

// Nombres más legibles para roles de sistema (slug → display)
const ROLE_DISPLAY: Record<string, string> = {
  platform_owner:    "Super Admin",
  platform_admin:    "Administrador",
  platform_support:  "Soporte",
  platform_billing:  "Facturación",
  platform_auditor:  "Auditor",
  platform_readonly: "Lector",
  platform_chef:     "Chef de contenido",
  org_owner:         "Propietario",
  org_manager:       "Gerente",
  org_chef:          "Chef",
  org_cost_analyst:  "Analista de costos",
  org_viewer:        "Observador",
  basic_user:        "Usuario básico",
  academic_teacher:  "Docente (academia)",
  academic_assistant:"Asistente (academia)",
  academic_student:  "Estudiante (academia)",
}

export default function RolesPage() {
  const { platformCan } = usePermissions()
  const { data: roles = [], mutate: mutateRoles } = useSWR("platform-roles", () =>
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
  const canCreateRole = platformCan("platform_roles", "create")
  const canDeleteOrgRole = platformCan("platform_roles", "delete")

  const { data: orgRoles = [], mutate: mutateOrgRoles } = useSWR(
    "platform-organization-roles",
    () => platformListOrganizationRoles().then((r) => r.data)
  )
  const [deletingOrgRoleId, setDeletingOrgRoleId] = useState<string | null>(null)

  async function handleDeleteOrgRole(id: string) {
    setDeletingOrgRoleId(id)
    try {
      await platformDeleteOrganizationRole(id)
      await mutateOrgRoles()
    } finally {
      setDeletingOrgRoleId(null)
    }
  }

  // ─── Crear rol de sistema ───────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newScope, setNewScope] = useState<"platform" | "organization" | "user">("organization")
  const [newScopeContext, setNewScopeContext] = useState("")
  const [newTiers, setNewTiers] = useState<Set<"free" | "pro" | "academia">>(new Set())
  const [newPermSlugs, setNewPermSlugs] = useState<Set<string>>(new Set())
  const [creatingRole, setCreatingRole] = useState(false)

  function resetCreateForm() {
    setNewName("")
    setNewDescription("")
    setNewScope("organization")
    setNewScopeContext("")
    setNewTiers(new Set())
    setNewPermSlugs(new Set())
  }

  function toggleNewPerm(slug: string) {
    setNewPermSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  function toggleNewTier(tier: "free" | "pro" | "academia") {
    setNewTiers((prev) => {
      const next = new Set(prev)
      if (next.has(tier)) next.delete(tier)
      else next.add(tier)
      return next
    })
  }

  async function handleCreateRole() {
    if (!newName.trim()) return
    setCreatingRole(true)
    try {
      await platformCreateSystemRole({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        scope: newScope,
        scopeContext: newScope === "organization" ? (newScopeContext || null) : null,
        permissionSlugs: [...newPermSlugs],
        tiers: newScope === "organization" ? [...newTiers] : [],
      })
      setCreateOpen(false)
      resetCreateForm()
      await Promise.all([mutateOrgRoles(), mutateRoles()])
    } finally {
      setCreatingRole(false)
    }
  }

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

  const [showAcademic, setShowAcademic] = useState(false)

  // Slugs ocultos del sidebar (existen en DB pero no se exponen en la UI)
  const HIDDEN_SIDEBAR = new Set([
    "basic_user",
    "org_chef",
    "org_cost_analyst",
    "platform_auditor",
    "platform_billing",
  ])

  // Roles agrupados por scope; académicos van en grupo separado
  const rolesByScope = new Map<string, typeof roles>()
  for (const r of roles) {
    if (HIDDEN_SIDEBAR.has(r.slug)) continue
    const key = r.scopeContext === "academic" ? "academic" : r.scope
    const list = rolesByScope.get(key) ?? []
    list.push(r)
    rolesByScope.set(key, list)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold console-title">Roles y permisos</h1>
          <p className="text-sm console-muted mt-1">
            Reconfigura la matriz rol × permiso del sistema. Los cambios aplican de inmediato a todos los usuarios.
          </p>
        </div>
        {canCreateRole && (
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} />
            Crear rol de sistema
          </Button>
        )}
      </div>

      <div className="flex gap-6 items-start flex-col lg:flex-row">
        {/* Lista de roles */}
        <div className="flex flex-col gap-4 shrink-0 w-full lg:w-64">
          {[...rolesByScope.entries()]
            .filter(([scope]) => scope !== "academic")
            .map(([scope, scopeRoles]) => (
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
                      {ROLE_DISPLAY[role.slug] ?? role.name}
                      <span className="block text-[10px] console-muted">{role.slug}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Roles académicos — colapsados por defecto */}
          {rolesByScope.has("academic") && (
            <div>
              <button
                onClick={() => setShowAcademic((v) => !v)}
                className="text-[10px] font-bold tracking-[0.15em] console-muted mb-1.5 px-1 uppercase w-full text-left flex items-center gap-1"
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                Academia {showAcademic ? "▾" : "▸"}
              </button>
              {showAcademic && (
                <div className="flex flex-col gap-1">
                  {(rolesByScope.get("academic") ?? []).map((role) => {
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
                        {ROLE_DISPLAY[role.slug] ?? role.name}
                        <span className="block text-[10px] console-muted">{role.slug}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
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

      {/* Supervisión: roles personalizados de cualquier organización */}
      <div className="console-card">
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} className="console-muted" />
          <p className="text-sm font-bold console-title">Roles personalizados de organizaciones</p>
        </div>
        {orgRoles.length === 0 ? (
          <p className="text-sm console-muted">Ninguna organización ha creado roles personalizados todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {orgRoles.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                style={{ background: "var(--bg-secondary)" }}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium console-title">{r.name}</span>
                  <span className="text-xs console-muted">
                    {r.organizationName} · {r.memberCount} {r.memberCount === 1 ? "miembro" : "miembros"}
                  </span>
                </div>
                {canDeleteOrgRole && (
                  <button
                    onClick={() => handleDeleteOrgRole(r.id)}
                    disabled={deletingOrgRoleId === r.id}
                    className="p-2 rounded-lg"
                    style={{ color: "#DC2626", background: "transparent", border: "none", cursor: "pointer" }}
                    aria-label={`Eliminar ${r.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: crear rol de sistema */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Crear rol de sistema"
        wide
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button variant="primary" loading={creatingRole} disabled={!newName.trim()} onClick={handleCreateRole}>
              Crear rol
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Nombre del rol"
            placeholder="Ej. Auditor Financiero"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            label="Descripción (opcional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Scope</label>
            <select
              value={newScope}
              onChange={(e) => setNewScope(e.target.value as typeof newScope)}
              className="console-input text-sm px-3"
              style={{ height: 38 }}
            >
              <option value="platform">Plataforma</option>
              <option value="organization">Organización</option>
              <option value="user">Usuario</option>
            </select>
          </div>

          {newScope === "organization" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Contexto (opcional)
                </label>
                <select
                  value={newScopeContext}
                  onChange={(e) => setNewScopeContext(e.target.value)}
                  className="console-input text-sm px-3"
                  style={{ height: 38 }}
                >
                  <option value="">Ninguno</option>
                  <option value="academic">Académico</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Disponible en tiers</p>
                <div className="flex gap-3">
                  {(["free", "pro", "academia"] as const).map((tier) => (
                    <label key={tier} className="flex items-center gap-1.5 text-sm console-muted">
                      <input
                        type="checkbox"
                        checked={newTiers.has(tier)}
                        onChange={() => toggleNewTier(tier)}
                        style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                      />
                      {tier}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Permisos</p>
            {[...byResource.entries()].map(([resource, perms]) => (
              <div key={resource} className="flex flex-col gap-1.5">
                <p className="text-[10px] font-bold tracking-widest console-muted uppercase">{resource}</p>
                <div className="flex flex-wrap gap-3">
                  {perms.map((p) => (
                    <label key={p.slug} className="flex items-center gap-1.5 text-sm console-muted">
                      <input
                        type="checkbox"
                        checked={newPermSlugs.has(p.slug)}
                        onChange={() => toggleNewPerm(p.slug)}
                        style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                      />
                      {p.action}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
