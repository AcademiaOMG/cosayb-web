"use client"

import Link from "next/link"
import { Award, BookOpen, CheckCircle2, GraduationCap, Users } from "lucide-react"
import { Card, EmptyState, ErrorPanel, Skeleton } from "@/components/lms/ui"
import { StatusBadge } from "@/components/lms/parts"
import { usePaths } from "@/components/lms/shell/area"
import { errorStatus, useOverview } from "@/lib/lms/hooks"
import { LEVEL_LABEL } from "@/lib/lms/format"
import { deltaPercent, monthLabel } from "@/lib/lms/studio"
import { BarChart, HBars, LineChart } from "./charts"
import { Kpi } from "./Dashboard"

/** Analítica de MIS cursos: tendencia, avance y aprobación por curso. El detalle (embudo, preguntas falladas) está en cada curso. */
export default function InstructorAnalytics() {
  const paths = usePaths()
  const { data, error, mutate } = useOverview()
  if (errorStatus(error) === 403) return <ErrorPanel title="Sin permisos" />
  if (error) return <ErrorPanel title="No pudimos cargar la analítica" onRetry={() => mutate()} />

  const k = data?.kpis
  const labels = data?.series.map((s) => monthLabel(s.month)) ?? []
  const byProgress = [...(data?.courses ?? [])].filter((c) => c.enrolled > 0).sort((a, b) => b.avgProgress - a.avgProgress)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Analítica</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Qué está funcionando en tus cursos. Para ver dónde abandonan y qué preguntas fallan, abre un curso y entra a «Analítica».</p>
      </header>

      {!data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[112px] !rounded-[22px]" />)}</div>
      ) : (
        <section aria-label="Indicadores" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi index={0} tone="brand" icon={<Users size={22} />} label="Estudiantes" value={k!.students} delta={deltaPercent(k!.enrollmentsThisMonth, k!.enrollmentsPrevMonth)} sub={`${k!.enrollmentsThisMonth} matrículas este mes`} />
          <Kpi index={1} tone="sky" icon={<BookOpen size={22} />} label="Cursos publicados" value={k!.courses.published} sub={`${k!.courses.total} en total`} />
          <Kpi index={2} tone="amber" icon={<GraduationCap size={22} />} label="Avance promedio" value={k!.avgProgress} suffix="%" sub="de las matrículas activas" />
          <Kpi index={3} tone="mint" icon={<CheckCircle2 size={22} />} label="Tasa de aprobación" value={k!.passRate} suffix="%" sub={<><Award size={13} aria-hidden="true" className="inline" /> {k!.certificates} certificados</>} />
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5" aria-label="Tendencias">
        <Card className="p-5 lg:col-span-3">
          <h2 className="text-base font-extrabold">Actividad de los últimos 6 meses</h2>
          <p className="mb-3 text-xs font-semibold" style={{ color: "var(--l-muted)" }}>Matrículas nuevas y lecciones completadas</p>
          {!data ? <Skeleton className="h-[200px]" /> : (
            <LineChart
              labels={labels}
              series={[
                { name: "Matrículas", color: "var(--l-brand)", values: data.series.map((s) => s.enrollments) },
                { name: "Lecciones completadas", color: "var(--l-mint)", values: data.series.map((s) => s.completions) },
              ]}
              summary={`Matrículas y lecciones por mes: ${data.series.map((s) => `${monthLabel(s.month)} ${s.enrollments} y ${s.completions}`).join("; ")}`}
            />
          )}
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-base font-extrabold">Evaluaciones presentadas</h2>
          <p className="mb-3 text-xs font-semibold" style={{ color: "var(--l-muted)" }}>Intentos enviados por mes</p>
          {!data ? <Skeleton className="h-[200px]" /> : <BarChart labels={labels} values={data.series.map((s) => s.attempts)} summary={`Intentos por mes: ${data.series.map((s) => `${monthLabel(s.month)} ${s.attempts}`).join(", ")}`} />}
        </Card>
      </section>

      <Card className="p-5">
        <h2 className="text-base font-extrabold">Avance medio por curso</h2>
        <p className="mb-3 text-xs font-semibold" style={{ color: "var(--l-muted)" }}>Solo cursos con estudiantes matriculados</p>
        {!data ? <Skeleton className="h-40" /> : byProgress.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--l-muted)" }}>Cuando tus cursos tengan estudiantes verás aquí su avance.</p>
        ) : (
          <HBars summary={`Avance medio por curso: ${byProgress.map((c) => `${c.title} ${c.avgProgress}%`).join(", ")}`} rows={byProgress.map((c) => ({ label: c.title, sub: `${c.enrolled} estudiantes · ${c.finished} terminaron`, percent: c.avgProgress, text: `${c.avgProgress}%` }))} />
        )}
      </Card>

      {data && (data.courses.length === 0 ? <EmptyState title="Aún no hay cursos" description="Crea tu primer curso desde «Mis cursos»." /> : (
        <Card className="overflow-x-auto">
          <h2 className="px-5 pt-5 text-base font-extrabold">Resultados por curso</h2>
          <table className="t-table">
            <caption className="sr-only">Resultados por curso</caption>
            <thead><tr><th scope="col">Curso</th><th scope="col">Estado</th><th scope="col">Estudiantes</th><th scope="col">Terminaron</th><th scope="col">Aprobación</th><th scope="col">Certificados</th><th scope="col"><span className="sr-only">Detalle</span></th></tr></thead>
            <tbody>
              {data.courses.map((c) => (
                <tr key={c.id}>
                  <td><span className="block font-extrabold">{c.title}</span><span className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{LEVEL_LABEL[c.level]} · {c.lessonCount} lecciones</span></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="font-bold">{c.enrolled}</td>
                  <td className="font-bold">{c.finished}</td>
                  <td className="font-bold">{c.passRate === null ? "—" : `${c.passRate}%`}</td>
                  <td className="font-bold">{c.certificates}</td>
                  <td><Link href={`${paths.course(c.id)}?tab=analytics`} className="l-btn l-btn-soft l-btn-sm">Ver detalle</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  )
}
