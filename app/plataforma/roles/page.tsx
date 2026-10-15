"use client"

import useSWR from "swr"
import { useMemo, useState } from "react"
import { usePermissions } from "@/hooks/usePermissions"
import {
  platformListRoles, platformListPermissions,
  platformGetRolePermissions, platformSetRolePermissions,
  platformListOrganizationRoles, platformDeleteOrganizationRole, platformCreateSystemRole,
  type PlatformPermissionRow, type PlatformRoleRow,
} from "@/lib/api"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Badge from "@/components/ui/Badge"
import ErrorState from "@/components/ui/ErrorState"
import EmptyState from "@/components/ui/EmptyState"
import { Drama, Plus, Trash2, Building2, Lock, Check, Minus } from "lucide-react"
import { toast } from "@/lib/toast"
import { friendlyError } from "@/lib/errorMessage"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import {
  ROLE_INFO, roleLabel, roleDescription, scopeLabel, membershipLabel,
  permissionLabel, permissionDescription, permissionResourceLabel, permissionGroupLabel, isCriticalPermission,
} from "@/lib/plataforma/labels"

/** Roles que existen en la base pero no se ofrecen para editar en la pantalla. */
const HIDDEN_ROLES = new Set(["basic_user", "org_chef", "org_cost_analyst", "platform_auditor", "platform_billing"])

/** Nombre a mostrar: el del diccionario para roles conocidos; el nombre guardado para los creados a mano. */
function displayName(role: Pick<PlatformRoleRow, "slug" | "name">): string {
  return role.slug in ROLE_INFO || !role.name ? roleLabel(role.slug) : role.name
}

type Group = { group: string; areas: { resource: string; perms: PlatformPermissionRow[] }[] }

/** Permisos agrupados: bloque grande → área → permisos. */
function groupPermissions(permissions: PlatformPermissionRow[]): Group[] {
  const groups = new Map<string, Map<string, PlatformPermissionRow[]>>()
  for (const p of permissions) {
    const g = permissionGroupLabel(p.resource)
    const areas = groups.get(g) ?? new Map<string, PlatformPermissionRow[]>()
    const list = areas.get(p.resource) ?? []
    list.push(p)
    areas.set(p.resource, list)
    groups.set(g, areas)
  }
  return [...groups.entries()].map(([group, areas]) => ({
    group,
    areas: [...areas.entries()].map(([resource, perms]) => ({ resource, perms })),
  }))
}

