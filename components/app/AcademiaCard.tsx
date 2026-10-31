"use client"

import Link from "next/link"
import { ArrowRight, GraduationCap } from "lucide-react"
import { useAcademia } from "@/hooks/useAcademia"
import AcademiaCourseRow from "./AcademiaCourseRow"

/**
 * Tarjeta del dashboard: con plan Academia, los cursos incluidos con su avance, listos para continuar.
 * Sin plan (o sin cursos) no se muestra nada: la invitación vive en la entrada «Cursos / Academia» del menú.
 */
export default function AcademiaCard() {
  const { hasPlan, courses, disabled } = useAcademia()
  if (!hasPlan || disabled || !courses || courses.length === 0) return null
  const ratio = (c: { completedCount: number; lessonCount: number }) => c.completedCount / Math.max(1, c.lessonCount)
  const shown = [...courses].sort((a, b) => ratio(b) - ratio(a)).slice(0, 3)
  return (
    <section aria-labelledby="dash-academia" className="glass-grid-wrap glass-grid-wrap-wide flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="dash-academia" className="dash-section-title flex items-center gap-2"><GraduationCap size={18} aria-hidden="true" /> Tus cursos de Academia</h2>
        <Link href="/academia" className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--accent)" }}>Ver todos <ArrowRight size={14} aria-hidden="true" /></Link>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {shown.map((c) => <AcademiaCourseRow key={c.id} c={c} />)}
      </div>
    </section>
  )
}
