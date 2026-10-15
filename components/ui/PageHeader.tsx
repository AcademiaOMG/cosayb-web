"use client"

import { HelpCircle } from "lucide-react"
import { useHelpAvailableSnapshot } from "@/hooks/useHelpAvailable"

export interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  // En móvil el botón «¿Cómo funciona?» vive aquí (en desktop lo muestra el
  // Topbar), así no ocupa espacio en la barra de navegación inferior.
  const helpAvailable = useHelpAvailableSnapshot()

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1 min-w-0">
        {/* El «?» va dentro del flujo del título: acompaña a la última palabra en vez de flotar en medio al lado */}
        <h1
          className="font-display text-2xl sm:text-3xl font-bold leading-tight min-w-0 text-balance"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
          {helpAvailable && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-help"))}
              aria-label="¿Cómo funciona?"
              title="¿Cómo funciona?"
              className="lg:hidden inline-flex items-center justify-center rounded-full align-middle ml-0.5 -my-3"
              style={{
                width: 44,
                height: 44,
                border: "none",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              <HelpCircle size={20} aria-hidden="true" />
            </button>
          )}
        </h1>
        {subtitle && (
          <p className="text-[13px] leading-snug sm:text-sm" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </div>
  )
}
