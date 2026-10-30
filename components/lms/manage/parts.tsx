"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/lms/ui"

export const PAGE = 25

/** Valor con retraso: evita una petición por cada letra escrita en un buscador. */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setV(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return v
}

export function SearchBox({ value, onChange, placeholder, label, width = 240 }: { value: string; onChange: (v: string) => void; placeholder: string; label: string; width?: number }) {
  return (
    <div className="relative">
      <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--l-muted)" }} />
      <input className="l-input !min-h-10" style={{ paddingLeft: 36, width }} type="search" placeholder={placeholder} aria-label={label} value={value} maxLength={100} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

export function Pager({ total, offset, onChange, noun = "resultados" }: { total: number; offset: number; onChange: (offset: number) => void; noun?: string }) {
  if (total <= PAGE) return <p className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{total} {noun}</p>
  const from = offset + 1
  const to = Math.min(offset + PAGE, total)
  return (
    <nav className="flex items-center justify-between gap-3" aria-label="Paginación">
      <p className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{from}–{to} de {total} {noun}</p>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - PAGE))}><ChevronLeft size={15} aria-hidden="true" /> Anterior</Button>
        <Button variant="ghost" size="sm" disabled={to >= total} onClick={() => onChange(offset + PAGE)}>Siguiente <ChevronRight size={15} aria-hidden="true" /></Button>
      </div>
    </nav>
  )
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export const dateLabel = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—"

export const dateTimeLabel = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"
