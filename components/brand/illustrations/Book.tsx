import type { ReactNode } from "react"
import { Lin, Svg, fill, grad, useUid, v, type IllustrationProps } from "./kit"

interface BookProps extends IllustrationProps {
  /** Emblema grabado en la tapa (coordenadas de la tapa, centrado en 0,0). */
  children: ReactNode
}

/** Libro isométrico (tapa clara con bandas, lomo oscuro, páginas y marcador) — base de Receta y Menú. */
export default function Book({ children, ...props }: BookProps) {
  const id = useUid()
  return (
    <Svg size={436} {...props}>
      <defs>
        <Lin id={`${id}t`} x2={1} y2={1} stops={[[0, "paper-hi"], [0.6, "paper"], [1, "paper-lo"]]} />
        <Lin id={`${id}s`} x2={0.25} y2={1} stops={[[0, "ink-hi"], [0.3, "ink"], [1, "ink-lo"]]} />
        <Lin id={`${id}p`} x2={1} y2={0} stops={[[0, "paper-lo"], [0.5, "paper"], [1, "paper-lo"]]} />
        <Lin id={`${id}b`} x2={1} y2={1} stops={[[0, "1-hi"], [1, "1"]]} />
      </defs>
      <ellipse cx={235} cy={345} rx={165} ry={26} style={fill("shadow", 0.35)} />
      {/* páginas */}
      <path d="M246 292L396 200Q404 196 404 206L402 238Q402 246 396 250L262 344Q252 350 246 344Z" style={grad(`${id}p`)} />
      {[310, 322, 334].map((y, i) => (
        <path key={y} d={`M${252 + i * 2} ${y}L${398} ${y - 90 + i * 2}`} style={{ stroke: v("paper-lo"), strokeWidth: 1.6, opacity: 0.6, fill: "none" }} />
      ))}
      {/* lomo */}
      <path d="M30 196Q28 176 48 176L246 288L246 342Q246 350 238 346L52 262Q30 252 30 230Z" style={grad(`${id}s`)} />
      <path d="M34 190Q40 178 54 180L80 195L48 192Z" style={fill("ink-hi", 0.5)} />
      {/* tapa */}
      <path d="M48 178Q50 164 66 156L204 88Q216 83 228 90L396 178Q408 186 402 198L262 284Q250 292 238 286L60 204Q46 196 48 178Z" style={grad(`${id}t`)} />
      <path d="M62 160L204 90Q216 84 228 91L392 178" style={{ stroke: v("paper-hi"), strokeWidth: 3, opacity: 0.9, fill: "none" }} />
      {/* bandas de color */}
      <path d="M100 152L204 98Q214 94 226 100L232 104L124 166Q108 170 100 160Z" style={grad(`${id}b`)} />
      <path d="M283 240L384 188Q398 184 398 196Q398 202 390 206L296 262Q284 266 280 254Z" style={grad(`${id}b`)} />
      {/* panel hundido */}
      <path
        d="M138 168L232 122Q240 118 248 122L322 160Q330 164 322 170L246 218Q238 222 230 218L146 178Q132 172 138 168Z"
        style={{ fill: v("paper-hi"), stroke: v("paper-lo"), strokeWidth: 3 }}
      />
      <path
        d="M150 170L234 130Q240 127 246 130L310 162Q316 165 310 169L246 208Q240 211 234 208L156 178Q146 174 150 170Z"
        style={{ fill: v("paper"), stroke: v("paper-hi"), strokeWidth: 2 }}
      />
      <g transform="translate(232 170)">{children}</g>
      {/* marcador */}
      <path d="M262 296L284 304L322 336L300 336L296 352L270 322Z" style={grad(`${id}b`)} />
    </Svg>
  )
}
