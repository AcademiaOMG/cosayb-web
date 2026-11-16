import { Rad, Svg, fill, grad, useUid, v, type IllustrationProps } from "./kit"

const TEETH = 8
const C = 162
const R_OUT = 134
const R_ROOT = 108
const R_HOLE = 42
const PUFF = 10 // mitad del trazo redondeado que "infla" el volumen

/** Contorno del engranaje (8 dientes trapezoidales) + orificio central (evenodd). */
function gearPath() {
  const step = (Math.PI * 2) / TEETH
  const p = (r: number, a: number) => `${(C + r * Math.cos(a)).toFixed(1)} ${(C + r * Math.sin(a)).toFixed(1)}`
  let d = ""
  for (let i = 0; i < TEETH; i++) {
    const a = i * step - Math.PI / 2
    d +=
      `${i ? "L" : "M"}${p(R_ROOT - PUFF, a - step * 0.34)}` +
      `L${p(R_OUT - PUFF, a - step * 0.16)}` +
      `L${p(R_OUT - PUFF, a + step * 0.16)}` +
      `L${p(R_ROOT - PUFF, a + step * 0.34)}`
  }
  const h = R_HOLE + PUFF
  return `${d}ZM${C - h} ${C}a${h} ${h} 0 1 0 ${h * 2} 0a${h} ${h} 0 1 0 ${-h * 2} 0Z`
}
const D = gearPath()

/** Engranaje de configuración: volumen inflado de un solo color de marca. */
export default function Gear(props: IllustrationProps) {
  const id = useUid()
  return (
    <Svg size={323} {...props}>
      <defs>
        <Rad id={`${id}g`} cx={0.4} cy={0.33} r={0.72} stops={[[0, "1-hi"], [0.5, "1"], [1, "1-lo"]]} />
      </defs>
      <path
        d={D}
        fillRule="evenodd"
        style={{ ...grad(`${id}g`), stroke: v("1"), strokeWidth: PUFF * 2, strokeLinejoin: "round" }}
      />
      {/* sombra interior del orificio y brillo del borde superior */}
      <circle cx={C} cy={C} r={R_HOLE + PUFF + 9} style={{ fill: "none", stroke: v("1-lo"), strokeWidth: 18, opacity: 0.35 }} />
      <path
        d={`M${C - 70} ${C - 55}A90 90 0 0 1 ${C + 20} ${C - 92}`}
        style={{ fill: "none", stroke: v("1-hi"), strokeWidth: 10, strokeLinecap: "round", opacity: 0.45 }}
      />
    </Svg>
  )
}
