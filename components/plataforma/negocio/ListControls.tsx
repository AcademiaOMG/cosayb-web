"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import Button from "@/components/ui/Button"

/** Valor que se actualiza solo cuando el usuario deja de escribir. */
export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search size={14} className="console-muted" aria-hidden="true" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
      <input
        type="search"
        placeholder={placeholder}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="console-input w-full text-sm"
        style={{ height: 38, paddingLeft: 34, paddingRight: 12 }}
      />
    </div>
  )
}

export function FilterSelect({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { id: string; label: string }[]
}) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="console-input text-sm" style={{ height: 38, paddingInline: 10 }}>
      {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  )
}

export function DateRange({ from, to, onFrom, onTo }: { from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 text-sm console-muted">
      <label className="flex items-center gap-1.5">
        Desde
        <input type="date" value={from} max={to || undefined} onChange={(e) => onFrom(e.target.value)} className="console-input text-sm" style={{ height: 38, paddingInline: 8 }} />
      </label>
      <label className="flex items-center gap-1.5">
        Hasta
        <input type="date" value={to} min={from || undefined} onChange={(e) => onTo(e.target.value)} className="console-input text-sm" style={{ height: 38, paddingInline: 8 }} />
      </label>
    </div>
  )
}

export function Pager({ offset, limit, total, onChange }: { offset: number; limit: number; total: number; onChange: (offset: number) => void }) {
  if (total <= 0) return null
  const from = offset + 1
  const to = Math.min(offset + limit, total)
  return (
    <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3 text-sm console-muted">
      <span>Mostrando {from}–{to} de {total}</span>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>
          <ChevronLeft size={14} aria-hidden="true" /> Anterior
        </Button>
        <Button variant="ghost" size="sm" disabled={offset + limit >= total} onClick={() => onChange(offset + limit)}>
          Siguiente <ChevronRight size={14} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}

/** Orden: criterio + sentido, accesible también en móvil. */
export function SortControl({
  options, sort, order, onChange,
}: {
  options: { id: string; label: string }[]
  sort: string
  order: "asc" | "desc"
  onChange: (sort: string, order: "asc" | "desc") => void
}) {
  return (
    <div className="flex items-center gap-1">
      <FilterSelect label="Ordenar por" value={sort} onChange={(v) => onChange(v, order)} options={options.map((o) => ({ id: o.id, label: `Ordenar: ${o.label}` }))} />
      <Button variant="ghost" size="sm" aria-label={order === "asc" ? "Orden ascendente, cambiar a descendente" : "Orden descendente, cambiar a ascendente"} onClick={() => onChange(sort, order === "asc" ? "desc" : "asc")}>
        {order === "asc" ? "↑ Menor a mayor" : "↓ Mayor a menor"}
      </Button>
    </div>
  )
}

/** Fila etiqueta/valor para los detalles. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs console-muted">{label}</dt>
      <dd className="text-sm console-title break-words">{children}</dd>
    </div>
  )
}
