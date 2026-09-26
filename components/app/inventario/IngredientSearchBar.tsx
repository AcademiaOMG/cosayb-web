"use client"

import { Search, X } from "lucide-react"
import { useRef } from "react"

export interface IngredientSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function IngredientSearchBar({
  value,
  onChange,
  placeholder = "Buscar ingrediente",
}: IngredientSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleClear() {
    onChange("")
    inputRef.current?.focus()
  }

  return (
    <div className="relative min-w-0 flex-1">
      <Search
        size={17}
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
        style={{ color: "var(--text-muted)" }}
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault()
            handleClear()
          }
        }}
        placeholder={placeholder}
        aria-label="Buscar ingrediente por nombre"
        autoComplete="off"
        spellCheck={false}
        className="h-11 w-full border border-[var(--border-light)] pl-10 pr-10 text-[15px] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-light)] [&::-webkit-search-cancel-button]:hidden"
        style={{
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-md)",
          color: "var(--text-primary)",
        }}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 transition-colors hover:bg-[var(--bg-secondary)]"
          style={{ color: "var(--text-muted)", borderRadius: "8px" }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}
