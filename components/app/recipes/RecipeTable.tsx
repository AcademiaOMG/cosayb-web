"use client"

import { memo } from "react"
import useSWR from "swr"
import { ChevronRight, Lock, Trash2 } from "lucide-react"
import type { Recipe } from "@/types/domain"
import { getRecipeCost } from "@/lib/api"
import { formatCOP } from "@/lib/utils"
import { RECIPE_CANT_DELETE, RECIPE_ORIGIN, RECIPE_TYPE, recipeTypeLabel } from "@/lib/recipeLabels"

/**
 * Misma base de cálculo que el detalle de la receta (RecipeDetailModal): costo
 * por porción con el margen de seguridad, y precio sugerido con 30 % de materia
 * prima. La clave coincide con la del modal, así comparten caché de SWR.
 */
const MATERIAL_COST_PCT = 30

/** Columnas en desktop, compartidas por la cabecera y las filas para que queden alineadas. */
export const RECIPE_COLUMNS =
  "md:grid-cols-[minmax(0,1fr)_8.5rem_5.5rem_6.5rem_7.5rem_7.5rem_2.5rem] xl:grid-cols-[minmax(0,1fr)_9.5rem_6.5rem_7.5rem_9rem_9rem_3rem]"

export function RecipeTableHeader() {
  const cell = "text-xs font-semibold"
  return (
    <div
      className={`hidden items-center gap-4 px-5 py-3 md:grid ${RECIPE_COLUMNS}`}
      style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
      aria-hidden="true"
    >
      <span className={cell}>Receta</span>
      <span className={cell}>Tipo</span>
      <span className={`${cell} text-right`}>Porciones</span>
      <span className={`${cell} text-right`}>Ingredientes</span>
      <span className={`${cell} text-right`}>Costo por porción</span>
      <span className={`${cell} text-right`} style={{ color: "var(--text-secondary)" }}>
        Precio sugerido
      </span>
      <span />
    </div>
  )
}

function useRecipeMoney(recipeId: string, hasItems: boolean) {
  const { data, isLoading } = useSWR(
    hasItems ? ["recipe-cost", recipeId, String(MATERIAL_COST_PCT)] : null,
    () => getRecipeCost(recipeId, MATERIAL_COST_PCT / 100).then((r) => r.data),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  )
  const cost = data ? data.costWithMarginPerServing : null
  const price = cost != null && cost > 0 ? cost / (MATERIAL_COST_PCT / 100) : null
  return { cost, price, loading: hasItems && isLoading }
}

function Money({ value, loading, strong }: { value: number | null; loading: boolean; strong?: boolean }) {
  if (loading) {
    return <span className="inline-block h-3.5 w-16 animate-pulse rounded-md" style={{ background: "var(--bg-secondary)" }} />
  }
  if (value == null) return <span style={{ color: "var(--text-muted)" }}>—</span>
  return (
    <span className={strong ? "font-bold" : ""} style={{ color: strong ? "var(--text-primary)" : "var(--text-secondary)" }}>
      {formatCOP(value)}
    </span>
  )
}

/** Etiqueta en palabras: de dónde viene la receta (solo se marca la del banco). */
function Tag({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <span
      title={title}
      className="shrink-0 px-1.5 py-px text-[11px] font-semibold leading-4"
      style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", borderRadius: "6px" }}
    >
      {children}
    </span>
  )
}

interface RecipeRowProps {
  recipe: Recipe
  onOpen: (recipe: Recipe) => void
  /** Sin handler = usuario sin permiso → la acción no se renderiza */
  onDelete?: (recipe: Recipe) => void
}

