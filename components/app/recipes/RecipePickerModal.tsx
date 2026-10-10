"use client"

import { useState } from "react"
import { Search, X, ChefHat } from "lucide-react"
import Modal from "@/components/ui/Modal"
import RecipeCard from "./RecipeCard"
import { RECIPE_TYPE } from "@/lib/recipeLabels"
import type { Recipe } from "@/types/domain"

type TypeFilter = "all" | "base" | "principal"

const TYPE_CHIPS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "base", label: RECIPE_TYPE.base.plural },
  { value: "principal", label: RECIPE_TYPE.dish.plural },
]

/**
 * Selector de platos para el menú: la misma lista de recetas del módulo
 * Recetas (tarjetas + búsqueda + filtro por tipo) para agregar o cambiar
 * la receta de una línea.
 */
export default function RecipePickerModal({
  open,
  recipes,
  onClose,
  onSelect,
}: {
  open: boolean
  recipes: Recipe[]
  onClose: () => void
  onSelect: (recipe: Recipe) => void
}) {
  const [search, setSearch] = useState("")
  const [type, setType] = useState<TypeFilter>("all")

  const q = search.trim().toLowerCase()
  const filtered = recipes.filter((r) => {
    if (type === "base" && !r.isBase) return false
    if (type === "principal" && r.isBase) return false
    return q === "" || r.name.toLowerCase().includes(q)
  })

  function resetFilters() {
    setSearch("")
    setType("all")
  }
  function handleSelect(recipe: Recipe) {
    resetFilters()
    onSelect(recipe)
  }
  function handleClose() {
    resetFilters()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Agregar plato" wide blur>
      <div className="flex flex-col gap-4">
        {/* Búsqueda + filtro por tipo (como en el módulo Recetas) */}
        <div className="flex flex-col gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true">
              <Search size={16} style={{ color: "var(--text-muted)" }} />
            </span>
            <input
              type="search"
              placeholder="Buscar receta por nombre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar receta"
              className="h-10 w-full rounded-xl pl-9 pr-9 text-sm outline-none"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-light)",
                color: "var(--text-primary)",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 transition-colors hover:bg-[var(--bg-secondary)]"
                style={{ color: "var(--text-muted)" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por tipo">
            {TYPE_CHIPS.map((chip) => {
              const active = type === chip.value
              return (
                <button
                  key={chip.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setType(chip.value)}
                  className="px-2.5 py-1 rounded-full text-xs transition-all"
                  style={{
                    border: `1px solid ${active ? "var(--accent)" : "var(--border-light)"}`,
                    background: active ? "var(--accent)" : "transparent",
                    color: active ? "#fff" : "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Lista de recetas */}
        {recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <ChefHat size={32} style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Aún no tienes recetas. Crea tus platos en la sección <strong>Recetas</strong> y luego
              agrégalos al menú desde aquí.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
            <ChefHat size={32} style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Sin resultados{search ? ` para «${search}»` : ""}. Prueba con otro término u otro filtro.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 260px), 1fr))",
              gap: "12px",
            }}
          >
            {filtered.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} onClick={handleSelect} />
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
