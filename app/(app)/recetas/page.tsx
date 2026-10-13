"use client"

import useSWR, { useSWRConfig } from "swr"
import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import Modal from "@/components/ui/Modal"
import Pagination from "@/components/app/inventario/Pagination"
import RecipeTable, { RecipeTableSkeleton } from "@/components/app/recipes/RecipeTable"
import RecipeCalculatorView from "@/components/app/recipes/RecipeCalculatorView"
import RecipeDetailModal from "@/components/app/recipes/RecipeDetailModal"
import { RECIPE_ORIGIN, RECIPE_TYPE } from "@/lib/recipeLabels"
import { ownsRecipe } from "@/lib/recipeOwnership"
import type { Recipe } from "@/types/domain"
import type { RecipeFilter, RecipeExtraFilters } from "@/lib/api"
import { getRecipes, deleteRecipe, getRecipeCounts } from "@/lib/api"
import { usePermissions } from "@/hooks/usePermissions"
import { useHelpAvailable } from "@/hooks/useHelpAvailable"
import { useRevalidateOnboarding } from "@/hooks/useOnboardingChecklist"
import ModuleLocked from "@/components/app/ModuleLocked"
import { toast } from "@/lib/toast"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { ChefHat, Plus, Search, SlidersHorizontal, X } from "lucide-react"

const PAGE_SIZE = 12

const TAB_OPTIONS: { value: RecipeFilter; label: string }[] = [
  { value: "all",   label: "Todas" },
  { value: "own",   label: RECIPE_ORIGIN.own.label },
  { value: "banco", label: RECIPE_ORIGIN.banco.label },
]

const EMPTY_EXTRA: RecipeExtraFilters = {}

type PageView = "list" | "calculator"

