"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import Toast from "@/components/ui/Toast"
import EmptyState from "@/components/ui/EmptyState"
import YieldFactorFormModal from "@/components/app/factor-rendimiento/YieldFactorFormModal"
import YieldFactorDetailModal from "@/components/app/factor-rendimiento/YieldFactorDetailModal"
import YieldFactorDeleteModal from "@/components/app/factor-rendimiento/YieldFactorDeleteModal"
import YieldFactorTable from "@/components/app/factor-rendimiento/YieldFactorTable"
import { getFactoresRendimiento, createFactorRendimiento, updateFactorRendimiento, deleteFactorRendimiento } from "@/lib/api"
import type { FactorRendimiento } from "@/types/domain"
import { Scale, Plus, Search, X, ArrowUpDown } from "lucide-react"

type SortKey = "name" | "updatedAt" | "createdAt" | "yieldFactor"
type SortDir = "asc" | "desc"

export default function FactorRendimientoPage() {
  const [factors, setFactors] = useState<FactorRendimiento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "bfactor" | "bfactorveg">("all")
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedFactor, setSelectedFactor] = useState<FactorRendimiento | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const fetchFactors = useCallback(async () => {
    try {
      setIsLoading(true)
      const variant = filter === "all" ? undefined : filter
      const res = await getFactoresRendimiento(variant)
      setFactors(res.data)
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Error al cargar los factores de rendimiento" })
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchFactors() }, [fetchFactors])

  const filteredAndSorted = useMemo(() => {
    let result = factors

    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter((f) => f.ingredientName.toLowerCase().includes(term))
    }

    result = [...result].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "name":
          cmp = a.ingredientName.localeCompare(b.ingredientName, "es")
          break
        case "updatedAt":
          cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "yieldFactor":
          cmp = parseFloat(a.yieldFactor) - parseFloat(b.yieldFactor)
          break
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return result
  }, [factors, search, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "name" ? "asc" : "desc")
    }
  }

  const sortLabel = (key: SortKey) => {
    const active = sortKey === key
    const arrow = active ? (sortDir === "asc" ? " ↑" : " ↓") : ""
    switch (key) {
      case "name": return `Nombre${arrow}`
      case "updatedAt": return `Ultima modificacion${arrow}`
      case "createdAt": return `Fecha creacion${arrow}`
      case "yieldFactor": return `Rendimiento${arrow}`
    }
  }

  const handleCreate = async (data: {
    variant: "bfactor" | "bfactorveg"
    ingredientName: string
    totalCost: string
    totalWeightGrams: string
    wasteItems: { name: string; weightGrams: string }[]
  }) => {
    try {
      setIsCreating(true)
      await createFactorRendimiento({
        variant: data.variant,
        ingredientName: data.ingredientName,
        totalCost: parseFloat(data.totalCost),
        totalWeightGrams: parseFloat(data.totalWeightGrams),
        wasteItems: data.wasteItems.map((i) => ({
          name: i.name,
          weightGrams: parseFloat(i.weightGrams),
        })),
      })
      await fetchFactors()
      setToast({ type: "success", message: `"${data.ingredientName}" registrado correctamente` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar el factor"
      setToast({ type: "error", message: msg })
      throw err
    } finally {
      setIsCreating(false)
    }
  }

  const handleEdit = async (data: {
    variant: "bfactor" | "bfactorveg"
    ingredientName: string
    totalCost: string
    totalWeightGrams: string
    wasteItems: { name: string; weightGrams: string }[]
  }) => {
    if (!selectedFactor) return
    try {
      setIsEditing(true)
      await updateFactorRendimiento(selectedFactor.id, {
        variant: data.variant,
        ingredientName: data.ingredientName,
        totalCost: parseFloat(data.totalCost),
        totalWeightGrams: parseFloat(data.totalWeightGrams),
        wasteItems: data.wasteItems.map((i) => ({
          name: i.name,
          weightGrams: parseFloat(i.weightGrams),
        })),
      })
      await fetchFactors()
      setToast({ type: "success", message: `"${data.ingredientName}" actualizado correctamente` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo actualizar el factor"
      setToast({ type: "error", message: msg })
      throw err
    } finally {
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedFactor) return
    try {
      setIsDeleting(true)
      await deleteFactorRendimiento(selectedFactor.id)
      await fetchFactors()
      setIsDeleteOpen(false)
      setToast({ type: "success", message: `"${selectedFactor.ingredientName}" eliminado correctamente` })
      setSelectedFactor(null)
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "No se pudo eliminar el factor" })
    } finally {
      setIsDeleting(false)
    }
  }

  const openCreateModal = () => { setSelectedFactor(null); setIsFormOpen(true) }
  const openEditModal = (f: FactorRendimiento) => { setSelectedFactor(f); setIsFormOpen(true) }
  const openDetailModal = (f: FactorRendimiento) => { setSelectedFactor(f); setIsDetailOpen(true) }
  const openDeleteModal = (f: FactorRendimiento) => { setSelectedFactor(f); setIsDeleteOpen(true) }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Factor de Rendimiento"
        subtitle="Cuanto producto util obtienes despues de pelar, deshuesar o limpiar"
        action={
          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={16} className="mr-1" /> Nuevo ingrediente
          </Button>
        }
      />

      {/* Barra de busqueda + filtros + orden */}
      <div
        className="flex flex-col gap-3 p-4 rounded-xl"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar por nombre del ingrediente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl text-sm outline-none transition-colors"
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-light)",
                color: "var(--text-primary)",
              }}
              aria-label="Buscar ingrediente"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70"
                style={{ color: "var(--text-muted)" }}
                aria-label="Limpiar busqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {[
              { key: "all" as const, label: "Todos" },
              { key: "bfactor" as const, label: "Carnes y pescados" },
              { key: "bfactorveg" as const, label: "Vegetales" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
                style={{
                  background: filter === f.key ? "var(--accent)" : "var(--bg-primary)",
                  color: filter === f.key ? "white" : "var(--text-secondary)",
                  border: `1px solid ${filter === f.key ? "var(--accent)" : "var(--border-light)"}`,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ordenar por */}
        <div className="flex items-center gap-2 flex-wrap">
          <ArrowUpDown size={14} style={{ color: "var(--text-muted)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Ordenar:</span>
          {(["name", "updatedAt", "createdAt", "yieldFactor"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: sortKey === key ? "var(--accent-light)" : "transparent",
                color: sortKey === key ? "var(--accent-text)" : "var(--text-muted)",
              }}
            >
              {sortLabel(key)}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState
          icon={<Scale size={48} />}
          title={search ? "No encontramos nada" : "Aun no tienes factores de rendimiento"}
          description={
            search
              ? `No hay ingredientes que coincidan con "${search}". Prueba con otro nombre.`
              : "Registra tu primer ingrediente para calcular cuanto producto util obtienes despues de la limpieza."
          }
          action={
            !search ? (
              <Button variant="primary" onClick={openCreateModal}>
                <Plus size={16} className="mr-1" /> Registrar primer ingrediente
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {filteredAndSorted.length} ingrediente{filteredAndSorted.length !== 1 ? "s" : ""}
            {search && ` encontrado${filteredAndSorted.length !== 1 ? "s" : ""} para "${search}"`}
          </div>
          <YieldFactorTable
            data={filteredAndSorted}
            onView={openDetailModal}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
          />
        </>
      )}

      <YieldFactorFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedFactor(null) }}
        onSubmit={selectedFactor ? handleEdit : handleCreate}
        editingFactor={selectedFactor}
      />

      <YieldFactorDetailModal
        isOpen={isDetailOpen}
        onClose={() => { setIsDetailOpen(false); setSelectedFactor(null) }}
        factor={selectedFactor}
      />

      <YieldFactorDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setSelectedFactor(null) }}
        onConfirm={handleDelete}
        factor={selectedFactor}
        isDeleting={isDeleting}
      />

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
