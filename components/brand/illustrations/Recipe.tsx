import Book from "./Book"
import { fill, type IllustrationProps } from "./kit"

/** Recetas: libro con gorro de chef en la tapa. */
export default function Recipe(props: IllustrationProps) {
  return (
    <Book {...props}>
      <g transform="skewY(14) scale(1 0.95)">
        <circle cx={-26} cy={-6} r={21} style={fill("1")} />
        <circle cx={0} cy={-17} r={24} style={fill("1")} />
        <circle cx={26} cy={-6} r={21} style={fill("1")} />
        <rect x={-34} y={-8} width={68} height={22} rx={8} style={fill("1")} />
        <rect x={-26} y={12} width={52} height={20} rx={5} style={fill("1-lo")} />
      </g>
    </Book>
  )
}
