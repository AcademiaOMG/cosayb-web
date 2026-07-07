"use client"

/**
 * Dona de 3 segmentos: Materia Prima (azul) / Costos Fijos (naranja) / Ganancia (verde).
 * Es el lenguaje visual compartido de "desglose de rentabilidad" en toda la app
 * (Menú, Valoración) — mismo componente, mismos colores, mismo significado.
 */
export interface RatioDonutProps {
  mp: number
  fixed: number
  profit: number
  /** Color del texto central (según el indicador de rentabilidad del módulo que lo usa) */
  profitColor: string
  size?: number
}

const COLOR_MP = "#3B82F6"
const COLOR_FIXED = "#FB923C"
const COLOR_PROFIT = "#10B981"

export { COLOR_MP, COLOR_FIXED, COLOR_PROFIT }

export default function RatioDonut({ mp, fixed, profit, profitColor, size = 168 }: RatioDonutProps) {
  const r = 14
  const circ = 2 * Math.PI * r
  const gap = 1.5
  const sw = 6
  const arc = (pct: number) => Math.max(0, (pct / 100) * circ - gap)
  const base = -(circ / 4)
  const offMP = base
  const offFixed = base - (mp / 100) * circ
  const offProfit = base - (mp / 100) * circ - (fixed / 100) * circ

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" width={size} height={size}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--border-light)" strokeWidth={sw} />
        <circle
          cx="18" cy="18" r={r} fill="none" stroke={COLOR_MP} strokeWidth={sw}
          strokeDasharray={`${arc(mp)} ${circ}`} strokeDashoffset={offMP}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }}
        />
        <circle
          cx="18" cy="18" r={r} fill="none" stroke={COLOR_FIXED} strokeWidth={sw}
          strokeDasharray={`${arc(fixed)} ${circ}`} strokeDashoffset={offFixed}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }}
        />
        <circle
          cx="18" cy="18" r={r} fill="none" stroke={COLOR_PROFIT} strokeWidth={sw}
          strokeDasharray={`${arc(profit)} ${circ}`} strokeDashoffset={offProfit}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }}
        />
        <text x="18" y="15.2" textAnchor="middle" fontFamily="var(--font-inter), system-ui, sans-serif"
          fill="var(--text-muted)" fontSize="2.5" fontWeight="600" letterSpacing="0.05em">
          GANANCIA
        </text>
        <text x="18" y="21.8" textAnchor="middle" fontFamily="var(--font-jetbrains-mono), monospace"
          fill={profitColor} fontSize="6.2" fontWeight="700"
          style={{ transition: "fill .35s ease" }}>
          {profit.toFixed(1)}%
        </text>
      </svg>
    </div>
  )
}

/** Fila de desglose: punto de color + etiqueta + barra + porcentaje — reutilizable en toda la app */
export function RatioRow({ label, color, pct }: { label: string; color: string; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span className="text-sm flex-1" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <div className="flex items-center gap-2" style={{ width: 120 }}>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--border-light)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color, transition: "width .45s ease" }}
          />
        </div>
        <span className="text-sm font-semibold tabular-nums font-mono" style={{ color, width: 42, textAlign: "right" }}>
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}
