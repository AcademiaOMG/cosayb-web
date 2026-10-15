"use client"

import { useEffect, useId, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

/**
 * Piezas de las ventanas de detalle (receta, ingrediente, menú, valoración…):
 * superficies sin contorno (solo tono y sombra, como el resto de la app), la cifra
 * principal grande y las demás como mosaicos con un foco de luz que sigue al cursor
 * (inspirado en SpotlightCard de React Bits). Sin pastillas de colores ni viñetas.
 */

/** Elevación estándar de las superficies blancas: dos sombras suaves, sin contorno */
export const RAISED: CSSProperties = {
  background: "var(--bg-surface)",
  boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05), 0 8px 20px -10px rgba(16, 24, 40, 0.16)",
}

export type Tone = "plain" | "accent" | "good" | "warn" | "bad"

const TONE_COLOR: Record<Tone, string> = {
  plain: "var(--text-primary)",
  accent: "var(--accent-text)",
  good: "#0F8F5F",
  warn: "#B7791F",
  bad: "#C2362B",
}

/** Color del texto para un semáforo de rentabilidad */
export const toneOfRating = (r: "MUY_BUENO" | "REGULAR" | "MALO" | string): Tone =>
  r === "MUY_BUENO" ? "good" : r === "MALO" ? "bad" : "warn"

/** Mosaico con foco de luz que sigue al cursor. Sin borde: se distingue por el tono del fondo. */
function useSpotlight() {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  return {
    spot: pos,
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === "touch") return
      const r = e.currentTarget.getBoundingClientRect()
      setPos({ x: e.clientX - r.left, y: e.clientY - r.top })
    },
    onPointerLeave: () => setPos(null),
  }
}

const tileStyle = (spot: { x: number; y: number } | null, tone: Tone): CSSProperties => ({
  ...RAISED,
  background: spot
    ? `radial-gradient(160px circle at ${spot.x}px ${spot.y}px, rgba(27,79,216,0.07), transparent 70%), var(--bg-surface)`
    : "var(--bg-surface)",
  borderRadius: 18,
  color: TONE_COLOR[tone],
  transition: "background 0.15s",
})

/** Cifra principal de la ventana: lo primero que se lee. */
export function ModalHero({
  label,
  value,
  note,
  tone = "accent",
  aside,
}: {
  label: string
  value: ReactNode
  note?: ReactNode
  tone?: Tone
  /** Algo a la derecha (por ejemplo la rentabilidad) */
  aside?: ReactNode
}) {
  return (
    <section
      className="relative overflow-hidden px-6 py-5"
      style={{ ...RAISED, borderRadius: 24 }}
    >
      <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            {label}
          </p>
          <p
            className="font-display text-[40px] font-extrabold leading-[1.05] tabular-nums sm:text-[46px]"
            style={{ color: TONE_COLOR[tone], letterSpacing: "-0.02em" }}
          >
            {value}
          </p>
          {note && (
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {note}
            </p>
          )}
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </section>
  )
}

/** Cifra secundaria: etiqueta arriba, valor grande, apoyo abajo. */
export function Stat({
  label,
  value,
  hint,
  tone = "plain",
  icon,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: Tone
  icon?: ReactNode
}) {
  const s = useSpotlight()
  return (
    <div className="min-w-0 px-4 py-3.5" style={tileStyle(s.spot, tone)} onPointerMove={s.onPointerMove} onPointerLeave={s.onPointerLeave}>
      <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        {icon}
        {label}
      </p>
      <p className="mt-0.5 truncate text-[19px] font-bold leading-tight tabular-nums" style={{ letterSpacing: "-0.01em" }}>
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      )}
    </div>
  )
}

