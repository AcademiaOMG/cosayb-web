import { Lin, Rad, Svg, fill, grad, useUid, type IllustrationProps } from "./kit"

type Tone = "neutral" | "ink" | "1"

/** Cubo isométrico: x,y = vértice superior de la cara de arriba. */
function Cube({ x, y, w, h, tone, id }: { x: number; y: number; w: number; h: number; tone: Tone; id: string }) {
  const hw = w / 2
  const dy = w * 0.28
  return (
    <g>
      <path d={`M${x} ${y}L${x + hw} ${y + dy}L${x} ${y + dy * 2}L${x - hw} ${y + dy}Z`} style={fill(`${tone}-hi`)} />
      <path d={`M${x - hw} ${y + dy}L${x} ${y + dy * 2}L${x} ${y + dy * 2 + h}L${x - hw} ${y + dy + h}Z`} style={grad(`${id}${tone}l`)} />
      <path d={`M${x + hw} ${y + dy}L${x} ${y + dy * 2}L${x} ${y + dy * 2 + h}L${x + hw} ${y + dy + h}Z`} style={fill(`${tone}-lo`)} />
    </g>
  )
}

/** Inventario: caja abierta con cubos, cilindro y esfera dentro. */
export default function Inventory(props: IllustrationProps) {
  const id = useUid()
  return (
    <Svg size={344} {...props}>
      <defs>
        <Lin id={`${id}L`} x2={1} y2={1} stops={[[0, "paper"], [1, "paper-lo"]]} />
        <Lin id={`${id}R`} x2={1} y2={0.4} stops={[[0, "paper"], [1, "paper-lo"]]} />
        <Lin id={`${id}I`} stops={[[0, "paper-lo"], [1, "2-hi"]]} />
        <Lin id={`${id}F`} x2={1} y2={1} stops={[[0, "paper"], [1, "paper-lo"]]} />
        <Lin id={`${id}neutrall`} stops={[[0, "neutral"], [1, "neutral-lo"]]} />
        <Lin id={`${id}inkl`} stops={[[0, "ink"], [1, "ink-lo"]]} />
        <Lin id={`${id}1l`} stops={[[0, "1"], [1, "1-lo"]]} />
        <Lin id={`${id}C`} x2={1} y2={0} stops={[[0, "neutral-lo"], [0.35, "neutral-hi"], [1, "neutral-lo"]]} />
        <Rad id={`${id}B`} stops={[[0, "ink-hi"], [1, "ink-lo"]]} />
      </defs>
      <ellipse cx={172} cy={288} rx={118} ry={12} style={fill("shadow", 0.35)} />
      {/* solapas traseras */}
      <path d="M28 106L124 86L142 112L64 142Z" style={grad(`${id}F`)} />
      <path d="M232 88L320 102L296 142L246 122Z" style={fill("paper-lo", 0.9)} />
      {/* interior */}
      <path d="M58 150L128 112L238 100L288 140L284 172L172 205L66 168Z" style={grad(`${id}I`)} />
      {/* contenido */}
      <Cube x={142} y={62} w={46} h={26} tone="neutral" id={id} />
      <g>
        <ellipse cx={204} cy={134} rx={20} ry={7} style={fill("neutral-lo")} />
        <path d="M184 76V134A20 7 0 0 0 224 134V76Z" style={grad(`${id}C`)} />
        <ellipse cx={204} cy={76} rx={20} ry={7} style={fill("neutral-hi")} />
      </g>
      <Cube x={120} y={100} w={46} h={26} tone="ink" id={id} />
      <Cube x={168} y={102} w={42} h={26} tone="1" id={id} />
      <circle cx={198} cy={130} r={9} style={grad(`${id}B`)} />
      {/* caras */}
      <path d="M66 168L172 205L172 285L66 226Z" style={grad(`${id}L`)} />
      <path d="M172 205L284 172L280 216L172 285Z" style={grad(`${id}R`)} />
      {/* solapas delanteras */}
      <path d="M66 168L172 205L150 214L42 166L52 158Z" style={fill("paper")} />
      <path d="M172 205L284 172L316 156L300 182L180 222Z" style={fill("paper")} />
      <path d="M42 166L150 214L172 205" style={{ fill: "none", stroke: "var(--ill-paper-lo)", strokeWidth: 1.5, opacity: 0.6 }} />
    </Svg>
  )
}
