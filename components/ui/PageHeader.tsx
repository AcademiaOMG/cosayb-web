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
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <h1
            className="font-display text-3xl font-bold min-w-0 break-words"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h1>
          {helpAvailable && (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("open-help"))}
              aria-label="¿Cómo funciona?"
              title="¿Cómo funciona?"
              className="lg:hidden shrink-0 inline-flex items-center justify-center rounded-full"
              style={{
                width: 44,
                height: 44,
                border: "none",
                background: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              <HelpCircle size={22} aria-hidden="true" />
            </button>
          )}
        </div>
        {subtitle && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
