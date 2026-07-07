"use client"

import useSWR from "swr"
import { useState } from "react"
import Link from "next/link"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"
import { usePermissions } from "@/hooks/usePermissions"
import {
  getCustomRolesSummary,
  getCustomRoleDetail,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  CUSTOM_ROLE_MODULES,
} from "@/lib/api"
import { Lock, Plus, Pencil, Trash2, Users } from "lucide-react"

const DEFAULT_LOCKED_MESSAGE = "Roles personalizados no está disponible en tu plan actual."

export default function RolesPage() {
  const { can, hasFeature, featureLimit, featureLockedMessage } = usePermissions()
  const canManage = can("organizationRoles", "create")
  const unlocked = hasFeature("custom_roles")
  const limit = featureLimit("max_custom_roles")

  const { data: rolesList = [], mutate } = useSWR(
    unlocked ? "custom-roles" : null,
    () => getCustomRolesSummary().then((r) => r.data ?? []),
    { revalidateOnFocus: false }
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!unlocked) {
    const message = featureLockedMessage("custom_roles") || DEFAULT_LOCKED_MESSAGE
    return (
      <Card className="flex flex-col items-center text-center gap-3 py-10">
        <Lock size={28} style={{ color: "var(--text-muted)" }} />
        <p className="text-sm max-w-sm" style={{ color: "var(--text-secondary)" }}>
          {message}
        </p>
        <Link href="/configuracion/membresia">
          <Button variant="primary" size="sm">Ver planes</Button>
        </Link>
      </Card>
    )
  }

  function openCreate() {
    setEditingId(null)
    setName("")
    setSelectedSlugs(new Set())
    setModalOpen(true)
  }

  async function openEdit(id: string) {
    const { data } = await getCustomRoleDetail(id)
    setEditingId(id)
    setName(data.name)
    setSelectedSlugs(new Set(data.permissionSlugs))
    setModalOpen(true)
  }

  function toggleSlug(slug: string) {
    setSelectedSlugs((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const permissionSlugs = [...selectedSlugs]
      if (editingId) {
        await updateCustomRole(editingId, { name: name.trim(), permissionSlugs })
      } else {
        await createCustomRole(name.trim(), permissionSlugs)
      }
      setModalOpen(false)
      await mutate()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      await deleteCustomRole(id)
      await mutate()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {limit != null
            ? `${rolesList.length} de ${limit} roles personalizados`
            : `${rolesList.length} roles personalizados`}
        </p>
        {canManage && (
          <Button variant="primary" size="sm" onClick={openCreate} disabled={limit != null && rolesList.length >= limit}>
            <Plus size={14} />
            Crear rol
          </Button>
        )}
      </div>

      {rolesList.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Aún no has creado ningún rol personalizado.
          </p>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {rolesList.map((r) => (
          <Card key={r.id} className="flex items-center justify-between !p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{r.name}</span>
              <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <Users size={12} /> {r.memberCount} {r.memberCount === 1 ? "miembro" : "miembros"}
              </span>
            </div>
            {canManage && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(r.id)}
                  className="p-2 rounded-lg"
                  style={{ color: "var(--text-muted)", background: "transparent", border: "none", cursor: "pointer" }}
                  aria-label={`Editar ${r.name}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                  className="p-2 rounded-lg"
                  style={{ color: "#DC2626", background: "transparent", border: "none", cursor: "pointer" }}
                  aria-label={`Eliminar ${r.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar rol" : "Crear rol personalizado"}
        wide
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" loading={saving} disabled={!name.trim()} onClick={handleSave}>
              Guardar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <Input
            label="Nombre del rol"
            placeholder="Ej. Coordinador de Eventos"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="flex flex-col gap-4">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Permisos</p>
            {CUSTOM_ROLE_MODULES.map((mod) => (
              <div key={mod.resource} className="flex flex-col gap-1.5">
                <p className="text-xs font-bold tracking-wide uppercase" style={{ color: "var(--text-muted)" }}>
                  {mod.label}
                </p>
                <div className="flex flex-wrap gap-3">
                  {mod.actions.map((action) => {
                    const slug = `${action}:${mod.resource}`
                    return (
                      <label key={slug} className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
                        <input
                          type="checkbox"
                          checked={selectedSlugs.has(slug)}
                          onChange={() => toggleSlug(slug)}
                          style={{ accentColor: "var(--accent)", cursor: "pointer" }}
                        />
                        {action}
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
