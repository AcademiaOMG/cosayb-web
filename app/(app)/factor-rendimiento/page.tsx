"use client"

import useSWR from "swr"
import { useState, useMemo, useEffect } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import EmptyState from "@/components/ui/EmptyState"
import YieldFactorTable from "@/components/app/factor-rendimiento/YieldFactorTable"
import YieldFactorFormModal from "@/components/app/factor-rendimiento/YieldFactorFormModal"
import YieldFactorDetailModal from "@/components/app/factor-rendimiento/YieldFactorDetailModal"
import YieldFactorDeleteModal from "@/components/app/factor-rendimiento/YieldFactorDeleteModal"
import YieldFactorSearchBar, { type YieldFactorFilter } from "@/components/app/factor-rendimiento/YieldFactorSearchBar"
import Pagination from "@/components/app/inventario/Pagination"
import type { FactorRendimiento } from "@/types/domain"
import {
  getFactoresRendimiento,
  createFactorRendimiento,
  updateFactorRendimiento,
  deleteFactorRendimiento,
} from "@/lib/api"
import { Scale, Plus } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { useHelpAvailable } from "@/hooks/useHelpAvailable"

const PAGE_SIZE = 10

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
  useHelpAvailable()
  const { can } = usePermissions()
  const { data: factors = [], isLoading, error, mutate } = useSWR(
    "yield-factors",
    () => getFactoresRendimiento().then((r) => r.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  // ── Search & Filter ─────────────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<YieldFactorFilter>("all")
  const [page, setPage] = useState(1)

  // Counts for filter tabs
  const filterCounts = useMemo(() => ({
    all: factors.length,
    bfactor: factors.filter((f) => f.variant === "bfactor").length,
    bfactorveg: factors.filter((f) => f.variant === "bfactorveg").length,
  }), [factors])

  const filtered = useMemo(() => {
    let result = factors

    // Filter by variant
    if (filter !== "all") {
      result = result.filter((f) => f.variant === filter)
    }

    // Search by ingredient name
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter((f) => f.ingredientName.toLowerCase().includes(q))
    }

    return result
  }, [factors, search, filter])

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleFilterChange(value: YieldFactorFilter) {
    setFilter(value)
    setPage(1)
  }
  const [formOpen, setFormOpen] = useState(false)
  const [editingFactor, setEditingFactor] = useState<FactorRendimiento | null>(null)
  const [detailFactor, setDetailFactor] = useState<FactorRendimiento | null>(null)
  const [deleteFactor, setDeleteFactor] = useState<FactorRendimiento | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    function handleHelp() { setHelpOpen(true) }
    window.addEventListener("open-help", handleHelp)
    return () => window.removeEventListener("open-help", handleHelp)
  }, [])

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
        subtitle="¿Cuánto aprovechas de lo que compras? Descuenta huesos, cáscaras y grasa para saber el costo real por gramo"
        action={
          can("yieldFactors", "create") ? (
            <Button variant="primary" onClick={openCreate}>
              <Plus size={16} />
              Nuevo factor
            </Button>
          ) : undefined
        }
      />

      {/* Search + Filter */}
      {!isLoading && !error && factors.length > 0 && (
        <YieldFactorSearchBar
          value={search}
          onChange={handleSearchChange}
          filter={filter}
          onFilterChange={handleFilterChange}
          counts={filterCounts}
          resultCount={search || filter !== "all" ? filtered.length : undefined}
        />
      )}

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

      {/* Empty state - no factors at all */}
      {!isLoading && !error && factors.length === 0 && (
        <EmptyState
          icon={<Scale size={40} style={{ color: "var(--text-muted)" }} />}
          title="Sin factores registrados"
          description="¿Cuánto aprovechas de una pechuga o de un kilo de zanahoria? Registra el rendimiento real de tus ingredientes (descontando huesos, cáscaras y grasa) para que el costo por gramo sea exacto en tus recetas."
          action={
            <Button variant="primary" onClick={openCreate}>
              <Plus size={14} />
              Calcular primer rendimiento
            </Button>
          }
        />
      )}

      {/* Empty state - no results after search/filter */}
      {!isLoading && !error && factors.length > 0 && filtered.length === 0 && (
        <EmptyState
          icon={<Scale size={40} style={{ color: "var(--text-muted)" }} />}
          title="Sin resultados"
          description={
            search
              ? `No se encontró ningún ingrediente con "${search}".`
              : "No hay factores en esta categoría."
          }
        />
      )}

      {/* Tabla */}
      {!isLoading && !error && filtered.length > 0 && (
        <>
          <YieldFactorTable
            data={paginated}
            onView={(f) => setDetailFactor(f)}
            onEdit={openEdit}
            onDelete={(f) => setDeleteFactor(f)}
          />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
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

      {/* ── Modal: help ──────────────────────────────────────────────────── */}
      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Factor de Rendimiento"
      >
        <div className="flex flex-col gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          <p>Esta seccion te permite calcular el rendimiento real de tus ingredientes, descontando huesos, cascaras, grasa y desperdicios.</p>

          <div>
            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Funcionalidades:</p>
            <ul className="flex flex-col gap-2 ml-1">
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Calcular rendimiento:</strong> Registra el peso total, costo y partes desechadas para obtener el factor de aprovechamiento.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Variantes:</strong> Usa "bfactor" para ingredientes de origen animal y "bfactorveg" para vegetales.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Visualizar detalles:</strong> Haz clic en el icono de ojo para ver el calculo completo del rendimiento.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Editar o eliminar:</strong> Usa los iconos de accion para modificar o borrar un factor existente.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Filtros:</strong> Busca por nombre de ingrediente o filtra por tipo (Todos, Proteina, Vegetal).</span>
              </li>
            </ul>
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            <strong>Nota:</strong> El factor de rendimiento se usa automaticamente al crear recetas para calcular el costo real por gramo.
          </p>
        </div>
      </Modal>
    </div>
  )
}
