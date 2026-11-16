import { Lin, Svg, fill, grad, useUid, v, type IllustrationProps } from "./kit"

/** Calculadora: cuerpo navy con 4 teclas claras (×, ÷, +, −). */
export default function Calculator(props: IllustrationProps) {
  const id = useUid()
  const keys: [number, number, "x" | "d" | "p" | "m"][] = [
    [54, 52, "x"],
    [152, 52, "d"],
    [54, 150, "p"],
    [152, 150, "m"],
  ]
  const sym = { fill: "none", strokeWidth: 11, strokeLinecap: "round" as const, stroke: v("ink") }
  return (
    <Svg size={287} {...props}>
      <defs>
        <Lin id={`${id}b`} x2={0.35} y2={1} stops={[[0, "ink-hi"], [0.35, "ink"], [1, "ink-lo"]]} />
        <Lin id={`${id}k`} stops={[[0, "paper-hi"], [0.6, "paper"], [1, "paper-lo"]]} />
        <Lin id={`${id}r`} stops={[[0, "ink-hi", 0.55], [0.25, "ink-hi", 0]]} />
      </defs>
      <ellipse cx={143} cy={270} rx={100} ry={8} style={fill("shadow", 0.5)} />
      <rect x={22} y={24} width={244} height={240} rx={46} style={grad(`${id}b`)} />
      <rect x={22} y={24} width={244} height={240} rx={46} style={grad(`${id}r`)} />
      {keys.map(([x, y, k]) => (
        <g key={k}>
          <rect x={x} y={y + 5} width={88} height={88} rx={28} style={fill("ink-lo", 0.55)} />
          <rect x={x} y={y} width={88} height={88} rx={28} style={grad(`${id}k`)} />
          <g transform={`translate(${x + 44} ${y + 44})`}>
            {k === "x" && <path d="M-14 -14L14 14M14 -14L-14 14" style={sym} />}
            {k === "d" && (
              <>
                <path d="M-15 0H15" style={sym} />
                <circle cx={0} cy={-16} r={5} style={fill("ink")} />
                <circle cx={0} cy={16} r={5} style={fill("ink")} />
              </>
            )}
            {k === "p" && <path d="M-15 0H15M0 -15V15" style={sym} />}
            {k === "m" && <path d="M-15 0H15" style={sym} />}
          </g>
        </g>
      ))}
    </Svg>
  )
}
