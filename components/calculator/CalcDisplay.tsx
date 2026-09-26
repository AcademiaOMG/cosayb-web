import "./calculator.css"

export type CalcDisplayTone = "idle" | "error" | "result"

/**
 * Pantalla principal: muestra el resultado (o qué falta para obtenerlo).
 * Nunca queda muda — en reposo o con error, la línea inferior dice qué hacer.
 */
export default function CalcDisplay({
  label,
  value,
  sub,
  tone,
  size = "md",
  announce,
  subId,
  revealKey,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  tone: CalcDisplayTone
  size?: "md" | "sm"
  /** Texto final para lectores de pantalla (el valor visible puede estar animándose) */
  announce?: string
  subId?: string
  /** Cambiarlo reinicia la animación de revelado */
  revealKey?: string | number
}) {
  return (
    <div className={`calc-display is-${tone}${size === "sm" ? " is-sm" : ""}`}>
      <span className="calc-display-label">{label}</span>
      <span key={revealKey} className="calc-display-value" aria-hidden={announce ? true : undefined}>
        {value}
      </span>
      {sub !== undefined && (
        <span className="calc-display-sub" id={subId} role={tone === "error" ? "alert" : undefined}>
          {sub}
        </span>
      )}
      {announce !== undefined && (
        <span className="sr-only" aria-live="polite">
          {announce}
        </span>
      )}
    </div>
  )
}
