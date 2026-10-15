"use client"

import { CalcReceipt, ReceiptDivider, ReceiptFold, ReceiptHero, ReceiptRow } from "@/components/calculator"
import RatioDonut, { COLOR_FIXED, COLOR_MP, COLOR_PROFIT, RatioRow } from "@/components/ui/RatioDonut"
import type { CostoMenuResult } from "@/types/domain"
import { buildFichaItems, buildFichaPrecio, pesoPorcionG, type FichaItemInput } from "@/lib/menuFicha"
import { IND, fmt, fmtDec, fmtQty } from "./menuFormat"

/**
 * Desglose del menú como recibo impreso (el mismo de las demás calculadoras):
 * primero la respuesta (precio por persona) y los datos clave; el detalle —cómo
 * se arma el precio y cada plato o extra— queda plegado, a un toque.
 */
export default function MenuTicket({
  costo,
  items: itemsInput,
  numPersonas,
  margenPct,
  pctMP,
  animate = true,
}: {
  costo: CostoMenuResult
  items: FichaItemInput[]
  numPersonas: number
  /** Margen de seguridad, 0–100 */
  margenPct: number
  /** % de materia prima, 0–100 */
  pctMP: number
  animate?: boolean
}) {
  const cfg = IND[costo.indicator]
  const items = buildFichaItems(itemsInput, numPersonas)
  const peso = pesoPorcionG(items)
  const lineas = buildFichaPrecio(costo, numPersonas, margenPct, pctMP)

  return (
    <CalcReceipt title="Menú" animate={animate}>
      <ReceiptHero
        label="Precio sugerido por persona"
        value={fmt(costo.precioPotencialVentaPorcion)}
        note={numPersonas > 1 ? `Para ${numPersonas} personas: ${fmt(costo.precioPotencialVentaTotal)}` : undefined}
      />

      <ReceiptDivider />

      {/* El gráfico: a dónde va cada peso del precio */}
      <div className="flex flex-col items-center gap-4 py-1 sm:flex-row">
        <RatioDonut mp={pctMP} fixed={costo.pctCostosFijos} profit={costo.pctGanancia} profitColor={cfg.color} size={124} />
        <div className="flex w-full min-w-0 flex-col gap-2.5">
          <RatioRow label="Materia prima" color={COLOR_MP} pct={pctMP} />
          <RatioRow label="Costos fijos" color={COLOR_FIXED} pct={costo.pctCostosFijos} />
          <RatioRow label="Ganancia" color={COLOR_PROFIT} pct={costo.pctGanancia} />
        </div>
      </div>

      <ReceiptDivider />

      <ReceiptRow
        label="Rentabilidad"
        value={<span style={{ color: cfg.color }}>{cfg.label.charAt(0) + cfg.label.slice(1).toLowerCase()}</span>}
      />
      <p className="calc-receipt-note" style={{ marginTop: -2, marginBottom: 6 }}>
        {cfg.sublabel}
      </p>
      <ReceiptRow label="Personas" value={numPersonas} />
      <ReceiptRow label="% de materia prima" value={`${pctMP.toFixed(0)}%`} />
      <ReceiptRow label="Costo por porción" value={fmt(costo.costoTotalPorcion)} />
      {peso > 0 && <ReceiptRow label="Peso por porción" value={fmtQty(peso, "g")} />}
      {peso > 0 && <ReceiptRow label="Costo por gramo" value={fmtDec(costo.costoTotalPorcion / peso)} />}

      <div className="mt-2">
        <ReceiptFold title="Cómo se arma el precio">
          <p className="calc-receipt-note" style={{ marginTop: 0 }}>Por persona (y para {numPersonas} {numPersonas === 1 ? "persona" : "personas"})</p>
          {lineas.map((l) => (
            <ReceiptRow
              key={l.key}
              wrap
              label={l.label}
              value={
                <>
                  {fmt(l.porPorcion)}
                  <span className="calc-receipt-pct">({fmt(l.total)})</span>
                </>
              }
            />
          ))}
        </ReceiptFold>

        <ReceiptFold title="Platos y extras" count={items.length}>
          {items.map((it) => (
            <div key={it.key} className="pb-1.5">
              <ReceiptRow
                wrap
                label={it.extra ? `${it.nombre} (extra)` : it.nombre}
                value={`${fmtQty(it.cantidad, it.unidad)} · ${fmt(it.porPorcion)}`}
              />
              <p className="calc-receipt-note" style={{ marginTop: 0 }}>
                {fmtDec(it.costoUnit)} por {it.unidad} · para {numPersonas} {numPersonas === 1 ? "persona" : "personas"}: {fmtQty(it.cantidadTotal, it.unidad)} · {fmt(it.costoTotal)}
              </p>
            </div>
          ))}
          <ReceiptRow label="Total por porción" value={`${peso > 0 ? `${fmtQty(peso, "g")} · ` : ""}${fmt(costo.costoTotalPorcion)}`} />
          <ReceiptRow label={`Total para ${numPersonas} ${numPersonas === 1 ? "persona" : "personas"}`} value={fmt(costo.costoTotalPersonas)} />
        </ReceiptFold>
      </div>
    </CalcReceipt>
  )
}
