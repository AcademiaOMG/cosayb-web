"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { mutate as globalMutate } from "swr"
import { Award, BookOpen, CheckCircle2, GraduationCap, LayoutGrid, List, Plus, Search, TrendingDown, TrendingUp, Users } from "lucide-react"
import { Badge, Button, Card, Chip, Donut, EmptyState, ErrorPanel, IconTile, ProgressBar, Skeleton, rise } from "@/components/lms/ui"
import { CourseThumb, StatusBadge } from "@/components/lms/parts"
import CountUp from "@/components/lms/fx/CountUp"
import { lms } from "@/lib/lms/api"
import { errorStatus, lmsKeys, useOverview } from "@/lib/lms/hooks"
import { LEVEL_LABEL, toneForPct } from "@/lib/lms/format"
import { deltaPercent, filterCourses, monthLabel } from "@/lib/lms/studio"
import { slugify, validateSlug } from "@/lib/lms/validation"
import { toast } from "@/lib/toast"
import type { CourseMeta, OverviewCourse } from "@/lib/lms/types"
import { BarChart, DonutChart, LineChart } from "./charts"
import { CourseMetaForm, DEFAULT_META } from "./forms"
import { AreaField, Dialog, Notice, SwitchRow, TextField, errMsg } from "./kit"

type StatusFilter = "all" | "published" | "draft" | "archived"
type Sort = "recent" | "students" | "progress" | "title"

function Kpi({ tone, icon, label, value, suffix, sub, delta, index }: { tone: "brand" | "mint" | "amber" | "sky"; icon: React.ReactNode; label: string; value: number | null; suffix?: string; sub: React.ReactNode; delta?: number | null; index: number }) {
  return (
    <Card className="k-tile l-rise" style={rise(index)}>
      <div className="min-w-0">
        <p className="text-sm font-bold" style={{ color: "var(--l-muted)" }}>{label}</p>
        <p className="mt-1 text-3xl font-extrabold leading-none">{value === null ? "—" : <CountUp to={value} suffix={suffix} />}</p>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs font-bold" style={{ color: "var(--l-muted)" }}>
          {delta !== undefined && delta !== null && (
            <span className={`inline-flex items-center gap-0.5 ${delta >= 0 ? "k-delta-up" : "k-delta-down"}`}>
              {delta >= 0 ? <TrendingUp size={13} aria-hidden="true" /> : <TrendingDown size={13} aria-hidden="true" />}
              {delta > 0 ? "+" : ""}{delta}%
              <span className="sr-only"> frente al mes anterior</span>
            </span>
          )}
          {sub}
        </p>
      </div>
      <IconTile tone={tone} size={46}>{icon}</IconTile>
    </Card>
  )
}

function CourseTile({ c, index }: { c: OverviewCourse; index: number }) {
  const tone = toneForPct(c.avgProgress)
  return (
    <Card hover className="l-rise flex flex-col gap-4 p-5" style={rise(index % 9)}>
      <div className="flex items-start gap-3">
        <CourseThumb coverKey={c.coverKey} size={56} />
        <div className="min-w-0 flex-1">
          <Link href={`/instructor/${c.id}`} className="block break-words text-lg font-extrabold leading-snug hover:underline">{c.title}</Link>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={c.status} />
            <Badge tone="neutral">{LEVEL_LABEL[c.level]}</Badge>
            <span className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{c.lessonCount} lecciones</span>
          </div>
        </div>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[["Estudiantes", String(c.enrolled)], ["Avance", `${c.avgProgress}%`], ["Aprobación", c.passRate === null ? "—" : `${c.passRate}%`]].map(([k, v]) => (
          <div key={k} className="rounded-2xl py-2" style={{ background: "var(--l-bg)" }}>
            <dd className="text-lg font-extrabold leading-tight">{v}</dd>
            <dt className="text-[11px] font-bold" style={{ color: "var(--l-muted)" }}>{k}</dt>
          </div>
        ))}
      </dl>
      <ProgressBar value={c.avgProgress} tone={tone} label={`Avance promedio de ${c.title}`} index={index} />
      <div className="mt-auto grid grid-cols-2 gap-2">
        <Link href={`/instructor/${c.id}?tab=students`} className="l-btn l-btn-ghost l-btn-sm"><Users size={15} aria-hidden="true" /> Ver estudiantes</Link>
        <Link href={`/instructor/${c.id}`} className="l-btn l-btn-soft l-btn-sm">Editar</Link>
      </div>
    </Card>
  )
}

function NewCourseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [f, setF] = useState({ title: "", slug: "", description: "", includedInAcademia: true })
  const [meta, setMeta] = useState<CourseMeta>(DEFAULT_META)
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const slug = touched ? f.slug : slugify(f.title)
  const slugError = slug ? validateSlug(slug) : null

  async function create() {
    if (!f.title.trim() || !slug || slugError) return toast.warning("Completa el título y un identificador válido.")
    setBusy(true)
    try {
      const c = await lms.admin.createCourse({ title: f.title.trim(), slug, description: f.description.trim(), includedInAcademia: f.includedInAcademia, ...meta })
      await globalMutate(lmsKeys.overview)
      router.push(`/instructor/${c.id}`)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Nuevo curso" footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={create} loading={busy}>Crear y editar</Button></>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={200} autoFocus />
          <TextField label="Identificador en la URL" value={slug} onChange={(e) => { setTouched(true); setF({ ...f, slug: e.target.value }) }} error={slugError} />
        </div>
        <AreaField label="Descripción" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={5000} rows={3} />
        <CourseMetaForm value={meta} onChange={setMeta} />
        <SwitchRow checked={f.includedInAcademia} onChange={(v) => setF({ ...f, includedInAcademia: v })} label="Incluido en el plan Academia" hint="Los negocios con ese plan acceden sin matrícula." />
      </div>
    </Dialog>
  )
}

