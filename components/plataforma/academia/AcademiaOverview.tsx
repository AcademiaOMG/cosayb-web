"use client"

import Link from "next/link"
import useSWR from "swr"
import { BookOpen, GraduationCap, UserCheck, UserX } from "lucide-react"
import DailyBarChart from "@/components/saas/DailyBarChart"
import EmptyState from "@/components/ui/EmptyState"
import KpiCard from "@/components/plataforma/negocio/KpiCard"
import StatCard from "@/components/plataforma/StatCard"
import { AsyncBlock, Section, Th } from "@/components/plataforma/analitica/Shared"
import { academiaApi, deltaText, monthDelta, type AcademiaOverview } from "@/lib/plataforma/academia"
import { monthLabel } from "@/lib/lms/studio"
import { fmtNumber } from "@/lib/plataforma/analitica"

const pct = (v: number | null) => (v === null ? "—" : `${v} %`)

/** Dona sencilla (SVG) con leyenda y tabla alternativa para lectores de pantalla. */
function Donut({ parts, caption }: { parts: { label: string; value: number; color: string }[]; caption: string }) {
  const total = parts.reduce((n, p) => n + p.value, 0)
  const r = 15.9
  const circ = 2 * Math.PI * r
  let acc = 0
  return (
    <figure className="flex flex-wrap items-center gap-5" aria-label={caption}>
      <svg viewBox="0 0 36 36" width={132} height={132} role="img" aria-label={caption}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--border-light)" strokeWidth="5" />
        {total > 0 &&
          parts.filter((p) => p.value > 0).map((p) => {
            const len = (p.value / total) * circ
            const el = <circle key={p.label} cx="18" cy="18" r={r} fill="none" stroke={p.color} strokeWidth="5" strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={-acc} transform="rotate(-90 18 18)" />
            acc += len
            return el
          })}
        <text x="18" y="19.5" textAnchor="middle" fontSize="6" fontWeight="700" fill="var(--text-primary)">{total}</text>
      </svg>
      <ul className="flex flex-col gap-1.5 text-sm">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
            <span className="console-muted">{p.label}</span>
            <span className="ml-auto font-semibold console-title">{p.value}</span>
          </li>
        ))}
      </ul>
    </figure>
  )
}

