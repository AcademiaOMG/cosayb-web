import { useId, type CSSProperties, type ReactNode } from "react"
import "./illustrations.css"

export interface IllustrationProps {
  className?: string
  /** Si se da, la ilustración deja de ser decorativa (role="img" + aria-label). */
  title?: string
}

/** Variable de paleta (definida en illustrations.css). */
export const v = (name: string) => `var(--ill-${name})`
/** Relleno con color de paleta. */
export const fill = (name: string, opacity?: number): CSSProperties => ({ fill: v(name), opacity })
/** Relleno con gradiente local. */
export const grad = (id: string): CSSProperties => ({ fill: `url(#${id})` })

/** Id base único por instancia (useId contiene ":" que no es válido en url(#…)). */
export function useUid(): string {
  return "ill" + useId().replace(/[^a-zA-Z0-9]/g, "")
}

export type Stop = [offset: number, color: string, opacity?: number]

const stops = (list: Stop[]) =>
  list.map(([o, c, op], i) => <stop key={i} offset={o} style={{ stopColor: v(c), stopOpacity: op }} />)

interface LinProps {
  id: string
  stops: Stop[]
  x1?: number
  y1?: number
  x2?: number
  y2?: number
}
/** Gradiente lineal en coordenadas relativas al objeto (0..1). */
export function Lin({ id, stops: s, x1 = 0, y1 = 0, x2 = 0, y2 = 1 }: LinProps) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
      {stops(s)}
    </linearGradient>
  )
}

interface RadProps {
  id: string
  stops: Stop[]
  cx?: number
  cy?: number
  r?: number
}
/** Gradiente radial en coordenadas relativas al objeto (0..1). */
export function Rad({ id, stops: s, cx = 0.35, cy = 0.3, r = 0.8 }: RadProps) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r={r}>
      {stops(s)}
    </radialGradient>
  )
}

interface SvgProps extends IllustrationProps {
  /** Lado del viewBox cuadrado (sistema de coordenadas de la referencia). */
  size: number
  children: ReactNode
}
export function Svg({ size, className, title, children }: SvgProps) {
  const a11y = title ? ({ role: "img", "aria-label": title } as const) : ({ "aria-hidden": true } as const)
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className ? `ill ${className}` : "ill"}
      focusable="false"
      {...a11y}
    >
      {children}
    </svg>
  )
}