function TechnicalDetails({ rows }: { rows: [string, string][] }) {
  return (
    <details className="text-xs console-muted">
      <summary className="cursor-pointer select-none">Detalles técnicos</summary>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt>{k}</dt>
            <dd style={{ fontFamily: "monospace", wordBreak: "break-all" }}>{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

/** Lista de casillas de permisos, con etiqueta clara y explicación al pasar el mouse o enfocar. */
function PermissionChecklist({
  groups, isChecked, onToggle, disabledReason, readOnly,
}: {
  groups: Group[]
  isChecked: (p: PlatformPermissionRow) => boolean
  onToggle: (p: PlatformPermissionRow) => void
  /** Motivo por el que una casilla no se puede cambiar (null = se puede). */
  disabledReason?: (p: PlatformPermissionRow) => string | null
  readOnly?: boolean
}) {
  return (
    <div className="flex flex-col gap-5">
      {groups.map(({ group, areas }) => (
        <section key={group} className="flex flex-col gap-3">
          <h3 className="text-xs font-bold tracking-wide console-title uppercase">{group}</h3>
          {areas.map(({ resource, perms }) => (
            <fieldset key={resource} className="m-0 p-0 border-0">
              <legend className="text-sm font-semibold console-title mb-1.5 p-0">
                {permissionResourceLabel(resource)}
              </legend>
              <div className="grid gap-1 sm:grid-cols-2">
                {perms.map((p) => {
                  const reason = disabledReason?.(p) ?? null
                  const description = permissionDescription(p.resource, p.action)
                  const checked = isChecked(p)
                  return (
                    <label
                      key={p.id}
                      title={reason ?? description}
                      className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg text-sm"
                      style={{
                        background: checked ? "var(--accent-light)" : "transparent",
                        border: "1px solid var(--border-light)",
                        cursor: readOnly || reason ? "default" : "pointer",
                        opacity: reason ? 0.75 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={readOnly || !!reason}
                        onChange={() => onToggle(p)}
                        aria-describedby={`perm-desc-${p.id}`}
                        className="mt-0.5"
                        style={{ accentColor: "var(--accent)" }}
                      />
                      <span className="flex flex-col min-w-0">
                        <span className="console-title">{permissionLabel(p.resource, p.action)}</span>
                        <span id={`perm-desc-${p.id}`} className="text-[11px] console-muted">
                          {reason ?? description}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          ))}
        </section>
      ))}
    </div>
  )
}

export default function RolesPage() {
  const { platformCan, platformRoles: myPlatformRoles } = usePermissions()
  const { data: roles = [], error: rolesError, mutate: mutateRoles } = useSWR("platform-roles", () =>
    platformListRoles().then((r) => r.data)
  )
  const { data: permissions = [] } = useSWR("platform-permissions", () =>
    platformListPermissions().then((r) => r.data)
  )

  const [view, setView] = useState<"edit" | "matrix">("edit")
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null

  const { data: rolePerms, mutate: mutateRolePerms } = useSWR(
    selectedRoleId ? ["role-perms", selectedRoleId] : null,
    () => platformGetRolePermissions(selectedRoleId!).then((r) => r.data)
  )

  const [pending, setPending] = useState<Set<string> | null>(null)
  const confirm = useConfirm()
  const [saving, setSaving] = useState(false)
  const canEdit = platformCan("platform_permissions", "update")
  const canCreateRole = platformCan("platform_roles", "create")
  const canDeleteOrgRole = platformCan("platform_roles", "delete")

  const { data: orgRoles = [], mutate: mutateOrgRoles } = useSWR(
    "platform-organization-roles",
    () => platformListOrganizationRoles().then((r) => r.data)
  )
  const [deletingOrgRoleId, setDeletingOrgRoleId] = useState<string | null>(null)

  const visibleRoles = useMemo(() => roles.filter((r) => !HIDDEN_ROLES.has(r.slug)), [roles])
  const groups = useMemo(() => groupPermissions(permissions), [permissions])
  const permById = useMemo(() => new Map(permissions.map((p) => [p.id, p])), [permissions])

  // Matriz: permisos de todos los roles visibles (solo se pide al abrir esa vista)
  const { data: matrix, error: matrixError } = useSWR(
    view === "matrix" && visibleRoles.length > 0 ? ["role-matrix", visibleRoles.map((r) => r.id).join(",")] : null,
    async () => {
      const entries = await Promise.all(
        visibleRoles.map(async (r) => [r.id, new Set((await platformGetRolePermissions(r.id)).data.map((p) => p.id))] as const)
      )
      return new Map(entries)
    }
  )

  const basePermIds = useMemo(() => new Set((rolePerms ?? []).map((p) => p.id)), [rolePerms])
  const currentPermIds = pending ?? basePermIds
  const added = pending ? [...pending].filter((id) => !basePermIds.has(id)) : []
  const removed = pending ? [...basePermIds].filter((id) => !pending.has(id)) : []

  /** Un administrador no puede quitarle a su propio rol los permisos con los que gestiona los roles. */
  const isOwnRole = !!selectedRole && myPlatformRoles.includes(selectedRole.slug)
  function lockedReason(p: PlatformPermissionRow): string | null {
    if (isOwnRole && isCriticalPermission(p.slug) && currentPermIds.has(p.id)) {
      return "No puedes quitarte este permiso a ti mismo: te quedarías sin poder administrar los roles."
    }
    return null
  }

  async function handleDeleteOrgRole(role: { id: string; name: string; memberCount: number }) {
    const ok = await confirm({
      title: "Eliminar rol",
      itemName: role.name,
      description:
        role.memberCount > 0
          ? `Hay ${role.memberCount} ${role.memberCount === 1 ? "persona" : "personas"} con este rol. Esta acción no se puede deshacer.`
          : "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      variant: "danger",
    })
    if (!ok) return
    setDeletingOrgRoleId(role.id)
    try {
      await platformDeleteOrganizationRole(role.id)
      await mutateOrgRoles()
      toast.success("Rol eliminado", { description: role.name })
    } catch (e) {
      toast.error("No se pudo eliminar el rol", {
        description: friendlyError(e, "Revisa tu conexión e inténtalo de nuevo."),
      })
    } finally {
      setDeletingOrgRoleId(null)
    }
  }

  /** Cambiar de rol con permisos editados sin guardar pide confirmación */
  async function selectRole(id: string) {
    if (id === selectedRoleId) return
    if (pending) {
      const ok = await confirm({
        title: "Descartar cambios",
        description: "Tienes cambios de permisos sin guardar. Si cambias de rol, se perderán.",
        confirmLabel: "Descartar",
        cancelLabel: "Seguir editando",
        variant: "danger",
      })
      if (!ok) return
    }
    setSelectedRoleId(id)
    setPending(null)
  }

  function togglePerm(p: PlatformPermissionRow) {
    if (!canEdit || lockedReason(p)) return
    const next = new Set(currentPermIds)
    if (next.has(p.id)) next.delete(p.id)
    else next.add(p.id)
    const same = next.size === basePermIds.size && [...next].every((id) => basePermIds.has(id))
    setPending(same ? null : next)
  }

  async function save() {
    if (!selectedRoleId || !pending) return
    // Defensa extra: nunca enviar un cambio que deje al administrador sin sus permisos críticos
    if (isOwnRole && removed.some((id) => isCriticalPermission(permById.get(id)?.slug ?? ""))) {
      toast.error("No se guardó", { description: "No puedes quitarte permisos críticos a ti mismo." })
      return
    }
    setSaving(true)
    try {
      await platformSetRolePermissions(selectedRoleId, [...pending])
      await mutateRolePerms()
      setPending(null)
      toast.success("Cambios guardados", { description: "Los permisos del rol ya están actualizados." })
    } catch (e) {
      toast.error("No se pudieron guardar los permisos", {
        description: friendlyError(e, "Revisa tu conexión e inténtalo de nuevo."),
      })
    } finally {
      setSaving(false)
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

  function toggleIn<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
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
      const createdName = newName.trim()
      resetCreateForm()
      await Promise.all([mutateOrgRoles(), mutateRoles()])
      toast.success("Rol creado", { description: createdName })
    } catch (e) {
      toast.error("No se pudo crear el rol", {
        description: friendlyError(e, "Revisa los datos e inténtalo de nuevo."),
      })
    } finally {
      setCreatingRole(false)
    }
  }

  // Roles agrupados por alcance; los de academia van en un grupo propio
  const rolesByScope = new Map<string, PlatformRoleRow[]>()
  for (const r of visibleRoles) {
    const key = r.scopeContext === "academic" ? "academic" : r.scope
    rolesByScope.set(key, [...(rolesByScope.get(key) ?? []), r])
  }
  const [showAcademic, setShowAcademic] = useState(false)

  function renderRoleButton(role: PlatformRoleRow) {
    const active = role.id === selectedRoleId
    return (
      <button
        key={role.id}
        onClick={() => void selectRole(role.id)}
        aria-pressed={active}
        className="text-left px-3 py-2 rounded-lg text-sm transition-colors"
        style={{
          background: active ? "var(--accent-light)" : "transparent",
          color: active ? "var(--accent)" : "var(--text-secondary)",
          border: "none",
          cursor: "pointer",
        }}
      >
        {displayName(role)}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold console-title">Roles y permisos</h1>
          <p className="text-sm console-muted mt-1">
            Decide qué puede hacer cada rol. Los cambios se aplican de inmediato a todas las personas que tienen ese rol.
          </p>
        </div>
        {canCreateRole && (
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} />
            Crear rol nuevo
          </Button>
        )}
      </div>

      <div role="tablist" aria-label="Vista" className="flex gap-1">
        {([["edit", "Editar un rol"], ["matrix", "Qué puede hacer cada rol"]] as const).map(([id, text]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{
              background: view === id ? "var(--accent-light)" : "transparent",
              color: view === id ? "var(--accent)" : "var(--text-muted)",
              border: "none",
              cursor: "pointer",
            }}
          >
            {text}
          </button>
        ))}
      </div>

      {rolesError && roles.length === 0 && (
        <ErrorState title="No pudimos cargar los roles" onRetry={() => void mutateRoles()} />
      )}

      {view === "matrix" ? (
        <div className="console-card overflow-x-auto">
          {matrixError ? (
            <ErrorState title="No pudimos cargar la matriz" />
          ) : !matrix ? (
            <p className="text-sm console-muted">Cargando…</p>
          ) : (
            <>
              <p className="text-xs console-muted mb-3">
                <Check size={12} className="inline" aria-hidden /> permiso completo ·{" "}
                <Minus size={12} className="inline" aria-hidden /> algunos permisos del área (pasa el mouse para ver cuáles) · vacío: ninguno
              </p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th scope="col" className="text-left p-2 font-semibold console-title sticky left-0" style={{ background: "var(--bg-surface)" }}>
                      Área
                    </th>
                    {visibleRoles.map((r) => (
                      <th key={r.id} scope="col" className="p-2 text-xs font-semibold console-title align-bottom" style={{ minWidth: 96 }}>
                        {displayName(r)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {groups.flatMap(({ group, areas }) => [
                    <tr key={`g-${group}`}>
                      <th colSpan={visibleRoles.length + 1} scope="colgroup" className="text-left text-[11px] uppercase tracking-wide console-muted pt-4 pb-1 px-2">
                        {group}
                      </th>
                    </tr>,
                    ...areas.map(({ resource, perms }) => (
                      <tr key={resource} style={{ borderTop: "1px solid var(--border-light)" }}>
                        <th scope="row" className="text-left p-2 font-medium console-title sticky left-0" style={{ background: "var(--bg-surface)" }}>
                          {permissionResourceLabel(resource)}
                        </th>
                        {visibleRoles.map((r) => {
                          const granted = perms.filter((p) => matrix.get(r.id)?.has(p.id))
                          const full = granted.length === perms.length
                          const title = granted.length
                            ? `${displayName(r)} puede: ${granted.map((p) => permissionLabel(p.resource, p.action)).join("; ")}.`
                            : `${displayName(r)} no tiene permisos en esta área.`
                          return (
                            <td key={r.id} className="p-2 text-center" title={title}>
                              {full ? (
                                <Check size={16} aria-label="Todos" style={{ color: "#16A34A" }} className="inline" />
                              ) : granted.length > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs console-muted">
                                  <Minus size={14} aria-hidden />
                                  {granted.length} de {perms.length}
                                </span>
                              ) : (
                                <span className="sr-only">Ninguno</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )),
                  ])}
                </tbody>
              </table>
            </>
          )}
        </div>
      ) : (
        <div className="flex gap-6 items-start flex-col lg:flex-row">
          {/* Lista de roles */}
          <div className="flex flex-col gap-4 shrink-0 w-full lg:w-64">
            {[...rolesByScope.entries()]
              .filter(([scope]) => scope !== "academic")
              .map(([scope, scopeRoles]) => (
                <div key={scope}>
                  <p className="text-[10px] font-bold tracking-[0.15em] console-muted mb-1.5 px-1 uppercase">
                    {scopeLabel(scope)}
                  </p>
                  <div className="flex flex-col gap-1">
                    {scopeRoles.map((role) => renderRoleButton(role))}
                  </div>
                </div>
              ))}

            {rolesByScope.has("academic") && (
              <div>
                <button
                  onClick={() => setShowAcademic((v) => !v)}
                  aria-expanded={showAcademic}
                  className="text-[10px] font-bold tracking-[0.15em] console-muted mb-1.5 px-1 uppercase w-full text-left flex items-center gap-1"
                  style={{ background: "transparent", border: "none", cursor: "pointer" }}
                >
                  {scopeLabel("academic")} {showAcademic ? "▾" : "▸"}
                </button>
                {showAcademic && (
                  <div className="flex flex-col gap-1">
                    {(rolesByScope.get("academic") ?? []).map((role) => renderRoleButton(role))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Permisos del rol elegido */}
          <div className="flex-1 min-w-0 w-full">
            {!selectedRole ? (
              <EmptyState
                icon={<Drama size={32} />}
                title="Elige un rol"
                description="Selecciona un rol de la lista para ver qué puede hacer y, si tienes permiso, cambiarlo."
              />
            ) : (
              <div className="console-card flex flex-col gap-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold console-title">{displayName(selectedRole)}</h2>
                    <Badge variant="muted">{scopeLabel(selectedRole.scopeContext === "academic" ? "academic" : selectedRole.scope)}</Badge>
                    {isOwnRole && <Badge variant="warning">Es tu rol</Badge>}
                  </div>
                  <p className="text-sm console-muted mt-1">
                    {selectedRole.description || roleDescription(selectedRole.slug)}
                  </p>
                  <p className="text-xs console-muted mt-1">
                    {currentPermIds.size === 1 ? "1 permiso activo" : `${currentPermIds.size} permisos activos`} de {permissions.length}
                  </p>
                  {!canEdit && (
                    <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <Lock size={12} aria-hidden /> Solo puedes consultar los permisos; no tienes permiso para cambiarlos.
                    </p>
                  )}
                </div>

                <PermissionChecklist
                  groups={groups}
                  isChecked={(p) => currentPermIds.has(p.id)}
                  onToggle={togglePerm}
                  disabledReason={lockedReason}
                  readOnly={!canEdit}
                />

                {canEdit && pending && (
                  <div
                    className="flex flex-col gap-3 p-4 rounded-xl sticky bottom-2"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--accent)", boxShadow: "var(--shadow-md, 0 4px 16px rgba(0,0,0,.12))" }}
                    role="region"
                    aria-label="Resumen de cambios"
                  >
                    <p className="text-sm font-semibold console-title">
                      Vas a cambiar el rol «{displayName(selectedRole)}»
                    </p>
                    {added.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#16A34A" }}>Podrá hacer ({added.length})</p>
                        <ul className="text-xs console-muted list-disc pl-5">
                          {added.map((id) => {
                            const p = permById.get(id)
                            return p ? <li key={id}>{permissionLabel(p.resource, p.action)}</li> : null
                          })}
                        </ul>
                      </div>
                    )}
                    {removed.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "#DC2626" }}>Dejará de poder hacer ({removed.length})</p>
                        <ul className="text-xs console-muted list-disc pl-5">
                          {removed.map((id) => {
                            const p = permById.get(id)
                            return p ? <li key={id}>{permissionLabel(p.resource, p.action)}</li> : null
                          })}
                        </ul>
                      </div>
                    )}
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setPending(null)} disabled={saving}>
                        Descartar
                      </Button>
                      <Button variant="primary" size="sm" onClick={() => void save()} loading={saving}>
                        Guardar cambios
                      </Button>
                    </div>
                  </div>
                )}

                <TechnicalDetails
                  rows={[
                    ["Código del rol", selectedRole.slug],
                    ["Identificador", selectedRole.id],
                    ["Alcance", `${selectedRole.scope}${selectedRole.scopeContext ? ` / ${selectedRole.scopeContext}` : ""}`],
                    ["Permisos activos", [...currentPermIds].map((id) => permById.get(id)?.slug ?? id).join(", ") || "ninguno"],
                  ]}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Supervisión: roles personalizados de cualquier organización */}
      <div className="console-card">
        <div className="flex items-center gap-2 mb-1">
          <Building2 size={16} className="console-muted" aria-hidden />
          <h2 className="text-sm font-bold console-title">Roles creados por los negocios</h2>
        </div>
        <p className="text-xs console-muted mb-4">
          Cada negocio puede crear sus propios roles para su equipo. Aquí puedes revisarlos y eliminarlos si hace falta.
        </p>
        {orgRoles.length === 0 ? (
          <p className="text-sm console-muted">Ningún negocio ha creado roles propios todavía.</p>
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
                    {r.organizationName} · {r.memberCount} {r.memberCount === 1 ? "persona" : "personas"}
                  </span>
                </div>
                {canDeleteOrgRole && (
                  <button
                    onClick={() => void handleDeleteOrgRole(r)}
                    disabled={deletingOrgRoleId === r.id}
                    className="p-2 rounded-lg"
                    style={{ color: "#DC2626", background: "transparent", border: "none", cursor: "pointer" }}
                    aria-label={`Eliminar el rol ${r.name}`}
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
        title="Crear rol nuevo"
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
            placeholder="Ej. Auditor financiero"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Input
            label="Descripción (opcional)"
            placeholder="Para qué sirve este rol"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-role-scope" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              ¿Dónde se usa este rol?
            </label>
            <select
              id="new-role-scope"
              value={newScope}
              onChange={(e) => setNewScope(e.target.value as typeof newScope)}
              className="console-input text-sm px-3"
              style={{ height: 38 }}
            >
              <option value="platform">{scopeLabel("platform")}</option>
              <option value="organization">{scopeLabel("organization")}</option>
              <option value="user">{scopeLabel("user")}</option>
            </select>
          </div>

          {newScope === "organization" && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="new-role-context" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Tipo de negocio (opcional)
                </label>
                <select
                  id="new-role-context"
                  value={newScopeContext}
                  onChange={(e) => setNewScopeContext(e.target.value)}
                  className="console-input text-sm px-3"
                  style={{ height: 38 }}
                >
                  <option value="">Cualquiera</option>
                  <option value="academic">Solo academias</option>
                </select>
              </div>

              <fieldset className="flex flex-col gap-1.5 m-0 p-0 border-0">
                <legend className="text-sm font-medium p-0 mb-1" style={{ color: "var(--text-primary)" }}>
                  Disponible en los planes
                </legend>
                <div className="flex gap-3">
                  {(["free", "pro", "academia"] as const).map((tier) => (
                    <label key={tier} className="flex items-center gap-1.5 text-sm console-muted">
                      <input
                        type="checkbox"
                        checked={newTiers.has(tier)}
                        onChange={() => setNewTiers((prev) => toggleIn(prev, tier))}
                        style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                      />
                      {membershipLabel(tier)}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>¿Qué podrá hacer?</p>
            <PermissionChecklist
              groups={groups}
              isChecked={(p) => newPermSlugs.has(p.slug)}
              onToggle={(p) => setNewPermSlugs((prev) => toggleIn(prev, p.slug))}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
