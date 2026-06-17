"use client"

import useSWR from "swr"
import { useState } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import YieldFactorTable from "@/components/app/factor-rendimiento/YieldFactorTable"
import YieldFactorFormModal from "@/components/app/factor-rendimiento/YieldFactorFormModal"
import YieldFactorDetailModal from "@/components/app/factor-rendimiento/YieldFactorDetailModal"
import YieldFactorDeleteModal from "@/components/app/factor-rendimiento/YieldFactorDeleteModal"
import type { FactorRendimiento } from "@/types/domain"
import {
  getFactoresRendimiento,
  createFactorRendimiento,
  updateFactorRendimiento,
  deleteFactorRendimiento,
} from "@/lib/api"
import { Scale, Plus } from "lucide-react"

// ── Skeleton ──────────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-xl animate-pulse" style={{ border: "1px solid var(--border-light)" }}>
      <div className="px-4 py-3 flex gap-4" style={{ background: "var(--bg-secondary)" }}>
        {[12, 30, 18, 15, 15, 10].map((w, i) => (
          <div key={i} className="h-3 rounded" style={{ background: "var(--border-light)", width: `${w}%` }} />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="px-4 py-4 flex gap-4 items-center"
          style={{
            borderTop: "1px solid var(--border-light)",
            background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-primary)",
          }}
        >
          <div className="h-5 rounded-full" style={{ background: "var(--bg-secondary)", width: "12%", flexShrink: 0 }} />
          <div className="flex flex-col gap-1.5" style={{ width: "30%", flexShrink: 0 }}>
            <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "80%" }} />
            <div className="h-3 rounded" style={{ background: "var(--bg-secondary)", width: "55%" }} />
          </div>
          <div className="h-6 rounded" style={{ background: "var(--bg-secondary)", width: "18%", flexShrink: 0 }} />
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "15%", flexShrink: 0 }} />
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "15%", flexShrink: 0 }} />
          <div className="flex gap-1 ml-auto">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-7 w-7 rounded-lg" style={{ background: "var(--bg-secondary)" }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function FactorRendimientoPage() {
  const { data: factors = [], isLoading, error, mutate } = useSWR(
    "yield-factors",
    () => getFactoresRendimiento().then((r) => r.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  // ── Modales ───────────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false)
  const [editingFactor, setEditingFactor] = useState<FactorRendimiento | null>(null)
  const [detailFactor, setDetailFactor] = useState<FactorRendimiento | null>(null)
  const [deleteFactor, setDeleteFactor] = useState<FactorRendimiento | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Acciones ──────────────────────────────────────────────────────────────
  async function handleSubmit(data: {
    variant: "bfactor" | "bfactorveg"
    ingredientName: string
    totalCost: string
    totalWeightGrams: string
    wasteItems: { name: string; weightGrams: string }[]
  }) {
    const payload = {
      variant: data.variant,
      ingredientName: data.ingredientName,
      totalCost: parseFloat(data.totalCost),
      totalWeightGrams: parseFloat(data.totalWeightGrams),
      wasteItems: data.wasteItems.map((w) => ({
        name: w.name,
        weightGrams: parseFloat(w.weightGrams),
      })),
    }
    if (editingFactor) {
      await updateFactorRendimiento(editingFactor.id, payload)
    } else {
      await createFactorRendimiento(payload)
    }
    await mutate()
  }

  async function handleDelete() {
    if (!deleteFactor) return
    setDeleting(true)
    try {
      await deleteFactorRendimiento(deleteFactor.id)
      setDeleteFactor(null)
      await mutate()
    } catch {
      // modal permanece abierto si falla
    } finally {
      setDeleting(false)
    }
  }

  function openCreate() {
    setEditingFactor(null)
    setFormOpen(true)
  }

  function openEdit(factor: FactorRendimiento) {
    setEditingFactor(factor)
    setFormOpen(true)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Factor de Rendimiento"
        subtitle="Calcula el costo real de tus ingredientes descontando desperdicios"
        action={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} />
            Nuevo factor
          </Button>
        }
      />

      {/* Skeleton primera carga */}
      {isLoading && <TableSkeleton />}

      {/* Error */}
      {!isLoading && error && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)", marginBottom: "12px" }}>
            No se pudieron cargar los factores.
          </p>
          <Button variant="ghost" onClick={() => void mutate()}>Reintentar</Button>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && factors.length === 0 && (
        <EmptyState
          icon={<Scale size={40} style={{ color: "var(--text-muted)" }} />}
          title="Sin factores de rendimiento"
          description="Registra el rendimiento de tus ingredientes para calcular su costo real después de descartar desperdicios."
          action={
            <Button variant="ghost" onClick={openCreate}>
              <Plus size={14} />
              Registrar primer ingrediente
            </Button>
          }
        />
      )}

      {/* Tabla */}
      {!isLoading && !error && factors.length > 0 && (
        <YieldFactorTable
          data={factors}
          onView={(f) => setDetailFactor(f)}
          onEdit={openEdit}
          onDelete={(f) => setDeleteFactor(f)}
        />
      )}

      {/* Modales */}
      <YieldFactorFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        editingFactor={editingFactor}
      />

      <YieldFactorDetailModal
        isOpen={!!detailFactor}
        onClose={() => setDetailFactor(null)}
        factor={detailFactor}
      />

      <YieldFactorDeleteModal
        isOpen={!!deleteFactor}
        onClose={() => setDeleteFactor(null)}
        onConfirm={handleDelete}
        factor={deleteFactor}
        isDeleting={deleting}
      />
    </div>
  )
}
