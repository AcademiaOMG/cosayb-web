"use client"

import useSWR from "swr"
import { useState, useMemo, useEffect } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import EmptyState from "@/components/ui/EmptyState"
import YieldFactorTable from "@/components/app/factor-rendimiento/YieldFactorTable"
import YieldFactorCalculator, { type YieldSavedInfo, type YieldSubmitData } from "@/components/app/factor-rendimiento/YieldFactorCalculator"
import YieldFactorDetailModal from "@/components/app/factor-rendimiento/YieldFactorDetailModal"
import YieldFactorDeleteModal from "@/components/app/factor-rendimiento/YieldFactorDeleteModal"
import YieldFactorSearchBar, { type YieldFactorFilter } from "@/components/app/factor-rendimiento/YieldFactorSearchBar"
import Pagination from "@/components/app/inventario/Pagination"
import { CalcModal } from "@/components/calculator"
import type { FactorRendimiento } from "@/types/domain"
import {
  getFactoresRendimiento,
  createFactorRendimiento,
  updateFactorRendimiento,
  deleteFactorRendimiento,
} from "@/lib/api"
import { Scale, Plus, CheckCircle2, X } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import ModuleLocked from "@/components/app/ModuleLocked"
import { useHelpAvailable } from "@/hooks/useHelpAvailable"

const PAGE_SIZE = 10

type PageView = "list" | "calculator"

/** Compara sin importar mayúsculas ni tildes ("platano" encuentra "Plátano") */
const normalize = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()

