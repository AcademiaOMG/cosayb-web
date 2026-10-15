"use client"

import { Fold, FactRow, ModalHero, Panel, RowList, ShareDonut, ShareRow, Stat, StatGrid } from "@/components/ui/ModalKit"
import { COLOR_FIXED, COLOR_MP, COLOR_PROFIT } from "@/components/ui/RatioDonut"
import type { CostoMenuResult } from "@/types/domain"
import { buildFichaItems, buildFichaPrecio, pesoPorcionG, type FichaItemInput } from "@/lib/menuFicha"
import { IND, fmt, fmtDec, fmtQty } from "./menuFormat"

const ratingText = (r: CostoMenuResult["indicator"]) => (r === "MUY_BUENO" ? "Muy buena" : r === "MALO" ? "Mala" : "Regular")

/**
 * Detalle de un menú guardado (hoja FORMATOMENU del Excel): la respuesta primero (precio por
 * persona), los datos de la porción, a dónde va cada peso del precio, cada plato con lo que pesa
 * en el costo y, plegado, cómo se arma el precio. Sin contornos ni pastillas.
 */
export default function MenuDetail({
  costo,
  items: itemsInput,
  numPersonas,
  margenPct,
  pctMP,
}: {
  costo: CostoMenuResult
  items: FichaItemInput[]
  numPersonas: number
  margenPct: number
  pctMP: number
}) {
  const cfg = IND[costo.indicator]
  const items = buildFichaItems(itemsInput, numPersonas)
  const peso = pesoPorcionG(items)
  const lineas = buildFichaPrecio(costo, numPersonas, margenPct, pctMP)
  const totalPorcion = costo.costoTotalPorcion
  const personas = `${numPersonas} ${numPersonas === 1 ? "persona" : "personas"}`

  return (
    <>
      <ModalHero
        label="Precio sugerido por persona"
        value={fmt(costo.precioPotencialVentaPorcion)}
        note={numPersonas > 1 ? `Para ${personas}: ${fmt(costo.precioPotencialVentaTotal)}` : undefined}
        aside={
          <p className="text-right text-sm" style={{ color: "var(--text-muted)" }}>
            Rentabilidad
            <span className="block text-xl font-bold" style={{ color: cfg.color }}>
              {ratingText(costo.indicator)}
            </span>
            {cfg.sublabel}
          </p>
        }
      />

      <StatGrid cols={4}>
        <Stat label="Costo por porción" value={fmt(totalPorcion)} />
        <Stat label="Personas" value={numPersonas} />
        <Stat label={peso > 0 ? "Peso por porción" : "Costo con margen"} value={peso > 0 ? fmtQty(peso, "g") : fmt(costo.costoConMargenPorcion)} />
        <Stat label={peso > 0 ? "Costo por gramo" : "Materia prima"} value={peso > 0 ? fmtDec(totalPorcion / peso) : `${pctMP.toFixed(0)} %`} />
      </StatGrid>

      <Panel title="A dónde va cada peso del precio">
        <ShareDonut
          centerLabel="de ganancia"
          centerValue={`${costo.pctGanancia.toFixed(1)} %`}
          centerColor={cfg.color}
          segments={[
            { key: "mp", label: "Materia prima", pct: pctMP, color: COLOR_MP, amount: fmt((costo.precioPotencialVentaPorcion * pctMP) / 100) },
            { key: "fixed", label: "Costos fijos", pct: costo.pctCostosFijos, color: COLOR_FIXED, amount: fmt((costo.precioPotencialVentaPorcion * costo.pctCostosFijos) / 100) },
            { key: "profit", label: "Ganancia", pct: costo.pctGanancia, color: COLOR_PROFIT, amount: fmt((costo.precioPotencialVentaPorcion * costo.pctGanancia) / 100) },
          ]}
        />
      </Panel>

      <div className="flex flex-col gap-2.5">
        <Fold title="Platos y extras" count={items.length}>
          {items.length === 0 ? (
            <p className="py-2 text-sm" style={{ color: "var(--text-muted)" }}>Este menú no tiene platos.</p>
          ) : (
            <RowList>
              {items.map((it) => (
                <ShareRow
                  key={it.key}
                  surface="inset"
                  name={it.nombre}
                  tag={it.extra ? "Extra" : undefined}
                  detail={`${fmtQty(it.cantidad, it.unidad)} por persona`}
                  amount={fmt(it.porPorcion)}
                  share={totalPorcion > 0 ? it.porPorcion / totalPorcion : undefined}
                />
              ))}
            </RowList>
          )}
        </Fold>

        <Fold title="Cómo se arma el precio">
        <p className="pb-1 text-xs" style={{ color: "var(--text-muted)" }}>
          Por persona (y para {personas} entre paréntesis)
        </p>
        <dl className="m-0">
          {lineas.map((l) => (
            <FactRow
              key={l.key}
              label={l.label}
              value={`${fmt(l.porPorcion)} (${fmt(l.total)})`}
              tone={l.kind === "resultado" ? "accent" : "plain"}
            />
          ))}
        </dl>
        <p className="pt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          El precio sale de dividir el costo con margen entre el % de materia prima; los costos fijos y la ganancia se reparten sobre ese precio.
        </p>
      </Fold>

        <Fold title="Para todas las personas">
        <dl className="m-0">
          {items.map((it) => (
            <FactRow key={it.key} label={it.nombre} value={`${fmtQty(it.cantidadTotal, it.unidad)} · ${fmt(it.costoTotal)}`} />
          ))}
          <FactRow label={`Costo para ${personas}`} value={fmt(costo.costoTotalPersonas)} tone="accent" />
        </dl>
      </Fold>
      </div>
    </>
  )
}
