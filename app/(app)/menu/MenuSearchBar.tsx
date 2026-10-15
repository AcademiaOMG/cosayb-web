"use client"

import { Search, X } from "lucide-react"
import { useRef } from "react"
import FilterMenu, { ActiveFilterChips, type FilterGroup } from "@/components/ui/FilterMenu"

export type MenuProfit = "MUY_BUENO" | "REGULAR" | "MALO"
export type MenuSize = "small" | "medium" | "large"

/** Mismos cortes que el indicador de rentabilidad del menú (<32 % muy bueno, >37 % malo). */
export const profitOf = (pctMP: number): MenuProfit => (pctMP < 32 ? "MUY_BUENO" : pctMP > 37 ? "MALO" : "REGULAR")
export const sizeOf = (people: number): MenuSize => (people <= 10 ? "small" : people <= 50 ? "medium" : "large")

/** Buscador + botón de filtros (mismo patrón que Recetas, Inventario y Factor de rendimiento). */
export default function MenuSearchBar({
  search,
  onSearch,
  profit,
  onProfit,
  size,
  onSize,
  profitCounts,
}: {
  search: string
  onSearch: (v: string) => void
  profit: MenuProfit | undefined
  onProfit: (v: MenuProfit | undefined) => void
  size: MenuSize | undefined
  onSize: (v: MenuSize | undefined) => void
  profitCounts: Record<MenuProfit, number>
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const groups: FilterGroup[] = [
    {
      id: "profit",
      label: "Rentabilidad",
      options: [
        { value: "MUY_BUENO", label: "Muy buena", count: profitCounts.MUY_BUENO },
        { value: "REGULAR", label: "Regular", count: profitCounts.REGULAR },
        { value: "MALO", label: "Mala", count: profitCounts.MALO },
      ],
      value: profit,
      onChange: (v) => onProfit(v as MenuProfit | undefined),
    },
    {
      id: "size",
      label: "Personas",
      options: [
        { value: "small", label: "≤ 10 personas" },
        { value: "medium", label: "11–50 personas" },
        { value: "large", label: "> 50 personas" },
      ],
      value: size,
      onChange: (v) => onSize(v as MenuSize | undefined),
    },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true">
            <Search size={16} style={{ color: "var(--text-muted)" }} />
          </span>
          <input
            ref={inputRef}
            type="search"
            placeholder="Buscar por nombre…"
            aria-label="Buscar menú por nombre"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="h-10 w-full rounded-xl pl-9 pr-10 text-sm outline-none transition-all duration-200"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)"
              e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-light)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border-light)"
              e.currentTarget.style.boxShadow = "none"
            }}
          />
          {search && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => {
                onSearch("")
                inputRef.current?.focus()
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 transition-colors hover:bg-[var(--bg-secondary)]"
              style={{ color: "var(--text-muted)" }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <FilterMenu groups={groups} ariaLabel="Filtrar menús" />
      </div>
      <ActiveFilterChips groups={groups} />
    </div>
  )
}