export function StatGrid({ children, cols = 3 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  const cls = cols === 4 ? "grid-cols-2 sm:grid-cols-4" : cols === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"
  return <div className={`grid gap-2.5 ${cls}`}>{children}</div>
}

/** Bloque con título, sin contorno: se separa por el aire y el tono, no por una línea. */
export function Panel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h3 className="text-[15px] font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          {title}
        </h3>
        {aside && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {aside}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

/**
 * Lista de partes de un total (ingredientes de una receta, platos de un menú): cada fila
 * dice cuánto pesa en el total con una barra fina, en lugar de viñetas.
 */
export function ShareRow({
  name,
  detail,
  amount,
  share,
  tag,
  color,
  surface = "raised",
}: {
  name: ReactNode
  detail?: ReactNode
  amount?: ReactNode
  /** 0–1: qué parte del total es */
  share?: number
  tag?: ReactNode
  /** Color de la barra (por defecto el de acento) */
  color?: string
  /** "inset": dentro de una superficie blanca (tono gris); por defecto va elevada sobre el fondo */
  surface?: "raised" | "inset"
}) {
  return (
    <li className="list-none px-4 py-3" style={surface === "raised" ? { ...RAISED, borderRadius: 16 } : { background: "var(--bg-primary)", borderRadius: 16 }}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {name}
          </span>
          {tag && (
            <span className="shrink-0 text-xs font-medium" style={{ color: "var(--accent-text)" }}>
              {tag}
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-baseline gap-3 text-sm tabular-nums">
          {detail && <span style={{ color: "var(--text-muted)" }}>{detail}</span>}
          {amount && (
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>
              {amount}
            </span>
          )}
        </span>
      </div>
      {share !== undefined && Number.isFinite(share) && (
        <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: "rgba(16,24,40,0.08)" }} aria-hidden>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(Math.max(share, 0), 1) * 100}%`, background: color ?? "var(--accent)", opacity: 0.9 }}
          />
        </div>
      )}
    </li>
  )
}

export function RowList({ children }: { children: ReactNode }) {
  return <ul className="m-0 flex flex-col gap-2 p-0">{children}</ul>
}

/** Plegable sin contorno: una fila de tono con el título y un chevron; se abre con una entrada suave. */
export function Fold({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string
  count?: number
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div style={{ ...RAISED, borderRadius: 20 }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-12 w-full items-center gap-3 rounded-[20px] px-5 text-left transition-colors hover:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        <span className="flex-1 text-[15px] font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>
          {title}
        </span>
        {count !== undefined && (
          <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
            {count}
          </span>
        )}
        <ChevronDown
          size={18}
          aria-hidden
          className="shrink-0 transition-transform duration-200"
          style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>
      {open && (
        <div id={id} className="anim-rise px-5 pb-5 pt-1">
          {children}
        </div>
      )}
    </div>
  )
}

/** Filas «dato → valor» para una ficha: sin líneas, con el valor a la derecha. */
export function FactRow({ label, value, tone = "plain" }: { label: string; value: ReactNode; tone?: Tone }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </dt>
      <dd className="m-0 text-sm font-semibold tabular-nums" style={{ color: TONE_COLOR[tone] }}>
        {value}
      </dd>
    </div>
  )
}

export interface DonutSegment {
  key: string
  label: string
  /** 0–100 */
  pct: number
  color: string
  /** Texto de apoyo a la derecha del porcentaje (por ejemplo el monto) */
  amount?: string
}

/**
 * Gráfico de reparto: la dona se dibuja al abrir y, al pasar el cursor (o enfocar) por una
 * fila de la leyenda, ese tramo se resalta y los demás se atenúan. Va directo sobre el fondo,
 * sin tarjeta detrás. Las filas de la leyenda llevan una barrita de color en vez de un punto.
 */
export function ShareDonut({
  segments,
  centerLabel,
  centerValue,
  centerColor = "var(--text-primary)",
  size = 168,
}: {
  segments: DonutSegment[]
  centerLabel: string
  centerValue: string
  centerColor?: string
  size?: number
}) {
  const [drawn, setDrawn] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    const f = requestAnimationFrame(() => setDrawn(true))
    return () => cancelAnimationFrame(f)
  }, [])

  const r = 15
  const circ = 2 * Math.PI * r
  const gap = 1.6
  const arcs = segments.map((seg, i) => {
    const frac = (v: number) => (Math.max(v, 0) / 100) * circ
    const start = segments.slice(0, i).reduce((sum, x) => sum + frac(x.pct), 0)
    return { seg, len: Math.max(0, frac(seg.pct) - gap), start }
  })

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 36 36" width={size} height={size} role="img" aria-label={segments.map((x) => `${x.label} ${x.pct.toFixed(1)} %`).join(", ")}>
          <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(16,24,40,0.07)" strokeWidth={4.6} />
          {arcs.map(({ seg, len, start }, i) => (
            <circle
              key={seg.key}
              cx="18"
              cy="18"
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={active === seg.key ? 5.6 : 4.6}
              strokeLinecap="round"
              strokeDasharray={`${drawn ? len : 0} ${circ}`}
              strokeDashoffset={-start}
              transform="rotate(-90 18 18)"
              opacity={active && active !== seg.key ? 0.28 : 1}
              style={{ transition: `stroke-dasharray 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 0.08}s, stroke-width 0.15s, opacity 0.15s` }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            {active ? segments.find((x) => x.key === active)?.label : centerLabel}
          </span>
          <span className="text-[26px] font-extrabold leading-tight tabular-nums" style={{ color: active ? "var(--text-primary)" : centerColor, letterSpacing: "-0.02em" }}>
            {active ? `${segments.find((x) => x.key === active)?.pct.toFixed(1)} %` : centerValue}
          </span>
        </div>
      </div>

      <ul className="m-0 flex w-full min-w-0 flex-1 flex-col gap-1 p-0">
        {segments.map((seg) => (
          <li
            key={seg.key}
            tabIndex={0}
            onPointerEnter={() => setActive(seg.key)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(seg.key)}
            onBlur={() => setActive(null)}
            className="flex list-none items-center gap-3 rounded-xl px-3 py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            style={{ background: active === seg.key ? "var(--bg-surface)" : "transparent", boxShadow: active === seg.key ? RAISED.boxShadow : undefined }}
          >
            <span className="h-4 w-1.5 shrink-0 rounded-full" style={{ background: seg.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              {seg.label}
            </span>
            {seg.amount && (
              <span className="text-sm tabular-nums" style={{ color: "var(--text-muted)" }}>
                {seg.amount}
              </span>
            )}
            <span className="w-14 text-right text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {seg.pct.toFixed(1)} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
