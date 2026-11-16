import { Lin, Rad, Svg, fill, grad, useUid, v, type IllustrationProps } from "./kit"

const CX = 250
const CY = 320
const R = 180 // radio medio del tubo
const W = 90 // grosor del tubo

const pt = (deg: number, r = R) => {
  const a = (deg * Math.PI) / 180
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)] as const
}
const arc = (from: number, to: number, r = R) => {
  const [x1, y1] = pt(from, r)
  const [x2, y2] = pt(to, r)
  return `M${x1.toFixed(1)} ${y1.toFixed(1)}A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`
}

const SEGMENTS: { from: number; to: number; color: string; hi: string; lo: string }[] = [
  { from: 180, to: 124, color: "1-lo", hi: "1", lo: "1-lo" },
  { from: 124, to: 56, color: "1", hi: "1-hi", lo: "1-lo" },
  { from: 56, to: 0, color: "2", hi: "2-hi", lo: "2-lo" },
]

/** Factor de rendimiento: medidor semicircular de tres tramos con aguja. */
export default function Gauge(props: IllustrationProps) {
  const id = useUid()
  const ring = (deg: number) => {
    const [x1, y1] = pt(deg, R - W / 2 - 2)
    const [x2, y2] = pt(deg, R + W / 2 + 2)
    return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`
  }
  return (
    <Svg size={500} {...props}>
      <defs>
        <Rad id={`${id}h`} cx={0.35} cy={0.3} r={0.85} stops={[[0, "ink-hi"], [0.6, "ink"], [1, "ink-lo"]]} />
        <Rad id={`${id}k`} cx={0.35} cy={0.3} r={0.8} stops={[[0, "paper-hi"], [0.5, "neutral-hi"], [1, "neutral"]]} />
        <Lin id={`${id}n`} x2={1} y2={1} stops={[[0, "paper-hi"], [1, "neutral"]]} />
        <Lin id={`${id}c`} x2={1} y2={0} stops={[[0, "neutral-lo"], [0.5, "neutral-hi"], [1, "neutral-lo"]]} />
      </defs>
      <ellipse cx={250} cy={332} rx={215} ry={12} style={fill("shadow", 0.45)} />
      {SEGMENTS.map((s) => (
        <g key={s.color} style={{ fill: "none" }}>
          <path d={arc(s.from, s.to)} style={{ stroke: v(s.color), strokeWidth: W, fill: "none" }} />
          <path d={arc(s.from - 1, s.to + 1, R + W / 2 - 9)} style={{ stroke: v(s.hi), strokeWidth: 18, opacity: 0.45, fill: "none" }} />
          <path d={arc(s.from - 1, s.to + 1, R - W / 2 + 9)} style={{ stroke: v(s.lo), strokeWidth: 18, opacity: 0.4, fill: "none" }} />
        </g>
      ))}
      {/* anillos metálicos entre tramos y bases */}
      {[124, 56].map((d) => (
        <path key={d} d={ring(d)} style={{ stroke: v("neutral-lo"), strokeWidth: 10, strokeLinecap: "round", opacity: 0.7, fill: "none" }} />
      ))}
      {[124, 56].map((d) => (
        <path key={`h${d}`} d={ring(d)} style={{ stroke: v("paper-hi"), strokeWidth: 4, strokeLinecap: "round", opacity: 0.8, fill: "none" }} />
      ))}
      <ellipse cx={CX - R} cy={CY - 4} rx={W / 2 + 4} ry={7} style={grad(`${id}c`)} />
      <ellipse cx={CX + R} cy={CY - 4} rx={W / 2 + 4} ry={7} style={grad(`${id}c`)} />
      {/* cubo: disco metálico con grosor */}
      <circle cx={254} cy={330} r={86} style={fill("ink-lo")} />
      <circle cx={258} cy={326} r={84} style={grad(`${id}h`)} />
      {/* aguja */}
      <path d="M288 300L368 232L326 322Z" style={grad(`${id}n`)} />
      <path d="M284 296L366 233L336 298Z" style={fill("paper-hi", 0.35)} />
      <circle cx={272} cy={326} r={34} style={fill("ink-lo")} />
      <circle cx={274} cy={324} r={33} style={grad(`${id}k`)} />
      <circle cx={274} cy={324} r={20} style={{ fill: "none", stroke: v("neutral-lo"), strokeWidth: 2, opacity: 0.4 }} />
    </Svg>
  )
}
