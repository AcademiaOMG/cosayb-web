import { Search } from "lucide-react"
import type { ReactNode } from "react"

export interface DataToolbarProps {
  /** Si se pasa, muestra el cuadro de búsqueda. */
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    /** Nombre accesible del cuadro (por defecto, el placeholder). */
    label?: string
  }
  /** Filtros (selects, chips…) a continuación de la búsqueda. */
  filters?: ReactNode
  /** Acciones a la derecha (exportar, crear…). */
  actions?: ReactNode
  /** Texto de resumen («23 resultados»), anunciado a lectores de pantalla. */
  summary?: ReactNode
}

/** Barra sobre tablas y listas: búsqueda + filtros + acciones. Se acomoda en varias líneas en móvil. */
export default function DataToolbar({ search, filters, actions, summary }: DataToolbarProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {search && (
          <label className="relative min-w-[200px] flex-1 sm:max-w-sm">
            <span className="sr-only">{search.label ?? search.placeholder ?? "Buscar"}</span>
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="search"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? "Buscar…"}
              className="console-input h-10 w-full pl-9 pr-3 text-sm"
            />
          </label>
        )}
        {filters}
        {actions && <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {summary && (
        <p className="text-xs" role="status" style={{ color: "var(--text-muted)" }}>{summary}</p>
      )}
    </div>
  )
}
