"use client"

import { Search, X } from "lucide-react"
import { useId, useRef } from "react"
import FilterMenu, { ActiveFilterChips, type FilterGroup } from "@/components/ui/FilterMenu"

export type YieldFactorFilter = "all" | "bfactor" | "bfactorveg"

export interface YieldFactorSearchBarProps {
  value: string
  onChange: (value: string) => void
  filter: YieldFactorFilter
  onFilterChange: (filter: YieldFactorFilter) => void
  resultCount?: number
  counts: Record<YieldFactorFilter, number>
}

/** Buscador + botón de filtros (mismo patrón que Recetas e Inventario). */
export default function YieldFactorSearchBar({
  value,
  onChange,
  filter,
  onFilterChange,
  resultCount,
  counts,
}: YieldFactorSearchBarProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleClear() {
    onChange("")
    inputRef.current?.focus()
  }

  const groups: FilterGroup[] = [
    {
      id: "type",
      label: "Tipo de ingrediente",
      options: [
        { value: "bfactor", label: "Proteínas", count: counts.bfactor },
        { value: "bfactorveg", label: "Vegetales", count: counts.bfactorveg },
      ],
      value: filter === "all" ? undefined : filter,
      onChange: (v) => onFilterChange((v as YieldFactorFilter | undefined) ?? "all"),
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true">
            <Search size={16} style={{ color: "var(--text-muted)" }} />
          </span>

          <input
            ref={inputRef}
            id={id}
            type="search"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Buscar por nombre…"
            aria-label="Buscar factor de rendimiento por nombre"
            aria-describedby={resultCount !== undefined ? `${id}-results` : undefined}
            className="h-10 w-full rounded-xl pl-9 pr-10 text-sm outline-none transition-all duration-200"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)"
              e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-light)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-light)"
              e.currentTarget.style.boxShadow = "none"
            }}
          />

          {value && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpiar búsqueda"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 transition-colors hover:bg-[var(--bg-secondary)]"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <FilterMenu groups={groups} ariaLabel="Filtrar factores de rendimiento" />
      </div>

      <ActiveFilterChips groups={groups} />

      {value && resultCount !== undefined && (
        <p
          id={`${id}-results`}
          className="text-xs pl-1"
          style={{ color: "var(--text-muted)" }}
          aria-live="polite"
          aria-atomic="true"
        >
          {resultCount === 0 ? "Sin resultados" : `${resultCount} resultado${resultCount === 1 ? "" : "s"}`}
        </p>
      )}
    </div>
  )
}
