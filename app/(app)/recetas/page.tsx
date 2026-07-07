"use client"

import useSWR from "swr"
import { useState, useMemo, useRef, useEffect } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import Modal from "@/components/ui/Modal"
import Pagination from "@/components/app/inventario/Pagination"
import RecipeCard from "@/components/app/recipes/RecipeCard"
import RecipeFormModal from "@/components/app/recipes/RecipeFormModal"
import RecipeDetailModal from "@/components/app/recipes/RecipeDetailModal"
import type { Recipe } from "@/types/domain"
import type { RecipeFilter, RecipeExtraFilters } from "@/lib/api"
import { getRecipes, deleteRecipe, getRecipeCounts } from "@/lib/api"
import { usePermissions } from "@/hooks/usePermissions"
import { useHelpAvailable } from "@/hooks/useHelpAvailable"
import { ChefHat, Plus, Search, Globe, User, SlidersHorizontal, X } from "lucide-react"
import { clsx } from "clsx"

const PAGE_SIZE = 12

const TAB_OPTIONS: { value: RecipeFilter; label: string }[] = [
  { value: "all",   label: "Todos" },
  { value: "own",   label: "Propios" },
  { value: "banco", label: "Banco" },
]

const EMPTY_EXTRA: RecipeExtraFilters = {}

