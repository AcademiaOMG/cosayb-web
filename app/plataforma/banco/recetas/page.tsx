"use client"

import useSWR from "swr"
import { useState, useMemo } from "react"
import { usePermissions } from "@/hooks/usePermissions"
import RecipeFormModal, { type RecipeFormDataSource } from "@/components/app/recipes/RecipeFormModal"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Pagination from "@/components/app/inventario/Pagination"
import type { Recipe } from "@/types/domain"
import type { BancoRecipeType } from "@/lib/api"
import {
  bancoListRecipes, bancoGetRecipe, bancoCreateRecipe, bancoUpdateRecipe,
  bancoDeleteRecipe, bancoListIngredients,
} from "@/lib/api"
import { Search, Plus, Pencil, Trash2, ChefHat, BookMarked, Users } from "lucide-react"

// ═══════════════════════════════════════════════════════════════════════════
// Content Studio — recetas del banco público.
// Reutiliza el <RecipeFormModal> del tenant con un dataSource propio.
// ═══════════════════════════════════════════════════════════════════════════

const PAGE_SIZE = 12

const BANCO_SOURCE: RecipeFormDataSource = {
  sourceKey: "banco",
  loadCatalog: async () => {
    const [ing, rec] = await Promise.all([
      bancoListIngredients(undefined, 1, 1000).then((r) => r.data),
      bancoListRecipes(undefined, 1, "base", 300).then((r) => r.data),
    ])
    return { ingredients: ing, baseRecipes: rec }
  },
  loadRecipe: (id) => bancoGetRecipe(id).then((r) => r.data),
  create: (payload) => bancoCreateRecipe(payload),
  update: (id, payload) => bancoUpdateRecipe(id, payload),
}

const TYPE_TABS: { value: BancoRecipeType; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "base", label: "Base" },
  { value: "principal", label: "Principales" },
]

