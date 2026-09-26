"use client"

import { ChevronRight, Pencil, Trash2 } from "lucide-react"
import type { Ingredient } from "@/types/ingredient"
import {
  displayName,
  formatCOP,
  formatGrams,
  formatPerGram,
  getPriceStatus,
  isOwnIngredient,
} from "./format"

/**
 * Columnas del listado en desktop. Compartidas con la cabecera
 * (IngredientGrid) para que ambas queden alineadas.
 */
export const DESKTOP_COLUMNS =
  "md:grid-cols-[minmax(0,1fr)_8.5rem_8.5rem_7.5rem_5rem] xl:grid-cols-[minmax(0,1fr)_10.5rem_10.5rem_9.5rem_5rem]"

export interface IngredientRowProps {
  ingredient: Ingredient
  onOpen: (ingredient: Ingredient) => void
  /** Sin handler = usuario sin permiso → la acción no se renderiza */
  onEdit?: (ingredient: Ingredient) => void
  onDelete?: (ingredient: Ingredient) => void
  /** Con el filtro "Propios" activo la etiqueta sobra: todas lo son */
  showOwnTag?: boolean
}

function OwnTag() {
  return (
    <span
      className="shrink-0 px-1.5 py-px text-[11px] font-semibold leading-4"
      style={{
        background: "var(--accent-light)",
        color: "var(--accent-text)",
        borderRadius: "6px",
      }}
    >
      Propio
    </span>
  )
}

function StaleDot() {
  return (
    <span
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ background: "#D97706" }}
      title="Precio desactualizado: confirmado hace más de 30 días"
      aria-label="Precio desactualizado"
      role="img"
    />
  )
}

export default function IngredientRow({
  ingredient,
  onOpen,
  onEdit,
  onDelete,
  showOwnTag = true,
}: IngredientRowProps) {
  const own = isOwnIngredient(ingredient)
  const tagged = own && showOwnTag
  const stale = getPriceStatus(ingredient) === "stale"
  const name = displayName(ingredient.name)
  const perGram = formatPerGram(ingredient.costPerGram)
  const unitCost = formatCOP(ingredient.costPerUnit)
  const weight = formatGrams(ingredient.weightGrams)
  const canEdit = own && !!onEdit
  const canDelete = own && !!onDelete

  return (
    <li
      className="group relative list-none transition-colors even:bg-[var(--bg-primary)]/60 hover:bg-[var(--accent-light)]/50 focus-within:bg-[var(--accent-light)]/50"
    >
      {/* Botón que cubre toda la fila → abre el detalle. Las acciones van por encima (z-10). */}
      <button
        type="button"
        onClick={() => onOpen(ingredient)}
        className="absolute inset-0 z-0 w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--accent)]"
        aria-label={`Ver detalle de ${name}`}
      />

      {/* ── Mobile: dos líneas, el costo por gramo manda ─────────────────── */}
      <div className="pointer-events-none relative flex items-center gap-3 px-4 py-3 md:hidden">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* En mobile el nombre puede ocupar dos líneas: truncarlo esconde justo lo que distingue ("… 1000 ml") */}
          <span
            className="line-clamp-2 text-[15px] font-semibold leading-snug"
            style={{ color: "var(--text-primary)" }}
          >
            {name}
            {tagged && (
              <>
                {" "}
                <span className="relative -top-px inline-block align-middle">
                  <OwnTag />
                </span>
              </>
            )}
          </span>
          <span
            className="text-[13px] tabular-nums"
            style={{ color: "var(--text-muted)" }}
          >
            {unitCost} por {weight}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {stale && <StaleDot />}
          <span
            className="text-[15px] font-bold tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {perGram}
            <span className="font-medium" style={{ color: "var(--text-muted)" }}>/g</span>
          </span>
          <ChevronRight size={16} aria-hidden="true" style={{ color: "var(--border-medium)" }} />
        </div>
      </div>

      {/* ── Desktop: columnas alineadas, números a la derecha ────────────── */}
      <div
        className={`pointer-events-none relative hidden items-center gap-4 px-5 md:grid ${DESKTOP_COLUMNS}`}
        style={{ minHeight: 52 }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="truncate text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
            title={ingredient.name}
          >
            {name}
          </span>
          {tagged && <OwnTag />}
        </div>
        <span
          className="flex items-center justify-end gap-2 text-sm font-bold tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {stale && <StaleDot />}
          {perGram}
        </span>
        <span className="text-right text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {unitCost}
        </span>
        <span className="text-right text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {weight}
        </span>
        <div className="flex items-center justify-end gap-0.5">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(ingredient)}
              aria-label={`Editar ${name}`}
              title="Editar"
              className="pointer-events-auto relative z-10 p-2 opacity-60 transition hover:bg-[var(--bg-secondary)] hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
              style={{ color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}
            >
              <Pencil size={15} />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(ingredient)}
              aria-label={`Eliminar ${name}`}
              title="Eliminar"
              className="pointer-events-auto relative z-10 p-2 text-[var(--text-secondary)] opacity-60 transition hover:bg-red-50 hover:text-[#B42020] hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              <Trash2 size={15} />
            </button>
          )}
          {!canEdit && !canDelete && (
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
}
