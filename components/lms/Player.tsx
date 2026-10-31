"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { mutate as globalMutate } from "swr"
import { Award, CheckCircle2, ExternalLink, ChevronLeft, ChevronRight, ChevronsRight, ClipboardCheck, Circle, Lock, PanelRightClose, PanelRightOpen, Play } from "lucide-react"
import { DocumentButton, ExternalVideo, LessonBody, VideoPlayer } from "@/components/lms/AssetViews"
import SignInRequired from "@/components/lms/SignInRequired"
import { usePaths, useArea } from "@/components/lms/shell/area"
import { homeFor } from "@/lib/lms/roles"
import InstructorBanner from "@/components/lms/InstructorBanner"
import Cover from "@/components/lms/art/Cover"
import { lms } from "@/lib/lms/api"
import { errorStatus, lmsKeys, useCourse, useCourseQuizzes, useLesson, useLmsAccess } from "@/lib/lms/hooks"
import { pct } from "@/lib/lms/format"
import { toast } from "@/lib/toast"
import type { CourseDetail } from "@/lib/lms/types"
import { Badge, Button, Card, ErrorPanel, LinkButton, ProgressBar, Skeleton, Tabs } from "@/components/lms/ui"

type Tab = "summary" | "resources" | "notes"

function Notes({ lessonId }: { lessonId: string }) {
  // Convivencia por-navegador: las notas se guardan solo en este dispositivo (localStorage), nunca en el servidor.
  const key = `lms.notes.${lessonId}`
  const [text, setText] = useState("")
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única al cambiar de lección
      setText(window.localStorage.getItem(key) ?? "")
    } catch {
      setText("")
    }
  }, [key])
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="notes" className="text-sm font-bold">Tus notas de esta lección</label>
      <textarea
        id="notes"
        className="l-input min-h-40 py-3"
        maxLength={5000}
        placeholder="Escribe aquí lo que quieras recordar…"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          try {
            window.localStorage.setItem(key, e.target.value)
          } catch {
            /* sin almacenamiento: la nota vive solo en esta sesión */
          }
        }}
      />
      <p className="text-xs" style={{ color: "var(--l-muted)" }}>Se guardan solo en este navegador.</p>
    </div>
  )
}

