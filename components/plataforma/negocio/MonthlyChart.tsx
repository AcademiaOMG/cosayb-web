"use client"

import { useState } from "react"
import type { MonthPoint } from "@/lib/plataforma/negocio"
import { formatCOP } from "@/lib/saas/format"

const W = 640
const H = 220
const PAD = { top: 14, right: 12, bottom: 28, left: 56 }

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
const monthShort = (m: string) => MONTHS[Number(m.slice(5, 7)) - 1] ?? m
const monthLong = (m: string) => `${monthShort(m)} ${m.slice(0, 4)}`

const compactCOP = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} M` : n >= 1000 ? `$${Math.round(n / 1000)} mil` : `$${Math.round(n)}`

type Metric = "mrr" | "revenue"
const METRICS: { id: Metric; label: string; caption: string }[] = [
  { id: "mrr", label: "Ingresos recurrentes (MRR)", caption: "Ingresos recurrentes mensuales al cierre de cada mes" },
  { id: "revenue", label: "Dinero cobrado", caption: "Dinero cobrado por suscripciones en cada mes" },
]

/** Tendencia mensual en SVG propio: línea con puntos, tooltip por foco/cursor y tabla equivalente. */
export default function MonthlyChart({ points }: { points: MonthPoint[] }) {
  const [metric, setMetric] = useState<Metric>("mrr")
  const [active, setActive] = useState<number | null>(null)
  const info = METRICS.find((m) => m.id === metric)!
  const values = points.map((p) => p[metric])
  const max = Math.max(...values, 1)
  const iw = W - PAD.left - PAD.right
  const ih = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (points.length <= 1 ? iw / 2 : (iw * i) / (points.length - 1))
  const y = (v: number) => PAD.top + ih - (v / max) * ih
  const line = values.map((v, i) => `${i ? "L" : "M"}${x(i)},${y(v)}`).join(" ")
  const area = points.length ? `${line} L${x(points.length - 1)},${PAD.top + ih} L${x(0)},${PAD.top + ih} Z` : ""
  const sel = active !== null ? points[active] : null

  return (
    <figure className="flex flex-col gap-3" aria-label={info.caption}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Qué mostrar en el gráfico">
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={metric === m.id}
            onClick={() => setMetric(m.id)}
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{
              background: metric === m.id ? "var(--accent)" : "var(--bg-surface)",
              color: metric === m.id ? "#fff" : "var(--text-secondary)",
              border: "1px solid var(--border-light)",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={info.caption}>
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + ih * (1 - t)} y2={PAD.top + ih * (1 - t)} stroke="var(--border-light)" />
              <text x={PAD.left - 6} y={PAD.top + ih * (1 - t) + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)">
                {compactCOP(max * t)}
              </text>
            </g>
          ))}
          <path d={area} fill="var(--accent)" opacity={0.1} />
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <g
              key={p.month}
              tabIndex={0}
              role="img"
              aria-label={`${monthLong(p.month)}: ${formatCOP(p[metric])}`}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              style={{ outline: "none" }}
            >
              <rect x={x(i) - iw / points.length / 2} y={PAD.top} width={iw / points.length} height={ih + PAD.bottom} fill="transparent" />
              <circle cx={x(i)} cy={y(p[metric])} r={active === i ? 5 : 3.5} fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth={2} />
              <text x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
                {monthShort(p.month)}
              </text>
            </g>
          ))}
        </svg>
        {sel && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 right-0 rounded-lg px-3 py-2 text-xs"
            style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-md)", color: "var(--text-primary)" }}
          >
            <p className="font-semibold">{monthLong(sel.month)}</p>
            <p>{formatCOP(sel[metric])}</p>
            <p className="console-muted">
              {sel.newSubscriptions} altas · {sel.cancellations} bajas
            </p>
          </div>
        )}
      </div>
      <details className="text-xs console-muted">
        <summary className="cursor-pointer">Ver como tabla</summary>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-left">
            <thead>
              <tr>
                <th className="py-1 pr-3">Mes</th>
                <th className="py-1 pr-3">Recurrente</th>
                <th className="py-1 pr-3">Cobrado</th>
                <th className="py-1 pr-3">Altas</th>
                <th className="py-1 pr-3">Bajas</th>
                <th className="py-1">Cancelación</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.month}>
                  <td className="py-0.5 pr-3">{monthLong(p.month)}</td>
                  <td className="pr-3">{formatCOP(p.mrr)}</td>
                  <td className="pr-3">{formatCOP(p.revenue)}</td>
                  <td className="pr-3">{p.newSubscriptions}</td>
                  <td className="pr-3">{p.cancellations}</td>
                  <td>{p.churnPercent.toLocaleString("es-CO")} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
