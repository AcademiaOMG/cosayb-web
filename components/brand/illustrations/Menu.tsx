import { Lin, Rad, Svg, fill, grad, useUid, v, type IllustrationProps } from "./kit"

/** Menú: cloche de servicio sobre un plato, con tenedor y cuchillo. */
export default function Menu(props: IllustrationProps) {
  const id = useUid()
  return (
    <Svg size={120} {...props}>
      <defs>
        <Rad id={`${id}d`} cx={0.35} cy={0.25} r={0.9} stops={[[0, "1-hi"], [0.55, "1"], [1, "1-lo"]]} />
        <Lin id={`${id}p`} stops={[[0, "paper-hi"], [1, "paper-lo"]]} />
        <Lin id={`${id}k`} x2={1} y2={0} stops={[[0, "ink-hi"], [1, "neutral-lo"]]} />
        <Rad id={`${id}n`} cx={0.35} cy={0.3} r={0.8} stops={[[0, "2-hi"], [1, "2"]]} />
      </defs>
      <ellipse cx={60} cy={106} rx={52} ry={6} style={fill("shadow")} />
      {/* cubiertos */}
      <g>
        <path d="M5 40V28M10 40V26M15 40V28" style={{ fill: "none", stroke: v("ink-hi"), strokeWidth: 2.6, strokeLinecap: "round" }} />
        <path d="M3.5 38H16.5Q16.5 48 10 49Q3.5 48 3.5 38Z" style={grad(`${id}k`)} />
        <rect x={7.5} y={46} width={5} height={50} rx={2.5} style={grad(`${id}k`)} />
        <path d="M108 96V54Q108 30 116 28Q116 56 114 60V96Q114 99 111 99Q108 99 108 96Z" style={grad(`${id}k`)} />
      </g>
      {/* plato */}
      <ellipse cx={60} cy={94} rx={47} ry={11.5} style={fill("paper-lo")} />
      <ellipse cx={60} cy={91} rx={46} ry={11} style={fill("paper-hi")} />
      <ellipse cx={60} cy={92} rx={36} ry={7.5} style={fill("cream")} />
      {/* cloche */}
      <path d="M20 90Q20 38 60 38Q100 38 100 90Q60 98 20 90Z" style={grad(`${id}d`)} />
      <path d="M26 82Q28 52 52 46" style={{ fill: "none", stroke: v("paper-hi"), strokeWidth: 5, strokeLinecap: "round", opacity: 0.5 }} />
      <path d="M17 90Q60 100 103 90" style={{ fill: "none", stroke: v("1-lo"), strokeWidth: 3, strokeLinecap: "round", opacity: 0.5 }} />
      <circle cx={60} cy={32} r={7} style={grad(`${id}n`)} />
      <rect x={55} y={36} width={10} height={4} rx={2} style={fill("2-lo")} />
    </Svg>
  )
}
