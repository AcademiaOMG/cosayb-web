import { AlertTriangle } from "lucide-react"
import Button from "./Button"

export interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
}

/** Bloque de error consistente con reintento (equivalente de EmptyState para fallos de carga). */
export default function ErrorState({
  title = "No pudimos cargar la información",
  description = "Revisa tu conexión e inténtalo de nuevo.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <AlertTriangle size={28} aria-hidden="true" style={{ color: "var(--warning)" }} />
      <div className="flex flex-col gap-1 max-w-sm">
        <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{description}</p>
      </div>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
