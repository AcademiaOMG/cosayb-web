"use client"

import "./calculator.css"
import type { ValuationIndicator } from "@/types/domain"
import { IND, fmt, fmtPct, moneyFromPct, type PricingResult } from "./lib"

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

  const arc = (pct: number) => Math.max(0, (pct / 100) * circ - gap)
  const base = -(circ / 4)
  const offMP     = base
  const offFixed  = base - (mp     / 100) * circ
  const offTaxes  = base - (mp     / 100) * circ - (fixed  / 100) * circ
  const offOthers = base - (mp     / 100) * circ - (fixed  / 100) * circ - (taxes  / 100) * circ
  const offProfit = base - (mp     / 100) * circ - (fixed  / 100) * circ - (taxes  / 100) * circ - (others / 100) * circ

  const cfg = IND[indicator]

  return (
    <div className="relative shrink-0" style={{ width: 108, height: 108 }}>
      <svg viewBox="0 0 36 36" width={108} height={108}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="#E4DFD2" strokeWidth={sw} />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#3B82F6" strokeWidth={sw}
          strokeDasharray={`${arc(mp)} ${circ}`} strokeDashoffset={offMP}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#FB923C" strokeWidth={sw}
          strokeDasharray={`${arc(fixed)} ${circ}`} strokeDashoffset={offFixed}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#A78BFA" strokeWidth={sw}
          strokeDasharray={`${arc(taxes)} ${circ}`} strokeDashoffset={offTaxes}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#94A3B8" strokeWidth={sw}
          strokeDasharray={`${arc(others)} ${circ}`} strokeDashoffset={offOthers}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#10B981" strokeWidth={sw}
          strokeDasharray={`${arc(profit)} ${circ}`} strokeDashoffset={offProfit}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        <text x="18" y="16.5" textAnchor="middle" fontFamily="var(--font-jetbrains-mono), monospace"
          fill="#6B6555" fontSize="3" fontWeight="600">GANANCIA</text>
        <text x="18" y="22.5" textAnchor="middle" fontFamily="var(--font-jetbrains-mono), monospace"
          fill={cfg.color} fontSize="7" fontWeight="700">
          {profit.toFixed(0)}%
        </text>
      </svg>
    </div>
  )
}

function ReceiptRow({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div className="calc-receipt-row">
      <span className="calc-receipt-row-label">{label}</span>
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
  const hasActual = actualPrice != null && actualPrice > 0
  const total = result.suggested

  const fixedCostsMoney = moneyFromPct(result.pctFixedCosts, total)
  const impuestosMoney = moneyFromPct(result.pctImpuestos, total)
  const otrosMoney = moneyFromPct(result.pctOtros, total)
  const profitMoney = moneyFromPct(result.pctProfit, total)

  return (
    <div className="calc-receipt">
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
        <div className="flex flex-col items-start gap-1">
          <span
            className="text-xs font-bold px-2 py-1 rounded"
            style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.color}55` }}
          >
            [ {result.indicator} ]
          </span>
          <span className="text-[11px]" style={{ color: "#8B8577" }}>{cfg.sublabel}</span>
        </div>
      </div>

      <hr className="calc-receipt-divider" />

      <ReceiptRow label="Materia prima" value={cost} pct={result.pctMateriaprima} />
      <ReceiptRow label="Costos fijos" value={fixedCostsMoney} pct={result.pctFixedCosts} />
      <ReceiptRow label="Impuestos de ley" value={impuestosMoney} pct={result.pctImpuestos} />
      <ReceiptRow label="Otros" value={otrosMoney} pct={result.pctOtros} />
      <ReceiptRow label="Ganancia neta" value={profitMoney} pct={result.pctProfit} />

      <hr className="calc-receipt-divider" />

      <div className="calc-receipt-total">
        <span>PRECIO DE VENTA</span>
        <span>{fmt(total)}</span>
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

      <p className="text-center mt-3" style={{ fontSize: 10.5, color: "#8B8577" }}>
        Costo con margen de seguridad ({fmtPct(margin)}): {fmt(cost * (1 + margin / 100))}
      </p>
    </div>
  )
}
