"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

/**
 * Sección que se despliega con "Ver detalle" (arranca cerrada).
 * Patrón compartido de los modales de resultado (Menú, Punto de Equilibrio).
 */
export default function CollapsibleSection({
  title, count, icon, defaultOpen = false, children,
}: {
  title: string
  /** Cantidad de ítems; se muestra junto al título */
  count?: number
  icon?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-secondary)]"
        style={{ background: "var(--bg-surface)" }}
      >
        {icon}
        <span className="flex-1 min-w-0 text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
          {title}{count !== undefined ? ` (${count})` : ""}
        </span>
        <span className="text-xs font-semibold shrink-0" style={{ color: "var(--accent)" }}>
          {open ? "Ocultar detalle" : "Ver detalle"}
        </span>
        <ChevronDown
          size={16}
          className="shrink-0 transition-transform"
          style={{ color: "var(--accent)", transform: open ? "rotate(180deg)" : undefined }}
          aria-hidden
        />
      </button>
      {open && <div className="p-4" style={{ borderTop: "1px solid var(--border-light)" }}>{children}</div>}
    </div>
  )
}
