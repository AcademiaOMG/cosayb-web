import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { changeText, changeTone, compare, type Kpi } from "@/lib/plataforma/negocio"

const TONE_COLOR = { good: "#047857", bad: "#B45309", neutral: "var(--text-muted)" } as const

/** Cifra del negocio con su explicación y la comparación con el periodo anterior. */
export default function KpiCard({
  label, value, help, kpi, higherIsBetter = true, format = String, hint,
}: {
  label: string
  value: string
  help: string
  kpi?: Kpi
  higherIsBetter?: boolean
  format?: (n: number) => string
  hint?: string
}) {
  const change = kpi ? compare(kpi.value, kpi.previous) : null
  const tone = change ? changeTone(change, higherIsBetter) : "neutral"
  const Icon = change?.kind === "pct" ? (change.direction === "up" ? ArrowUpRight : change.direction === "down" ? ArrowDownRight : Minus) : Minus
  return (
    <div className="console-card flex flex-col gap-1.5">
      <p className="text-sm font-semibold console-muted">{label}</p>
      <p className="text-2xl font-bold console-title">{value}</p>
      {hint && <p className="text-xs console-muted">{hint}</p>}
      {change && kpi && (
        <p className="flex items-start gap-1 text-xs font-medium" style={{ color: TONE_COLOR[tone] }}>
          <Icon size={14} aria-hidden="true" className="shrink-0 mt-px" />
          <span>
            {changeText(change)}
            {change.kind !== "none" && <span className="console-muted font-normal"> (antes: {format(kpi.previous)})</span>}
          </span>
        </p>
      )}
      <p className="text-xs console-muted leading-snug">{help}</p>
    </div>
  )
}
