import type { ReactNode } from "react"
import { donutSegments, linePoints, niceMax } from "@/lib/lms/studio"

// Gráficos SVG propios y accesibles: cada uno es una <figure> con resumen (aria-label) y una tabla equivalente
// solo para lectores de pantalla. Sin dependencias; las animaciones respetan prefers-reduced-motion (lms.css).

const sr = "sr-only"

export interface Series {
  name: string
  color: string
  values: number[]
}

/** Gráfico de líneas con rejilla y ejes. `labels` son las categorías del eje X. */
export function LineChart({ labels, series, summary }: { labels: string[]; series: Series[]; summary: string }) {
  const W = 560
  const H = 200
  const PAD = { l: 34, r: 12, t: 12, b: 26 }
  const iw = W - PAD.l - PAD.r
  const ih = H - PAD.t - PAD.b
  const max = niceMax(Math.max(1, ...series.flatMap((s) => s.values)))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f))
  const step = labels.length > 1 ? iw / (labels.length - 1) : 0
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="h-auto w-full">
        <g transform={`translate(${PAD.l},${PAD.t})`}>
          {ticks.map((t) => {
            const y = ih - (t / max) * ih
            return (
              <g key={t}>
                <line x1={0} x2={iw} y1={y} y2={y} className="chart-grid" />
                <text x={-8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--l-muted)">{t}</text>
              </g>
            )
          })}
          {labels.map((l, i) => (
            <text key={l} x={i * step} y={ih + 18} textAnchor="middle" fontSize="11" fill="var(--l-muted)">{l}</text>
          ))}
          {series.map((s) => {
            const pts = linePoints(s.values, iw, ih, max)
            return (
              <g key={s.name}>
                <path d={pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ")} pathLength={1} className="chart-line" stroke={s.color} />
                {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill="#fff" stroke={s.color} strokeWidth={2.5} />)}
              </g>
            )
          })}
        </g>
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-4 text-xs font-bold" style={{ color: "var(--l-muted)" }}>
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5"><i aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.name}</span>
        ))}
      </figcaption>
      <table className={sr}>
        <caption>{summary}</caption>
        <thead><tr><th scope="col">Mes</th>{series.map((s) => <th key={s.name} scope="col">{s.name}</th>)}</tr></thead>
        <tbody>{labels.map((l, i) => <tr key={l}><th scope="row">{l}</th>{series.map((s) => <td key={s.name}>{s.values[i]}</td>)}</tr>)}</tbody>
      </table>
    </figure>
  )
}

export interface Slice {
  label: string
  value: number
  color: string
}

/** Dona con leyenda. El total va en el centro. */
export function DonutChart({ slices, centerLabel, summary }: { slices: Slice[]; centerLabel: string; summary: string }) {
  const R = 54
  const C = 2 * Math.PI * R
  const total = slices.reduce((s, x) => s + x.value, 0)
  const segs = donutSegments(slices.map((s) => s.value))
  return (
    <figure className="m-0 flex flex-wrap items-center gap-5">
      <svg viewBox="0 0 140 140" width={150} height={150} role="img" aria-label={summary} className="shrink-0">
        <circle cx={70} cy={70} r={R} fill="none" stroke="var(--l-line)" strokeWidth={18} />
        {total > 0 &&
          segs.map((g, i) =>
            g.share > 0 ? (
              <circle key={slices[i].label} cx={70} cy={70} r={R} fill="none" stroke={slices[i].color} strokeWidth={18} strokeDasharray={`${Math.max(0, g.share * C - 2)} ${C}`} strokeDashoffset={-g.start * C} transform="rotate(-90 70 70)" />
            ) : null
          )}
        <text x={70} y={68} textAnchor="middle" fontSize="26" fontWeight={800} fill="var(--l-ink)">{total}</text>
        <text x={70} y={86} textAnchor="middle" fontSize="11" fontWeight={700} fill="var(--l-muted)">{centerLabel}</text>
      </svg>
      <figcaption className="min-w-[140px] flex-1">
        <ul className="flex flex-col gap-2 text-sm">
          {slices.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <i aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="min-w-0 flex-1 truncate font-semibold">{s.label}</span>
              <span className="font-extrabold">{s.value}</span>
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  )
}

/** Barras verticales (p. ej. distribución de notas). */
export function BarChart({ labels, values, color = "var(--l-brand)", summary, unit = "" }: { labels: string[]; values: number[]; color?: string; summary: string; unit?: string }) {
  const W = 420
  const H = 150
  const max = Math.max(1, ...values)
  const bw = W / values.length
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${W} ${H + 22}`} role="img" aria-label={summary} className="h-auto w-full">
        <line x1={0} x2={W} y1={H} y2={H} className="chart-grid" />
        {values.map((v, i) => {
          const h = (v / max) * (H - 18)
          return (
            <g key={labels[i]}>
              <rect className="chart-bar" style={{ ["--i" as string]: i }} x={i * bw + 5} y={H - h} width={bw - 10} height={Math.max(h, v > 0 ? 3 : 0)} rx={6} fill={color} />
              {v > 0 && <text x={i * bw + bw / 2} y={H - h - 5} textAnchor="middle" fontSize="11" fontWeight={800} fill="var(--l-ink-2)">{v}</text>}
              <text x={i * bw + bw / 2} y={H + 15} textAnchor="middle" fontSize="10" fill="var(--l-muted)">{labels[i]}</text>
            </g>
          )
        })}
      </svg>
      <table className={sr}>
        <caption>{summary}</caption>
        <thead><tr><th scope="col">Tramo</th><th scope="col">Cantidad{unit}</th></tr></thead>
        <tbody>{labels.map((l, i) => <tr key={l}><th scope="row">{l}</th><td>{values[i]}</td></tr>)}</tbody>
      </table>
    </figure>
  )
}

/** Barras horizontales con porcentaje (embudo de lecciones, preguntas falladas). */
export function HBars({ rows, summary, tone = "brand" }: { rows: { label: ReactNode; sub?: string; percent: number; text: string }[]; summary: string; tone?: "brand" | "rose" }) {
  const color = tone === "rose" ? "var(--l-rose)" : "var(--l-brand)"
  return (
    <figure className="m-0">
      <ul aria-label={summary} className="flex flex-col gap-3">
        {rows.map((r, i) => (
          <li key={i} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 break-words font-bold">{r.label}</span>
              <span className="shrink-0 font-extrabold">{r.text}</span>
            </div>
            <div className="q-progress" role="img" aria-label={`${r.percent}%`}>
              <span className="l-bar-fill" style={{ width: `${Math.max(0, Math.min(100, r.percent))}%`, background: color, ["--i" as string]: i }} />
            </div>
            {r.sub && <span className="l-hint">{r.sub}</span>}
          </li>
        ))}
      </ul>
    </figure>
  )
}
