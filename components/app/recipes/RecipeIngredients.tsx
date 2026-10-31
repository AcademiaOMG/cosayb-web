"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { RAISED } from "@/components/ui/ModalKit"

export interface IngredientEntry {
  key: string
  name: string
  grams: number
  /** Unidad de la cantidad; ausente = gramos */
  unit?: string
  /** Texto corto junto al nombre (por ejemplo «Preparación base») */
  tag?: string
}

const qtyText = (n: number, unit?: string) =>
  `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${unit === "porcion" ? "porc." : (unit ?? "g")}`

/** Cuántos ingredientes se ven sin pedir más; el resto está a un toque. */
const PREVIEW = 8

/**
 * Ingredientes de una receta: filas compactas en dos columnas (20 ingredientes = 10 filas),
 * en el orden de la receta. Se ven los primeros 8 y «Ver todos» despliega el resto en el lugar,
 * sin contenedor con scroll propio (un contenedor así le recorta la sombra a las tarjetas).
 */
export default function RecipeIngredients({ items }: { items: IngredientEntry[] }) {
  const [expanded, setExpanded] = useState(false)
  // La barra de proporción solo compara líneas en gramos: 30 und no se miden contra 500 g
  const total = items.reduce((s, i) => ((i.unit ?? "g") === "g" ? s + i.grams : s), 0)
  const visible = expanded ? items : items.slice(0, PREVIEW)

  if (items.length === 0) {
    return (
      <p className="py-3 text-center text-sm" style={{ color: "var(--text-muted)" }}>
        Esta receta todavía no tiene ingredientes.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="m-0 grid grid-cols-1 gap-2 p-0 sm:grid-cols-2">
        {visible.map((i) => (
          <li key={i.key} className="list-none px-3.5 py-2.5" style={{ ...RAISED, borderRadius: 14 }}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }} title={i.name}>
                {i.name}
                {i.tag && (
                  <span className="ml-2 text-xs font-medium" style={{ color: "var(--accent-text)" }}>
                    {i.tag}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {qtyText(i.grams, i.unit)}
              </span>
            </div>
            {total > 0 && (i.unit ?? "g") === "g" && (
              <div className="mt-1.5 h-1 overflow-hidden rounded-full" style={{ background: "rgba(16,24,40,0.08)" }} aria-hidden>
                <div className="h-full rounded-full" style={{ width: `${(i.grams / total) * 100}%`, background: "var(--accent)", opacity: 0.85 }} />
              </div>
            )}
          </li>
        ))}
      </ul>

      {items.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          style={{ color: "var(--accent-text)" }}
        >
          {expanded ? "Ver menos" : `Ver los ${items.length - PREVIEW} restantes`}
          <ChevronDown size={16} aria-hidden className="transition-transform duration-200" style={{ transform: expanded ? "rotate(180deg)" : undefined }} />
        </button>
      )}
    </div>
  )
}