export default function RecetasPage() {
  useHelpAvailable()
  const { can } = usePermissions()
  const [filter, setFilter]   = useState<RecipeFilter>("all")
  const [search, setSearch]   = useState("")
  const [page, setPage]       = useState(1)
  const [extra, setExtra]     = useState<RecipeExtraFilters>(EMPTY_EXTRA)
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Cierra el panel al hacer clic fuera
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false)
      }
    }
    if (panelOpen) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [panelOpen])

  const { data, isLoading, error, mutate } = useSWR(
    ["recipes", filter, search, page, extra],
    () => getRecipes(search || undefined, filter, page, PAGE_SIZE, extra),
    { revalidateOnFocus: false, dedupingInterval: 60_000, keepPreviousData: true },
  )

  // Counts for filter tabs (single API call)
  const { data: countsData } = useSWR(
    "recipe-counts",
    () => getRecipeCounts(),
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  )

  const filterCounts = useMemo(() => ({
    all: countsData?.data?.all ?? 0,
    own: countsData?.data?.own ?? 0,
    banco: countsData?.data?.banco ?? 0,
  }), [countsData])

  const recipes = data?.data ?? []
  const total   = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const activeFilterCount = [
    extra.type, extra.weight, extra.portions, extra.empty,
  ].filter(Boolean).length

  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null)
  const [deleting, setDeleting]         = useState(false)
  const [formOpen, setFormOpen]         = useState(false)
  const [editRecipeId, setEditRecipeId] = useState<string | null>(null)
  const [detailRecipeId, setDetailRecipeId] = useState<string | null>(null)
  const [helpOpen, setHelpOpen]         = useState(false)

  useEffect(() => {
    function handleHelp() { setHelpOpen(true) }
    window.addEventListener("open-help", handleHelp)
    return () => window.removeEventListener("open-help", handleHelp)
  }, [])

  const stats = useMemo(() => {
    if (isLoading) return "Cargando…"
    return `${total} receta${total !== 1 ? "s" : ""}`
  }, [total, isLoading])

  function changeFilter(v: RecipeFilter) { setFilter(v); setPage(1) }
  function changeSearch(v: string)       { setSearch(v); setPage(1) }
  function changeExtra(patch: Partial<RecipeExtraFilters>) {
    setExtra(prev => ({ ...prev, ...patch }))
    setPage(1)
  }
  function clearExtra() { setExtra(EMPTY_EXTRA); setPage(1) }

  function handleClearSearch() {
    changeSearch("")
    searchRef.current?.focus()
  }

  async function handleDelete() {
    if (!deleteTarget || !data) return
    const id = deleteTarget.id
    setDeleteTarget(null) // cerrar de inmediato — la card desaparece al instante
    const optimistic = { ...data, data: data.data.filter((r) => r.id !== id), total: data.total - 1 }
    try {
      await mutate(
        async () => { await deleteRecipe(id); return optimistic },
        { optimisticData: optimistic, rollbackOnError: true, revalidate: true }
      )
    } catch { /* rollback automático: la card reaparece si la API falló */ }
  }

  function handleOpenEdit(id: string) {
    setDetailRecipeId(null); setEditRecipeId(id); setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Recetas"
        subtitle={stats}
        action={
          can("recipes", "create") ? (
            <Button variant="primary" onClick={() => { setEditRecipeId(null); setFormOpen(true) }}>
              <Plus size={16} /> Nueva receta
            </Button>
          ) : undefined
        }
      />

      {/* ── Barra de controles ── */}
      <div className="flex flex-col gap-3">
        {/* Búsqueda */}
        <div className="relative">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          >
            <Search size={16} style={{ color: "var(--text-muted)" }} />
          </span>
          <input
            ref={searchRef}
            type="search"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={e => changeSearch(e.target.value)}
            className="h-10 w-full rounded-xl pl-9 pr-10 text-sm outline-none transition-all duration-200"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)"
              e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-light)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-light)"
              e.currentTarget.style.boxShadow = "none"
            }}
          />
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 transition-colors hover:bg-[var(--bg-secondary)]"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Tabs + Botón filtros */}
        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div
            className="flex items-center gap-2 flex-wrap"
            role="group"
            aria-label="Filtrar recetas por origen"
          >
            {TAB_OPTIONS.map(({ value, label }) => {
              const isActive = filter === value
              const count = filterCounts[value]
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeFilter(value)}
                  aria-pressed={isActive}
                  className={clsx(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  )}
                  style={
                    isActive
                      ? {
                          background: "var(--accent)",
                          color: "#fff",
                          boxShadow: "0 1px 4px rgba(27,79,216,0.25)",
                        }
                      : {
                          background: "var(--bg-surface)",
                          color: "var(--text-secondary)",
                          border: "1px solid var(--border-light)",
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "var(--border-medium)"
                      e.currentTarget.style.background = "var(--bg-secondary)"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "var(--border-light)"
                      e.currentTarget.style.background = "var(--bg-surface)"
                    }
                  }}
                >
                  {label}
                  <span
                    className="rounded-full px-1.5 py-0.5 text-xs font-bold leading-none"
                    style={
                      isActive
                        ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                        : {
                            background: "var(--bg-secondary)",
                            color: "var(--text-muted)",
                          }
                    }
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Botón filtros */}
          <div ref={panelRef} className="relative ml-auto">
            <button
              onClick={() => setPanelOpen(o => !o)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                border: `1px solid ${activeFilterCount > 0 ? "var(--accent)" : "var(--border-light)"}`,
                background: activeFilterCount > 0 ? "var(--accent)" : "var(--bg-surface)",
                color: activeFilterCount > 0 ? "#fff" : "var(--text-secondary)",
                boxShadow: activeFilterCount > 0 ? "0 1px 4px rgba(27,79,216,0.25)" : undefined,
                cursor: "pointer",
              }}
            >
              <SlidersHorizontal size={14} />
              Filtros
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold" style={{ background: "rgba(255,255,255,0.3)" }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Panel desplegable */}
            {panelOpen && (
              <div
                className="absolute top-full right-0 mt-1.5 z-40 flex flex-col gap-3.5 p-3.5"
                style={{
                  width: "260px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "16px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                }}
              >
                <FilterGroup label="Tipo de receta">
                  <Chip active={extra.type === "base"}      onClick={() => changeExtra({ type: extra.type === "base"      ? undefined : "base" })}>     Base</Chip>
                  <Chip active={extra.type === "principal"} onClick={() => changeExtra({ type: extra.type === "principal" ? undefined : "principal" })}> Principal</Chip>
                </FilterGroup>

                <FilterGroup label="Porciones">
                  <Chip active={extra.portions === "small"}  onClick={() => changeExtra({ portions: extra.portions === "small"  ? undefined : "small" })}>  ≤ 4</Chip>
                  <Chip active={extra.portions === "medium"} onClick={() => changeExtra({ portions: extra.portions === "medium" ? undefined : "medium" })}> 5–10</Chip>
                  <Chip active={extra.portions === "large"}  onClick={() => changeExtra({ portions: extra.portions === "large"  ? undefined : "large" })}>  &gt; 10</Chip>
                </FilterGroup>

                <FilterGroup label="Peso por porción">
                  <Chip active={extra.weight === "yes"} onClick={() => changeExtra({ weight: extra.weight === "yes" ? undefined : "yes" })}> Con peso</Chip>
                  <Chip active={extra.weight === "no"}  onClick={() => changeExtra({ weight: extra.weight === "no"  ? undefined : "no" })}>  Sin peso</Chip>
                </FilterGroup>

                <FilterGroup label="Contenido">
                  <Chip active={!!extra.empty} onClick={() => changeExtra({ empty: extra.empty ? undefined : true })}>
                    Sin ingredientes
                  </Chip>
                </FilterGroup>

                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { clearExtra(); setPanelOpen(false) }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
                    style={{
                      border: "1px solid var(--border-light)",
                      background: "transparent",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    <X size={11} /> Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chips de filtros activos */}
      {activeFilterCount > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {extra.type      && <ActiveChip label={extra.type === "base" ? "Base" : "Principal"} onRemove={() => changeExtra({ type: undefined })} />}
          {extra.portions  && <ActiveChip label={{ small: "≤ 4 porciones", medium: "5–10 porciones", large: "> 10 porciones" }[extra.portions]} onRemove={() => changeExtra({ portions: undefined })} />}
          {extra.weight    && <ActiveChip label={extra.weight === "yes" ? "Con peso" : "Sin peso"} onRemove={() => changeExtra({ weight: undefined })} />}
          {extra.empty     && <ActiveChip label="Sin ingredientes" onRemove={() => changeExtra({ empty: undefined })} />}
        </div>
      )}

      {/* ── Grid de cards ── */}
      {isLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="animate-pulse rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}>
              <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "70%" }} />
              <div className="h-3 rounded" style={{ background: "var(--bg-secondary)", width: "40%" }} />
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)", marginBottom: "12px" }}>No se pudieron cargar las recetas.</p>
          <Button variant="ghost" onClick={() => void mutate()}>Reintentar</Button>
        </div>
      )}

      {!isLoading && !error && recipes.length === 0 && (
        <EmptyState
          icon={<ChefHat size={40} style={{ color: "var(--text-muted)" }} />}
          title={search || filter !== "all" || activeFilterCount > 0 ? "Sin resultados" : "No tienes recetas registradas"}
          description={
            search || filter !== "all" || activeFilterCount > 0
              ? "Intenta con otros filtros o términos de búsqueda."
              : "Crea tu primera ficha técnica con ingredientes y porciones."
          }
          action={
            !search && filter === "all" && activeFilterCount === 0 && can("recipes", "create") ? (
              <Button variant="primary" onClick={() => { setEditRecipeId(null); setFormOpen(true) }}>
                <Plus size={16} /> Crear primera receta
              </Button>
            ) : undefined
          }
        />
      )}

      {!isLoading && !error && recipes.length > 0 && (
        <>
          {/* Los badges Base/Principal en cada card indican el tipo de receta */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {recipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={r => setDetailRecipeId(r.id)}
                onDelete={can("recipes", "delete") ? setDeleteTarget : undefined}
              />
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* ── Modales ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar receta"
        footer={
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Eliminar</Button>
          </div>
        }
      >
        <p style={{ color: "var(--text-secondary)" }}>
          ¿Eliminar <strong style={{ color: "var(--text-primary)" }}>{deleteTarget?.name}</strong>? Esta acción no se puede deshacer.
        </p>
      </Modal>

      <RecipeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => void mutate()}
        editRecipeId={editRecipeId}
      />

      <RecipeDetailModal
        open={!!detailRecipeId}
        recipeId={detailRecipeId}
        onClose={() => setDetailRecipeId(null)}
        onEdit={can("recipes", "update") ? handleOpenEdit : undefined}
        onDelete={can("recipes", "delete") ? (r => { setDetailRecipeId(null); setDeleteTarget(r) }) : undefined}
        onImported={() => { setDetailRecipeId(null); void mutate() }}
      />

      {/* ── Modal: help ──────────────────────────────────────────────────── */}
      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Recetas"
      >
        <div className="flex flex-col gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          <p>Esta seccion te permite crear y gestionar fichas tecnicas de tus platos con ingredientes y costos.</p>

          <div>
            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Funcionalidades:</p>
            <ul className="flex flex-col gap-2 ml-1">
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Crear receta:</strong> Haz clic en Nueva receta para agregar ingredientes, porciones y costo total.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Ver detalles:</strong> Haz clic en una receta para ver el desglose completo de ingredientes y costos.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Editar o eliminar:</strong> Modifica o borra recetas existentes desde la vista de detalles.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Banco de recetas:</strong> Importa recetas base del sistema para usarlas como plantilla.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Filtros avanzados:</strong> Filtra por tipo (Base/Principal), porciones, peso y contenido.</span>
              </li>
            </ul>
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            <strong>Nota:</strong> Las recetas se usan en el Menu y en las Valoraciones para calcular costos por porcion.
          </p>
        </div>
      </Modal>
    </div>
  )
}

// ── Sub-componentes UI ────────────────────────────────────────────────────────

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
      <p className="text-xs font-semibold" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </p>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {children}
      </div>
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "5px 11px", borderRadius: "100px", fontSize: "12px", fontWeight: 500,
        border: `1px solid ${active ? "var(--accent)" : "var(--border-light)"}`,
        background: active ? "var(--accent)" : "transparent",
        color: active ? "#fff" : "var(--text-secondary)",
        cursor: "pointer", transition: "all 0.12s",
      }}
    >
      {children}
    </button>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "4px 10px", borderRadius: "100px",
      background: "var(--accent-light)", border: "1px solid var(--accent)",
      color: "var(--accent)", fontSize: "12px", fontWeight: 500,
    }}>
      {label}
      <button onClick={onRemove} style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: 0 }}>
        <X size={11} />
      </button>
    </span>
  )
}
