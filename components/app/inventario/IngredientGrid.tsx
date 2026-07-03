"use client"

import { AlertCircle, Package } from "lucide-react"
import IngredientCard from "./IngredientCard"
import Pagination from "./Pagination"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import EmptyState from "@/components/ui/EmptyState"
import type { Ingredient } from "@/types/ingredient"

// ── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-5 animate-pulse"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
      }}
    >
      <div className="flex flex-col gap-2">
        <div
          className="h-4 w-3/4 rounded-md"
          style={{ background: "var(--bg-secondary)" }}
        />
        <div
          className="h-5 w-16 rounded-full"
          style={{ background: "var(--bg-secondary)" }}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div
          className="h-12 rounded-xl"
          style={{ background: "var(--bg-primary)" }}
        />
        <div
          className="h-12 rounded-xl"
          style={{ background: "var(--bg-primary)" }}
        />
        <div
          className="col-span-2 h-9 rounded-xl"
          style={{ background: "var(--bg-primary)" }}
        />
      </div>
    </div>
  )
}

// ── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-2xl px-6 py-16 text-center"
      style={{
        background: "var(--bg-surface)",
        border: "1px dashed #FCA5A5",
      }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "#FEF2F2" }}
      >
        <AlertCircle size={24} style={{ color: "#B42020" }} />
      </div>
      <div className="flex flex-col gap-1 max-w-sm">
        <p
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Error al cargar ingredientes
        </p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Ocurrió un problema al conectar con el servidor. Revisa tu conexión e
          intenta de nuevo.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        style={{
          background: "var(--accent)",
          color: "#fff",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--accent-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "var(--accent)")
        }
      >
        Reintentar
      </button>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export interface IngredientGridProps {
  ingredients: Ingredient[]
  loading: boolean
  error: boolean
  searchQuery: string
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  onEdit?: (ingredient: Ingredient) => void
  onDelete?: (ingredient: Ingredient) => void
  onRetry: () => void
  pageSize: number
}

export default function IngredientGrid({
  ingredients,
  loading,
  error,
  searchQuery,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDelete,
  onRetry,
  pageSize,
}: IngredientGridProps) {
  // Loading state → skeleton grid
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
        aria-label="Cargando ingredientes"
      >
        {Array.from({ length: pageSize }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  // Error state
  if (error) {
    return <ErrorState onRetry={onRetry} />
  }

  // Empty state (no results after filter/search)
  if (ingredients.length === 0) {
    return (
      <EmptyState
        icon={<Package size={40} />}
        title={searchQuery ? "Sin resultados" : "No tienes ingredientes todavía"}
        description={
          searchQuery
            ? `No se encontró ningún ingrediente con "${searchQuery}".`
            : "Agrega tu primer ingrediente usando el botón de arriba."
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Grid */}
      <ul
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-label={`${ingredients.length} ingrediente${ingredients.length === 1 ? "" : "s"}`}
      >
        {ingredients.map((ingredient) => (
          <li key={ingredient.id} className="list-none">
            <IngredientCard
              ingredient={ingredient}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </li>
        ))}
      </ul>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  )
}
