"use client"

import useSWR from "swr"
import { useState, useMemo } from "react"
import { usePermissions } from "@/hooks/usePermissions"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Pagination from "@/components/app/inventario/Pagination"
import type { Ingrediente } from "@/types/domain"
import {
  bancoListIngredients, bancoCreateIngredient,
  bancoUpdateIngredient, bancoDeleteIngredient,
} from "@/lib/api"
import { Search, Plus, Pencil, Trash2, Carrot, Scale, DollarSign } from "lucide-react"

const PAGE_SIZE = 24

export default function BancoIngredientesPage() {
  const { platformCan } = usePermissions()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading, error, mutate } = useSWR(
    ["banco-ingredients", search, page],
    () => bancoListIngredients(search || undefined, page, PAGE_SIZE),
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  const canCreate = platformCan("publicIngredients", "create")
  const canUpdate = platformCan("publicIngredients", "update")
  const canDelete = platformCan("publicIngredients", "delete")

  const totalPages = useMemo(
    () => (data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1),
    [data]
  )

  function changeSearch(v: string) { setSearch(v); setPage(1) }

  // ── Form crear/editar ──
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Ingrediente | null>(null)
  const [name, setName] = useState("")
  const [costPerUnit, setCostPerUnit] = useState("")
  const [weightGrams, setWeightGrams] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  function openCreate() {
    setEditing(null)
    setName(""); setCostPerUnit(""); setWeightGrams("")
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(ing: Ingrediente) {
    setEditing(ing)
    setName(ing.name)
    setCostPerUnit(ing.costPerUnit)
    setWeightGrams(ing.weightGrams)
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSave() {
    setFormError(null)
    const cost = parseFloat(costPerUnit)
    const weight = parseFloat(weightGrams)
    if (!name.trim()) return setFormError("El nombre es requerido.")
    if (isNaN(cost) || cost <= 0) return setFormError("El costo debe ser positivo.")
    if (isNaN(weight) || weight <= 0) return setFormError("El peso debe ser positivo.")

    setSaving(true)
    try {
      if (editing) {
        await bancoUpdateIngredient(editing.id, { name: name.trim(), costPerUnit: cost, weightGrams: weight })
      } else {
        await bancoCreateIngredient({ name: name.trim(), costPerUnit: cost, weightGrams: weight })
      }
      setFormOpen(false)
      await mutate()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar.")
    } finally {
      setSaving(false)
    }
  }

  // ── Eliminar ──
  const [deleteTarget, setDeleteTarget] = useState<Ingrediente | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteTarget || !data) return
    const id = deleteTarget.id
    setDeleteTarget(null) // cerrar de inmediato — la card desaparece al instante
    const optimistic = { ...data, data: data.data.filter((i) => i.id !== id), total: data.total - 1 }
    try {
      await mutate(
        async () => { await bancoDeleteIngredient(id); return optimistic },
        { optimisticData: optimistic, rollbackOnError: true, revalidate: true }
      )
    } catch { /* rollback automático si la API falla */ }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold console-title">Banco público · Ingredientes</h1>
          <p className="text-sm console-muted mt-1">
            {data ? `${data.total} ingredientes disponibles para importar` : "Cargando…"}
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" onClick={openCreate}>
            <Plus size={15} /> Nuevo ingrediente
          </Button>
        )}
      </div>

      <div className="relative" style={{ maxWidth: 360 }}>
        <Search size={14} className="console-muted" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input
          type="search"
          placeholder="Buscar ingrediente…"
          value={search}
          onChange={(e) => changeSearch(e.target.value)}
          className="console-input w-full text-sm"
          style={{ height: 40, paddingLeft: 34, paddingRight: 12 }}
        />
      </div>

      {/* Grid de cards */}
      {isLoading && !data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse console-card" style={{ height: 120 }} />
          ))}
        </div>
      )}

      {error && !data && (
        <div className="text-center py-16">
          <p className="text-sm console-muted mb-3">No se pudieron cargar los ingredientes del banco.</p>
          <Button variant="ghost" onClick={() => void mutate()}>Reintentar</Button>
        </div>
      )}

      {data && data.data.length === 0 && (
        <div className="text-center py-16">
          <Carrot size={36} className="console-muted mx-auto mb-3" />
          <p className="text-sm console-muted">
            {search ? "Sin resultados para esta búsqueda." : "El banco no tiene ingredientes todavía."}
          </p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16, opacity: isLoading ? 0.6 : 1, transition: "opacity 0.15s" }}>
            {data.data.map((ing) => (
              <BancoIngredientCard
                key={ing.id}
                ingredient={ing}
                onEdit={canUpdate ? () => openEdit(ing) : undefined}
                onDelete={canDelete ? () => setDeleteTarget(ing) : undefined}
              />
            ))}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Modal crear/editar */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? "Editar ingrediente del banco" : "Nuevo ingrediente del banco"}
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {editing ? "Guardar cambios" : "Crear ingrediente"}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre"
            placeholder="Ej. HARINA DE TRIGO"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Costo de compra (COP)"
              type="number"
              min="0"
              placeholder="Ej. 5000"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
            />
            <Input
              label="Peso (gramos)"
              type="number"
              min="0"
              placeholder="Ej. 1000"
              value={weightGrams}
              onChange={(e) => setWeightGrams(e.target.value)}
            />
          </div>
          {costPerUnit && weightGrams && parseFloat(weightGrams) > 0 && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Costo por gramo: <strong>${(parseFloat(costPerUnit) / parseFloat(weightGrams)).toFixed(4)}/g</strong>
            </p>
          )}
          {formError && <p className="text-xs" style={{ color: "#EF4444" }}>{formError}</p>}
        </div>
      </Modal>

      {/* Confirmar eliminación */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar ingrediente del banco"
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Eliminar</Button>
          </div>
        }
      >
        <p style={{ color: "var(--text-secondary)" }}>
          ¿Eliminar <strong style={{ color: "var(--text-primary)" }}>{deleteTarget?.name}</strong> del banco público?
          Las recetas del banco que lo usan quedarán sin este componente. La acción queda auditada.
        </p>
      </Modal>
    </div>
  )
}

