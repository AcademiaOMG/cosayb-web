import type { ReactNode } from "react"

// Portadas ilustradas ORIGINALES (SVG inline, estilo isométrico plano, temática gastronómica).
// Una escena por `coverKey`. Decorativas: aria-hidden; el título del curso va en texto aparte.

type P = { top: string; left: string; right: string }
const pal = (base: string, light: string, dark: string): P => ({ top: light, left: base, right: dark })
const C = {
  brand: pal("var(--accent)", "color-mix(in srgb, var(--accent) 55%, white)", "var(--accent-hover)"),
  amber: pal("#f5a524", "#ffc766", "#d4860a"),
  rose: pal("#f0527e", "#ff8aa8", "#c93560"),
  mint: pal("#2cc185", "#6fe0b0", "#1c9a69"),
  sky: pal("#4a95f7", "#8ec0ff", "#2f74d4"),
  cream: pal("#f6e7cf", "#fff6e6", "#e3cda8"),
  ink: pal("#1f3253", "#3a5280", "#12213A"),
  white: pal("#eff3fa", "#ffffff", "#dbe3f0"),
}

/** Cuboide isométrico: (cx, cy) = vértice inferior central, w = medio ancho, h = alto. */
function Box({ cx, cy, w, h, p, children }: { cx: number; cy: number; w: number; h: number; p: P; children?: ReactNode }) {
  const pt = (pts: number[][]) => pts.map((q) => q.join(",")).join(" ")
  return (
    <g>
      <polygon points={pt([[cx - w, cy - h], [cx, cy - h + w / 2], [cx, cy + w / 2], [cx - w, cy]])} style={{ fill: p.left }} />
      <polygon points={pt([[cx, cy - h + w / 2], [cx + w, cy - h], [cx + w, cy], [cx, cy + w / 2]])} style={{ fill: p.right }} />
      <polygon points={pt([[cx, cy - h - w / 2], [cx + w, cy - h], [cx, cy - h + w / 2], [cx - w, cy - h]])} style={{ fill: p.top }} />
      {children}
    </g>
  )
}

function Cyl({ cx, cy, r, h, p }: { cx: number; cy: number; r: number; h: number; p: P }) {
  return (
    <g>
      <path d={`M${cx - r} ${cy - h} v${h} a${r} ${r / 2} 0 0 0 ${2 * r} 0 v${-h}`} style={{ fill: p.left }} />
      <path d={`M${cx} ${cy - h + r / 2} a${r} ${r / 2} 0 0 0 ${r} ${-r / 2} v${h} a${r} ${r / 2} 0 0 1 ${-r} ${r / 2}z`} style={{ fill: p.right }} opacity=".55" />
      <ellipse cx={cx} cy={cy - h} rx={r} ry={r / 2} style={{ fill: p.top }} />
    </g>
  )
}

const Spark = ({ x, y, s = 1, c = "#fff" }: { x: number; y: number; s?: number; c?: string }) => (
  <path className="l-float" transform={`translate(${x} ${y}) scale(${s})`} d="M0-9 2.4-2.4 9 0 2.4 2.4 0 9-2.4 2.4-9 0-2.4-2.4z" style={{ fill: c }} opacity=".9" />
)

const THEMES: Record<string, { bg: [string, string]; floor: string }> = {
  costeo: { bg: ["#ffe6b8", "#ffc98a"], floor: "#fff3dc" },
  merma: { bg: ["#c9f2dd", "#8fdcb9"], floor: "#e9fbf2" },
  equilibrio: { bg: ["#cfe3ff", "#9dc4ff"], floor: "#eaf3ff" },
  menu: { bg: ["#ffd3de", "#ffa9bf"], floor: "#ffedf2" },
  inventario: { bg: ["#dbe8ff", "#a9c8ff"], floor: "#eaf2ff" },
  compras: { bg: ["#ffe1c2", "#ffbf8a"], floor: "#fff1e2" },
  panaderia: { bg: ["#ffeab0", "#ffd16e"], floor: "#fff7da" },
  precios: { bg: ["#d7f0ff", "#9fd8ff"], floor: "#ecf8ff" },
  finanzas: { bg: ["#d3f5e4", "#9be6c4"], floor: "#eefbf5" },
  autor: { bg: ["#d6e6ff", "#a4c3f7"], floor: "#eef4ff" },
  servicio: { bg: ["#ffd9e6", "#ffb3cd"], floor: "#fff0f5" },
  higiene: { bg: ["#c8f0f2", "#8adde2"], floor: "#e8fafb" },
  bar: { bg: ["#cfe0ff", "#9dbcf5"], floor: "#eaf1ff" },
  delivery: { bg: ["#ffe0c8", "#ffb48a"], floor: "#fff0e4" },
  cocina: { bg: ["#dde9ff", "#a8c1f0"], floor: "#edf3ff" },
}

