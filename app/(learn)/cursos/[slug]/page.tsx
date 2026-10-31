"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { BarChart3, BookOpen, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck, Clock, Eye, Lock, Play, Users } from "lucide-react"
import { authClient } from "@/lib/auth"
import { buildLoginUrl } from "@/lib/authRedirect"
import { errorStatus, useCourse, useCourseQuizzes } from "@/lib/lms/hooks"
import { LEVEL_LABEL, durationLabel, pct } from "@/lib/lms/format"
import Cover from "@/components/lms/art/Cover"
import { LevelBadge } from "@/components/lms/parts"
import { Avatar, Badge, Card, Donut, ErrorPanel, LinkButton, ProgressBar, Skeleton, rise } from "@/components/lms/ui"

export default function CursoDetallePage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: course, error, mutate } = useCourse(slug)
  const { data: session } = authClient.useSession()
  const { data: quizzes } = useCourseQuizzes(course?.access.canViewAll ? course.id : undefined)
  const [closed, setClosed] = useState<Record<string, boolean>>({})

  if (errorStatus(error) === 404) return <ErrorPanel title="Curso no disponible" description="Este curso no existe o aún no está publicado." />
  if (error) return <ErrorPanel title="No pudimos cargar el curso" onRetry={() => mutate()} />
  if (!course) {
    return (
      <div className="flex flex-col gap-5">
        <Skeleton className="h-64 w-full !rounded-[28px]" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const flat = course.modules.flatMap((m) => m.lessons)
  const total = flat.length
  const canAll = course.access.canViewAll
  const current = canAll ? flat.find((l) => !l.completed) : undefined
  const done = course.progress?.completed ?? 0
  const p = pct(done, course.progress?.total ?? total)
  const started = done > 0
  const finished = canAll && total > 0 && done >= total

  const cta = canAll ? (
    <LinkButton href={`/aprender/${course.slug}${current ? `?l=${current.id}` : ""}`} className="w-full">
      <Play size={16} aria-hidden="true" /> {course.access.instructorView ? "Ver como estudiante" : finished ? "Repasar el curso" : started ? "Continuar" : "Empezar curso"}
    </LinkButton>
  ) : !session ? (
    <>
      <LinkButton href={buildLoginUrl(`/cursos/${course.slug}`)} className="w-full">Iniciar sesión para inscribirme</LinkButton>
      <Link href="/register" className="text-center text-sm font-bold" style={{ color: "var(--l-brand)" }}>Crear una cuenta</Link>
    </>
  ) : (
    <>
      <LinkButton href="/contacto" className="w-full">Inscribirme</LinkButton>
      <p className="text-center text-xs" style={{ color: "var(--l-muted)" }}>
        El acceso se otorga con una matrícula{course.includedInAcademia ? " o con el plan Academia de tu negocio" : ""}.
      </p>
      {course.includedInAcademia && <Link href="/planes" className="text-center text-sm font-bold" style={{ color: "var(--l-brand)" }}>Ver planes</Link>}
    </>
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <section className="l-rise overflow-hidden rounded-[28px]" style={{ background: "linear-gradient(135deg, var(--l-tint-bg), #fff)" , border: "1px solid var(--l-line)" }}>
        <div className="grid items-center gap-6 p-5 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex min-w-0 flex-col gap-4">
            <nav aria-label="Ruta" className="text-xs font-bold" style={{ color: "var(--l-muted)" }}>
              <Link href="/cursos" className="hover:underline">Catálogo</Link> <ChevronRight size={12} className="inline" aria-hidden="true" /> {course.category}
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              <LevelBadge level={course.level} />
              {course.includedInAcademia && <Badge tone="brand">Incluido en plan Academia</Badge>}
              {finished && <Badge tone="mint"><CheckCircle2 size={12} aria-hidden="true" /> Completado</Badge>}
            </div>
            <h1 className="text-balance text-3xl font-extrabold sm:text-4xl">{course.title}</h1>
            <p className="max-w-2xl break-words text-base" style={{ color: "var(--l-ink-2)" }}>{course.description}</p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold" style={{ color: "var(--l-ink-2)" }}>
              <li className="inline-flex items-center gap-1.5"><BookOpen size={16} aria-hidden="true" /> {total} lecciones</li>
              <li className="inline-flex items-center gap-1.5"><Clock size={16} aria-hidden="true" /> {durationLabel(course.durationMinutes)}</li>
              <li className="inline-flex items-center gap-1.5"><BarChart3 size={16} aria-hidden="true" /> {LEVEL_LABEL[course.level]}</li>
            </ul>
            <div className="flex flex-wrap gap-1.5">{course.tags.map((t) => <span key={t} className="l-badge" style={{ background: "#fff", color: "var(--l-ink-2)", border: "1px solid var(--l-line)" }}>{t}</span>)}</div>
          </div>
          <div className="l-float overflow-hidden rounded-3xl shadow-[0_24px_50px_rgba(60,50,140,.2)]"><Cover coverKey={course.coverKey} className="block h-auto w-full" /></div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <section aria-labelledby="temario" className="flex flex-col gap-3">
            <h2 id="temario" className="text-xl font-extrabold">Temario</h2>
            {course.modules.map((m, mi) => {
              const hasCurrent = m.lessons.some((l) => l.id === current?.id)
              const open = closed[m.id] === undefined ? mi === 0 || hasCurrent : !closed[m.id]
              const mDone = m.lessons.filter((l) => l.completed).length
              return (
                <Card key={m.id} className="l-rise overflow-hidden" style={rise(mi)}>
                  <button type="button" aria-expanded={open} aria-controls={`mod-${m.id}`} className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setClosed((c) => ({ ...c, [m.id]: open }))}>
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold" style={{ background: "var(--l-tint-bg)", color: "var(--l-tint-ink)" }}>{mi + 1}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate font-extrabold">{m.title}</span><span className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{canAll ? `${mDone}/${m.lessons.length} lecciones` : `${m.lessons.length} lecciones`}</span></span>
                    <ChevronDown size={18} aria-hidden="true" style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform .25s" }} />
                  </button>
                  {open && (
                    <ul id={`mod-${m.id}`} className="border-t px-2 py-2" style={{ borderColor: "var(--l-line)" }}>
                      {m.lessons.map((l) => {
                        const openL = canAll || l.isPreview
                        const isCur = l.id === current?.id
                        const Icon = l.completed ? CheckCircle2 : isCur ? Play : openL ? Eye : Lock
                        const tone = l.completed ? "var(--l-mint)" : isCur ? "var(--l-brand)" : openL ? "var(--l-sky)" : "#9aa5b8"
                        const row = (
                          <span className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm" style={{ background: isCur ? "var(--l-brand-50)" : "transparent", color: openL ? "var(--l-ink)" : "var(--l-muted)" }}>
                            <Icon size={18} aria-hidden="true" style={{ color: tone }} />
                            <span className="min-w-0 flex-1 break-words font-bold">{l.title}</span>
                            {isCur && <Badge tone="brand">Actual</Badge>}
                            {l.isPreview && !canAll && <Badge tone="sky">Vista previa</Badge>}
                            {!openL && <span className="sr-only">Bloqueada</span>}
                          </span>
                        )
                        return <li key={l.id}>{openL && session ? <Link href={`/aprender/${course.slug}?l=${l.id}`} className="block hover:bg-[var(--l-bg)] rounded-2xl">{row}</Link> : row}</li>
                      })}
                    </ul>
                  )}
                </Card>
              )
            })}
          </section>

          {quizzes && quizzes.length > 0 && (
            <section aria-labelledby="evals" className="flex flex-col gap-3">
              <h2 id="evals" className="text-xl font-extrabold">Evaluaciones</h2>
              {quizzes.map((q) => (
                <Link key={q.id} href={`/evaluacion/${q.id}`} className="l-card l-card-hover flex items-center gap-4 p-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: q.passed ? "var(--l-mint)" : "var(--l-rose)" }} aria-hidden="true"><ClipboardCheck size={20} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate font-extrabold">{q.title}</span><span className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{q.questionCount} preguntas · nota mínima {q.passingScore}%</span></span>
                  {q.passed ? <Badge tone="mint">Aprobada {q.bestScore}%</Badge> : q.attemptsUsed > 0 ? <Badge tone="amber">Mejor: {q.bestScore ?? 0}%</Badge> : <Badge tone="rose">Pendiente</Badge>}
                </Link>
              ))}
            </section>
          )}

          <section aria-labelledby="instr" className="flex flex-col gap-3">
            <h2 id="instr" className="text-xl font-extrabold">Tu instructor</h2>
            <Card className="flex items-center gap-4 p-5">
              <Avatar name={course.instructorName} size={56} />
              <div><p className="font-extrabold">{course.instructorName}</p><p className="text-sm" style={{ color: "var(--l-muted)" }}>Equipo de Academia OMG: cocineros, costeadores y asesores de restaurantes.</p></div>
            </Card>
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24" aria-label="Inscripción">
          <Card className="flex flex-col gap-4 p-5">
            {canAll && course.progress ? (
              <div className="flex items-center gap-4">
                <Donut value={p} tone={finished ? "mint" : "brand"} size={72} stroke={9} label="Avance del curso" />
                <div className="min-w-0 flex-1"><p className="font-extrabold">{finished ? "¡Curso completado!" : "Tu avance"}</p><p className="text-sm" style={{ color: "var(--l-muted)" }}>{done} de {course.progress.total} lecciones</p><div className="mt-2"><ProgressBar value={p} label="Avance" /></div></div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "var(--l-ink-2)" }}><Users size={16} aria-hidden="true" /> Aprende a tu ritmo, con certificado</div>
            )}
            {cta}
            {course.access.viaAcademia && !course.access.enrolled && <p className="text-center text-xs" style={{ color: "var(--l-muted)" }}>Acceso incluido por el plan Academia de tu negocio.</p>}
          </Card>
        </aside>
      </div>
    </div>
  )
}
