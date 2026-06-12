"use client"

import { Search, X } from "lucide-react"
import { useId, useRef } from "react"

export interface IngredientSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  resultCount?: number
}

export default function IngredientSearchBar({
  value,
  onChange,
  placeholder = "Buscar ingrediente...",
  resultCount,
}: IngredientSearchBarProps) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleClear() {
    onChange("")
    inputRef.current?.focus()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        {/* Search icon */}
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          aria-hidden="true"
        >
          <Search size={16} style={{ color: "var(--text-muted)" }} />
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Buscar ingrediente por nombre"
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

        {/* Clear button */}
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
