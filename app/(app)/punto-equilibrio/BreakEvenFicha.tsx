"use client"

import { Fold, FactRow, ModalHero, Panel, ShareDonut, Stat, StatGrid } from "@/components/ui/ModalKit"
import { COLOR_FIXED } from "@/components/ui/RatioDonut"
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
 * Ficha del cálculo de punto de equilibrio (modal de ver del historial): la respuesta primero,
 * las cifras clave, a dónde va cada peso de la venta y, plegado, cómo se calcula y los costos
 * fijos usados. Solo presenta: las cifras llegan ya calculadas (solveBreakEven / la API).
 */
export default function BreakEvenFicha({ data }: { data: BreakEvenFichaData }) {
  const mcPct = (data.contributionMargin / data.salePrice) * 100
  const cfg = IND[indicatorFromMC(mcPct)]

  return (
    <div className="flex flex-col gap-6 pb-2">
      <ModalHero
        label="Unidades para cubrir tus costos"
        value={
          <>
            {formatNumber(data.unitsPerMonth, 2)}
            <span className="ml-2 text-lg font-semibold" style={{ color: "var(--text-muted)", letterSpacing: 0 }}>al mes</span>
          </>
        }
        note={`${formatNumber(data.unitsPerDay, 2)} unidades al día`}
        aside={
          <p className="text-right text-sm" style={{ color: "var(--text-muted)" }}>
            Margen de contribución
            <span className="block text-xl font-bold tabular-nums" style={{ color: cfg.color }}>
              {mcPct.toFixed(1)} %
            </span>
          </p>
        }
      />

      <StatGrid cols={4}>
        <Stat label="Venta al mes" value={formatCOP(data.revenuePerMonth)} tone="accent" />
        <Stat label="Venta al día" value={formatCOP(data.revenuePerDay)} />
        <Stat label="Precio de venta" value={formatCOP(data.salePrice)} />
        <Stat label="Costo variable" value={formatCOP(data.variableCost)} />
      </StatGrid>

      <Panel title="A dónde va cada peso de la venta">
        <ShareDonut
          centerLabel="de margen"
          centerValue={`${mcPct.toFixed(1)} %`}
          centerColor={cfg.color}
          segments={[
            { key: "var", label: "Costo variable", pct: (data.variableCost / data.salePrice) * 100, color: COLOR_FIXED, amount: formatCOP(data.variableCost) },
            { key: "mc", label: "Margen de contribución", pct: mcPct, color: cfg.color, amount: formatCOP(data.contributionMargin) },
          ]}
        />
        <p className="px-1 text-xs" style={{ color: "var(--text-muted)" }}>
          El margen es lo que queda de cada venta para pagar tus costos fijos y, después, ganar.
        </p>
      </Panel>

      <div className="flex flex-col gap-2.5">
        <Fold title="Cómo se calcula">
          <dl className="m-0">
            <FactRow label="Costos fijos del mes" value={formatCOP(data.fixedTotal)} />
            <FactRow label={`Margen por unidad (${formatCOP(data.salePrice)} − ${formatCOP(data.variableCost)})`} value={formatCOP(data.contributionMargin)} />
            <FactRow label="Unidades al mes (costos fijos ÷ margen)" value={formatNumber(data.unitsPerMonth, 2)} tone="accent" />
            <FactRow label="Unidades al día (÷ 30)" value={formatNumber(data.unitsPerDay, 2)} />
            <FactRow label="Venta al mes" value={formatCOP(data.revenuePerMonth)} tone="accent" />
            <FactRow label="Venta al día" value={formatCOP(data.revenuePerDay)} />
          </dl>
        </Fold>

        <Fold title="Costos fijos" count={data.fixedCosts.length}>
          {data.fixedCosts.length === 0 ? (
            <p className="py-2 text-sm" style={{ color: "var(--text-muted)" }}>Este cálculo no tiene costos fijos detallados.</p>
          ) : (
            <dl className="m-0">
              {data.fixedCosts.map((c, i) => (
                <FactRow key={`${i}-${c.name}`} label={c.name} value={formatCOP(c.amount)} />
              ))}
              <FactRow label="Total al mes" value={formatCOP(data.fixedTotal)} tone="accent" />
            </dl>
          )}
        </Fold>
      </div>
    </div>
  )
}
