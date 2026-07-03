"use client"

import { Search, X } from "lucide-react"
import { useId, useRef } from "react"
import { clsx } from "clsx"

export type YieldFactorFilter = "all" | "bfactor" | "bfactorveg"

export interface YieldFactorSearchBarProps {
  value: string
  onChange: (value: string) => void
  filter: YieldFactorFilter
  onFilterChange: (filter: YieldFactorFilter) => void
  resultCount?: number
  counts: Record<YieldFactorFilter, number>
}

const FILTER_OPTIONS: { value: YieldFactorFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "bfactor", label: "Proteína" },
  { value: "bfactorveg", label: "Vegetal" },
]

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

  return (
    <div className="flex flex-col gap-3">
      {/* Search input */}
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          aria-hidden="true"
        >
          <Search size={16} style={{ color: "var(--text-muted)" }} />
        </span>

        <input
          ref={inputRef}
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar ingrediente..."
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

      {/* Filter buttons */}
      <div
        className="flex items-center gap-2 flex-wrap"
        role="group"
        aria-label="Filtrar factores de rendimiento por tipo"
      >
        {FILTER_OPTIONS.map((opt) => {
          const isActive = filter === opt.value
          const count = counts[opt.value]
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onFilterChange(opt.value)}
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
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Live result count hint */}
      {value && resultCount !== undefined && (
        <p
          id={`${id}-results`}
          className="text-xs pl-1"
          style={{ color: "var(--text-muted)" }}
          aria-live="polite"
          aria-atomic="true"
        >
          {resultCount === 0
            ? "Sin resultados"
            : `${resultCount} resultado${resultCount === 1 ? "" : "s"}`}
        </p>
      )}
    </div>
  )
}
