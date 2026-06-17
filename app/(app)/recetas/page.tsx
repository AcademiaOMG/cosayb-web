"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import EmptyState from "@/components/ui/EmptyState"
import Modal from "@/components/ui/Modal"
import RecipeCard from "@/components/app/recipes/RecipeCard"
import RecipeCostModal from "@/components/app/recipes/RecipeCostModal"
import type { Recipe, RecipeCostResult } from "@/types/domain"
import { getRecipes, deleteRecipe, getRecipeCost } from "@/lib/api"
import { ChefHat, Plus, Search, BookMarked, List } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

export default function RecetasPage() {
  const router = useRouter()

  // ── Remote state ───────────────────────────────────────────────────────────
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [firstLoad, setFirstLoad] = useState(true)
  const [error, setError] = useState(false)

  // ── Filtros ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("")
  const [filterBase, setFilterBase] = useState(false)

  // ── Delete modal ───────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Cost modal ─────────────────────────────────────────────────────────────
  const [costTarget, setCostTarget] = useState<Recipe | null>(null)
  const [costResult, setCostResult] = useState<RecipeCostResult | null>(null)
  const [costLoading, setCostLoading] = useState(false)
  const [costError, setCostError] = useState<string | null>(null)

  // ── Load ───────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await getRecipes()
      setRecipes(res.data ?? [])
    } catch {
      setError(true)
      setRecipes([])
    } finally {
      setLoading(false)
      setFirstLoad(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // ── Derived: filtro local ──────────────────────────────────────────────────
  const filtered = recipes.filter((r) => {
    const matchBase = !filterBase || r.isBase
    const matchSearch =
      !search.trim() ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.recipeNumber.toLowerCase().includes(search.toLowerCase())
    return matchBase && matchSearch
  })

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteRecipe(deleteTarget.id)
      setDeleteTarget(null)
      await load()
    } catch {
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  async function handleOpenCost(recipe: Recipe) {
    setCostTarget(recipe)
    setCostResult(null)
    setCostError(null)
    setCostLoading(true)
    try {
      const res = await getRecipeCost(recipe.id)
      setCostResult(res.data)
    } catch (err) {
      setCostError(err instanceof Error ? err.message : "Error al calcular costo")
    } finally {
      setCostLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ──────────────────────────────────────────────── */}
      <PageHeader
        title="Recetas"
        subtitle={
          loading
            ? "Cargando…"
            : `${recipes.length} receta${recipes.length !== 1 ? "s" : ""} · ${recipes.filter((r) => r.isBase).length} base${recipes.filter((r) => r.isBase).length !== 1 ? "s" : ""}`
        }
        action={
          <Button
            id="btn-nueva-receta"
            variant="primary"
            onClick={() => router.push("/recetas/nueva")}
          >
            <Plus size={16} />
            Nueva receta
          </Button>
        }
      />

      {/* ── Barra de búsqueda + filtros ─────────────────────────── */}
      {!error && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {/* Search */}
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
              onChange={(e) => setSearch(e.target.value)}
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

          {/* Filtro base */}
          <button
            id="filter-base"
            onClick={() => setFilterBase((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              height: "40px",
              padding: "0 14px",
              borderRadius: "12px",
              border: `1px solid ${filterBase ? "var(--accent)" : "var(--border-light)"}`,
              background: filterBase ? "var(--accent-light)" : "var(--bg-surface)",
              color: filterBase ? "var(--accent)" : "var(--text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <BookMarked size={14} />
            Solo bases
          </button>
        </div>
      )}

      {/* ── Skeleton (primera carga) ─────────────────────────────── */}
      {firstLoad && (
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

      {/* ── Error ───────────────────────────────────────────────── */}
      {!firstLoad && !loading && error && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)", marginBottom: "12px" }}>
            No se pudieron cargar las recetas.
          </p>
          <Button variant="ghost" onClick={load}>
            Reintentar
          </Button>
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────── */}
      {!firstLoad && !loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={<ChefHat size={40} style={{ color: "var(--text-muted)" }} />}
          title={
            search || filterBase
              ? "Sin resultados"
              : "No tienes recetas registradas"
          }
          description={
            search || filterBase
              ? "Intenta con otros filtros o términos de búsqueda."
              : "Crea tu primera ficha técnica con ingredientes y porciones para calcular el costo exacto."
          }
          action={
            !search && !filterBase ? (
              <Button
                variant="primary"
                onClick={() => router.push("/recetas/nueva")}
              >
                <Plus size={16} />
                Crear primera receta
              </Button>
            ) : undefined
          }
        />
      )}

      {/* ── Grid de cards ────────────────────────────────────────── */}
      {!firstLoad && !loading && !error && filtered.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onEdit={(r) => router.push(`/recetas/${r.id}/editar`)}
              onDelete={setDeleteTarget}
              onCost={handleOpenCost}
            />
          ))}
        </div>
      )}

      {/* ── Modal: eliminar ──────────────────────────────────────── */}
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

      {/* ── Modal: costo ─────────────────────────────────────────── */}
      <RecipeCostModal
        open={!!costTarget}
        onClose={() => {
          setCostTarget(null)
          setCostResult(null)
          setCostError(null)
        }}
        loading={costLoading}
        result={costResult}
        error={costError}
        recipeName={costTarget?.name ?? ""}
      />
    </div>
  )
}
