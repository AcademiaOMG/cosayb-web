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
  "md:grid-cols-[minmax(0,1fr)_8rem_6.5rem_5rem_6rem_6.5rem_6.5rem_2.5rem] xl:grid-cols-[minmax(0,1fr)_9rem_8rem_6rem_7rem_8.5rem_8.5rem_3rem]"

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
      <span className={cell}>Origen</span>
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

interface RecipeRowProps {
  recipe: Recipe
  onOpen: (recipe: Recipe) => void
  /** Sin handler = usuario sin permiso → la acción no se renderiza */
  onDelete?: (recipe: Recipe) => void
  /** ¿La receta es del negocio activo? Solo entonces se ofrece eliminar (la API lo valida también). */
  canModify: (recipe: Recipe) => boolean
}

const RecipeRow = memo(function RecipeRow({ recipe, onOpen, onDelete, canModify }: RecipeRowProps) {
  const servings = parseInt(recipe.servings, 10) || 0
  const itemCount = recipe.itemCount ?? recipe.items?.length ?? 0
  const { cost, price, loading } = useRecipeMoney(recipe.id, itemCount > 0)
  const isPublic = recipe.isPublic ?? false
  // Propiedad real: la receta es de mi negocio (el tipo "preparación base" no bloquea)
  const canDelete = canModify(recipe) && !!onDelete

  const typeLabel = recipeTypeLabel(recipe.isBase)
  const typeHint = recipe.isBase ? RECIPE_TYPE.base.hint : RECIPE_TYPE.dish.hint
  const lockedReason = canDelete ? null : isPublic ? RECIPE_CANT_DELETE.banco : RECIPE_CANT_DELETE.ajena

  return (
    <li className="group relative list-none transition-colors even:bg-[var(--bg-primary)]/60 hover:bg-[var(--accent-light)]/50 focus-within:bg-[var(--accent-light)]/50">
      {/* Botón que cubre toda la fila → abre el detalle. Las acciones van por encima (z-10). */}
      <button
        type="button"
        onClick={() => onOpen(recipe)}
        className="absolute inset-0 z-0 w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
        aria-label={`Ver receta ${recipe.name}`}
      />

      {/* ── Mobile: nombre, dos cifras con etiqueta y pie con tipo y porciones ── */}
      <div className="pointer-events-none relative flex flex-col gap-2.5 px-4 py-3.5 md:hidden">
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 text-[15px] font-semibold leading-snug" style={{ color: "var(--text-primary)" }}>
            {recipe.name}
          </span>
          <ChevronRight size={16} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: "var(--border-medium)" }} />
        </div>

        <dl
          className="m-0 grid grid-cols-2 gap-px overflow-hidden tabular-nums"
          style={{ background: "var(--border-light)", borderRadius: "var(--radius-md)" }}
        >
          <div className="flex flex-col gap-0.5 px-3 py-2" style={{ background: "var(--bg-primary)" }}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Costo por porción
            </dt>
            <dd className="m-0 text-[15px]">
              <Money value={cost} loading={loading} />
            </dd>
          </div>
          <div className="flex flex-col gap-0.5 px-3 py-2" style={{ background: "var(--bg-primary)" }}>
            <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Precio sugerido
            </dt>
            <dd className="m-0 text-[15px]">
              <Money value={price} loading={loading} strong />
            </dd>
          </div>
        </dl>

        <p className="m-0 text-[12.5px]" style={{ color: "var(--text-muted)" }} title={typeHint}>
          {typeLabel} · {servings} porción{servings !== 1 ? "es" : ""}
        </p>
      </div>

      {/* ── Desktop: columnas alineadas, números a la derecha ────────────── */}
      <div className={`pointer-events-none relative hidden items-center gap-4 px-5 md:grid ${RECIPE_COLUMNS}`} style={{ minHeight: 52 }}>
        <span className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }} title={recipe.name}>
          {recipe.name}
        </span>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }} title={typeHint}>
          {typeLabel}
        </span>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }} title={isPublic ? RECIPE_ORIGIN.banco.hint : RECIPE_ORIGIN.own.hint}>
          {isPublic ? RECIPE_ORIGIN.banco.label : RECIPE_ORIGIN.own.label}
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

export default function RecipeTable({ recipes, onOpen, onDelete, canModify }: { recipes: Recipe[] } & Omit<RecipeRowProps, "recipe">) {
  return (
    <div
      className="overflow-hidden"
      style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}
    >
      <RecipeTableHeader />
      <ul aria-label="Recetas">
        {recipes.map((recipe) => (
          <RecipeRow key={recipe.id} recipe={recipe} onOpen={onOpen} onDelete={onDelete} canModify={canModify} />
        ))}
      </ul>
    </div>
  )
}

/**
 * Esqueleto con la estructura real de la tabla: misma cabecera, mismas columnas
 * (RECIPE_COLUMNS), misma altura de fila (52 px) y, en móvil, las dos líneas de
 * nombre/detalle + precio. Así no hay salto de layout al llegar los datos.
 */
export function RecipeTableSkeleton({ rows = 8 }: { rows?: number }) {
  const bar = "rounded-md"
  const fill = { background: "var(--bg-secondary)" } as const
  return (
    <div
      className="overflow-hidden"
      style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}
      aria-busy="true"
      aria-label="Cargando recetas"
    >
      <RecipeTableHeader />
      <ul className="animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="list-none even:bg-[var(--bg-primary)]/60">
            {/* Móvil */}
            <div className="flex flex-col gap-2.5 px-4 py-3.5 md:hidden">
              <div className={`h-4 ${bar}`} style={{ ...fill, width: `${55 + ((i * 13) % 30)}%` }} />
              <div className={`h-12 w-full ${bar}`} style={fill} />
              <div className={`h-3 w-2/3 ${bar}`} style={fill} />
            </div>
            {/* Escritorio */}
            <div className={`hidden items-center gap-4 px-5 md:grid ${RECIPE_COLUMNS}`} style={{ minHeight: 52 }}>
              <div className={`h-3.5 ${bar}`} style={{ ...fill, width: `${40 + ((i * 17) % 35)}%` }} />
              <div className={`h-3.5 w-20 ${bar}`} style={fill} />
              <div className={`h-3.5 w-16 ${bar}`} style={fill} />
              <div className={`ml-auto h-3.5 w-6 ${bar}`} style={fill} />
              <div className={`ml-auto h-3.5 w-6 ${bar}`} style={fill} />
              <div className={`ml-auto h-3.5 w-16 ${bar}`} style={fill} />
              <div className={`ml-auto h-3.5 w-20 ${bar}`} style={fill} />
              <span />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