export default function RecetasPage() {
  useHelpAvailable()
  const { can, hasFeature, featureLockedMessage, organization, impersonation } = usePermissions()
  // Propiedad real: la org activa (o la impersonada) decide qué recetas son editables
  const activeOrgId = organization?.id ?? impersonation?.organizationId
  const canModify = useCallback((r: Recipe) => ownsRecipe(r, activeOrgId), [activeOrgId])
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
  const { data: countsData, mutate: mutateCounts } = useSWR(
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

  // Origen (Todas/Mis recetas/Banco de recetas) también cuenta como filtro activo
  const totalActiveFilters = activeFilterCount + (filter !== "all" ? 1 : 0)

  const confirm = useConfirm()
  const [view, setView]                 = useState<PageView>("list")
  const [editRecipeId, setEditRecipeId] = useState<string | null>(null)
  const { mutate: globalMutate } = useSWRConfig()
  const revalidateOnboarding = useRevalidateOnboarding()
  const [detailRecipeId, setDetailRecipeId] = useState<string | null>(null)
  const [helpOpen, setHelpOpen]         = useState(false)

  useEffect(() => {
    function handleHelp() { setHelpOpen(true) }
    window.addEventListener("open-help", handleHelp)
    return () => window.removeEventListener("open-help", handleHelp)
  }, [])

  /** Receta guardada: refrescar lista, contadores y detalles en caché, y volver a la lista */
  function handleSaved(info: { name: string; created: boolean }) {
    void mutate()
    void mutateCounts()
    void globalMutate((key) => Array.isArray(key) && (key[0] === "recipe-detail" || key[0] === "recipe-cost"))
    revalidateOnboarding()
    toast.success(info.created ? "Receta creada" : "Receta actualizada", { description: info.name })
    setView("list")
  }

  function openCreate() {
    setEditRecipeId(null)
    setView("calculator")
  }

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

  async function handleDelete(target: Recipe) {
    if (!data) return
    const ok = await confirm({
      title: "Eliminar receta",
      itemName: target.name,
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      variant: "danger",
    })
    if (!ok) return
    const id = target.id
    const optimistic = { ...data, data: data.data.filter((r) => r.id !== id), total: data.total - 1 }
    // Si era la última receta de esta página, retroceder en vez de dejar "Sin resultados"
    if (optimistic.data.length === 0 && page > 1) setPage(page - 1)
    try {
      await mutate(
        async () => { await deleteRecipe(id); return optimistic },
        { optimisticData: optimistic, rollbackOnError: true, revalidate: true }
      )
      void mutateCounts()
      revalidateOnboarding()
      toast.success("Receta eliminada", { description: target.name })
    } catch (e) {
      // rollback automático: la card reaparece; ahora además se explica por qué
      toast.error("No se pudo eliminar la receta", {
        description: e instanceof Error && e.message ? e.message : "Revisa tu conexión e inténtalo de nuevo.",
      })
    }
  }

  function handleOpenEdit(id: string) {
    setDetailRecipeId(null); setEditRecipeId(id); setView("calculator")
  }

  // Ayuda: se muestra tanto en la lista como en la vista de calculadora
  const helpModal = (
    <Modal
      open={helpOpen}
      onClose={() => setHelpOpen(false)}
      title="Recetas"
    >
      <div className="flex flex-col gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
        <p>Aquí creas y gestionas las fichas técnicas de tus platos: ingredientes, porciones, costos y precio de venta.</p>
  
        <div>
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Funcionalidades:</p>
          <ul className="flex flex-col gap-2 ml-1">
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Crear receta:</strong> Pulsa Nueva receta. Una pantalla completa te guía en 5 pasos: ponle nombre, agrega los ingredientes (elige uno, escribe sus gramos y pulsa Agregar; la lista va sumando el costo), indica cuántas porciones salen, elige qué parte del precio se va en ingredientes y revisa el resultado. Al final pulsa Guardar.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Ver detalles:</strong> Haz clic en una receta para ver el desglose completo de ingredientes y costos.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Editar o eliminar:</strong> Modifica o borra tus recetas desde la vista de detalles. Al editar, la pantalla se abre con los ingredientes que ya tenía. Las preparaciones base y las del banco de recetas no se pueden editar ni eliminar.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Banco de recetas:</strong> Recetas de Academia OMG para usar como punto de partida; puedes copiarlas a tu negocio.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Filtros avanzados:</strong> Filtra por tipo (platos o preparaciones base), porciones, peso y contenido.</span>
            </li>
          </ul>
        </div>
  
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          <strong>Nota:</strong> Las recetas se usan en el Menú y en las Valoraciones para calcular costos por porción.
        </p>
      </div>
    </Modal>
  )

  if (!hasFeature("module_recipes")) {
    return <ModuleLocked message={featureLockedMessage("module_recipes")} />
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Recetas"
        subtitle="Tus platos, ingredientes y porciones."
        action={
          can("recipes", "create") ? (
            <Button variant="primary" onClick={openCreate}>
              <Plus size={16} /> Nueva receta
            </Button>
          ) : undefined
        }
      />

      {/* ── Barra de controles ── */}
      <div className="flex flex-col gap-3">
        {/* Búsqueda + filtros (un solo botón con menú, como en Inventario) */}
        <div className="flex items-center gap-2">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-0">
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


          {/* Botón filtros */}
          <div ref={panelRef} className="relative shrink-0">
            <button
              onClick={() => setPanelOpen(o => !o)}
              aria-expanded={panelOpen}
              aria-haspopup="true"
              aria-label={totalActiveFilters > 0 ? `Filtros (${totalActiveFilters} activos)` : "Filtrar recetas"}
              className="relative flex h-10 min-w-[44px] items-center justify-center rounded-xl px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              style={{
                border: `1px solid ${totalActiveFilters > 0 ? "transparent" : "var(--border-light)"}`,
                background: totalActiveFilters > 0 ? "var(--accent-light)" : "var(--bg-surface)",
                color: totalActiveFilters > 0 ? "var(--accent-text)" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              <SlidersHorizontal size={17} aria-hidden="true" />
              {totalActiveFilters > 0 && (
                <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold" style={{ background: "var(--accent)", color: "#fff" }}>
                  {totalActiveFilters}
                </span>
              )}
            </button>

            {/* Panel desplegable */}
            {panelOpen && (
              <div
                className="absolute top-full right-0 mt-1.5 z-40 flex flex-col gap-3.5 p-3.5"
                style={{
                  width: "280px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "16px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                }}
              >
                <FilterGroup label="Origen">
                  {TAB_OPTIONS.map(({ value, label }) => (
                    <Chip key={value} active={filter === value} onClick={() => changeFilter(value)}>
                      {label} · {filterCounts[value]}
                    </Chip>
                  ))}
                </FilterGroup>

                <FilterGroup label="Tipo de receta">
                  <Chip active={extra.type === "base"}      onClick={() => changeExtra({ type: extra.type === "base"      ? undefined : "base" })}>     {RECIPE_TYPE.base.plural}</Chip>
                  <Chip active={extra.type === "principal"} onClick={() => changeExtra({ type: extra.type === "principal" ? undefined : "principal" })}> {RECIPE_TYPE.dish.plural}</Chip>
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

                {totalActiveFilters > 0 && (
                  <button
                    onClick={() => { clearExtra(); changeFilter("all"); setPanelOpen(false) }}
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
      {totalActiveFilters > 0 && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {filter !== "all" && <ActiveChip label={filter === "own" ? RECIPE_ORIGIN.own.label : RECIPE_ORIGIN.banco.label} onRemove={() => changeFilter("all")} />}
          {extra.type      && <ActiveChip label={extra.type === "base" ? RECIPE_TYPE.base.plural : RECIPE_TYPE.dish.plural} onRemove={() => changeExtra({ type: undefined })} />}
          {extra.portions  && <ActiveChip label={{ small: "≤ 4 porciones", medium: "5–10 porciones", large: "> 10 porciones" }[extra.portions]} onRemove={() => changeExtra({ portions: undefined })} />}
          {extra.weight    && <ActiveChip label={extra.weight === "yes" ? "Con peso" : "Sin peso"} onRemove={() => changeExtra({ weight: undefined })} />}
          {extra.empty     && <ActiveChip label="Sin ingredientes" onRemove={() => changeExtra({ empty: undefined })} />}
        </div>
      )}

      {/* ── Tabla de recetas ── */}
      {isLoading && <RecipeTableSkeleton />}

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
              <Button variant="primary" onClick={openCreate}>
                <Plus size={16} /> Crear primera receta
              </Button>
            ) : undefined
          }
        />
      )}

      {!isLoading && !error && recipes.length > 0 && (
        <>
          <RecipeTable
            recipes={recipes}
            onOpen={r => setDetailRecipeId(r.id)}
            onDelete={can("recipes", "delete") ? handleDelete : undefined}
            canModify={canModify}
          />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* ── Modales ── */}
      {helpModal}

      {/* Crear / editar: ventana flotante sobre la lista */}
      {view === "calculator" && (
        <RecipeCalculatorView
          // Arranque limpio al cambiar entre "nueva" y cada receta a editar
          key={editRecipeId ?? "new"}
          editRecipeId={editRecipeId}
          onBack={() => setView("list")}
          onSaved={handleSaved}
        />
      )}

      <RecipeDetailModal
        open={!!detailRecipeId}
        recipeId={detailRecipeId}
        onClose={() => setDetailRecipeId(null)}
        canModify={canModify}
        onEdit={can("recipes", "update") ? handleOpenEdit : undefined}
        onDelete={can("recipes", "delete") ? (r => { setDetailRecipeId(null); void handleDelete(r) }) : undefined}
        onImported={() => { setDetailRecipeId(null); void mutate(); revalidateOnboarding() }}
      />

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
      type="button"
      aria-pressed={active}
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
      <button type="button" aria-label={`Quitar filtro ${label}`} onClick={onRemove} style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: 0 }}>
        <X size={11} />
      </button>
    </span>
  )
}