export default function BancoRecetasPage() {
  const { platformCan } = usePermissions()
  const [search, setSearch] = useState("")
  const [type, setType] = useState<BancoRecipeType>("all")
  const [page, setPage] = useState(1)

  const { data, isLoading, error, mutate } = useSWR(
    ["banco-recipes", search, type, page],
    () => bancoListRecipes(search || undefined, page, type, PAGE_SIZE),
    { keepPreviousData: true, revalidateOnFocus: false }
  )

  const canCreate = platformCan("publicRecipes", "create")
  const canUpdate = platformCan("publicRecipes", "update")
  const canDelete = platformCan("publicRecipes", "delete")

  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null)
  const [deleting, setDeleting] = useState(false)

  const totalPages = useMemo(
    () => (data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1),
    [data]
  )

  function changeType(v: BancoRecipeType) { setType(v); setPage(1) }
  function changeSearch(v: string) { setSearch(v); setPage(1) }

  async function handleDelete() {
    if (!deleteTarget || !data) return
    const id = deleteTarget.id
    setDeleteTarget(null) // cerrar de inmediato — la card desaparece al instante
    const optimistic = { ...data, data: data.data.filter((r) => r.id !== id), total: data.total - 1 }
    try {
      await mutate(
        async () => { await bancoDeleteRecipe(id); return optimistic },
        { optimisticData: optimistic, rollbackOnError: true, revalidate: true }
      )
    } catch { /* rollback automático si la API falla */ }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold console-title">Banco público · Recetas</h1>
          <p className="text-sm console-muted mt-1">
            {data ? `${data.total} recetas visibles para todos los negocios` : "Cargando…"}
          </p>
        </div>
        {canCreate && (
          <Button variant="primary" onClick={() => { setEditId(null); setFormOpen(true) }}>
            <Plus size={15} /> Nueva receta
          </Button>
        )}
      </div>

      {/* Filtros + búsqueda */}
      <div className="flex gap-3 flex-wrap items-center">
        <div
          className="inline-flex overflow-hidden"
          style={{ borderRadius: 12, border: "1px solid var(--border-light)", background: "var(--bg-surface)" }}
        >
          {TYPE_TABS.map((t) => {
            const active = type === t.value
            return (
              <button
                key={t.value}
                onClick={() => changeType(t.value)}
                style={{
                  padding: "8px 16px", fontSize: 13, fontWeight: 500,
                  border: "none", cursor: "pointer", whiteSpace: "nowrap",
                  background: active ? "var(--accent)" : "transparent",
                  color: active ? "#fff" : "var(--text-secondary)",
                  transition: "all 0.15s",
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="relative flex-1" style={{ minWidth: 220, maxWidth: 360 }}>
          <Search size={14} className="console-muted" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="search"
            placeholder="Buscar receta…"
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            className="console-input w-full text-sm"
            style={{ height: 40, paddingLeft: 34, paddingRight: 12 }}
          />
        </div>
      </div>

      {/* Grid de cards */}
      {isLoading && !data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse console-card" style={{ height: 150 }} />
          ))}
        </div>
      )}

      {error && !data && (
        <div className="text-center py-16">
          <p className="text-sm console-muted mb-3">No se pudieron cargar las recetas del banco.</p>
          <Button variant="ghost" onClick={() => void mutate()}>Reintentar</Button>
        </div>
      )}

      {data && data.data.length === 0 && (
        <div className="text-center py-16">
          <ChefHat size={36} className="console-muted mx-auto mb-3" />
          <p className="text-sm console-muted">
            {search || type !== "all" ? "Sin resultados con estos filtros." : "El banco no tiene recetas todavía."}
          </p>
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20, opacity: isLoading ? 0.6 : 1, transition: "opacity 0.15s" }}>
            {data.data.map((recipe) => (
              <BancoRecipeCard
                key={recipe.id}
                recipe={recipe}
                onEdit={canUpdate ? () => { setEditId(recipe.id); setFormOpen(true) } : undefined}
                onDelete={canDelete ? () => setDeleteTarget(recipe) : undefined}
              />
            ))}
          </div>

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {/* Formulario compartido con el tenant, dataSource del banco */}
      <RecipeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => void mutate()}
        editRecipeId={editId}
        dataSource={BANCO_SOURCE}
      />

      {/* Confirmar eliminación */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar receta del banco"
        footer={
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>Eliminar</Button>
          </div>
        }
      >
        <p style={{ color: "var(--text-secondary)" }}>
          ¿Eliminar <strong style={{ color: "var(--text-primary)" }}>{deleteTarget?.name}</strong> del banco público?
          Dejará de estar disponible para todos los negocios. La acción queda auditada.
        </p>
      </Modal>
    </div>
  )
}

// ─── Card de receta del banco (ligera y espaciada) ────────────────────────────

function BancoRecipeCard({
  recipe,
  onEdit,
  onDelete,
}: {
  recipe: Recipe & { itemCount?: number }
  onEdit?: () => void
  onDelete?: () => void
}) {
  const servings = Math.round(parseFloat(recipe.servings)) || 0

  return (
    <article
      className="flex flex-col gap-3 rounded-2xl p-5 transition-all"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        height: 204, // tamaño FIJO: todas las cards iguales
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(18,33,58,0.10)"
        e.currentTarget.style.borderColor = "var(--border-medium)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = ""
        e.currentTarget.style.borderColor = "var(--border-light)"
      }}
    >
      {/* Header: icono + nombre + badges */}
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "#F0FDF4" }}
        >
          <ChefHat size={18} style={{ color: "#16A34A" }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-sm font-semibold leading-snug truncate"
            style={{ color: "var(--text-primary)" }}
            title={recipe.name}
          >
            {recipe.name}
          </h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            {recipe.isBase && (
              <span
                className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase"
                style={{ background: "#EDE9FE", color: "#6D28D9" }}
              >
                <BookMarked size={8} /> Base
              </span>
            )}
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {recipe.recipeNumber}
            </span>
          </div>
        </div>
      </div>

      {/* Descripción — SIEMPRE reserva exactamente 2 líneas (tamaño uniforme) */}
      <p
        className="text-xs"
        style={{
          color: recipe.description ? "var(--text-secondary)" : "var(--text-muted)",
          fontStyle: recipe.description ? "normal" : "italic",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          lineHeight: 1.5,
          height: "3em", // 2 líneas × 1.5 — la segunda línea ya no se corta
        }}
      >
        {recipe.description || "Sin descripción"}
      </p>

      {/* Footer: datos + acciones SIEMPRE visibles */}
      <div
        className="flex items-center gap-4 mt-auto pt-3"
        style={{ borderTop: "1px solid var(--border-light)" }}
      >
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <Users size={12} /> {servings} porciones
        </span>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {recipe.itemCount ?? 0} ingredientes
        </span>

        <div className="flex gap-1 ml-auto shrink-0">
          {onEdit && (
            <button
              onClick={onEdit}
              title="Editar receta"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                color: "var(--accent)",
                background: "var(--accent-light)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Pencil size={12} /> Editar
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              title="Eliminar receta"
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{ color: "#B42020", background: "#FEF2F2", border: "none", cursor: "pointer" }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
