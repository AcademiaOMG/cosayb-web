import Book from "./Book"
import { fill, v, type IllustrationProps } from "./kit"

/** Menú: libro con tenedor y cuchillo en la tapa. */
export default function Menu(props: IllustrationProps) {
  const tine = { fill: "none", stroke: v("1"), strokeWidth: 6, strokeLinecap: "round" as const }
  return (
    <Book {...props}>
      <g transform="skewY(14) rotate(18) scale(1 .9)">
        {/* cuchillo */}
        <g transform="translate(-24 0)">
          <path d="M-9 -30C6 -34 12 -14 10 6L-9 6Z" style={fill("1")} />
          <rect x={-9} y={4} width={19} height={34} rx={8} style={fill("1")} />
        </g>
        {/* tenedor */}
        <g transform="translate(24 0)">
          <path d="M-12 -30V-8M0 -30V-6M12 -30V-8" style={tine} />
          <path d="M-14 -10H14Q14 6 5 8V8L5 38Q5 46 0 46Q-5 46 -5 38L-5 8Q-14 6 -14 -10Z" style={fill("1")} />
        </g>
      </g>
    </Book>
  )
}
