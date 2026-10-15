import type { ReactNode } from "react"

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral"

export interface StatusPillProps {
  tone?: StatusTone
  /** Texto en español claro («Activa», «Pago pendiente»). Nunca un código técnico. */
  children: ReactNode
  /** Muestra un punto de color antes del texto (por defecto sí). */
  dot?: boolean
}

// Colores de texto/fondo con contraste AA sobre superficies claras.
const TONES: Record<StatusTone, { bg: string; fg: string; dot: string }> = {
  success: { bg: "#DCFCE7", fg: "#166534", dot: "#16A34A" },
  warning: { bg: "#FEF3C7", fg: "#92400E", dot: "#D97706" },
  danger: { bg: "#FEE2E2", fg: "#991B1B", dot: "#DC2626" },
  info: { bg: "var(--accent-light)", fg: "var(--accent-text)", dot: "var(--accent)" },
  neutral: { bg: "var(--bg-secondary)", fg: "var(--text-secondary)", dot: "var(--text-muted)" },
}

/** Etiqueta de estado compacta. El color nunca es el único canal: siempre lleva texto. */
export default function StatusPill({ tone = "neutral", children, dot = true }: StatusPillProps) {
  const t = TONES[tone]
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: t.bg, color: t.fg }}
    >
      {dot && <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: t.dot }} />}
      {children}
    </span>
  )
}
