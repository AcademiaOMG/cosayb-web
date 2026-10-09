import type { CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { ValuationIndicator } from "@/types/domain"
import { IND } from "@/lib/indicator"

/**
 * Pill del semáforo de margen: punto de color + etiqueta textual.
 * El label hace el indicador legible sin depender solo del color.
 */
export default function IndicatorPill({
  indicator,
  icon,
  className,
  style,
}: {
  indicator: ValuationIndicator
  /** Icono propio (p. ej. el recibo de Valoración); si falta, punto de color. */
  icon?: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const c = IND[indicator]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        className,
      )}
      style={{ background: c.bg, color: c.text, ...style }}
    >
      {icon ?? (
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} aria-hidden />
      )}
      {indicator}
    </span>
  )
}
