"use client"

import { useState } from "react"

export interface BarPoint {
  /** Etiqueta del eje (corta) */
  label: string
  /** Etiqueta del tooltip (completa) */
  title: string
  value: number
}

const W = 640
const H = 200
const PAD = { top: 12, right: 8, bottom: 26, left: 32 }

function niceMax(v: number): number {
  if (v <= 4) return 4
  const p = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}

/**
 * Barras de una sola serie (conteo por día). Tooltip al pasar el cursor o enfocar,
 * y tabla equivalente para lectores de pantalla.
 */
export default function DailyBarChart({ points, unit, caption }: { points: BarPoint[]; unit: string; caption: string }) {
  const [active, setActive] = useState<number | null>(null)
  const max = niceMax(Math.max(...points.map((p) => p.value), 1))
  const iw = W - PAD.left - PAD.right
  const ih = H - PAD.top - PAD.bottom
  const slot = iw / Math.max(points.length, 1)
  const bw = Math.max(2, Math.min(18, slot * 0.7))
  const labelEvery = Math.max(1, Math.ceil(points.length / 8))
  const sel = active !== null ? points[active] : null

  return (
    <figure className="flex flex-col gap-2" aria-label={caption}>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={caption}>
          {[0, 0.5, 1].map((t) => {
            const y = PAD.top + ih * (1 - t)
            return (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="var(--border-light)" strokeWidth={1} />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={11} fill="var(--text-muted)">
                  {Math.round(max * t)}
                </text>
              </g>
            )
          })}
          {points.map((p, i) => {
            const h = (p.value / max) * ih
            const x = PAD.left + slot * i + (slot - bw) / 2
            const y = PAD.top + ih - h
            const r = Math.min(3, bw / 2, h)
            return (
              <g
                key={`${p.label}-${i}`}
                tabIndex={0}
                role="img"
                aria-label={`${p.title}: ${p.value} ${unit}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                style={{ outline: "none" }}
              >
                <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={ih + PAD.bottom} fill="transparent" />
                {h > 0 && (
                  <path
                    d={`M${x},${PAD.top + ih} V${y + r} a${r},${r} 0 0 1 ${r},-${r} h${bw - 2 * r} a${r},${r} 0 0 1 ${r},${r} V${PAD.top + ih} Z`}
                    fill="var(--accent)"
                    opacity={active === null || active === i ? 1 : 0.45}
                  />
                )}
                {i % labelEvery === 0 && (
                  <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
                    {p.label}
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
            <p className="font-semibold">{sel.title}</p>
            <p>{sel.value} {unit}</p>
          </div>
        )}
      </div>
      <details className="text-xs" style={{ color: "var(--text-muted)" }}>
        <summary className="cursor-pointer">Ver como tabla</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr><th className="py-1 pr-3">Día</th><th className="py-1">{unit}</th></tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={`${p.title}-${i}`}>
                <td className="py-0.5 pr-3">{p.title}</td>
                <td className="py-0.5">{p.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
