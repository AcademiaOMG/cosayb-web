"use client"

import { AlertCircle, ChevronLeft, ChevronRight, Package } from "lucide-react"
import IngredientRow, { DESKTOP_COLUMNS } from "./IngredientRow"
import Pagination from "./Pagination"
import EmptyState from "@/components/ui/EmptyState"
import Button from "@/components/ui/Button"
import type { Ingredient, IngredientOriginFilter } from "@/types/ingredient"

// ── Superficie única del listado ────────────────────────────────────────────
function Surface({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

// ── Cabecera de columnas (solo desktop) ─────────────────────────────────────
function ColumnHeader() {
  const cell = "text-xs font-semibold"
  return (
    <div
      className={`hidden items-center gap-4 px-5 py-3 md:grid ${DESKTOP_COLUMNS}`}
      style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
      aria-hidden="true"
    >
      <span className={cell}>Ingrediente</span>
      <span className={`${cell} text-right`} style={{ color: "var(--text-secondary)" }}>
        Costo por gramo
      </span>
      <span className={`${cell} text-right`}>Costo unidad</span>
      <span className={`${cell} text-right`}>Peso unidad</span>
      <span />
    </div>
  )
}

// ── Botón de página (mobile) ────────────────────────────────────────────────
function PagerButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next"
  disabled: boolean
  onClick: () => void
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Página anterior" : "Página siguiente"}
      className="flex h-11 w-11 shrink-0 items-center justify-center transition-opacity disabled:opacity-35"
      style={{
        background: "var(--bg-surface)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
        color: "var(--text-primary)",
      }}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  )
}

// ── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonRows({ count }: { count: number }) {
  return (
    <Surface aria-busy="true" aria-label="Cargando ingredientes">
      <ColumnHeader />
      <ul className="animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <li
            key={i}
            className="flex items-center justify-between gap-4 px-4 py-4 md:px-5"
          >
            <div className="h-3.5 rounded-md" style={{ width: `${40 + ((i * 17) % 30)}%`, background: "var(--bg-secondary)" }} />
            <div className="h-3.5 w-16 rounded-md md:w-80" style={{ background: "var(--bg-secondary)" }} />
          </li>
        ))}
      </ul>
    </Surface>
  )
}

// ── Error ───────────────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Surface>
      <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: "#FEF2F2" }}
        >
          <AlertCircle size={22} style={{ color: "#B42020" }} />
        </div>
        <div className="flex max-w-sm flex-col gap-1">
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            No pudimos cargar tus ingredientes
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Revisa tu conexión e intenta de nuevo.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    </Surface>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────
export interface IngredientListProps {
  ingredients: Ingredient[]
  /** Total de resultados tras buscar/filtrar (no solo la página) */
  totalCount: number
  loading: boolean
  error: boolean
  searchQuery: string
  filter: IngredientOriginFilter
  currentPage: number
  totalPages: number
  pageSize: number
  onPageChange: (page: number) => void
  onOpen: (ingredient: Ingredient) => void
  onEdit?: (ingredient: Ingredient) => void
  onDelete?: (ingredient: Ingredient) => void
  onRetry: () => void
  onClearFilters: () => void
}

export default function IngredientList({
  ingredients,
  totalCount,
  loading,
  error,
  searchQuery,
  filter,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onOpen,
  onEdit,
  onDelete,
  onRetry,
  onClearFilters,
}: IngredientListProps) {
  if (loading) return <SkeletonRows count={10} />
  if (error) return <ErrorState onRetry={onRetry} />

  if (ingredients.length === 0) {
    const narrowed = !!searchQuery.trim() || filter !== "all"
    return (
      <EmptyState
        icon={<Package size={36} />}
        title={
          !searchQuery.trim() && filter === "own"
            ? "Sin ingredientes propios"
            : narrowed
            ? "Ningún ingrediente coincide"
            : "Todavía no tienes ingredientes"
        }
        description={
          searchQuery.trim()
            ? `No encontramos "${searchQuery.trim()}". Revisa la ortografía o créalo como ingrediente propio.`
            : filter === "own"
            ? "Aún no has creado ingredientes propios. Créalos cuando tu precio de compra sea distinto al del banco general."
            : narrowed
            ? "Prueba con otro filtro."
            : "Agrega tu primer ingrediente con el botón Nuevo ingrediente."
        }
        action={
          narrowed ? (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Ver todos los ingredientes
            </Button>
          ) : undefined
        }
      />
    )
  }

  const from = (currentPage - 1) * pageSize + 1
  const to = from + ingredients.length - 1
  const rangeLabel =
    totalCount <= pageSize
      ? `${totalCount} ingrediente${totalCount === 1 ? "" : "s"}`
      : `${from.toLocaleString("es-CO")}–${to.toLocaleString("es-CO")} de ${totalCount.toLocaleString("es-CO")}`

  return (
    <div className="flex flex-col gap-3">
      <Surface>
        <ColumnHeader />
        <ul aria-label={`Ingredientes, ${from} a ${to} de ${totalCount}`}>
          {ingredients.map((ingredient) => (
            <IngredientRow
              key={ingredient.id}
              ingredient={ingredient}
              onOpen={onOpen}
              onEdit={onEdit}
              onDelete={onDelete}
              showOwnTag={filter !== "own"}
            />
          ))}
        </ul>
      </Surface>

      {/* Mobile: anterior · rango · siguiente en una sola fila con blancos táctiles grandes */}
      <div className="flex items-center justify-between gap-2 md:hidden">
        {totalPages > 1 && (
          <PagerButton
            dir="prev"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          />
        )}
        <p
          className="flex-1 text-center text-[13px] tabular-nums"
          style={{ color: "var(--text-muted)" }}
          aria-live="polite"
        >
          {rangeLabel}
        </p>
        {totalPages > 1 && (
          <PagerButton
            dir="next"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          />
        )}
      </div>

      {/* Desktop: rango a la izquierda, páginas numeradas a la derecha */}
      <div className="hidden items-center justify-between gap-4 md:flex">
        <p className="text-[13px] tabular-nums" style={{ color: "var(--text-muted)" }}>
          {rangeLabel}
        </p>
        {totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  )
}
