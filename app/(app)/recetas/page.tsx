"use client"

import useSWR from "swr"
import { useState, useMemo } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import Modal from "@/components/ui/Modal"
import Pagination from "@/components/app/inventario/Pagination"
import RecipeCard from "@/components/app/recipes/RecipeCard"
import RecipeFormModal from "@/components/app/recipes/RecipeFormModal"
import RecipeDetailModal from "@/components/app/recipes/RecipeDetailModal"
import type { Recipe } from "@/types/domain"
import type { RecipeFilter } from "@/lib/api"
import { getRecipes, deleteRecipe } from "@/lib/api"
import { ChefHat, Plus, Search, Globe, User } from "lucide-react"

const PAGE_SIZE = 12

const FILTER_OPTIONS: { value: RecipeFilter; label: string; icon: typeof ChefHat }[] = [
  { value: "all", label: "Todos", icon: ChefHat },
  { value: "own", label: "Propios", icon: User },
  { value: "banco", label: "Banco base", icon: Globe },
]

export default function RecetasPage() {
  const [filter, setFilter] = useState<RecipeFilter>("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const { data, isLoading, error, mutate } = useSWR(
    ["recipes", filter, search, page],
    () => getRecipes(search || undefined, filter, page, PAGE_SIZE),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60_000,
      keepPreviousData: true,
    },
  )

  const recipes = data?.data ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [formOpen, setFormOpen] = useState(false)
  const [editRecipeId, setEditRecipeId] = useState<string | null>(null)

  const [detailId, setDetailId] = useState<string | null>(null)

  const stats = useMemo(() => {
    if (isLoading) return "Cargando…"
    return `${total} receta${total !== 1 ? "s" : ""}`
  }, [total, isLoading])

  function handleFilterChange(value: RecipeFilter) {
    setFilter(value)
    setPage(1)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteRecipe(deleteTarget.id)
      setDeleteTarget(null)
      void mutate()
    } catch {
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  function handleOpenCreate() {
    setEditRecipeId(null)
    setFormOpen(true)
  }

  function handleOpenEdit(id: string) {
    setEditRecipeId(id)
    setFormOpen(true)
  }

  function handleFormSaved() {
    void mutate()
  }

  function handleOpenDetail(id: string) {
    setDetailId(id)
  }

  return (
    <div className="flex flex-col gap-6">

      <PageHeader
        title="Recetas"
        subtitle={stats}
        action={
          <Button
            id="btn-nueva-receta"
            variant="primary"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            Nueva receta
          </Button>
        }
      />

      {/* Filtros + Búsqueda */}
      {!error && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Filtros de origen */}
          <div
            style={{
              display: "inline-flex",
              borderRadius: "12px",
              border: "1px solid var(--border-light)",
              background: "var(--bg-surface)",
              overflow: "hidden",
            }}
          >
            {FILTER_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const active = filter === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => handleFilterChange(opt.value)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "8px 14px",
                    fontSize: "13px",
                    fontWeight: 500,
                    border: "none",
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "#fff" : "var(--text-secondary)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <Icon size={14} />
                  {opt.label}
                </button>
              )
            })}
          </div>

          {/* Búsqueda */}
          <div
            style={{
              flex: 1,
              minWidth: "200px",
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              id="recipe-search"
              type="search"
              placeholder="Buscar por nombre o número…"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{
                width: "100%",
                height: "40px",
                paddingLeft: "36px",
                paddingRight: "12px",
                borderRadius: "12px",
                border: "1px solid var(--border-light)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
              }}
            />
          </div>
        </div>
      )}

      {isLoading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl p-4 flex flex-col gap-3"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
            >
              <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "70%" }} />
              <div className="h-3 rounded" style={{ background: "var(--bg-secondary)", width: "40%" }} />
              <div className="flex gap-2 mt-2">
                <div className="h-5 w-16 rounded-full" style={{ background: "var(--bg-secondary)" }} />
                <div className="h-5 w-20 rounded-full" style={{ background: "var(--bg-secondary)" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)", marginBottom: "12px" }}>
            No se pudieron cargar las recetas.
          </p>
          <Button variant="ghost" onClick={() => void mutate()}>
            Reintentar
          </Button>
        </div>
      )}

      {!isLoading && !error && recipes.length === 0 && (
        <EmptyState
          icon={<ChefHat size={40} style={{ color: "var(--text-muted)" }} />}
          title={
            search || filter !== "all"
              ? "Sin resultados"
              : "No tienes recetas registradas"
          }
          description={
            search || filter !== "all"
              ? "Intenta con otros filtros o términos de búsqueda."
              : "Crea tu primera ficha técnica con ingredientes y porciones para calcular el costo exacto."
          }
          action={
            !search && filter === "all" ? (
              <Button variant="primary" onClick={handleOpenCreate}>
                <Plus size={16} />
                Crear primera receta
              </Button>
            ) : undefined
          }
        />
      )}

      {!isLoading && !error && recipes.length > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "16px",
            }}
          >
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onEdit={(r) => handleOpenEdit(r.id)}
                onDelete={setDeleteTarget}
                onCost={(r) => handleOpenDetail(r.id)}
              />
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar receta"
        footer={
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Eliminar
            </Button>
          </div>
        }
      >
        <p style={{ color: "var(--text-secondary)" }}>
          ¿Eliminar{" "}
          <strong style={{ color: "var(--text-primary)" }}>
            {deleteTarget?.name}
          </strong>
          ? Esta acción no se puede deshacer.
        </p>
      </Modal>

      <RecipeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleFormSaved}
        editRecipeId={editRecipeId}
      />

      <RecipeDetailModal
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        recipeId={detailId}
        onEdit={(id) => {
          setDetailId(null)
          handleOpenEdit(id)
        }}
      />
    </div>
  )
}