function Contenido({ d }: { d: AcademiaOverview }) {
  const k = d.kpis
  const delta = monthDelta(k.enrollmentsThisMonth, k.enrollmentsPrevMonth)
  const points = (pick: (s: AcademiaOverview["series"][number]) => number) => d.series.map((s) => ({ label: monthLabel(s.month), title: monthLabel(s.month), value: pick(s) }))
  const empty = k.courses.total === 0

  if (empty) {
    return <EmptyState title="Aún no hay cursos en la academia" description="Cuando un instructor cree cursos en el LMS, aquí verás las cifras." />
  }

  return (
    <div className="flex flex-col gap-8">
      <Section id="aca-cifras" title="La academia en cifras" explain="Datos en vivo del LMS, solo lectura. Las matrículas cuentan personas inscritas en cursos; el avance promedio es el porcentaje de lecciones completadas entre quienes están matriculados; la aprobación es la de las evaluaciones enviadas.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Estudiantes con matrícula" value={fmtNumber(d.people.students)} hint={`${fmtNumber(k.enrollments)} matrículas en total`} icon={GraduationCap} />
          <StatCard label="Cursos publicados" value={fmtNumber(k.courses.published)} hint={`${k.courses.draft} en borrador · ${k.courses.archived} archivados`} icon={BookOpen} />
          <StatCard label="Instructores y administradores" value={fmtNumber(d.people.instructors + d.people.admins)} hint={`${d.people.instructors} instructores · ${d.people.admins} administradores`} icon={UserCheck} />
          <StatCard label="Cuentas desactivadas" value={fmtNumber(d.people.disabled)} hint="Sin acceso a la academia" icon={UserX} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Matrículas este mes" value={fmtNumber(k.enrollmentsThisMonth)} help="Personas que se inscribieron a un curso en el mes en curso." hint={deltaText(delta)} />
          <KpiCard label="Avance promedio" value={pct(k.avgProgress)} help="Lecciones completadas sobre las disponibles, entre las personas matriculadas." />
          <KpiCard label="Aprobación de evaluaciones" value={pct(k.passRate)} help="Intentos aprobados sobre los enviados." />
          <KpiCard label="Certificados emitidos" value={fmtNumber(k.certificates)} help="Certificados vigentes (los revocados no cuentan)." hint={`${d.attention.revokedCertificates} revocados`} />
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Section id="aca-matriculas" title="Matrículas por mes" explain="Matrículas nuevas en cada uno de los últimos meses.">
            <div className="console-card">
              <DailyBarChart points={points((s) => s.enrollments)} unit="matrículas" caption="Matrículas por mes en los últimos meses" />
            </div>
          </Section>
        </div>
        <Section id="aca-estado" title="Cursos por estado" explain="Cuántos cursos hay publicados, en borrador y archivados.">
          <div className="console-card">
            <Donut
              caption="Cursos por estado"
              parts={[
                { label: "Publicados", value: k.courses.published, color: "#059669" },
                { label: "Borradores", value: k.courses.draft, color: "#D97706" },
                { label: "Archivados", value: k.courses.archived, color: "#64748B" },
              ]}
            />
          </div>
        </Section>
      </div>

      <Section id="aca-top" title="Cursos con más estudiantes" explain="Los ocho cursos con más matrículas. Cada fila abre el curso en el LMS.">
        <div className="console-card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <caption className="sr-only">Cursos con más estudiantes</caption>
            <thead><tr><Th>Curso</Th><Th>Estado</Th><Th>Matriculados</Th><Th>Avance</Th><Th>Aprobación</Th><Th>Certificados</Th></tr></thead>
            <tbody>
              {d.topCourses.map((c) => (
                <tr key={c.id} className="border-t" style={{ borderColor: "var(--border-light)" }}>
                  <td className="px-3 py-2"><Link className="font-semibold console-title hover:underline" href={`/administracion/cursos/${c.id}`}>{c.title}</Link></td>
                  <td className="px-3 py-2 console-muted">{c.status === "published" ? "Publicado" : c.status === "draft" ? "Borrador" : "Archivado"}</td>
                  <td className="px-3 py-2 font-semibold">{c.enrolled}</td>
                  <td className="px-3 py-2">{c.avgProgress} %</td>
                  <td className="px-3 py-2">{pct(c.passRate)}</td>
                  <td className="px-3 py-2">{c.certificates}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="aca-instructores" title="Actividad por instructor" explain="Cursos, estudiantes y matrículas del mes de cada instructor y administrador. Cada fila abre sus cursos en el LMS.">
        <div className="console-card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <caption className="sr-only">Actividad por instructor</caption>
            <thead><tr><Th>Persona</Th><Th>Rol</Th><Th>Cursos</Th><Th>Estudiantes</Th><Th>Matrículas del mes</Th><Th>Aprobación</Th></tr></thead>
            <tbody>
              {d.instructors.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center console-muted">Todavía no hay instructores con actividad.</td></tr>}
              {d.instructors.map((i) => (
                <tr key={i.id} className="border-t" style={{ borderColor: "var(--border-light)" }}>
                  <td className="px-3 py-2">
                    <Link className="font-semibold console-title hover:underline" href={`/administracion/cursos?ownerId=${encodeURIComponent(i.id)}`}>{i.name}</Link>
                    <span className="block text-xs console-muted">{i.email}</span>
                  </td>
                  <td className="px-3 py-2 console-muted">{i.role === "admin" ? "Administrador" : "Instructor"}</td>
                  <td className="px-3 py-2">{i.published} / {i.courses}</td>
                  <td className="px-3 py-2 font-semibold">{i.students}</td>
                  <td className="px-3 py-2">{i.enrollmentsThisMonth}</td>
                  <td className="px-3 py-2">{pct(i.passRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="aca-atencion" title="Requiere atención" explain="Cosas que conviene revisar en el LMS.">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <li className="console-card"><p className="text-sm console-muted">Cursos sin instructor</p><p className="text-2xl font-bold console-title">{d.attention.withoutOwner}</p></li>
          <li className="console-card"><p className="text-sm console-muted">Cursos en borrador</p><p className="text-2xl font-bold console-title">{d.attention.drafts}</p></li>
          <li className="console-card"><p className="text-sm console-muted">Acciones de gestión (7 días)</p><p className="text-2xl font-bold console-title">{d.attention.actionsLastWeek}</p></li>
        </ul>
        <p className="text-sm console-muted">Organizaciones con plan Academia activas: <strong className="console-title">{d.people.academiaOrganizations}</strong>. Sus integrantes ven los cursos incluidos en el plan sin matrícula manual.</p>
      </Section>
    </div>
  )
}

export default function AcademiaOverviewView() {
  const { data, error, mutate } = useSWR("plat-academia-overview", () => academiaApi.overview(), { revalidateOnFocus: false })
  return (
    <AsyncBlock data={data} error={error} onRetry={() => mutate()} label="los datos de la academia" forbiddenTitle="Tu rol no incluye los datos de la academia">
      {(d) => <Contenido d={d} />}
    </AsyncBlock>
  )
}
