"use client"

import { clsx } from "clsx"
import type { IngredientOriginFilter } from "@/types/ingredient"

interface FilterOption {
  value: IngredientOriginFilter
  label: string
  count?: number
}

export interface IngredientFiltersProps {
  active: IngredientOriginFilter
  onChange: (filter: IngredientOriginFilter) => void
  counts: Record<IngredientOriginFilter, number>
}

export default function IngredientFilters({
  active,
  onChange,
  counts,
}: IngredientFiltersProps) {
  const options: FilterOption[] = [
    { value: "all", label: "Todos", count: counts.all },
    { value: "own", label: "Propios", count: counts.own },
    { value: "base", label: "Banco base", count: counts.base },
  ]

  return (
    <div
      className="flex items-center gap-2 flex-wrap"
      role="group"
      aria-label="Filtrar ingredientes por origen"
    >
      {options.map((opt) => {
        const isActive = active === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={isActive}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            )}
            style={
              isActive
                ? {
                    background: "var(--accent)",
                    color: "#fff",
                    boxShadow: "0 1px 4px rgba(27,79,216,0.25)",
                  }
                : {
                    background: "var(--bg-surface)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-light)",
                  }
            }
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = "var(--border-medium)"
                e.currentTarget.style.background = "var(--bg-secondary)"
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.borderColor = "var(--border-light)"
                e.currentTarget.style.background = "var(--bg-surface)"
              }
            }}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                className="rounded-full px-1.5 py-0.5 text-xs font-bold leading-none"
                style={
                  isActive
                    ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
                    : {
                        background: "var(--bg-secondary)",
                        color: "var(--text-muted)",
                      }
                }
              >
                {opt.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