const RecipeRow = memo(function RecipeRow({ recipe, onOpen, onDelete }: RecipeRowProps) {
  const servings = parseInt(recipe.servings, 10) || 0
  const itemCount = recipe.itemCount ?? recipe.items?.length ?? 0
  const { cost, price, loading } = useRecipeMoney(recipe.id, itemCount > 0)
  const isPublic = recipe.isPublic ?? false
  // La API no permite eliminar recetas base: no se ofrece un botón que siempre fallaría
  const canDelete = !isPublic && !recipe.isBase && !!onDelete

  const typeLabel = recipeTypeLabel(recipe.isBase)
  const typeHint = recipe.isBase ? RECIPE_TYPE.base.hint : RECIPE_TYPE.dish.hint
  const lockedReason = isPublic ? RECIPE_CANT_DELETE.banco : recipe.isBase ? RECIPE_CANT_DELETE.base : null
  // Móvil: el tipo y el origen van en la línea de detalle; en escritorio el tipo tiene su columna.
  const origin = isPublic ? <Tag title={RECIPE_ORIGIN.banco.hint}>{RECIPE_ORIGIN.banco.tag}</Tag> : null

  return (
    <li className="group relative list-none transition-colors even:bg-[var(--bg-primary)]/60 hover:bg-[var(--accent-light)]/50 focus-within:bg-[var(--accent-light)]/50">
      {/* Botón que cubre toda la fila → abre el detalle. Las acciones van por encima (z-10). */}
      <button
        type="button"
        onClick={() => onOpen(recipe)}
        className="absolute inset-0 z-0 w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
        aria-label={`Ver receta ${recipe.name}`}
      />

      {/* ── Mobile: dos líneas, el precio sugerido manda ─────────────────── */}
      <div className="pointer-events-none relative flex items-center gap-3 px-4 py-3 md:hidden">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="line-clamp-2 text-[15px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
            {recipe.name}
          </span>
          <span className="flex flex-wrap items-center gap-1.5 text-[13px] tabular-nums" style={{ color: "var(--text-muted)" }}>
            <span title={typeHint}>{typeLabel}</span> · {servings} porción{servings !== 1 ? "es" : ""} · {itemCount} ingrediente{itemCount !== 1 ? "s" : ""}
            {origin}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end tabular-nums">
          <span className="text-[15px]">
            <Money value={price} loading={loading} strong />
          </span>
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            cuesta <Money value={cost} loading={loading} />
          </span>
        </div>
        <ChevronRight size={16} aria-hidden="true" style={{ color: "var(--border-medium)" }} />
      </div>

      {/* ── Desktop: columnas alineadas, números a la derecha ────────────── */}
      <div className={`pointer-events-none relative hidden items-center gap-4 px-5 md:grid ${RECIPE_COLUMNS}`} style={{ minHeight: 52 }}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }} title={recipe.name}>
            {recipe.name}
          </span>
          {origin}
        </div>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }} title={typeHint}>
          {typeLabel}
        </span>
        <span className="text-right text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {servings}
        </span>
        <span className="text-right text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {itemCount}
        </span>
        <span className="text-right text-sm tabular-nums">
          <Money value={cost} loading={loading} />
        </span>
        <span className="text-right text-sm tabular-nums">
          <Money value={price} loading={loading} strong />
        </span>
        <div className="flex items-center justify-end">
          {canDelete ? (
            <button
              type="button"
              onClick={() => onDelete?.(recipe)}
              aria-label={`Eliminar receta ${recipe.name}`}
              title="Eliminar receta"
              className="pointer-events-auto relative z-10 p-2 text-[var(--text-secondary)] opacity-60 transition hover:bg-red-50 hover:text-[#B42020] hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              <Trash2 size={15} />
            </button>
          ) : lockedReason && onDelete ? (
            <span
              className="pointer-events-auto relative z-10 p-2"
              title={lockedReason}
              role="img"
              aria-label={lockedReason}
              style={{ color: "var(--text-muted)" }}
            >
              <Lock size={14} />
            </span>
          ) : (
            <ChevronRight
              size={16}
              aria-hidden="true"
              className="opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: "var(--text-muted)" }}
            />
          )}
        </div>
      </div>
    </li>
  )
})

export default function RecipeTable({ recipes, onOpen, onDelete }: { recipes: Recipe[] } & Omit<RecipeRowProps, "recipe">) {
  return (
    <div
      className="overflow-hidden"
      style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}
    >
      <RecipeTableHeader />
      <ul aria-label="Recetas">
        {recipes.map((recipe) => (
          <RecipeRow key={recipe.id} recipe={recipe} onOpen={onOpen} onDelete={onDelete} />
        ))}
      </ul>
    </div>
  )
}
