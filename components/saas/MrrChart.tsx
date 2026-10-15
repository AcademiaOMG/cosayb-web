"use client"

import { useState } from "react"
import { fmtMonth, formatCOP } from "@/lib/saas/format"
import type { MrrPoint } from "@/lib/saas/types"

const W = 640
const H = 220
const PAD = { top: 12, right: 8, bottom: 28, left: 56 }

function niceMax(v: number): number {
  if (v <= 0) return 1
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}

function short(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`
  if (v >= 1_000) return `${Math.round(v / 1_000)} mil`
  return String(v)
}

/** MRR mensual: una sola serie (barras), con tooltip al pasar/enfocar y tabla equivalente. */
export default function MrrChart({ series }: { series: MrrPoint[] }) {
  const [active, setActive] = useState<number | null>(null)
  const max = niceMax(Math.max(...series.map((p) => p.mrr), 1))
  const iw = W - PAD.left - PAD.right
  const ih = H - PAD.top - PAD.bottom
  const slot = iw / Math.max(series.length, 1)
  const bw = Math.min(28, slot * 0.6)
  const ticks = [0, 0.25, 0.5, 0.75, 1]
  const sel = active !== null ? series[active] : null

  return (
    <figure className="flex flex-col gap-2" aria-label="Ingreso mensual recurrente por mes">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Gráfico de barras del MRR de los últimos 12 meses">
          {ticks.map((t) => {
            const y = PAD.top + ih * (1 - t)
            return (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="var(--border-light)" strokeWidth={1} />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)">
                  {short(max * t)}
                </text>
              </g>
            )
          })}
          {series.map((p, i) => {
            const h = (p.mrr / max) * ih
            const x = PAD.left + slot * i + (slot - bw) / 2
            const y = PAD.top + ih - h
            const isActive = active === i
            return (
              <g
                key={p.month}
                tabIndex={0}
                role="img"
                aria-label={`${fmtMonth(p.month)}: ${formatCOP(p.mrr)}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                style={{ outline: "none" }}
              >
                {/* zona de impacto más ancha que la barra */}
                <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={ih + PAD.bottom} fill="transparent" />
                <path
                  d={`M${x},${PAD.top + ih} V${y + 4} a4,4 0 0 1 4,-4 h${bw - 8} a4,4 0 0 1 4,4 V${PAD.top + ih} Z`}
                  fill="var(--accent)"
                  opacity={active === null || isActive ? 1 : 0.45}
                />
                {(i % 2 === 0 || series.length < 8) && (
                  <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
                    {fmtMonth(p.month)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>
        {sel && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 right-0 rounded-lg px-3 py-2 text-xs"
            style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-md)", color: "var(--text-primary)" }}
          >
            <p className="font-semibold">{fmtMonth(sel.month)}</p>
            <p>MRR: {formatCOP(sel.mrr)}</p>
            <p style={{ color: "var(--text-muted)" }}>
              +{sel.newSubscriptions} altas · −{sel.canceledSubscriptions} bajas
            </p>
          </div>
        )}
      </div>
      <details className="text-xs" style={{ color: "var(--text-muted)" }}>
        <summary className="cursor-pointer">Ver como tabla</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr><th className="py-1 pr-3">Mes</th><th className="py-1 pr-3">MRR</th><th className="py-1 pr-3">Altas</th><th className="py-1">Bajas</th></tr>
          </thead>
          <tbody>
            {series.map((p) => (
              <tr key={p.month}>
                <td className="py-0.5 pr-3">{fmtMonth(p.month)}</td>
                <td className="py-0.5 pr-3">{formatCOP(p.mrr)}</td>
                <td className="py-0.5 pr-3">{p.newSubscriptions}</td>
                <td className="py-0.5">{p.canceledSubscriptions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
