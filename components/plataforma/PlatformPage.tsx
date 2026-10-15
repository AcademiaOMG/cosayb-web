import type { ReactNode } from "react"

export interface PlatformPageProps {
  /** Título de la página (h1). */
  title: string
  /** Frase corta que explica para qué sirve la página. */
  description?: string
  /** Botones o controles a la derecha del título (se apilan debajo en móvil). */
  actions?: ReactNode
  children: ReactNode
}

/** Estructura estándar de una página del panel: título + descripción + acciones, y el contenido con separación uniforme. */
export default function PlatformPage({ title, description, actions, children }: PlatformPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h1
            className="font-display text-2xl font-bold leading-tight text-balance sm:text-3xl"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm" style={{ color: "var(--text-muted)" }}>
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  )
}
