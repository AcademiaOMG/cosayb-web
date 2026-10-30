"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Award, BookOpen, CheckCircle2, GraduationCap, TrendingDown, TrendingUp, UserPlus, Users } from "lucide-react"
import { Avatar, Badge, Card, Chip, Donut, EmptyState, ErrorPanel, Skeleton, rise } from "@/components/lms/ui"
import { errorStatus, useManageOverview } from "@/lib/lms/hooks"
import { deltaPercent, monthLabel } from "@/lib/lms/studio"
import type { InstructorCard } from "@/lib/lms/types"
import { DonutChart, LineChart } from "@/components/lms/studio/charts"
import { Kpi } from "@/components/lms/studio/Dashboard"
import { Notice } from "@/components/lms/studio/kit"
import { SearchBox } from "./parts"

type Filter = "all" | "instructor" | "admin"

function InstructorTile({ i, index }: { i: InstructorCard; index: number }) {
  const delta = deltaPercent(i.enrollmentsThisMonth, i.enrollmentsPrevMonth)
  return (
    <Card hover className="l-rise flex flex-col gap-4 p-5" style={rise(index % 9)}>
      <div className="flex items-start gap-3">
        <Avatar name={i.name} size={44} />
        <div className="min-w-0 flex-1">
          <p className="break-words text-lg font-extrabold leading-snug">{i.name}</p>
          <p className="truncate text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{i.email}</p>
        </div>
        <Badge tone={i.role === "admin" ? "brand" : "sky"}>{i.role === "admin" ? "Administrador" : "Instructor"}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-3" style={{ background: "var(--l-bg)" }}>
          <p className="text-xs font-bold" style={{ color: "var(--l-muted)" }}>Cursos</p>
          <p className="text-2xl font-extrabold leading-tight">{i.courses}</p>
          <p className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{i.published} publicados</p>
        </div>
        <div className="rounded-2xl p-3" style={{ background: "var(--l-bg)" }}>
          <p className="text-xs font-bold" style={{ color: "var(--l-muted)" }}>Estudiantes</p>
          <p className="text-2xl font-extrabold leading-tight">{i.students}</p>
          <p className="flex items-center gap-1 text-xs font-bold">
            {delta === null ? (
              <span style={{ color: "var(--l-muted)" }}>{i.enrollmentsThisMonth} este mes</span>
            ) : (
              <span className={`inline-flex items-center gap-0.5 ${delta >= 0 ? "k-delta-up" : "k-delta-down"}`}>
                {delta >= 0 ? <TrendingUp size={13} aria-hidden="true" /> : <TrendingDown size={13} aria-hidden="true" />}
                {delta > 0 ? "+" : ""}{delta}%<span className="sr-only"> frente al mes anterior</span>
              </span>
            )}
          </p>
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold" style={{ color: "var(--l-muted)" }}>
        <span>Aprobación {i.passRate === null ? "—" : `${i.passRate}%`}</span>
        <span className="inline-flex items-center gap-1"><Award size={13} aria-hidden="true" /> {i.certificates} certificados</span>
      </p>
      <div className="mt-auto grid grid-cols-2 gap-2">
        <Link href={`/administracion/cursos?ownerId=${encodeURIComponent(i.id)}`} className="l-btn l-btn-ghost l-btn-sm">Ver cursos</Link>
        <Link href="/administracion/usuarios" className="l-btn l-btn-soft l-btn-sm">Gestionar</Link>
      </div>
    </Card>
  )
}