// ── Skeleton ──────────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-xl animate-pulse" style={{ border: "1px solid var(--border-light)" }}>
      {/* Mobile: bloques a ancho completo (sin columnas que se recorten) */}
      <div className="md:hidden flex flex-col">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-2 px-4 py-4"
            style={{
              borderTop: i === 1 ? undefined : "1px solid var(--border-light)",
              background: i % 2 === 1 ? "var(--bg-surface)" : "var(--bg-primary)",
            }}
          >
            <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "60%" }} />
            <div className="h-3 rounded" style={{ background: "var(--bg-secondary)", width: "40%" }} />
            <div className="h-3 rounded" style={{ background: "var(--bg-secondary)", width: "30%" }} />
          </div>
        ))}
      </div>

      {/* Desktop: columnas de la tabla */}
      <div className="hidden md:block">
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
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function FactorRendimientoPage() {
  useHelpAvailable()
  const { can, hasFeature, featureLockedMessage } = usePermissions()
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
      const q = normalize(search)
      result = result.filter((f) => normalize(f.ingredientName).includes(q))
    }

    return result
  }, [factors, search, filter])

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  // Si se borra el último de la última página, no quedarse en una página vacía
  const currentPage = Math.min(page, Math.max(1, totalPages))
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, currentPage])

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleFilterChange(value: YieldFactorFilter) {
    setFilter(value)
    setPage(1)
  }
  const [view, setView] = useState<PageView>("list")
  const [editingFactor, setEditingFactor] = useState<FactorRendimiento | null>(null)
  const [detailFactor, setDetailFactor] = useState<FactorRendimiento | null>(null)
  const [deleteFactor, setDeleteFactor] = useState<FactorRendimiento | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  /** Registro recién guardado: aviso arriba de la lista y fila resaltada */
  const [justSaved, setJustSaved] = useState<YieldSavedInfo | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  /** La calculadora tiene datos escritos sin guardar (la ventana avisa antes de cerrar) */
  const [calcDirty, setCalcDirty] = useState(false)

  useEffect(() => {
    function handleHelp() { setHelpOpen(true) }
    window.addEventListener("open-help", handleHelp)
    return () => window.removeEventListener("open-help", handleHelp)
  }, [])

  // ── Acciones ──────────────────────────────────────────────────────────────
  async function handleSubmit(data: YieldSubmitData, existingId?: string) {
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
    let id: string
    const targetId = existingId ?? editingFactor?.id
    if (targetId) {
      await updateFactorRendimiento(targetId, payload)
      id = targetId
    } else {
      const created = await createFactorRendimiento(payload)
      id = created.data.id
    }
    const fresh = await mutate()
    // Dejar la lista donde el usuario verá su registro: sin filtros y en su página
    const idx = fresh ? fresh.findIndex((f) => f.id === id) : -1
    setSearch("")
    setFilter("all")
    setPage(idx >= 0 ? Math.floor(idx / PAGE_SIZE) + 1 : 1)
    return { id }
  }

  async function handleDelete() {
    if (!deleteFactor) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteFactorRendimiento(deleteFactor.id)
      if (justSaved?.id === deleteFactor.id) setJustSaved(null)
      setDeleteFactor(null)
      await mutate()
    } catch (e) {
      // el modal permanece abierto y explica qué pasó
      setDeleteError(e instanceof Error && e.message ? e.message : "No se pudo eliminar. Revisa tu conexión e inténtalo de nuevo.")
    } finally {
      setDeleting(false)
    }
  }

  function openCreate() {
    setEditingFactor(null)
    setJustSaved(null)
    setView("calculator")
  }

  function openEdit(factor: FactorRendimiento) {
    setEditingFactor(factor)
    setDetailFactor(null)
    setJustSaved(null)
    setView("calculator")
  }

  function closeCalculator() {
    setCalcDirty(false)
    setView("list")
  }

  function handleSaved(info: YieldSavedInfo) {
    setJustSaved(info)
    setCalcDirty(false)
    setView("list")
  }

  function clearFilters() {
    setSearch("")
    setFilter("all")
    setPage(1)
  }

  // Mostrar el registro guardado
  useEffect(() => {
    if (view !== "list" || !justSaved) return
    const t = setTimeout(() => {
      const el = Array.from(document.querySelectorAll<HTMLElement>(`[data-factor-id="${justSaved.id}"]`)).find(
        (n) => n.offsetParent !== null,
      )
      el?.scrollIntoView({ block: "center", behavior: "smooth" })
    }, 100)
    return () => clearTimeout(t)
  }, [view, justSaved])

  // ── Render ────────────────────────────────────────────────────────────────
  if (!hasFeature("module_yieldFactors")) {
    return <ModuleLocked message={featureLockedMessage("module_yieldFactors")} />
  }

  // La ayuda debe abrir también dentro de la calculadora (el botón de la app sigue visible).
  const helpModal = (
    <Modal
      open={helpOpen}
      onClose={() => setHelpOpen(false)}
      title="Factor de Rendimiento"
    >
      <div className="flex flex-col gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
        <p>Esta sección es una calculadora: te dice cuánto aprovechas de lo que compras (descontando huesos, cáscaras, grasa y agua) y cuánto cuesta realmente cada gramo útil.</p>

        <div>
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Cómo usarla:</p>
          <ul className="flex flex-col gap-2 ml-1">
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Nuevo factor:</strong> se abre la calculadora en una ventana. Elige el tipo, escribe el nombre y, en la calculadora, el costo, el peso total y los gramos que se pierden. Pulsa Calcular y guarda. La cierras con la X (o con Esc); si escribiste algo, te avisamos antes de cerrar.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Tipos:</strong> carnes, pescados y mariscos (huesos, grasa, cueros, agua de bolsas) o verduras, frutas y hortalizas (cáscaras, pepas, agua, bolsa).</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Visualizar detalles:</strong> toca el ojo (o la fila) para ver el cálculo completo del rendimiento.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Editar o eliminar:</strong> usa el lápiz para volver a abrir la calculadora con ese ingrediente, o el bote de basura para borrarlo.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Filtros:</strong> busca por nombre de ingrediente o filtra por tipo (Todos, Proteína, Vegetal).</span>
            </li>
          </ul>
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          <strong>Nota:</strong> al guardar puedes crear el ingrediente limpio «NOMBRE (LIMPIO)» en Inventario, con el peso útil y el nuevo costo por gramo, para usarlo en tus recetas.
        </p>
      </div>
    </Modal>
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Factor de Rendimiento"
        subtitle="¿Cuánto aprovechas de lo que compras? Descuenta huesos, cáscaras y grasa para saber el costo real por gramo"
        action={
          can("yieldFactors", "create") ? (
            <Button variant="primary" onClick={openCreate}>
              <Plus size={16} />
              <span className="hidden sm:inline">Nuevo factor</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          ) : undefined
        }
      />

      {justSaved && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#166534" }}
        >
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p className="flex-1 min-w-0 break-words">
            <strong>{justSaved.name}</strong>: {justSaved.message} Lo encuentras resaltado en la lista.
          </p>
          <button
            type="button"
            onClick={() => setJustSaved(null)}
            aria-label="Cerrar aviso"
            className="p-1 -m-1 rounded-md hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <X size={14} />
          </button>
        </div>
      )}

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
        <div role="alert" className="text-center py-12 rounded-2xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}>
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
          title="Aún no has calculado ningún rendimiento"
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
          action={<Button variant="ghost" onClick={clearFilters}>Ver todos los factores</Button>}
        />
      )}

      {/* Tabla */}
      {!isLoading && !error && filtered.length > 0 && (
        <>
          <YieldFactorTable
            data={paginated}
            highlightId={justSaved?.id}
            onView={(f) => setDetailFactor(f)}
            onEdit={can("yieldFactors", "update") ? openEdit : undefined}
            onDelete={can("yieldFactors", "delete") ? (f) => { setDeleteError(null); setDeleteFactor(f) } : undefined}
          />
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Modales (solo lectura y confirmación) */}
      <YieldFactorDetailModal
        // Cada registro arranca sin mensajes del anterior
        key={detailFactor?.id ?? "none"}
        isOpen={!!detailFactor}
        onClose={() => setDetailFactor(null)}
        factor={detailFactor}
        onEdit={can("yieldFactors", "update") ? openEdit : undefined}
        onDelete={can("yieldFactors", "delete") ? (f) => { setDetailFactor(null); setDeleteError(null); setDeleteFactor(f) } : undefined}
      />

      <YieldFactorDeleteModal
        isOpen={!!deleteFactor}
        onClose={() => setDeleteFactor(null)}
        onConfirm={handleDelete}
        factor={deleteFactor}
        isDeleting={deleting}
        error={deleteError}
      />

      {/* Calculadora: ventana común de la app */}
      {view === "calculator" && (
        <CalcModal
          title={editingFactor ? `Editar: ${editingFactor.ingredientName}` : "Nuevo factor de rendimiento"}
          subtitle="Escribe lo que pagaste, el peso y lo que se pierde. Te decimos cuánto cuesta de verdad cada gramo que aprovechas."
          dirty={calcDirty}
          onClose={closeCalculator}
        >
          <YieldFactorCalculator
            // Reiniciar la calculadora al cambiar de registro (nuevo / editar)
            key={editingFactor?.id ?? "new"}
            editingFactor={editingFactor}
            onSubmit={handleSubmit}
            onDone={handleSaved}
            onDirtyChange={setCalcDirty}
          />
        </CalcModal>
      )}

      {helpModal}
    </div>
  )
}