function PlayerInner() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const area = useArea()
  const paths = usePaths()
  const { data: access } = useLmsAccess(area === "student")
  const params = useSearchParams()
  const { data: course, error, mutate: mutateCourse } = useCourse(slug)
  const [tab, setTab] = useState<Tab>("summary")
  const [open, setOpen] = useState(true)
  const [busy, setBusy] = useState(false)
  const [justDone, setJustDone] = useState(false)
  // Vista de instructor: el "avance" es solo visual (no se envía nada al servidor)
  const [viewDone, setViewDone] = useState<string[]>([])

  const flat = course?.modules.flatMap((m) => m.lessons) ?? []
  const requested = params.get("l")
  const isDone = (l: { id: string; completed: boolean }) => l.completed || viewDone.includes(l.id)
  const current = flat.find((l) => l.id === requested) ?? flat.find((l) => !isDone(l)) ?? flat[0]
  // Un instructor/administrador que abre el reproductor por la URL de estudiante pasa a SU área (sin menú de estudiante)
  const toStaff = area === "student" && course?.access.instructorView ? `${homeFor(access)}/ver/${slug}${requested ? `?l=${requested}` : ""}` : null
  useEffect(() => {
    if (toStaff && access) router.replace(toStaff)
  }, [toStaff, access, router])
  const canLoad = Boolean(course && (course.access.canViewAll || current?.isPreview))
  const { data: lesson, error: lessonError, mutate: mutateLesson } = useLesson(canLoad ? (current?.id ?? null) : null)
  const { data: quizzes } = useCourseQuizzes(course?.access.canViewAll ? course.id : undefined)

  if (errorStatus(error) === 401) return <SignInRequired message="Inicia sesión para continuar con tu curso." />
  if (errorStatus(error) === 404) return <ErrorPanel title="Curso no disponible" description="Este curso no existe o aún no está publicado." />
  if (error) return <ErrorPanel title="No pudimos cargar el curso" onRetry={() => mutateCourse()} />
  if (!course) return <div className="grid gap-5 lg:grid-cols-[1fr_360px]"><Skeleton className="aspect-video w-full !rounded-3xl" /><Skeleton className="h-96 w-full" /></div>

  if (!course.access.canViewAll && !current?.isPreview) {
    return (
      <ErrorPanel title="Aún no tienes acceso a este curso" description="Pide tu matrícula para ver las lecciones." onRetry={() => router.push(paths.course(course.id, course.slug))} />
    )
  }

  const idx = flat.findIndex((l) => l.id === current?.id)
  const prev = idx > 0 ? flat[idx - 1] : undefined
  const next = idx >= 0 ? flat[idx + 1] : undefined
  const go = (id: string) => {
    setTab("summary")
    setJustDone(false)
    router.push(`${paths.view(course.slug)}?l=${id}`)
  }
  const iv = Boolean(course.access.instructorView)
  const progress = iv ? { completed: flat.filter(isDone).length, total: flat.length } : (course.progress ?? { completed: 0, total: flat.length })
  const viewCourse: CourseDetail = iv ? { ...course, modules: course.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => ({ ...l, completed: isDone(l) })) })) } : course

  async function complete() {
    if (!lesson) return
    if (iv) {
      setViewDone((d) => (d.includes(lesson.id) ? d : [...d, lesson.id]))
      setJustDone(true)
      toast.success("Marcada como completada (solo en esta vista: no se guarda).")
      return
    }
    setBusy(true)
    try {
      const r = await lms.completeLesson(lesson.id)
      setJustDone(true)
      await Promise.all([mutateLesson(), mutateCourse(), globalMutate(lmsKeys.mine), globalMutate(lmsKeys.certificates), globalMutate(lmsKeys.summary)])
      if (r.certificate) {
        toast.success("¡Curso aprobado! Ya tienes tu certificado.")
        router.push(`/certificados/${r.certificate.id}`)
      } else toast.success("Lección completada.")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos guardar tu avance.")
    } finally {
      setBusy(false)
    }
  }

  const videos = lesson?.assets.filter((a) => a.kind === "video") ?? []
  const subtitles = lesson?.assets.filter((a) => a.kind === "subtitle") ?? []
  const docs = lesson?.assets.filter((a) => a.kind === "document") ?? []
  const p = pct(progress.completed, progress.total)

  return (
    <div className="flex flex-col gap-4">
      {iv && <InstructorBanner backHref={paths.course(course.id, course.slug)} status={course.status} />}
      {/* Cabecera del curso */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href={paths.course(course.id, course.slug)} className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: "var(--l-muted)" }}><ChevronLeft size={16} aria-hidden="true" />{course.title}</Link>
        <div className="flex min-w-[200px] flex-1 items-center gap-3">
          <ProgressBar value={p} label="Progreso del curso" tone={p === 100 ? "mint" : "brand"} />
          <span className="shrink-0 text-xs font-extrabold">{progress.completed}/{progress.total} · {p}%</span>
        </div>
        <button type="button" className="l-btn l-btn-ghost l-btn-sm hidden lg:inline-flex" aria-expanded={open} aria-controls="lms-outline" onClick={() => setOpen((o) => !o)}>
          {open ? <PanelRightClose size={16} aria-hidden="true" /> : <PanelRightOpen size={16} aria-hidden="true" />} Temario
        </button>
      </div>

      <div>
        <div className={`grid items-start gap-6 ${open ? "lg:grid-cols-[minmax(0,1fr)_360px]" : "lg:grid-cols-1"}`}>
          <section className="flex min-w-0 flex-col gap-5" aria-live="polite">
            {lessonError ? (
              <ErrorPanel title={errorStatus(lessonError) === 403 ? "No tienes acceso a esta lección" : "No pudimos cargar la lección"} onRetry={() => mutateLesson()} />
            ) : !lesson ? (
              <Skeleton className="aspect-video w-full !rounded-3xl" />
            ) : (
              <>
                {videos[0] ? (
                  <VideoPlayer lessonId={lesson.id} video={videos[0]} subtitles={subtitles} />
                ) : lesson.kind === "external_video" && lesson.embed ? (
                  <ExternalVideo embed={lesson.embed} title={lesson.title} />
                ) : lesson.kind === "link" && lesson.linkUrl && /^https?:[/][/]/i.test(lesson.linkUrl) ? (
                  <div className="relative flex flex-col items-start justify-end gap-3 overflow-hidden rounded-3xl p-6 sm:p-8" style={{ aspectRatio: "16 / 6", minHeight: 180 }}>
                    <Cover coverKey={course.coverKey} className="absolute inset-0 h-full w-full" />
                    <span className="relative rounded-2xl bg-white/95 p-4 shadow-lg">
                      <span className="block text-sm font-bold" style={{ color: "var(--l-muted)" }}>Esta lección es un recurso externo</span>
                      <a href={lesson.linkUrl} target="_blank" rel="noopener noreferrer" className="l-btn l-btn-primary mt-2"><ExternalLink size={16} aria-hidden="true" /> Abrir el enlace</a>
                      <span className="mt-1 block max-w-xs break-all text-xs" style={{ color: "var(--l-muted)" }}>{lesson.linkUrl.replace(/^https?:[/][/]/i, "").split("/")[0]}</span>
                    </span>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-3xl" style={{ aspectRatio: "16 / 6" }}>
                    <Cover coverKey={course.coverKey} className="absolute inset-0 h-full w-full" />
                  </div>
                )}
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    {lesson.isPreview && !course.access.canViewAll && <Badge tone="sky">Vista previa gratuita</Badge>}
                    <p className="text-xs font-bold" style={{ color: "var(--l-muted)" }}>Lección {idx + 1} de {flat.length}</p>
                    <h1 className="text-balance text-2xl font-extrabold sm:text-3xl">{lesson.title}</h1>
                  </div>
                  {lesson.completed || viewDone.includes(lesson.id) ? (
                    <span className={`l-badge ${justDone ? "l-pop" : ""}`} style={{ background: "var(--l-mint-bg)", color: "var(--l-mint-ink)", fontSize: 14, padding: "8px 14px" }}><CheckCircle2 size={16} aria-hidden="true" /> Completada</span>
                  ) : (
                    <Button onClick={complete} loading={busy}><CheckCircle2 size={16} aria-hidden="true" /> Marcar como completada</Button>
                  )}
                </header>

                <Card className="p-5 sm:p-6">
                  <Tabs label="Contenido de la lección" value={tab} onChange={setTab} tabs={[{ id: "summary", label: "Resumen" }, { id: "resources", label: "Recursos", count: docs.length }, { id: "notes", label: "Notas" }]} />
                  <div className="pt-4" role="tabpanel">
                    {tab === "summary" && (lesson.body.trim() ? <LessonBody body={lesson.body} /> : <p className="text-sm" style={{ color: "var(--l-muted)" }}>Esta lección no tiene texto.</p>)}
                    {tab === "resources" && (docs.length ? <div className="flex flex-col gap-3">{docs.map((d, i) => <DocumentButton key={d.id} lessonId={lesson.id} asset={d} index={i} />)}</div> : <p className="text-sm" style={{ color: "var(--l-muted)" }}>Esta lección no tiene recursos descargables.</p>)}
                    {tab === "notes" && <Notes lessonId={lesson.id} />}
                  </div>
                </Card>

                <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Navegación entre lecciones">
                  <Button variant="ghost" disabled={!prev} onClick={() => prev && go(prev.id)}><ChevronLeft size={16} aria-hidden="true" /> Anterior</Button>
                  {!iv && progress.total > 0 && progress.completed === progress.total && (
                    <Link href={paths.certificates} className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: "var(--l-brand)" }}><Award size={16} aria-hidden="true" /> Ver mis certificados</Link>
                  )}
                  <Button variant={isDone(lesson) ? "primary" : "soft"} disabled={!next || !(course.access.canViewAll || next.isPreview)} onClick={() => next && go(next.id)}>Siguiente <ChevronRight size={16} aria-hidden="true" /></Button>
                </nav>
              </>
            )}
          </section>

          {open && (
            <aside id="lms-outline" className="flex flex-col gap-4 lg:sticky lg:top-24" aria-label="Contenido del curso">
              <Outline course={viewCourse} currentId={current?.id} onPick={go} />
              {quizzes && quizzes.length > 0 && (
                <Card className="p-4">
                  <h2 className="mb-2 text-sm font-extrabold">Evaluaciones</h2>
                  <ul className="flex flex-col gap-1">
                    {quizzes.map((q) => (
                      <li key={q.id}>
                        <Link href={paths.viewQuiz(q.id)} className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold hover:bg-[var(--l-bg)]">
                          <ClipboardCheck size={16} aria-hidden="true" />
                          <span className="min-w-0 flex-1 break-words">{q.title}</span>
                          {q.passed ? <Badge tone="mint">Aprobada</Badge> : q.required ? <Badge tone="amber">Pendiente</Badge> : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              <LinkButton href={paths.course(course.id, course.slug)} variant="ghost" size="sm"><ChevronsRight size={14} aria-hidden="true" /> {area === "student" ? "Ver página del curso" : "Volver al estudio del curso"}</LinkButton>
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

function Outline({ course, currentId, onPick }: { course: CourseDetail; currentId?: string; onPick: (id: string) => void }) {
  return (
    <nav className="flex flex-col gap-3" aria-label="Lecciones">
      {course.modules.map((m, mi) => (
        <Card key={m.id} className="p-3">
          <h2 className="px-2 pb-1 pt-1 text-sm font-extrabold">{mi + 1}. {m.title}</h2>
          <ul className="flex flex-col gap-0.5">
            {m.lessons.map((l) => {
              const openL = course.access.canViewAll || l.isPreview
              const cur = l.id === currentId
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    disabled={!openL}
                    onClick={() => onPick(l.id)}
                    aria-current={cur ? "true" : undefined}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm font-bold disabled:opacity-55"
                    style={{ background: cur ? "var(--l-brand-50)" : "transparent", color: cur ? "var(--l-tint-ink)" : "var(--l-ink)" }}
                  >
                    {l.completed ? <CheckCircle2 size={17} aria-hidden="true" style={{ color: "var(--l-mint)" }} /> : cur ? <Play size={17} aria-hidden="true" style={{ color: "var(--l-brand)" }} /> : openL ? <Circle size={17} aria-hidden="true" style={{ color: "#9aa5b8" }} /> : <Lock size={17} aria-hidden="true" style={{ color: "#9aa5b8" }} />}
                    <span className="min-w-0 flex-1 break-words">{l.title}</span>
                    <span className="sr-only">{l.completed ? "Completada" : cur ? "Actual" : !openL ? "Bloqueada" : ""}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      ))}
    </nav>
  )
}

/** Reproductor del curso: el MISMO para estudiantes y para la «vista de instructor» (cada área lo monta en su shell). */
export default function Player() {
  return (
    <Suspense fallback={<Skeleton className="aspect-video w-full !rounded-3xl" />}>
      <PlayerInner />
    </Suspense>
  )
}
