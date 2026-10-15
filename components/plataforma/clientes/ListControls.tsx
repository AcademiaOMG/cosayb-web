"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react"
import Button from "@/components/ui/Button"
import { toast } from "@/lib/toast"
import { totalPages } from "@/lib/plataforma/clientes"

/** Buscador con espera (350 ms) para no consultar en cada tecla. */
export function SearchBox({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  const [text, setText] = useState(value)
  useEffect(() => {
    if (text === value) return
    const t = setTimeout(() => onChange(text), 350)
    return () => clearTimeout(t)
  }, [text, value, onChange])
  return (
    <div className="relative w-full" style={{ maxWidth: 360 }}>
      <Search size={14} className="console-muted" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} aria-hidden="true" />
      <input
        type="search"
        placeholder={placeholder}
        aria-label={label}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="console-input w-full text-sm"
        style={{ height: 38, paddingLeft: 34, paddingRight: 12 }}
      />
    </div>
  )
}

export interface QuickTab { id: string; label: string; count?: number; active: boolean; onSelect: () => void }

/** Vistas rápidas con contador: un clic aplica el filtro. */
export function QuickTabs({ tabs, ariaLabel }: { tabs: QuickTab[]; ariaLabel: string }) {
  return (
    <div role="group" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-pressed={t.active}
          onClick={t.onSelect}
          className="inline-flex items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors"
          style={{
            height: 32,
            background: t.active ? "var(--accent-light)" : "transparent",
            color: t.active ? "var(--accent)" : "var(--text-secondary)",
            border: `1px solid ${t.active ? "var(--accent)" : "var(--border-light)"}`,
            cursor: "pointer",
          }}
        >
          {t.label}
          {t.count !== undefined && <span className="text-xs" style={{ opacity: 0.75 }}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function SortSelect<T extends string>({ value, dir, options, onChange }: { value: T; dir: "asc" | "desc"; options: { value: T; label: string }[]; onChange: (sort: T, dir: "asc" | "desc") => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs console-muted" htmlFor="sort-select">Ordenar por</label>
      <select
        id="sort-select"
        value={value}
        onChange={(e) => onChange(e.target.value as T, e.target.value === "name" ? "asc" : "desc")}
        className="console-input text-sm"
        style={{ height: 38, paddingInline: 10 }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <button
        type="button"
        onClick={() => onChange(value, dir === "asc" ? "desc" : "asc")}
        className="text-sm console-muted"
        style={{ height: 38, paddingInline: 10, border: "1px solid var(--border-light)", borderRadius: "var(--radius-md)", background: "transparent", cursor: "pointer" }}
        aria-label={dir === "asc" ? "Orden ascendente, cambiar a descendente" : "Orden descendente, cambiar a ascendente"}
      >
        {dir === "asc" ? "↑ Menor a mayor" : "↓ Mayor a menor"}
      </button>
    </div>
  )
}

export function ExportButton({ onExport }: { onExport: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  return (
    <Button
      variant="ghost"
      size="sm"
      loading={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await onExport()
        } catch (e) {
          toast.error("No se pudo exportar", { description: e instanceof Error ? e.message : undefined })
        } finally {
          setBusy(false)
        }
      }}
    >
      <Download size={14} aria-hidden="true" /> Exportar CSV
    </Button>
  )
}

export function Pagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const pages = totalPages(total, limit)
  if (total <= limit) return null
  const from = (page - 1) * limit + 1
  const to = Math.min(total, page * limit)
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3 text-sm console-muted">
      <span>{from}–{to} de {total}</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft size={14} aria-hidden="true" /> Anterior
        </Button>
        <span>Página {page} de {pages}</span>
        <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Siguiente <ChevronRight size={14} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
