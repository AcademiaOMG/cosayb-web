"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Check, SlidersHorizontal } from "lucide-react"
import type { IngredientOriginFilter } from "@/types/ingredient"

interface FilterOption {
  value: IngredientOriginFilter
  label: string
  hint: string
}

const OPTIONS: FilterOption[] = [
  { value: "all", label: "Todos", hint: "Propios y del banco general" },
  { value: "own", label: "Propios", hint: "Los que creaste tú" },
  { value: "base", label: "Banco general", hint: "Precios de referencia" },
]

export interface IngredientFiltersProps {
  active: IngredientOriginFilter
  onChange: (filter: IngredientOriginFilter) => void
  counts: Record<IngredientOriginFilter, number>
}

/**
 * Botón de filtro junto al buscador. El filtro vive en un menú y solo
 * se hace visible en la barra cuando está activo (el botón muestra su nombre).
 */
export default function IngredientFilters({ active, onChange, counts }: IngredientFiltersProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const isFiltered = active !== "all"
  const activeLabel = OPTIONS.find((o) => o.value === active)?.label

  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={isFiltered ? `Filtro: ${activeLabel}. Cambiar filtro` : "Filtrar ingredientes"}
        className="flex h-11 items-center gap-2 px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        style={{
          borderRadius: "var(--radius-md)",
          background: isFiltered ? "var(--accent-light)" : "var(--bg-surface)",
          color: isFiltered ? "var(--accent-text)" : "var(--text-secondary)",
          border: `1px solid ${isFiltered ? "transparent" : "var(--border-light)"}`,
          minWidth: 44,
          justifyContent: "center",
        }}
      >
        <SlidersHorizontal size={17} aria-hidden="true" />
        {isFiltered && <span className="max-w-[7rem] truncate">{activeLabel}</span>}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Filtrar por origen"
          className="absolute right-0 top-full z-30 mt-2 w-72 p-1.5"
          style={{
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--border-light)",
          }}
        >
          {OPTIONS.map((opt) => {
            const selected = opt.value === active
            return (
              <button
                key={opt.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-primary)] focus-visible:bg-[var(--bg-primary)] focus-visible:outline-none"
                style={{ borderRadius: "var(--radius-sm)" }}
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: selected ? "var(--accent-text)" : "var(--text-primary)" }}
                  >
                    {opt.label}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {opt.hint}
                  </span>
                </span>
                <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {counts[opt.value].toLocaleString("es-CO")}
                </span>
                <Check
                  size={16}
                  aria-hidden="true"
                  style={{ color: "var(--accent)", visibility: selected ? "visible" : "hidden" }}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
