import { Lin, Svg, fill, grad, useUid, v, type IllustrationProps } from "./kit"

/** Inventario: cajón de almacén con frasco, lata y saco de ingredientes asomando. */
export default function Inventory(props: IllustrationProps) {
  const id = useUid()
  return (
    <Svg size={120} {...props}>
      <defs>
        <Lin id={`${id}c`} stops={[[0, "1-hi"], [1, "1"]]} />
        <Lin id={`${id}r`} stops={[[0, "1-hi"], [1, "1"]]} />
        <Lin id={`${id}j`} x2={1} y2={0} stops={[[0, "paper"], [0.4, "paper-hi"], [1, "paper-lo"]]} />
        <Lin id={`${id}k`} x2={1} y2={0} stops={[[0, "cream"], [0.4, "paper-hi"], [1, "cream-lo"]]} />
        <Lin id={`${id}s`} x2={1} y2={1} stops={[[0, "2-hi"], [1, "2"]]} />
        <Lin id={`${id}l`} stops={[[0, "2-hi"], [1, "2"]]} />
      </defs>
      <ellipse cx={60} cy={110} rx={46} ry={5} style={fill("shadow")} />
      {/* frasco */}
      <rect x={17} y={30} width={26} height={36} rx={8} style={grad(`${id}j`)} />
      <rect x={17} y={30} width={26} height={36} rx={8} style={{ fill: "none", stroke: v("paper-lo"), strokeWidth: 1.2 }} />
      <rect x={20} y={21} width={20} height={11} rx={4} style={fill("2")} />
      <rect x={20} y={21} width={20} height={4} rx={2} style={fill("2-hi")} />
      <rect x={20} y={40} width={20} height={14} rx={3} style={fill("1")} />
      <rect x={24} y={45} width={12} height={3} rx={1.5} style={fill("paper-hi")} />
      {/* lata */}
      <rect x={47} y={24} width={26} height={44} rx={6} style={grad(`${id}k`)} />
      <ellipse cx={60} cy={25} rx={13} ry={4} style={fill("paper-hi")} />
      <rect x={47} y={38} width={26} height={16} style={fill("2")} />
      <circle cx={60} cy={46} r={4} style={fill("paper-hi")} />
      {/* saco con hojas */}
      <path d="M76 70V48Q76 36 90 36Q104 36 104 48V70Z" style={grad(`${id}s`)} />
      <path d="M85 38Q84 30 90 28Q96 30 95 38Z" style={fill("2-lo")} />
      <path d="M90 30Q86 20 78 20Q80 28 90 31Z" style={fill("1-hi")} />
      <path d="M90 30Q94 18 103 18Q101 27 90 31Z" style={fill("1")} />
      <path d="M81 48Q90 52 99 48" style={{ fill: "none", stroke: v("2-lo"), strokeWidth: 1.6, strokeLinecap: "round", opacity: 0.7 }} />
      {/* cajón */}
      <rect x={12} y={60} width={96} height={46} rx={9} style={grad(`${id}c`)} />
      <rect x={8} y={56} width={104} height={14} rx={7} style={grad(`${id}r`)} />
      <rect x={8} y={64} width={104} height={3} style={fill("1-lo", 0.35)} />
      <rect x={20} y={80} width={80} height={3} rx={1.5} style={fill("1-lo", 0.3)} />
      <rect x={20} y={90} width={80} height={3} rx={1.5} style={fill("1-lo", 0.3)} />
      {/* etiqueta */}
      <rect x={42} y={74} width={36} height={22} rx={5} style={fill("paper-hi")} />
      <rect x={47} y={80} width={26} height={4} rx={2} style={fill("1")} />
      <rect x={47} y={87} width={16} height={3} rx={1.5} style={fill("paper-lo")} />
    </Svg>
  )
}
