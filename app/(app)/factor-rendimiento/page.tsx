"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Scale, Plus, Search, X } from "lucide-react"

export default function FactorRendimientoPage() {
  // Data
  const [factors, setFactors] = useState<FactorRendimiento[]>([])
  const [filteredFactors, setFilteredFactors] = useState<FactorRendimiento[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Search
  const [search, setSearch] = useState("")

  // Filter
  const [filter, setFilter] = useState<"all" | "bfactor" | "bfactorveg">("all")

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedFactor, setSelectedFactor] = useState<FactorRendimiento | null>(null)

  // Loading states
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Fetch data
  const fetchFactors = useCallback(async () => {
    try {
      setIsLoading(true)
      const variant = filter === "all" ? undefined : filter
      const res = await getFactoresRendimiento(variant)
      setFactors(res.data)
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Error al cargar factores" })
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchFactors()
  }, [fetchFactors])

  // Filter by search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredFactors(factors)
    } else {
      const term = search.toLowerCase()
      setFilteredFactors(
        factors.filter((f) => f.ingredientName.toLowerCase().includes(term))
      )
    }
  }, [factors, search])

  // Create
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
      setToast({ type: "success", message: `"${data.ingredientName}" creado exitosamente` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear factor"
      setToast({ type: "error", message: msg })
      throw err
    } finally {
      setIsCreating(false)
    }
  }

  // Edit
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
      setToast({ type: "success", message: `"${data.ingredientName}" actualizado exitosamente` })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al actualizar factor"
      setToast({ type: "error", message: msg })
      throw err
    } finally {
      setIsEditing(false)
    }
  }

  // Delete
  const handleDelete = async () => {
    if (!selectedFactor) return
    try {
      setIsDeleting(true)
      await deleteFactorRendimiento(selectedFactor.id)
      await fetchFactors()
      setIsDeleteOpen(false)
      setToast({ type: "success", message: `"${selectedFactor.ingredientName}" eliminado exitosamente` })
      setSelectedFactor(null)
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Error al eliminar factor" })
    } finally {
      setIsDeleting(false)
    }
  }

  // Open modals
  const openCreateModal = () => {
    setSelectedFactor(null)
    setIsFormOpen(true)
  }

  const openEditModal = (factor: FactorRendimiento) => {
    setSelectedFactor(factor)
    setIsFormOpen(true)
  }

  const openDetailModal = (factor: FactorRendimiento) => {
    setSelectedFactor(factor)
    setIsDetailOpen(true)
  }

  const openDeleteModal = (factor: FactorRendimiento) => {
    setSelectedFactor(factor)
    setIsDeleteOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Factor de Rendimiento"
        subtitle="Merma y rendimiento real de ingredientes"
        action={
          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={16} className="mr-1" /> Nuevo factor
          </Button>
        }
      />

      {/* Barra de búsqueda + filtros */}
      <div
        className="flex flex-col sm:flex-row gap-3 p-4 rounded-xl"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
      >
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Buscar ingrediente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-xl text-sm outline-none transition-colors"
            style={{
              background: "var(--bg-primary)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
            aria-label="Buscar factor de rendimiento"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {[
            { key: "all" as const, label: "Todos" },
            { key: "bfactor" as const, label: "Proteínas" },
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

      {/* Contenido */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : filteredFactors.length === 0 ? (
        <EmptyState
          icon={<Scale size={48} />}
          title={search ? "Sin resultados" : "Sin factores de rendimiento"}
          description={
            search
              ? `No se encontraron factores para "${search}"`
              : "Crea el primer factor usando el botón de arriba."
          }
          action={
            !search ? (
              <Button variant="primary" onClick={openCreateModal}>
                <Plus size={16} className="mr-1" /> Crear primer factor
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {filteredFactors.length} factor{filteredFactors.length !== 1 ? "es" : ""}
            {search && ` para "${search}"`}
          </div>
          <YieldFactorTable
            data={filteredFactors}
            onView={openDetailModal}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
          />
        </>
      )}

      {/* Modales */}
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

      {/* Toast */}
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
