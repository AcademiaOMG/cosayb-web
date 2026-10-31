import Link from "next/link"
import Cover from "@/components/lms/art/Cover"
import { pct } from "@/lib/lms/format"
import type { MyCourse } from "@/lib/lms/types"

/** Curso del LMS dentro de la app del negocio: portada, avance y acceso directo al reproductor. */
export default function AcademiaCourseRow({ c }: { c: MyCourse }) {
  const done = pct(c.completedCount, c.lessonCount)
  return (
    <Link
      href={`/aprender/${c.slug}`}
      className="flex items-center gap-3 rounded-[var(--radius-lg)] p-3 transition-shadow hover:shadow-[var(--shadow-md)]"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
    >
      <span className="block h-14 w-20 shrink-0 overflow-hidden rounded-[var(--radius-md)]"><Cover coverKey={c.coverKey} className="h-full w-full" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{c.title}</span>
        <span className="mt-1.5 flex items-center gap-2">
          <span role="progressbar" aria-label={`Avance de ${c.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={done} className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--bg-secondary)" }}>
            <span className="block h-full rounded-full" style={{ width: `${done}%`, background: "var(--accent)" }} />
          </span>
          <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>{done} %</span>
        </span>
      </span>
    </Link>
  )
}