function Scene({ k }: { k: string }) {
  switch (k) {
    case "costeo":
      return (
        <g>
          <Box cx={170} cy={150} w={62} h={26} p={C.ink}>
            {[0, 1, 2].map((i) => [0, 1, 2].map((j) => <rect key={`${i}${j}`} x={150 + i * 11 - j * 6} y={106 + j * 6 + i * 3} width="8" height="4" rx="1" fill="#fff" opacity=".85" />))}
          </Box>
          <polygon points="170,92 232,123 170,150 108,123" fill="#c9f2dd" opacity=".95" />
          <text x="170" y="127" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1c6b48">$12.5</text>
          <Cyl cx={290} cy={160} r={34} h={30} p={C.rose} />
          <ellipse cx={290} cy={130} rx={26} ry={13} fill="#ffe3a8" />
          <Box cx={110} cy={185} w={34} h={8} p={C.white} />
        </g>
      )
    case "merma":
      return (
        <g>
          <Box cx={190} cy={170} w={78} h={22} p={C.mint} />
          <ellipse cx={190} cy={134} rx={44} ry={20} fill="#fff" />
          <path d="M150 134a40 22 0 0 1 80 0" fill="none" stroke="#12213A" strokeWidth="3" />
          <line x1="190" y1="134" x2="208" y2="118" stroke="#f0527e" strokeWidth="4" strokeLinecap="round" />
          <circle cx="300" cy="150" r="22" fill="#f0527e" /><path d="M300 128c-2-10 6-14 12-14" stroke="#16885a" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="90" cy="162" r="18" fill="#ffb02e" /><circle cx="118" cy="176" r="14" fill="#f58a00" />
        </g>
      )
    case "equilibrio":
      return (
        <g>
          {[0, 1, 2, 3].map((i) => <Box key={i} cx={100 + i * 62} cy={178 - i * 8} w={26} h={28 + i * 22} p={i === 2 ? C.amber : i > 2 ? C.mint : C.sky} />)}
          <polyline points="70,150 150,130 220,112 330,64" fill="none" stroke="#12213A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 9" />
          <circle cx="330" cy="64" r="9" fill="#f0527e" />
        </g>
      )
    case "menu":
      return (
        <g>
          <Box cx={200} cy={176} w={74} h={14} p={C.white} />
          <g transform="rotate(-6 200 120)"><rect x="140" y="52" width="120" height="104" rx="10" fill="#fff" /><rect x="152" y="66" width="60" height="9" rx="4" style={{ fill: "var(--accent)" }} />
            {[0, 1, 2].map((i) => <g key={i}><rect x="152" y={88 + i * 18} width="70" height="6" rx="3" fill="#dbe3f0" /><rect x="232" y={88 + i * 18} width="16" height="6" rx="3" fill="#f0527e" /></g>)}</g>
          <Spark x={280} y={70} s={1.4} c="#ffc766" /><Spark x={110} y={100} s={0.9} />
          <path d="M300 130l8 16 18 3-13 12 3 18-16-9-16 9 3-18-13-12 18-3z" fill="#ffc766" />
        </g>
      )
    case "inventario":
      return (
        <g>
          <Box cx={140} cy={178} w={44} h={44} p={C.amber} /><Box cx={228} cy={178} w={44} h={44} p={C.sky} />
          <Box cx={184} cy={134} w={44} h={44} p={C.rose} />
          <Box cx={300} cy={176} w={30} h={30} p={C.mint} />
          <rect x="160" y="120" width="48" height="16" rx="3" fill="#fff" opacity=".9" /><text x="184" y="132" textAnchor="middle" fontSize="11" fontWeight="800" fill="#c93560">PEPS</text>
        </g>
      )
    case "compras":
      return (
        <g>
          <Box cx={190} cy={170} w={70} h={46} p={C.amber} />
          <Box cx={290} cy={178} w={34} h={32} p={C.sky} />
          <circle cx="150" cy="190" r="13" fill="#12213A" /><circle cx="150" cy="190" r="5" fill="#fff" />
          <circle cx="262" cy="196" r="13" fill="#12213A" /><circle cx="262" cy="196" r="5" fill="#fff" />
          <path d="M70 120h46M80 136h30" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".8" />
          <g transform="translate(300 70)"><circle r="24" fill="#fff" /><path d="M-9 -3h18l-2 12h-14z M-5 -3v-4a5 5 0 0 1 10 0v4" style={{ stroke: "var(--accent)" }} strokeWidth="3.5" fill="none" strokeLinejoin="round" /></g>
        </g>
      )
    case "panaderia":
      return (
        <g>
          <Box cx={200} cy={176} w={86} h={20} p={C.cream} />
          <ellipse cx="150" cy="140" rx="48" ry="26" fill="#d98a3a" /><ellipse cx="150" cy="132" rx="46" ry="23" fill="#f0b25c" />
          {[-22, 0, 22].map((d) => <path key={d} d={`M${150 + d - 6} 118q6 8 0 20`} stroke="#d98a3a" strokeWidth="4" fill="none" strokeLinecap="round" />)}
          <ellipse cx="262" cy="150" rx="34" ry="22" fill="#d98a3a" /><ellipse cx="262" cy="144" rx="32" ry="19" fill="#f6c277" />
          <path d="M70 60c10-10 10-20 0-30M90 66c10-10 10-20 0-30" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".85" />
        </g>
      )
    case "precios":
      return (
        <g>
          <Box cx={150} cy={178} w={50} h={14} p={C.white} />
          <g transform="rotate(-14 200 120)"><path d="M150 70h90l22 36-22 36h-90z" fill="#fff" /><circle cx="168" cy="106" r="7" fill="#9fd8ff" /><text x="215" y="115" textAnchor="middle" fontSize="28" fontWeight="800" fill="#2f74d4">$89</text></g>
          <Cyl cx={290} cy={178} r={26} h={8} p={C.amber} /><Cyl cx={290} cy={168} r={26} h={8} p={C.amber} /><Cyl cx={290} cy={158} r={26} h={8} p={C.amber} />
          <text x="290" y="154" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">%</text>
        </g>
      )
    case "finanzas":
      return (
        <g>
          {[0, 1, 2, 3].map((i) => <Cyl key={i} cx={120} cy={186 - i * 11} r={34} h={10} p={C.amber} />)}
          {[0, 1].map((i) => <Cyl key={i} cx={210} cy={186 - i * 11} r={34} h={10} p={C.amber} />)}
          <Box cx={300} cy={176} w={30} h={70} p={C.mint} /><Box cx={350} cy={182} w={22} h={40} p={C.sky} />
          <path d="M70 70l50 20 40-26 50 20" fill="none" stroke="#12213A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case "autor":
      return (
        <g>
          <ellipse cx="200" cy="150" rx="100" ry="46" fill="#fff" /><ellipse cx="200" cy="146" rx="70" ry="30" style={{ fill: "var(--accent-light)" }} />
          <circle cx="200" cy="138" r="18" fill="#f0527e" /><path d="M170 150q30-24 60 0" stroke="#22b573" strokeWidth="6" fill="none" strokeLinecap="round" />
          <circle cx="238" cy="148" r="6" fill="#ffc766" /><circle cx="160" cy="150" r="5" style={{ fill: "var(--accent)" }} />
          <Spark x={110} y={70} s={1.5} c="var(--accent)" /><Spark x={300} y={80} s={1.2} c="#f0527e" /><Spark x={250} y={44} s={0.9} />
        </g>
      )
    case "servicio":
      return (
        <g>
          <ellipse cx="200" cy="168" rx="104" ry="30" fill="#fff" opacity=".9" />
          <path d="M120 156a80 80 0 0 1 160 0z" fill="#ffc766" /><path d="M120 156a80 80 0 0 1 20-52" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" opacity=".7" />
          <circle cx="200" cy="82" r="9" fill="#d4860a" /><rect x="104" y="156" width="192" height="12" rx="6" fill="#d4860a" />
          <Spark x={304} y={70} s={1.3} c="#f0527e" /><Spark x={90} y={90} s={1} />
          <path d="M310 130c10-14 28-6 20 8-6 10-20 18-20 18s-14-8-18-18c-6-14 12-22 18-8z" transform="translate(-30 -6) scale(.9)" fill="#f0527e" />
        </g>
      )
    case "higiene":
      return (
        <g>
          <path d="M200 40l78 24v52c0 36-30 58-78 76-48-18-78-40-78-76V64z" fill="#fff" /><path d="M200 54l64 20v42c0 28-24 46-64 62-40-16-64-34-64-62V74z" fill="#2cc185" />
          <path d="M170 118l20 20 38-42" stroke="#fff" strokeWidth="11" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {[[96, 150, 10], [112, 176, 6], [306, 160, 11], [292, 184, 6]].map(([x, y, r]) => <circle key={`${x}${y}`} cx={x} cy={y} r={r} fill="#fff" opacity=".85" />)}
        </g>
      )
    case "bar":
      return (
        <g>
          <path d="M130 70h140l-70 80z" fill="#fff" opacity=".95" /><path d="M146 78h108l-54 62z" fill="#f0527e" opacity=".9" />
          <rect x="196" y="150" width="8" height="34" fill="#fff" /><ellipse cx="200" cy="188" rx="40" ry="10" fill="#fff" />
          <line x1="236" y1="52" x2="214" y2="98" stroke="#12213A" strokeWidth="4" strokeLinecap="round" /><circle cx="214" cy="98" r="9" fill="#22b573" />
          <Spark x={110} y={80} s={1.2} c="#fff" /><Spark x={300} y={120} s={1.5} c="#fff" />
        </g>
      )
    case "delivery":
      return (
        <g>
          <path d="M60 176h280" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 14" opacity=".8" />
          <Box cx={170} cy={170} w={50} h={46} p={C.rose} />
          <rect x="150" y="126" width="40" height="12" rx="3" fill="#fff" opacity=".9" />
          <circle cx="262" cy="176" r="18" fill="#12213A" /><circle cx="262" cy="176" r="7" fill="#fff" />
          <path d="M214 176h48l16-44h-24" stroke="#12213A" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <g transform="translate(320 70)"><path d="M0 34C-18 14-20 0 0-12S20 0 0 34z" fill="#fff" /><circle cy="2" r="7" fill="#f0527e" /></g>
        </g>
      )
    default:
      return (
        <g>
          <Box cx={200} cy={180} w={90} h={14} p={C.cream} />
          <Cyl cx={150} cy={160} r={42} h={46} p={C.brand} />
          <ellipse cx="150" cy="114" rx="34" ry="14" fill="#ffe3a8" />
          <rect x="190" y="104" width="62" height="8" rx="4" style={{ fill: "var(--accent-hover)" }} />
          <path d="M120 70c8-10 8-18 0-28M150 66c8-10 8-18 0-28" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".85" />
          <circle cx="290" cy="150" r="22" fill="#f0527e" /><circle cx="318" cy="168" r="14" fill="#22b573" />
        </g>
      )
  }
}

export const COVER_KEYS = Object.keys(THEMES)

/** Portada decorativa 400x220. `className` controla tamaño (usa w-full y aspect/altura del contenedor). */
export default function Cover({ coverKey, className = "" }: { coverKey: string; className?: string }) {
  const key = THEMES[coverKey] ? coverKey : "cocina"
  const t = THEMES[key]
  const id = `cv-${key}`
  return (
    <svg viewBox="0 0 400 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" className={className}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={t.bg[0]} />
          <stop offset="1" stopColor={t.bg[1]} />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill={`url(#${id})`} />
      <circle cx="350" cy="30" r="70" fill="#fff" opacity=".18" />
      <circle cx="40" cy="200" r="60" fill="#fff" opacity=".14" />
      <polygon points="200,92 350,160 200,228 50,160" fill={t.floor} opacity=".85" />
      <Scene k={key} />
    </svg>
  )
}
