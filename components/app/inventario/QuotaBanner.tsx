"use client"

import { Zap, TrendingUp } from "lucide-react"
import Button from "@/components/ui/Button"

export interface QuotaBannerProps {
  used: number
  limit: number
}

export default function QuotaBanner({ used, limit }: QuotaBannerProps) {
  const pct = Math.min((used / limit) * 100, 100)
  const remaining = limit - used

  const isCritical = used >= limit - 2   // 28–30
  const isWarning  = used >= limit - 10  // 20–27
  const isSafe     = !isWarning

  const barColor = isCritical
    ? "#B42020"
    : isWarning
    ? "#D97706"
    : "var(--accent)"

  const bgColor = isCritical
    ? "#FEF2F2"
    : isWarning
    ? "#FFFBEB"
    : "var(--accent-light)"

  const borderColor = isCritical
    ? "#FCA5A5"
    : isWarning
    ? "#FDE68A"
    : "var(--accent)"

  const labelColor = isCritical
    ? "#991B1B"
    : isWarning
    ? "#92400E"
    : "var(--accent-text)"

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: bgColor, border: `1px solid ${borderColor}` }}
      role="status"
      aria-label={`Cuota de ingredientes: ${used} de ${limit} usados`}
    >
      {/* Fila superior */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {isCritical || isWarning ? (
            <Zap size={16} style={{ color: barColor, flexShrink: 0 }} />
          ) : (
            <TrendingUp size={16} style={{ color: barColor, flexShrink: 0 }} />
          )}
          <span className="text-sm font-semibold" style={{ color: labelColor }}>
            {isCritical && used >= limit
              ? "Límite de ingredientes alcanzado"
              : isCritical
              ? `Solo ${remaining} ingrediente${remaining === 1 ? "" : "s"} disponible${remaining === 1 ? "" : "s"}`
              : isWarning
              ? `${remaining} ingredientes disponibles`
              : `${used} de ${limit} ingredientes usados`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono" style={{ color: labelColor }}>
            {used}/{limit}
          </span>
          {!isSafe && (
            <Button size="sm" variant="primary">
              Mejorar plan
            </Button>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ background: "rgba(0,0,0,0.08)" }}
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  )
}