export default function Dashboard() {
  const { data, error, mutate } = useOverview()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [sort, setSort] = useState<Sort>("recent")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [creating, setCreating] = useState(false)
  const [donutBy, setDonutBy] = useState<"status" | "level">("status")

  const shown = useMemo(() => (data ? filterCourses(data.courses, { q, status, sort }) : []), [data, q, status, sort])

  if (errorStatus(error) === 403) return <ErrorPanel title="Sin permisos" description="El estudio del instructor requiere permisos de instructor." />
  if (error) return <ErrorPanel title="No pudimos cargar el estudio" onRetry={() => mutate()} />

  const k = data?.kpis
  const labels = data?.series.map((s) => monthLabel(s.month)) ?? []
  const count = (s: StatusFilter) => (s === "all" ? data?.courses.length ?? 0 : data?.courses.filter((c) => c.status === s).length ?? 0)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-balance text-2xl font-extrabold sm:text-3xl">Estudio del instructor</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Crea cursos, sigue a tus estudiantes y mide qué está funcionando.</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus size={16} aria-hidden="true" /> Nuevo curso</Button>
      </header>

      <Notice storeKey="lms.notice.studio">
        <strong>Recuerda revisar tus evaluaciones.</strong> Las preguntas con más errores aparecen en la analítica de cada curso: úsalas para reforzar las lecciones que más cuestan.
      </Notice>

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
          <p className="mb-3 text-xs font-semibold" style={{ color: "var(--l-muted)" }}>Matrículas nuevas y lecciones completadas por mes</p>
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
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-extrabold">Tus cursos</h2>
            <div className="flex gap-1.5">
              <Chip pressed={donutBy === "status"} onClick={() => setDonutBy("status")}>Estado</Chip>
              <Chip pressed={donutBy === "level"} onClick={() => setDonutBy("level")}>Nivel</Chip>
            </div>
          </div>
          {!data ? <Skeleton className="h-[150px]" /> : donutBy === "status" ? (
            <DonutChart
              centerLabel="cursos"
              slices={[
                { label: "Publicados", value: k!.courses.published, color: "var(--l-mint)" },
                { label: "Borradores", value: k!.courses.draft, color: "var(--l-amber)" },
                { label: "Archivados", value: k!.courses.archived, color: "#9aa5ba" },
              ]}
              summary={`Cursos por estado: ${k!.courses.published} publicados, ${k!.courses.draft} borradores, ${k!.courses.archived} archivados`}
            />
          ) : (
            <DonutChart
              centerLabel="cursos"
              slices={data.byLevel.map((l, i) => ({ label: LEVEL_LABEL[l.level], value: l.count, color: ["var(--l-mint)", "var(--l-brand)", "var(--l-rose)"][i] }))}
              summary={`Cursos por nivel: ${data.byLevel.map((l) => `${LEVEL_LABEL[l.level]} ${l.count}`).join(", ")}`}
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

      <section aria-labelledby="mis-cursos" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="mis-cursos" className="text-xl font-extrabold">Cursos</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--l-muted)" }} />
              <input className="l-input !min-h-10" style={{ paddingLeft: 36, width: 220 }} type="search" placeholder="Buscar curso…" aria-label="Buscar curso" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="l-input l-select !min-h-10 !w-auto" aria-label="Ordenar por" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="recent">Más recientes</option>
              <option value="students">Más estudiantes</option>
              <option value="progress">Mayor avance</option>
              <option value="title">Nombre (A–Z)</option>
            </select>
            <div className="l-seg" role="tablist" aria-label="Vista">
              <button type="button" role="tab" aria-selected={view === "grid"} aria-label="Cuadrícula" onClick={() => setView("grid")}><LayoutGrid size={16} aria-hidden="true" /></button>
              <button type="button" role="tab" aria-selected={view === "list"} aria-label="Lista" onClick={() => setView("list")}><List size={16} aria-hidden="true" /></button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
          {([["all", "Todos"], ["published", "Publicados"], ["draft", "Borradores"], ["archived", "Archivados"]] as const).map(([id, label]) => (
            <Chip key={id} pressed={status === id} onClick={() => setStatus(id)}>{label} <span className="font-extrabold">{count(id)}</span></Chip>
          ))}
        </div>

        {!data ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[260px] !rounded-[22px]" />)}</div>
        ) : shown.length === 0 ? (
          <EmptyState title={data.courses.length ? "Ningún curso coincide" : "Aún no hay cursos"} description={data.courses.length ? "Prueba con otro filtro o búsqueda." : "Crea el primero con el botón Nuevo curso."} action={<Button onClick={() => setCreating(true)}><Plus size={16} aria-hidden="true" /> Nuevo curso</Button>} />
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{shown.map((c, i) => <CourseTile key={c.id} c={c} index={i} />)}</div>
        ) : (
          <Card className="overflow-x-auto">
            <table className="t-table">
              <caption className="sr-only">Cursos del instructor</caption>
              <thead><tr><th scope="col">Curso</th><th scope="col">Estado</th><th scope="col">Estudiantes</th><th scope="col">Avance</th><th scope="col">Aprobación</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
              <tbody>
                {shown.map((c) => (
                  <tr key={c.id}>
                    <td><Link href={`/instructor/${c.id}`} className="flex items-center gap-3 font-extrabold hover:underline"><CourseThumb coverKey={c.coverKey} size={40} rounded={12} />{c.title}</Link></td>
                    <td><StatusBadge status={c.status} /></td>
                    <td className="font-bold">{c.enrolled}</td>
                    <td className="min-w-[130px]"><div className="flex items-center gap-2"><ProgressBar value={c.avgProgress} tone={toneForPct(c.avgProgress)} label={`Avance de ${c.title}`} height={6} /><span className="text-xs font-extrabold">{c.avgProgress}%</span></div></td>
                    <td className="font-bold">{c.passRate === null ? "—" : `${c.passRate}%`}</td>
                    <td><Link href={`/instructor/${c.id}?tab=students`} className="l-btn l-btn-ghost l-btn-sm">Estudiantes</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>

      {data && data.series.some((s) => s.attempts > 0) && (
        <Card className="p-5">
          <h2 className="text-base font-extrabold">Evaluaciones presentadas por mes</h2>
          <p className="mb-3 text-xs font-semibold" style={{ color: "var(--l-muted)" }}>Intentos enviados en los últimos 6 meses</p>
          <div className="max-w-xl"><BarChart labels={labels} values={data.series.map((s) => s.attempts)} summary={`Intentos de evaluación por mes: ${data.series.map((s) => `${monthLabel(s.month)} ${s.attempts}`).join(", ")}`} /></div>
        </Card>
      )}

      <NewCourseDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
