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
import { getRecipes, deleteRecipe } from "@/lib/api"
import { ChefHat, Plus, Search, Globe, User, SlidersHorizontal, X } from "lucide-react"

const PAGE_SIZE = 12

const TAB_OPTIONS: { value: RecipeFilter; label: string; icon: typeof ChefHat }[] = [
  { value: "all",   label: "Todos",      icon: ChefHat },
  { value: "own",   label: "Propios",    icon: User },
  { value: "banco", label: "Banco base", icon: Globe },
]

const EMPTY_EXTRA: RecipeExtraFilters = {}

export default function RecetasPage() {
  const [filter, setFilter]   = useState<RecipeFilter>("all")
  const [search, setSearch]   = useState("")
  const [page, setPage]       = useState(1)
  const [extra, setExtra]     = useState<RecipeExtraFilters>(EMPTY_EXTRA)
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

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

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try { await deleteRecipe(deleteTarget.id); setDeleteTarget(null); void mutate() }
    catch { setDeleteTarget(null) }
    finally { setDeleting(false) }
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
          <Button variant="primary" onClick={() => { setEditRecipeId(null); setFormOpen(true) }}>
            <Plus size={16} /> Nueva receta
          </Button>
        }
      />

      {/* ── Barra de controles ── */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>

        {/* Tabs */}
        <div style={{ display: "inline-flex", borderRadius: "12px", border: "1px solid var(--border-light)", background: "var(--bg-surface)", overflow: "hidden" }}>
          {TAB_OPTIONS.map(({ value, label, icon: Icon }) => {
            const active = filter === value
            return (
              <button key={value} onClick={() => changeFilter(value)} style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "8px 14px", fontSize: "13px", fontWeight: 500,
                border: "none", cursor: "pointer", transition: "all 0.15s",
                whiteSpace: "nowrap",
                background: active ? "var(--accent)" : "transparent",
                color:      active ? "#fff" : "var(--text-secondary)",
              }}>
                <Icon size={14} />{label}
              </button>
            )
          })}
        </div>

        {/* Búsqueda */}
        <div style={{ flex: 1, minWidth: "180px", position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={15} style={{ position: "absolute", left: "11px", color: "var(--text-muted)", pointerEvents: "none" }} />
          <input
            type="search"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={e => changeSearch(e.target.value)}
            style={{
              width: "100%", height: "40px", paddingLeft: "34px", paddingRight: "12px",
              borderRadius: "12px", border: "1px solid var(--border-light)",
              background: "var(--bg-surface)", color: "var(--text-primary)",
              fontSize: "14px", outline: "none",
            }}
          />
        </div>

        {/* Botón filtros */}
        <div ref={panelRef} style={{ position: "relative" }}>
          <button
            onClick={() => setPanelOpen(o => !o)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              height: "40px", padding: "0 14px",
              borderRadius: "12px", border: "1px solid var(--border-light)",
              background: activeFilterCount > 0 ? "var(--accent)" : "var(--bg-surface)",
              color:      activeFilterCount > 0 ? "#fff" : "var(--text-secondary)",
              fontSize: "13px", fontWeight: 500, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <SlidersHorizontal size={15} />
            Filtros
            {activeFilterCount > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: "18px", height: "18px", borderRadius: "50%",
                background: "rgba(255,255,255,0.3)",
                fontSize: "11px", fontWeight: 700,
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Panel desplegable */}
          {panelOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", right: 0,
              width: "260px", zIndex: 40,
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              borderRadius: "16px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              padding: "14px",
              display: "flex", flexDirection: "column", gap: "14px",
            }}>

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
                  style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "5px",
                    padding: "7px 12px", borderRadius: "8px",
                    border: "1px solid var(--border-light)",
                    background: "transparent", color: "var(--text-muted)",
                    fontSize: "12px", cursor: "pointer",
                  }}
                >
                  <X size={12} /> Limpiar filtros
                </button>
              )}
            </div>
          )}
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
            !search && filter === "all" && activeFilterCount === 0 ? (
              <Button variant="primary" onClick={() => { setEditRecipeId(null); setFormOpen(true) }}>
                <Plus size={16} /> Crear primera receta
              </Button>
            ) : undefined
          }
        />
      )}

      {!isLoading && !error && recipes.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {recipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={r => setDetailRecipeId(r.id)}
                onDelete={setDeleteTarget}
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
        onEdit={handleOpenEdit}
        onDelete={r => { setDetailRecipeId(null); setDeleteTarget(r) }}
        onImported={() => { setDetailRecipeId(null); void mutate() }}
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
