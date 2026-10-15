"use client"

import { useEffect, useId, useRef, useState } from "react"
import { SlidersHorizontal, X } from "lucide-react"

/**
 * Filtros de las listas: UN solo comportamiento en todas las vistas.
 *  - Junto al buscador hay un botón con el icono de filtros; si hay filtros
 *    activos se tiñe y muestra cuántos son (insignia numérica).
 *  - Al pulsarlo se abre un panel con los grupos de opciones.
 *  - Los filtros activos se ven como chips con su nombre y una × (ActiveFilterChips),
 *    debajo de la barra.
 */
export interface FilterOption {
  value: string
  label: string
  /** Cantidad de resultados con esa opción (opcional) */
  count?: number
}

export interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
  /** Opción elegida; undefined = sin filtro en este grupo */
  value: string | undefined
  /** Elegir una opción, o undefined para quitarla */
  onChange: (value: string | undefined) => void
}

const activeOf = (g: FilterGroup) => g.options.find((o) => o.value === g.value)

export function countActiveFilters(groups: FilterGroup[]) {
  return groups.filter((g) => activeOf(g)).length
}

export default function FilterMenu({
  groups,
  ariaLabel = "Filtrar",
}: {
  groups: FilterGroup[]
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const active = countActiveFilters(groups)

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
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={panelId}
        aria-label={active > 0 ? `${ariaLabel} (${active} activos)` : ariaLabel}
        className="relative flex h-10 min-w-[44px] items-center justify-center rounded-xl px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        style={{
          border: `1px solid ${active > 0 ? "transparent" : "var(--border-light)"}`,
          background: active > 0 ? "var(--accent-light)" : "var(--bg-surface)",
          color: active > 0 ? "var(--accent-text)" : "var(--text-secondary)",
          cursor: "pointer",
        }}
      >
        <SlidersHorizontal size={17} aria-hidden="true" />
        {active > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            {active}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="group"
          aria-label={ariaLabel}
          className="anim-pop absolute right-0 top-full z-40 mt-1.5 flex w-[280px] max-w-[calc(100vw-2rem)] flex-col gap-3.5 p-3.5"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-light)",
            borderRadius: 16,
            boxShadow: "var(--shadow-lg)",
            transformOrigin: "top right",
          }}
        >
          {groups.map((g) => (
            <div key={g.id} className="flex flex-col gap-[7px]">
              <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.5px" }}>
                {g.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {g.options.map((o) => {
                  const on = g.value === o.value
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => g.onChange(on ? undefined : o.value)}
                      className="transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                      style={{
                        padding: "5px 11px",
                        borderRadius: 100,
                        fontSize: 12,
                        fontWeight: 500,
                        border: `1px solid ${on ? "var(--accent)" : "var(--border-light)"}`,
                        background: on ? "var(--accent)" : "transparent",
                        color: on ? "#fff" : "var(--text-secondary)",
                        cursor: "pointer",
                      }}
                    >
                      {o.label}
                      {o.count !== undefined && ` · ${o.count.toLocaleString("es-CO")}`}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {active > 0 && (
            <button
              type="button"
              onClick={() => {
                groups.forEach((g) => g.value !== undefined && g.onChange(undefined))
                setOpen(false)
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-[var(--bg-primary)]"
              style={{ border: "1px solid var(--border-light)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}
            >
              <X size={11} aria-hidden="true" /> Limpiar filtros
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Los filtros activos, con su nombre y una × para quitarlos. No se dibuja nada si no hay. */
export function ActiveFilterChips({ groups }: { groups: FilterGroup[] }) {
  const chips = groups.flatMap((g) => {
    const o = activeOf(g)
    return o ? [{ id: g.id, label: o.label, remove: () => g.onChange(undefined) }] : []
  })
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Filtros activos">
      {chips.map((c) => (
        <span
          key={c.id}
          className="anim-pop inline-flex items-center gap-1.5 text-xs font-medium"
          style={{
            padding: "4px 10px",
            borderRadius: 100,
            background: "var(--accent-light)",
            border: "1px solid var(--accent)",
            color: "var(--accent-text)",
          }}
        >
          {c.label}
          <button
            type="button"
            aria-label={`Quitar filtro ${c.label}`}
            onClick={c.remove}
            className="flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}
          >
            <X size={11} aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  )
}
