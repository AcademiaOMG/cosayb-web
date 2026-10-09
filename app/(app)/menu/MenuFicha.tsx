"use client"

import { ChefHat, Percent, Users } from "lucide-react"
import Card from "@/components/ui/Card"
import CollapsibleSection from "@/components/ui/CollapsibleSection"
import InfoStat from "@/components/ui/InfoStat"
import RatioDonut, { RatioRow, COLOR_MP, COLOR_FIXED, COLOR_PROFIT } from "@/components/ui/RatioDonut"
import type { CostoMenuResult } from "@/types/domain"
import {
  buildFichaItems, buildFichaPrecio, pesoPorcionG,
  type FichaItem, type FichaItemInput,
} from "@/lib/menuFicha"
import { IND, fmt, fmtDec, fmtQty } from "./menuFormat"

/**
 * Ficha del menú: presenta el resultado en el mismo orden y con los mismos
 * datos que la hoja FORMATOMENU del Excel (peso y costo por gramo de la porción,
 * cada plato por porción y por todas las personas, y cómo se arma el precio),
 * con textos cortos para quien no sabe de costos.
 */
export default function MenuFicha({
  costo, items: itemsInput, numPersonas, margenPct, pctMP,
}: {
  costo: CostoMenuResult
  items: FichaItemInput[]
  numPersonas: number
  /** Margen de seguridad, 0–100 */
  margenPct: number
  /** % de materia prima, 0–100 */
  pctMP: number
}) {
  const cfg = IND[costo.indicator]
  const items = buildFichaItems(itemsInput, numPersonas)
  const peso = pesoPorcionG(items)
  const lineas = buildFichaPrecio(costo, numPersonas, margenPct, pctMP)

  return (
    <div className="flex flex-col gap-4">
      {/* 1 · Respuesta: a cuánto vender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <div
          className="rounded-2xl p-5 flex flex-col justify-center"
          style={{ background: cfg.bg, border: `1px solid ${cfg.color}40`, transition: "background .4s ease" }}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: cfg.color, color: "#fff" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" aria-hidden />
              {cfg.label}
            </span>
            <span className="text-xs" style={{ color: cfg.text, opacity: 0.8 }}>{cfg.sublabel}</span>
          </div>
          <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: cfg.text, opacity: 0.7 }}>
            PRECIO SUGERIDO POR PERSONA
          </p>
          <p className="text-4xl font-bold tabular-nums" style={{ color: cfg.text, lineHeight: 1.1 }}>
            {fmt(costo.precioPotencialVentaPorcion)}
          </p>
          {numPersonas > 1 && (
            <p className="text-sm mt-2" style={{ color: cfg.text, opacity: 0.85 }}>
              Para {numPersonas} personas: <strong>{fmt(costo.precioPotencialVentaTotal)}</strong>
            </p>
          )}
        </div>

        <Card>
          <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            ¿A DÓNDE VA CADA PESO DEL PRECIO?
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <RatioDonut mp={pctMP} fixed={costo.pctCostosFijos} profit={costo.pctGanancia} profitColor={cfg.color} size={132} />
            <div className="flex flex-col gap-3 w-full min-w-0">
              <RatioRow label="Materia prima" color={COLOR_MP} pct={pctMP} />
              <RatioRow label="Costos fijos" color={COLOR_FIXED} pct={costo.pctCostosFijos} />
              <RatioRow label="Ganancia" color={COLOR_PROFIT} pct={costo.pctGanancia} />
            </div>
          </div>
        </Card>
      </div>

      {/* 2 · Datos de la porción (cabecera de FORMATOMENU) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoStat icon={<Users size={12} style={{ color: "var(--text-muted)" }} />} label="Personas" value={numPersonas} />
        <InfoStat
          icon={<Percent size={12} style={{ color: "var(--text-muted)" }} />}
          label="% materia prima"
          value={`${pctMP.toFixed(0)}%`}
        />
        <InfoStat
          label={peso > 0 ? "Peso por porción" : "Costo por porción"}
          value={peso > 0 ? fmtQty(peso, "g") : fmt(costo.costoTotalPorcion)}
          mono
        />
        <InfoStat
          label={peso > 0 ? "Costo por gramo" : "Costo con margen"}
          value={peso > 0 ? fmtDec(costo.costoTotalPorcion / peso) : fmt(costo.costoConMargenPorcion)}
          mono
        />
      </div>

      {/* 3 · Cómo se arma el precio (filas 23-29 de FORMATOMENU) */}
      <CollapsibleSection title="CÓMO SE ARMA EL PRECIO">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                <th scope="col" className="text-left font-semibold pb-2"><span className="sr-only">Concepto</span></th>
                <th scope="col" className="text-right font-semibold pb-2 pl-3 whitespace-nowrap">Por persona</th>
                <th scope="col" className="text-right font-semibold pb-2 pl-3 whitespace-nowrap">
                  Total {numPersonas} pers.
                </th>
              </tr>
            </thead>
            <tbody>
              {lineas.map((l) => (
                <tr
                  key={l.key}
                  style={{
                    borderTop: "1px solid var(--border-light)",
                    background: l.kind === "resultado" ? "var(--accent-light)" : undefined,
                    color: l.kind === "resultado" ? "var(--accent-text)" : "var(--text-secondary)",
                    fontWeight: l.kind === "base" ? 400 : 600,
                  }}
                >
                  <td className="py-2 pr-2 pl-1">
                    <span className="block" style={{ color: l.kind === "resultado" ? "inherit" : "var(--text-primary)" }}>
                      {l.label}
                    </span>
                    <span className="block text-[11px] font-normal" style={{ color: "var(--text-muted)" }}>{l.hint}</span>
                  </td>
                  <td className="py-2 pl-3 text-right tabular-nums font-mono whitespace-nowrap">{fmt(l.porPorcion)}</td>
                  <td className="py-2 pl-3 pr-1 text-right tabular-nums font-mono whitespace-nowrap">{fmt(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
          El precio sale de dividir el costo con margen entre el % de materia prima; los costos fijos
          y la ganancia se reparten sobre ese precio.
        </p>
      </CollapsibleSection>

      {/* 4 · Detalle por plato (filas 9-22 de FORMATOMENU), cerrado por defecto */}
      <CollapsibleSection
        title="PLATOS Y EXTRAS"
        count={items.length}
        icon={<ChefHat size={15} style={{ color: "var(--accent)" }} />}
      >
        <ItemsList
          items={items}
          numPersonas={numPersonas}
          pesoPorcion={peso}
          costoPorcion={costo.costoTotalPorcion}
          costoTotal={costo.costoTotalPersonas}
        />
      </CollapsibleSection>
    </div>
  )
}

function ExtraBadge() {
  return (
    <span
      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase shrink-0"
      style={{ background: "#FEF3C7", color: "#92400E" }}
      title="Extra por unidad (bebidas, desechables…)"
    >
      Extra
    </span>
  )
}

/**
 * Platos y extras sin tabla: cada uno es un bloque corto (nombre + costo total
 * y debajo sus cantidades en texto), así no depende del ancho del modal.
 */
function ItemsList({ items, numPersonas, pesoPorcion, costoPorcion, costoTotal }: {
  items: FichaItem[]
  numPersonas: number
  pesoPorcion: number
  costoPorcion: number
  costoTotal: number
}) {
  if (items.length === 0) {
    return <p className="text-sm py-2 text-center" style={{ color: "var(--text-muted)" }}>Sin ítems.</p>
  }
  return (
    <div className="flex flex-col">
      <ul className="flex flex-col">
        {items.map((it, idx) => (
          <li
            key={it.key}
            className="py-3 flex flex-col gap-1"
            style={{ borderTop: idx === 0 ? undefined : "1px solid var(--border-light)", paddingTop: idx === 0 ? 0 : undefined }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 flex items-center gap-2">
                {it.extra && <ExtraBadge />}
                <span className="text-sm font-semibold break-words" style={{ color: "var(--text-primary)" }}>{it.nombre}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums font-mono shrink-0" style={{ color: "var(--text-primary)" }}>
                {fmt(it.costoTotal)}
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {fmtQty(it.cantidad, it.unidad)} por persona · {fmtDec(it.costoUnit)} por {it.unidad} · {fmt(it.porPorcion)} por porción
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Para {numPersonas} personas: <strong style={{ color: "var(--text-secondary)" }}>{fmtQty(it.cantidadTotal, it.unidad)}</strong>
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-1 pt-3 flex flex-col gap-1.5 text-sm" style={{ borderTop: "2px solid var(--border-light)" }}>
        {pesoPorcion > 0 && (
          <div className="flex justify-between gap-3">
            <dt style={{ color: "var(--text-muted)" }}>Peso por porción</dt>
            <dd className="tabular-nums font-mono" style={{ color: "var(--text-secondary)" }}>{fmtQty(pesoPorcion, "g")}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <dt style={{ color: "var(--text-muted)" }}>Costo por porción</dt>
          <dd className="tabular-nums font-mono font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(costoPorcion)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt style={{ color: "var(--text-muted)" }}>Costo para {numPersonas} personas</dt>
          <dd className="tabular-nums font-mono font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(costoTotal)}</dd>
        </div>
      </dl>
    </div>
  )
}
