import { Lin, Svg, fill, grad, useUid, v, type IllustrationProps } from "./kit"

/** Recetas: ficha técnica con filas marcadas y un gorro de chef grande. */
export default function Recipe(props: IllustrationProps) {
  const id = useUid()
  const row = (y: number, done: boolean) => (
    <g key={y}>
      <circle cx={30} cy={y} r={6} style={done ? fill("2") : { fill: v("paper-hi"), stroke: v("paper-lo"), strokeWidth: 2 }} />
      {done && <path d={`M27 ${y}L29.5 ${y + 2.5}L33.5 ${y - 2.5}`} style={{ fill: "none", stroke: v("paper-hi"), strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }} />}
      <rect x={42} y={y - 3} width={32} height={6} rx={3} style={fill("paper-lo")} />
    </g>
  )
  return (
    <Svg size={120} {...props}>
      <defs>
        <Lin id={`${id}p`} x2={0.3} y2={1} stops={[[0, "paper-hi"], [1, "paper"]]} />
        <Lin id={`${id}h`} x2={0.6} y2={1} stops={[[0, "1-hi"], [1, "1"]]} />
        <Lin id={`${id}b`} stops={[[0, "1"], [1, "1-lo"]]} />
      </defs>
      <ellipse cx={56} cy={111} rx={44} ry={5} style={fill("shadow")} />
      <g transform="rotate(-5 50 70)">
        <rect x={16} y={30} width={68} height={78} rx={10} style={fill("1-lo", 0.25)} transform="translate(2 3)" />
        <rect x={16} y={30} width={68} height={78} rx={10} style={grad(`${id}p`)} />
        <rect x={16} y={30} width={68} height={78} rx={10} style={{ fill: "none", stroke: v("paper-lo"), strokeWidth: 1.2 }} />
        <rect x={16} y={30} width={68} height={22} rx={10} style={fill("1")} />
        <rect x={16} y={42} width={68} height={10} style={fill("1")} />
        <rect x={25} y={38} width={30} height={5} rx={2.5} style={fill("paper-hi")} />
        {row(66, true)}
        {row(82, true)}
        {row(98, false)}
      </g>
      {/* gorro de chef */}
      <g transform="translate(-6 4) rotate(10 86 34)">
        <ellipse cx={88} cy={56} rx={22} ry={3} style={fill("shadow", 0.7)} />
        <circle cx={72} cy={32} r={12} style={grad(`${id}h`)} />
        <circle cx={102} cy={32} r={12} style={grad(`${id}h`)} />
        <circle cx={87} cy={24} r={16} style={grad(`${id}h`)} />
        <rect x={70} y={32} width={34} height={20} rx={6} style={grad(`${id}h`)} />
        <rect x={70} y={46} width={34} height={11} rx={4} style={grad(`${id}b`)} />
        <path d="M80 34V45M87 34V45M94 34V45" style={{ fill: "none", stroke: v("1-lo"), strokeWidth: 1.6, strokeLinecap: "round", opacity: 0.3 }} />
        <path d="M76 19Q80 13 86 13" style={{ fill: "none", stroke: v("paper-hi"), strokeWidth: 3, strokeLinecap: "round", opacity: 0.55 }} />
      </g>
    </Svg>
  )
}
