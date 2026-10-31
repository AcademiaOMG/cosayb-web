import { progressPercent } from "@/lib/lms/validation"

export default function ProgressBar({ completed, total, label }: { completed: number; total: number; label?: string }) {
  const pct = progressPercent(completed, total)
  return (
    <div className="flex flex-col gap-1">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={label ?? "Progreso del curso"}
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: "var(--bg-secondary)" }}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--accent)" }} />
      </div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {completed} de {total} lecciones · {pct}%
      </p>
    </div>
  )
}