// ─── Card de ingrediente del banco ───────────────────────────────────────────

function BancoIngredientCard({
  ingredient,
  onEdit,
  onDelete,
}: {
  ingredient: Ingrediente
  onEdit?: () => void
  onDelete?: () => void
}) {
  const costPerUnit = parseFloat(ingredient.costPerUnit)
  const weightGrams = parseFloat(ingredient.weightGrams)
  const costPerGram = parseFloat(ingredient.costPerGram)

  return (
    <article
      className="flex flex-col gap-3 rounded-2xl p-4 transition-all"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        height: 168, // tamaño FIJO: todas las cards iguales
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(18,33,58,0.10)"
        e.currentTarget.style.borderColor = "var(--border-medium)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = ""
        e.currentTarget.style.borderColor = "var(--border-light)"
      }}
    >
      {/* Header: icono + nombre + acciones SIEMPRE visibles */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "#F0FDF4" }}
        >
          <Carrot size={15} style={{ color: "#16A34A" }} />
        </div>
        <h3
          className="flex-1 text-sm font-semibold leading-snug min-w-0 truncate"
          style={{ color: "var(--text-primary)" }}
          title={ingredient.name}
        >
          {ingredient.name}
        </h3>

        <div className="flex gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={onEdit}
              title="Editar ingrediente"
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
              style={{ color: "var(--accent)", background: "var(--accent-light)", border: "none", cursor: "pointer" }}
            >
              <Pencil size={12} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              title="Eliminar ingrediente"
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
              style={{ color: "#B42020", background: "#FEF2F2", border: "none", cursor: "pointer" }}
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Datos de compra */}
      <div className="flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <DollarSign size={11} /> ${costPerUnit.toLocaleString("es-CO")}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <Scale size={11} /> {weightGrams.toLocaleString("es-CO")} g
        </span>
      </div>

      {/* Costo por gramo — anclado abajo */}
      <div
        className="flex items-center justify-between rounded-xl px-3 py-2 mt-auto"
        style={{ background: "var(--accent-light)" }}
      >
        <span className="text-xs" style={{ color: "var(--accent-text)" }}>Costo por gramo</span>
        <span className="text-xs font-bold font-mono" style={{ color: "var(--accent-text)" }}>
          ${costPerGram.toFixed(4)}/g
        </span>
      </div>
    </article>
  )
}
