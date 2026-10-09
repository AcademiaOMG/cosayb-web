"use client"

import { useEffect, useState } from "react"
import "./calculator.css"
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react"
import type { ValuationIndicator } from "@/types/domain"
import IndicatorPill from "@/components/ui/IndicatorPill"
import { IND } from "@/lib/indicator"
import { fmt, fmtPct, moneyFromPct, type PricingResult } from "./lib"

const INDICATOR_ICON: Record<ValuationIndicator, typeof CheckCircle2> = {
  "MUY BUENO": CheckCircle2,
  "REGULAR": AlertCircle,
  "MALO": AlertTriangle,
}

// Un solo lugar para los 5 colores de la dona — reutilizados como color de
// texto en las filas del recibo, así el color mismo es la leyenda.
const SEGMENT_COLOR = {
  mp: "#3B82F6",
  fixed: "#FB923C",
  taxes: "#A78BFA",
  others: "#94A3B8",
  profit: "#10B981",
} as const

// ─── Donut de 5 segmentos: MP / Costos fijos / Impuestos / Otros / Ganancia ──
// Vive aquí (no en components/ui/RatioDonut) porque ese componente de 3
// segmentos es compartido con Menú y Punto de Equilibrio, que no tienen el
// desglose de Impuestos/Otros de este módulo.
function DonutChart({ mp, fixed, taxes, others, profit, indicator }: {
  mp: number; fixed: number; taxes: number; others: number; profit: number; indicator: ValuationIndicator
}) {
  const r = 14
  const circ = 2 * Math.PI * r
  const gap = 1.5
  const sw = 6

  // Las porciones arrancan en 0 y "dibujan" hacia su valor real al montar —
  // el mismo lenguaje de revelado que el resto del flujo.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  const mpV = mounted ? mp : 0
  const fixedV = mounted ? fixed : 0
  const taxesV = mounted ? taxes : 0
  const othersV = mounted ? others : 0
  const profitV = mounted ? profit : 0

  const arc = (pct: number) => Math.max(0, (pct / 100) * circ - gap)
  const base = -(circ / 4)
  const offMP     = base
  const offFixed  = base - (mpV     / 100) * circ
  const offTaxes  = base - (mpV     / 100) * circ - (fixedV  / 100) * circ
  const offOthers = base - (mpV     / 100) * circ - (fixedV  / 100) * circ - (taxesV  / 100) * circ
  const offProfit = base - (mpV     / 100) * circ - (fixedV  / 100) * circ - (taxesV  / 100) * circ - (othersV / 100) * circ

  const cfg = IND[indicator]

  return (
    <div className="relative shrink-0" style={{ width: 118, height: 118 }}>
      <svg viewBox="0 0 36 36" width={118} height={118}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="#E2E5EA" strokeWidth={sw} />
        <circle cx="18" cy="18" r={r} fill="none" stroke={SEGMENT_COLOR.mp} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${arc(mpV)} ${circ}`} strokeDashoffset={offMP}
          style={{ transition: "stroke-dasharray .6s cubic-bezier(0.22,1,0.36,1), stroke-dashoffset .6s cubic-bezier(0.22,1,0.36,1)" }} />
        <circle cx="18" cy="18" r={r} fill="none" stroke={SEGMENT_COLOR.fixed} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${arc(fixedV)} ${circ}`} strokeDashoffset={offFixed}
          style={{ transition: "stroke-dasharray .6s cubic-bezier(0.22,1,0.36,1) .05s, stroke-dashoffset .6s cubic-bezier(0.22,1,0.36,1) .05s" }} />
        <circle cx="18" cy="18" r={r} fill="none" stroke={SEGMENT_COLOR.taxes} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${arc(taxesV)} ${circ}`} strokeDashoffset={offTaxes}
          style={{ transition: "stroke-dasharray .6s cubic-bezier(0.22,1,0.36,1) .1s, stroke-dashoffset .6s cubic-bezier(0.22,1,0.36,1) .1s" }} />
        <circle cx="18" cy="18" r={r} fill="none" stroke={SEGMENT_COLOR.others} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${arc(othersV)} ${circ}`} strokeDashoffset={offOthers}
          style={{ transition: "stroke-dasharray .6s cubic-bezier(0.22,1,0.36,1) .15s, stroke-dashoffset .6s cubic-bezier(0.22,1,0.36,1) .15s" }} />
        <circle cx="18" cy="18" r={r} fill="none" stroke={SEGMENT_COLOR.profit} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${arc(profitV)} ${circ}`} strokeDashoffset={offProfit}
          style={{ transition: "stroke-dasharray .6s cubic-bezier(0.22,1,0.36,1) .2s, stroke-dashoffset .6s cubic-bezier(0.22,1,0.36,1) .2s" }} />
        <text x="18" y="16.5" textAnchor="middle" fontFamily="var(--font-body), system-ui, sans-serif"
          fill="#8890A0" fontSize="3" fontWeight="600">GANANCIA</text>
        <text x="18" y="22.8" textAnchor="middle" fontFamily="var(--font-display), system-ui, sans-serif"
          fill={cfg.color} fontSize="7.5" fontWeight="700">
          {profit.toFixed(0)}%
        </text>
      </svg>
    </div>
  )
}

// Mismos colores que las porciones de la dona — el color del texto ES la
// leyenda, sin puntos ni chips aparte.
function ReceiptRow({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div className="calc-receipt-row">
      <span className="calc-receipt-row-label" style={{ color }}>{label}</span>
      <span className="calc-receipt-row-leader" />
      <span className="calc-receipt-row-value">
        {fmt(value)}
        <span className="calc-receipt-pct">({fmtPct(pct)})</span>
      </span>
    </div>
  )
}

export interface ValuationDetailCardProps {
  headline?: string
  result: PricingResult
  cost: number
  margin: number
  actualPrice?: number | null
}

export default function ValuationDetailCard({
  headline = "Precio final del plato o producto",
  result,
  cost,
  margin,
  actualPrice,
}: ValuationDetailCardProps) {
  const cfg = IND[result.indicator]
  const IndicatorIcon = INDICATOR_ICON[result.indicator]
  const hasActual = actualPrice != null && actualPrice > 0
  const total = result.suggested

  const fixedCostsMoney = moneyFromPct(result.pctFixedCosts, total)
  const impuestosMoney = moneyFromPct(result.pctImpuestos, total)
  const otrosMoney = moneyFromPct(result.pctOtros, total)
  const profitMoney = moneyFromPct(result.pctProfit, total)

  return (
    <div className="calc-printer">
      <div className="calc-printer-slot" />
      <div className="calc-printer-mask">
        <div className="calc-receipt calc-receipt-print">
          <div className="calc-receipt-torn" />
          <p className="calc-receipt-title">{headline}</p>

          <div className="flex items-center justify-center gap-4 mb-3">
            <DonutChart
              mp={result.pctMateriaprima}
              fixed={result.pctFixedCosts}
              taxes={result.pctImpuestos}
              others={result.pctOtros}
              profit={result.pctProfit}
              indicator={result.indicator}
            />
            <div className="flex flex-col items-start gap-2">
              <IndicatorPill
                indicator={result.indicator}
                icon={<IndicatorIcon size={13} style={{ color: cfg.color }} />}
                className="calc-indicator-pill"
              />
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{cfg.sublabel}</span>
            </div>
          </div>

          <hr className="calc-receipt-divider" />

          <ReceiptRow label="Materia prima" value={cost} pct={result.pctMateriaprima} color={SEGMENT_COLOR.mp} />
          <ReceiptRow label="Costos fijos" value={fixedCostsMoney} pct={result.pctFixedCosts} color={SEGMENT_COLOR.fixed} />
          <ReceiptRow label="Impuestos de ley" value={impuestosMoney} pct={result.pctImpuestos} color={SEGMENT_COLOR.taxes} />
          <ReceiptRow label="Otros" value={otrosMoney} pct={result.pctOtros} color={SEGMENT_COLOR.others} />
          <ReceiptRow label="Ganancia neta" value={profitMoney} pct={result.pctProfit} color={SEGMENT_COLOR.profit} />

          <hr className="calc-receipt-divider" />

          <div className="calc-receipt-total">
            <span className="calc-receipt-total-label">PRECIO DE VENTA</span>
            <span className="calc-receipt-total-value">{fmt(total)}</span>
          </div>

          {hasActual && (() => {
            const diff = actualPrice! - total
            const up = diff >= 0
            return (
              <div className="calc-receipt-row" style={{ marginTop: 4 }}>
                <span className="calc-receipt-row-label">Precio real cobrado</span>
                <span className="calc-receipt-row-leader" />
                <span className="calc-receipt-row-value" style={{ color: up ? "#166534" : "#991B1B" }}>
                  {fmt(actualPrice!)}
                </span>
              </div>
            )
          })()}

          <p className="text-center mt-3" style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
            Costo con margen de seguridad ({fmtPct(margin)}): {fmt(cost * (1 + margin / 100))}
          </p>
        </div>
      </div>
    </div>
  )
}
