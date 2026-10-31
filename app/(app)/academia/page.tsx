"use client"

import Link from "next/link"
import { ArrowRight, GraduationCap, Sparkles } from "lucide-react"
import AcademiaCourseRow from "@/components/app/AcademiaCourseRow"
import PageHeader from "@/components/ui/PageHeader"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import Cover from "@/components/lms/art/Cover"
import { useAcademia } from "@/hooks/useAcademia"
import { useCatalog } from "@/lib/lms/hooks"
import { LEVEL_LABEL, durationLabel } from "@/lib/lms/format"

const linkBtn = "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-4 py-2 text-sm font-semibold"

export default function AcademiaPage() {
  const { loading, hasPlan, disabled, courses, coursesLoading, error, retry } = useAcademia()
  const { data: catalog } = useCatalog()

  if (loading) return <LoadingBlock label="Cargando Academia…" />

  if (disabled) {
    return <EmptyState title="Tu acceso a la academia está desactivado" description="Un administrador lo desactivó. Tu negocio sigue funcionando con normalidad. Si crees que es un error, contacta al administrador." />
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Cursos / Academia"
        subtitle={hasPlan ? "Los cursos incluidos en tu plan Academia, con tu avance. No necesitas matricularte." : "Cursos de Academia OMG para tu equipo y tu negocio."}
        action={<Link href="/inicio" className={linkBtn} style={{ background: "var(--accent)", color: "#fff" }}>Ir a mi aprendizaje <ArrowRight size={15} aria-hidden="true" /></Link>}
      />

      {!hasPlan && (
        <section aria-label="Plan Academia" className="flex flex-wrap items-center gap-4 rounded-[var(--radius-lg)] p-5" style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>
          <Sparkles size={22} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-bold">Con el plan Academia, estos cursos quedan incluidos</p>
            <p className="text-sm">Entra de una a los cursos del plan y lleva tu avance sin matricularte a mano. Tu negocio sigue como está mientras decides.</p>
          </div>
          <Link href="/planes" className={linkBtn} style={{ background: "var(--accent)", color: "#fff" }}>Ver planes</Link>
        </section>
      )}

      {courses && courses.length > 0 && (
        <section aria-labelledby="aca-mis" className="flex flex-col gap-3">
          <h2 id="aca-mis" className="dash-section-title">{hasPlan ? "Tus cursos" : "Tus cursos matriculados"}</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{courses.map((c) => <AcademiaCourseRow key={c.id} c={c} />)}</div>
        </section>
      )}
      {coursesLoading && <LoadingBlock label="Cargando tus cursos…" />}
      {error && !courses && <ErrorState title="No pudimos cargar tus cursos" onRetry={retry} />}

      {(!hasPlan || (courses && courses.length === 0)) && (
        <section aria-labelledby="aca-cat" className="flex flex-col gap-3">
          <h2 id="aca-cat" className="dash-section-title flex items-center gap-2"><GraduationCap size={18} aria-hidden="true" /> Catálogo</h2>
          {!catalog ? (
            <LoadingBlock label="Cargando catálogo…" />
          ) : catalog.length === 0 ? (
            <EmptyState title="Aún no hay cursos publicados" description="Cuando se publiquen, aparecerán aquí." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {catalog.slice(0, 6).map((c) => (
                <Link key={c.id} href={`/cursos/${c.slug}`} className="overflow-hidden rounded-[var(--radius-lg)] transition-shadow hover:shadow-[var(--shadow-md)]" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}>
                  <span className="block aspect-[400/220] w-full"><Cover coverKey={c.coverKey} className="h-full w-full" /></span>
                  <span className="flex flex-col gap-1 p-4">
                    <span className="font-display text-base font-bold" style={{ color: "var(--text-primary)" }}>{c.title}</span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{LEVEL_LABEL[c.level]} · {c.lessonCount} lecciones · {durationLabel(c.durationMinutes)}{c.includedInAcademia ? " · Incluido en el plan Academia" : ""}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
          <Link href="/cursos" className="self-start text-sm font-semibold" style={{ color: "var(--accent)" }}>Ver todo el catálogo →</Link>
        </section>
      )}
    </div>
  )
}
