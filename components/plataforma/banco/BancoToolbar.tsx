"use client"

import { useEffect, useRef, useState } from "react"
import { Search, X, ArrowUpDown } from "lucide-react"
import FilterMenu, { ActiveFilterChips, type FilterGroup } from "@/components/ui/FilterMenu"

const RETRASO_MS = 250

/** Buscador con retraso: avisa al padre 250 ms después de que se deja de escribir. */
function Buscador({
  inicial,
  placeholder,
  etiqueta,
  onChange,
}: {
  inicial: string
  placeholder: string
  etiqueta: string
  onChange: (v: string) => void
}) {
  const [texto, setTexto] = useState(inicial)
  const enviado = useRef(inicial)
  const inputRef = useRef<HTMLInputElement>(null)
  const alCambiar = useRef(onChange)
  useEffect(() => { alCambiar.current = onChange })

  useEffect(() => {
    if (texto === enviado.current) return
    const t = setTimeout(() => {
      enviado.current = texto
      alCambiar.current(texto)
    }, RETRASO_MS)
    return () => clearTimeout(t)
  }, [texto])

  function limpiar() {
    setTexto("")
    enviado.current = ""
    alCambiar.current("")
    inputRef.current?.focus()
  }

  return (
    <div className="relative min-w-0 flex-1">
      <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
      <input
        ref={inputRef}
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape" && texto) { e.preventDefault(); limpiar() } }}
        placeholder={placeholder}
        aria-label={etiqueta}
        autoComplete="off"
        spellCheck={false}
        className="h-11 w-full border border-[var(--border-light)] pl-10 pr-10 text-[15px] outline-none transition-[border-color,box-shadow] duration-150 focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-light)] [&::-webkit-search-cancel-button]:hidden"
        style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}
      />
      {texto && (
        <button
          type="button"
          onClick={limpiar}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 transition-colors hover:bg-[var(--bg-secondary)]"
          style={{ color: "var(--text-muted)", borderRadius: 8 }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}

export default function BancoToolbar<O extends string>({
  busquedaInicial,
  claveBusqueda,
  placeholder,
  etiquetaBusqueda,
  onBusqueda,
  grupos,
  orden,
  opcionesOrden,
  onOrden,
}: {
  busquedaInicial: string
  /** cambiar la clave vacía el buscador (al limpiar filtros) */
  claveBusqueda: number
  placeholder: string
  etiquetaBusqueda: string
  onBusqueda: (v: string) => void
  grupos: FilterGroup[]
  orden: O
  opcionesOrden: { value: O; label: string }[]
  onOrden: (o: O) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Buscador
          key={claveBusqueda}
          inicial={busquedaInicial}
          placeholder={placeholder}
          etiqueta={etiquetaBusqueda}
          onChange={onBusqueda}
        />
        <label className="relative shrink-0">
          <span className="sr-only">Ordenar por</span>
          <ArrowUpDown size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <select
            value={orden}
            onChange={(e) => onOrden(e.target.value as O)}
            className="h-10 cursor-pointer appearance-none border border-[var(--border-light)] pl-9 pr-3 text-sm outline-none focus:border-[var(--accent)]"
            style={{ background: "var(--bg-surface)", color: "var(--text-secondary)", borderRadius: "var(--radius-md)" }}
          >
            {opcionesOrden.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <FilterMenu groups={grupos} ariaLabel="Filtrar" />
      </div>
      <ActiveFilterChips groups={grupos} />
    </div>
  )
}
