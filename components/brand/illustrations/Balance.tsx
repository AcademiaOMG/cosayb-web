import { Lin, Rad, Svg, fill, grad, useUid, type IllustrationProps } from "./kit"

/** Punto de equilibrio: disco navy sobre una barra clara apoyada en un sector gris. */
export default function Balance(props: IllustrationProps) {
  const id = useUid()
  const sector = "M240 260L108 384A178 178 0 0 0 366 384Z"
  return (
    <Svg size={472} {...props}>
      <defs>
        <Rad id={`${id}d`} cx={0.35} cy={0.3} r={0.85} stops={[[0, "1-hi"], [0.5, "1"], [1, "1-lo"]]} />
        <Lin id={`${id}s`} x2={0.4} y2={1} stops={[[0, "1"], [1, "1-lo"]]} />
        <Lin id={`${id}f`} stops={[[0, "2-hi"], [1, "2"]]} />
      </defs>
      {/* sector (con grosor hacia la izquierda/abajo) */}
      <path d={sector} transform="translate(-9 9)" style={fill("ink", 0.85)} />
      <path d={sector} style={grad(`${id}s`)} />
      {/* barra */}
      <path d="M88 218L383 218L383 262L88 262Z" style={grad(`${id}f`)} />
      <path d="M88 218L383 218L377 226L94 226Z" style={fill("paper-hi", 0.9)} />
      <path d="M88 218L100 224L100 262L88 262Z" style={fill("2-lo")} />
      {/* disco: cara trasera con grosor y cara frontal */}
      <ellipse cx={242} cy={222} rx={74} ry={5} style={fill("shadow", 0.6)} />
      <circle cx={232} cy={128} r={92} style={fill("1-lo")} />
      <circle cx={250} cy={125} r={86} style={grad(`${id}d`)} />
    </Svg>
  )
}
