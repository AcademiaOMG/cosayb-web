"use client"

import { Receipt, Wallet } from "lucide-react"
import Card from "@/components/ui/Card"
import CollapsibleSection from "@/components/ui/CollapsibleSection"
import IndicatorPill from "@/components/ui/IndicatorPill"
import InfoStat from "@/components/ui/InfoStat"
import { RatioRow, COLOR_FIXED } from "@/components/ui/RatioDonut"
import { IND, indicatorFromMC } from "@/lib/indicator"
import { formatCOP, formatNumber } from "@/lib/calculator/format"

export interface BreakEvenFichaData {
  unitsPerMonth: number
  unitsPerDay: number
  revenuePerMonth: number
  revenuePerDay: number
  fixedTotal: number
  salePrice: number
  variableCost: number
  contributionMargin: number
  fixedCosts: { name: string; amount: number }[]
}

/**
 * Ficha del cálculo de punto de equilibrio: misma estructura que la ficha del
 * Menú (respuesta arriba, datos clave, y el detalle en desplegables). Se usa
 * en el modal de resultado de la calculadora y en el de ver del historial.
 * Solo presenta: las cifras llegan ya calculadas (solveBreakEven / la API).
 */
export default function BreakEvenFicha({ data }: { data: BreakEvenFichaData }) {
  const mcPct = (data.contributionMargin / data.salePrice) * 100
  const indicator = indicatorFromMC(mcPct)
  const cfg = IND[indicator]

  const pasos: { label: string; hint: string; value: string; strong?: boolean }[] = [
    { label: "Costos fijos del mes", hint: "Lo que pagas aunque no vendas", value: formatCOP(data.fixedTotal) },
    {
      label: "÷ Margen de contribución por unidad",
      hint: `Precio ${formatCOP(data.salePrice)} − costo variable ${formatCOP(data.variableCost)}`,
      value: formatCOP(data.contributionMargin),
    },
    { label: "= Unidades al mes", hint: "Desde aquí empiezas a ganar", value: formatNumber(data.unitsPerMonth), strong: true },
    { label: "Unidades al día", hint: "Unidades al mes ÷ 30 días", value: formatNumber(data.unitsPerDay) },
    { label: "Venta al mes", hint: "Unidades al mes × precio de venta", value: formatCOP(data.revenuePerMonth), strong: true },
    { label: "Venta al día", hint: "Venta al mes ÷ 30 días", value: formatCOP(data.revenuePerDay) },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* 1 · Respuesta: cuánto vender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <div
          className="rounded-2xl p-5 flex flex-col justify-center"
          style={{ background: cfg.bg, border: `1px solid ${cfg.color}40` }}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <IndicatorPill indicator={indicator} />
            <span className="text-xs font-semibold tabular-nums" style={{ color: cfg.text }}>
              MC {mcPct.toFixed(1)}%
            </span>
          </div>
          <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: cfg.text, opacity: 0.7 }}>
            UNIDADES PARA CUBRIR TUS COSTOS
          </p>
          <p className="text-4xl font-bold tabular-nums" style={{ color: cfg.text, lineHeight: 1.1 }}>
            {formatNumber(data.unitsPerMonth)}
            <span className="text-base font-medium ml-2" style={{ opacity: 0.8 }}>al mes</span>
          </p>
          <p className="text-sm mt-2" style={{ color: cfg.text, opacity: 0.85 }}>
            {formatNumber(data.unitsPerDay)} unidades al día · <strong>{formatCOP(data.revenuePerMonth)}</strong> en ventas al mes
          </p>
        </div>

        <Card>
          <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            ¿A DÓNDE VA CADA PESO DE VENTA?
          </p>
          <div className="flex flex-col gap-3">
            <RatioRow label="Costo variable" color={COLOR_FIXED} pct={(data.variableCost / data.salePrice) * 100} />
            <RatioRow label="Margen de contribución" color={cfg.color} pct={mcPct} />
          </div>
          <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            El margen es lo que queda de cada venta para pagar tus costos fijos y, después, ganar.
          </p>
        </Card>
      </div>

      {/* 2 · Datos clave */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoStat icon={<Receipt size={12} style={{ color: "var(--text-muted)" }} />} label="Venta al mes" value={formatCOP(data.revenuePerMonth)} mono accent />
        <InfoStat icon={<Receipt size={12} style={{ color: "var(--text-muted)" }} />} label="Venta al día" value={formatCOP(data.revenuePerDay)} mono />
        <InfoStat label="Precio de venta" value={formatCOP(data.salePrice)} mono />
        <InfoStat label="Costo variable" value={formatCOP(data.variableCost)} mono />
      </div>

      {/* 3 · Cómo se calcula (desplegable) */}
      <CollapsibleSection title="CÓMO SE CALCULA">
        <div className="flex flex-col">
          {pasos.map((p, i) => (
            <div
              key={p.label}
              className="flex items-start justify-between gap-3 py-2.5"
              style={{ borderTop: i === 0 ? undefined : "1px solid var(--border-light)", paddingTop: i === 0 ? 0 : undefined }}
            >
              <div className="min-w-0">
                <p className="text-sm" style={{ color: "var(--text-primary)", fontWeight: p.strong ? 600 : 400 }}>{p.label}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{p.hint}</p>
              </div>
              <p
                className="text-sm tabular-nums font-mono shrink-0"
                style={{ color: p.strong ? "var(--accent-text)" : "var(--text-secondary)", fontWeight: p.strong ? 700 : 500 }}
              >
                {p.value}
              </p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* 4 · Costos fijos usados (desplegable) */}
      <CollapsibleSection
        title="COSTOS FIJOS"
        count={data.fixedCosts.length}
        icon={<Wallet size={15} style={{ color: "var(--accent)" }} />}
      >
        {data.fixedCosts.length === 0 ? (
          <p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>
            Este cálculo no tiene costos fijos detallados.
          </p>
        ) : (
          <div className="flex flex-col">
            {data.fixedCosts.map((c, i) => (
              <div
                key={`${i}-${c.name}`}
                className="flex items-baseline justify-between gap-3 py-2.5 text-sm"
                style={{ borderTop: i === 0 ? undefined : "1px solid var(--border-light)", paddingTop: i === 0 ? 0 : undefined }}
              >
                <span className="min-w-0 break-words" style={{ color: "var(--text-primary)" }}>{c.name}</span>
                <span className="tabular-nums font-mono font-medium shrink-0" style={{ color: "var(--text-secondary)" }}>
                  {formatCOP(c.amount)}
                </span>
              </div>
            ))}
            <div
              className="flex justify-between gap-3 pt-3 mt-1 text-sm font-semibold"
              style={{ borderTop: "2px solid var(--border-light)", color: "var(--text-primary)" }}
            >
              <span>Total al mes</span>
              <span className="tabular-nums font-mono">{formatCOP(data.fixedTotal)}</span>
            </div>
          </div>
        )}
      </CollapsibleSection>
    </div>
  )
}
