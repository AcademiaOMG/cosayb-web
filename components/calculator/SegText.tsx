import type { CSSProperties } from "react"

/**
 * Dígitos de 7 segmentos dibujados en SVG (sin fuentes externas). Los
 * segmentos apagados quedan siempre visibles (`.s`, tinta al ~7%) y los
 * encendidos llevan `.on`. Ver `.calc-seg` en calculator.css.
 *
 * El punto y la coma no consumen celda: se adjuntan como punto decimal del
 * dígito anterior (la coma con cola). El texto se alinea a la derecha.
 */

function hs(cy: number) {
  return `3,${cy} 6,${cy - 3} 22,${cy - 3} 25,${cy} 22,${cy + 3} 6,${cy + 3}`
}
function vs(cx: number, y1: number, y2: number) {
  return `${cx},${y1} ${cx + 3},${y1 + 3} ${cx + 3},${y2 - 3} ${cx},${y2} ${cx - 3},${y2 - 3} ${cx - 3},${y1 + 3}`
}

const POINTS: Record<string, string> = {
  a: hs(3.5),
  g: hs(24),
  d: hs(44.5),
  f: vs(2.5, 5.5, 22.5),
  b: vs(25.5, 5.5, 22.5),
  e: vs(2.5, 25.5, 42.5),
  c: vs(25.5, 25.5, 42.5),
}
const SEGMENTS = ["a", "b", "c", "d", "e", "f", "g"] as const

const MAP: Record<string, string> = {
  "0": "abcdef",
  "1": "bc",
  "2": "abdeg",
  "3": "abcdg",
  "4": "bcfg",
  "5": "acdfg",
  "6": "acdefg",
  "7": "abc",
  "8": "abcdefg",
  "9": "abcdfg",
  "-": "g",
  " ": "",
}

const PITCH = 34

interface Cell {
  ch: string
  dp: "" | "." | ","
}

/** Separa el texto formateado ("$ 25.000", "35,5 %") en unidad y cifras. */
export function splitUnit(text: string): { unit: string; unitSide: "left" | "right"; number: string } {
  const number = text.replace(/[^0-9.,-]/g, "")
  const unit = text.replace(/[0-9.,-]/g, "").trim()
  const firstDigit = text.search(/[0-9]/)
  const firstUnit = text.search(/[^0-9.,\-\s]/)
  const unitSide = firstUnit !== -1 && (firstDigit === -1 || firstUnit < firstDigit) ? "left" : "right"
  return { unit, unitSide, number }
}

export function toCells(number: string, cells: number): Cell[] {
  const out: Cell[] = []
  for (const ch of number) {
    if (ch === "." || ch === ",") {
      if (out.length) out[out.length - 1].dp = ch
    } else if (MAP[ch] !== undefined) {
      out.push({ ch, dp: "" })
    }
  }
  const total = Math.max(cells, out.length)
  while (out.length < total) out.unshift({ ch: " ", dp: "" })
  return out
}

export default function SegText({
  number,
  cells,
  dim = false,
  className,
  style,
}: {
  /** Solo cifras, signo, punto y coma (ver splitUnit) */
  number: string
  /** Celdas mínimas; crece si el número no cabe */
  cells: number
  /** Valor vacío / sin resultado: el cero se ve atenuado */
  dim?: boolean
  className?: string
  style?: CSSProperties
}) {
  const list = toCells(number === "" ? "0" : number, cells)
  const width = list.length * PITCH + 10

  return (
    <svg
      className={`calc-seg${dim ? " is-dim" : ""}${className ? ` ${className}` : ""}`}
      style={{ ...style, ["--cells" as string]: list.length }}
      viewBox={`0 0 ${width} 54`}
      aria-hidden
      focusable="false"
    >
      <g transform="translate(7 0) skewX(-7)">
        {list.map((cell, i) => {
          const on = MAP[cell.ch] ?? ""
          return (
            <g key={i} transform={`translate(${i * PITCH} 0)`}>
              {SEGMENTS.map((s) => (
                <polygon key={s} className={on.includes(s) ? "s on" : "s"} points={POINTS[s]} />
              ))}
              <circle className={cell.dp ? "s on" : "s"} cx="30.5" cy="49.5" r="2.4" />
              {cell.dp === "," && <polygon className="s on" points="29,51 33,51 30.2,54" />}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