/** Panorama de toda la academia (referencia: aviso, 4 indicadores, dona + línea, tarjetas por instructor). */
export default function Overview() {
  const { data, error, mutate } = useManageOverview()
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<Filter>("all")

  const shown = useMemo(() => {
    if (!data) return []
    const term = q.trim().toLowerCase()
    return data.instructors.filter((i) => (filter === "all" || i.role === filter) && (!term || i.name.toLowerCase().includes(term) || i.email.toLowerCase().includes(term)))
  }, [data, q, filter])

  if (errorStatus(error) === 403) return <ErrorPanel title="Solo para administradores" description="Esta sección es para los administradores de la academia." />
  if (error) return <ErrorPanel title="No pudimos cargar el panorama" onRetry={() => mutate()} />

  const k = data?.kpis
  const labels = data?.series.map((s) => monthLabel(s.month)) ?? []
  const att = data?.attention
  const count = (f: Filter) => (f === "all" ? data?.instructors.length ?? 0 : data?.instructors.filter((i) => i.role === f).length ?? 0)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-balance text-2xl font-extrabold sm:text-3xl">Administración de la academia</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Cursos, instructores y estudiantes de toda la academia en un vistazo.</p>
        </div>
        <Link href="/administracion/usuarios" className="l-btn l-btn-primary"><UserPlus size={16} aria-hidden="true" /> Nuevo instructor</Link>
      </header>

      {att && (att.drafts > 0 || att.withoutOwner > 0) && (
        <Notice storeKey="lms.notice.admin">
          <strong>Requiere atención:</strong>{" "}
          {att.withoutOwner > 0 && <>hay {att.withoutOwner} curso{att.withoutOwner > 1 ? "s" : ""} sin instructor responsable (<Link href="/administracion/cursos" className="underline">asígnalos</Link>). </>}
          {att.drafts > 0 && <>{att.drafts} curso{att.drafts > 1 ? "s" : ""} en borrador esperan publicarse. </>}
          {att.actionsLastWeek} acciones registradas en los últimos 7 días (<Link href="/administracion/auditoria" className="underline">ver auditoría</Link>).
        </Notice>
      )}

      {!data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[112px] !rounded-[22px]" />)}</div>
      ) : (
        <section aria-label="Indicadores" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi index={0} tone="brand" icon={<Users size={22} />} label="Estudiantes matriculados" value={k!.students} delta={deltaPercent(k!.enrollmentsThisMonth, k!.enrollmentsPrevMonth)} sub={`${k!.enrollmentsThisMonth} matrículas este mes`} />
          <Kpi index={1} tone="sky" icon={<BookOpen size={22} />} label="Cursos publicados" value={k!.courses.published} sub={`${k!.courses.draft} borradores · ${k!.courses.archived} archivados`} />
          <Kpi index={2} tone="amber" icon={<GraduationCap size={22} />} label="Avance promedio" value={k!.avgProgress} suffix="%" sub="de todas las matrículas activas" />
          <Kpi index={3} tone="mint" icon={<CheckCircle2 size={22} />} label="Tasa de aprobación" value={k!.passRate} suffix="%" sub={<><Award size={13} aria-hidden="true" className="inline" /> {k!.certificates} certificados</>} />
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5" aria-label="Gráficos">
        <Card className="p-5 lg:col-span-3">
          <h2 className="text-base font-extrabold">Actividad de los últimos 6 meses</h2>
          <p className="mb-3 text-xs font-semibold" style={{ color: "var(--l-muted)" }}>Matrículas nuevas y lecciones completadas en toda la academia</p>
          {!data ? <Skeleton className="h-[200px]" /> : (
            <LineChart
              labels={labels}
              series={[
                { name: "Matrículas", color: "var(--l-brand)", values: data.series.map((s) => s.enrollments) },
                { name: "Lecciones completadas", color: "var(--l-mint)", values: data.series.map((s) => s.completions) },
              ]}
              summary={`Matrículas y lecciones completadas por mes: ${data.series.map((s) => `${monthLabel(s.month)} ${s.enrollments} matrículas y ${s.completions} lecciones`).join("; ")}`}
            />
          )}
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-base font-extrabold">Cursos por estado</h2>
          {!data ? <Skeleton className="h-[150px]" /> : (
            <DonutChart
              centerLabel="cursos"
              slices={[
                { label: "Publicados", value: k!.courses.published, color: "var(--l-mint)" },
                { label: "Borradores", value: k!.courses.draft, color: "var(--l-amber)" },
                { label: "Archivados", value: k!.courses.archived, color: "#9aa5ba" },
              ]}
              summary={`Cursos por estado: ${k!.courses.published} publicados, ${k!.courses.draft} borradores, ${k!.courses.archived} archivados`}
            />
          )}
          {data && k!.courses.total > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl p-3" style={{ background: "var(--l-bg)" }}>
              <Donut value={k!.avgProgress} tone="brand" size={52} stroke={7} label="Avance promedio" />
              <p className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{k!.enrollments} matrículas activas con un avance promedio de {k!.avgProgress}%.</p>
            </div>
          )}
        </Card>
      </section>

      <section aria-labelledby="inst" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="inst" className="text-xl font-extrabold">Instructores</h2>
          <SearchBox value={q} onChange={setQ} placeholder="Buscar por nombre o correo…" label="Buscar instructor" />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por rol">
          {([["all", "Todos"], ["instructor", "Instructores"], ["admin", "Administradores"]] as const).map(([id, label]) => (
            <Chip key={id} pressed={filter === id} onClick={() => setFilter(id)}>{label} <span className="font-extrabold">{count(id)}</span></Chip>
          ))}
        </div>
        {!data ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[250px] !rounded-[22px]" />)}</div>
        ) : shown.length === 0 ? (
          <EmptyState title={data.instructors.length ? "Nadie coincide" : "Aún no hay instructores"} description={data.instructors.length ? "Prueba con otro filtro o búsqueda." : "Otorga el rol de instructor desde «Instructores y usuarios»."} action={<Link href="/administracion/usuarios" className="l-btn l-btn-primary"><UserPlus size={16} aria-hidden="true" /> Nuevo instructor</Link>} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{shown.map((i, n) => <InstructorTile key={i.id} i={i} index={n} />)}</div>
        )}
      </section>

      {data && data.courses.length > 0 && (
        <Card className="overflow-x-auto">
          <h2 className="px-5 pt-5 text-base font-extrabold">Cursos con más estudiantes</h2>
          <table className="t-table">
            <caption className="sr-only">Cursos con más estudiantes</caption>
            <thead><tr><th scope="col">Curso</th><th scope="col">Estudiantes</th><th scope="col">Avance</th><th scope="col">Aprobación</th></tr></thead>
            <tbody>
              {[...data.courses].sort((a, b) => b.enrolled - a.enrolled).slice(0, 5).map((c) => (
                <tr key={c.id}>
                  <td><Link href={`/administracion/cursos/${c.id}`} className="font-extrabold hover:underline">{c.title}</Link></td>
                  <td className="font-bold">{c.enrolled}</td>
                  <td className="font-bold">{c.avgProgress}%</td>
                  <td className="font-bold">{c.passRate === null ? "—" : `${c.passRate}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
