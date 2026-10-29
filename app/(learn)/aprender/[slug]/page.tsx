"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { mutate as globalMutate } from "swr"
import { Award, CheckCircle2, ChevronRight, ClipboardCheck, Circle } from "lucide-react"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import { DocumentButton, LessonBody, VideoPlayer } from "@/components/lms/AssetViews"
import ProgressBar from "@/components/lms/ProgressBar"
import SignInRequired from "@/components/lms/SignInRequired"
import { lms } from "@/lib/lms/api"
import { errorStatus, lmsKeys, useCourse, useCourseQuizzes, useLesson } from "@/lib/lms/hooks"
import { toast } from "@/lib/toast"
import type { CourseDetail } from "@/lib/lms/types"

function Player() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const params = useSearchParams()
  const { data: course, error, mutate: mutateCourse } = useCourse(slug)

  const flat = course?.modules.flatMap((m) => m.lessons) ?? []
  const requested = params.get("l")
  const current = flat.find((l) => l.id === requested) ?? flat.find((l) => !l.completed) ?? flat[0]
  const { data: lesson, error: lessonError, mutate: mutateLesson } = useLesson(course && (course.access.canViewAll || current?.isPreview) ? (current?.id ?? null) : null)
  const { data: quizzes } = useCourseQuizzes(course?.access.canViewAll ? course.id : undefined)
  const [busy, setBusy] = useState(false)

  if (errorStatus(error) === 401) return <SignInRequired message="Inicia sesión para continuar con tu curso." />
  if (errorStatus(error) === 404) return <ErrorState title="Curso no disponible" description="Este curso no existe o aún no está publicado." />
  if (error) return <ErrorState title="No pudimos cargar el curso" onRetry={() => mutateCourse()} />
  if (!course) return <LoadingBlock className="py-12" />

  if (!course.access.canViewAll && !current?.isPreview) {
    return (
      <ErrorState
        title="Aún no tienes acceso a este curso"
        description="Pide tu matrícula para ver las lecciones."
        onRetry={() => router.push(`/cursos/${course.slug}`)}
      />
    )
  }

  const idx = flat.findIndex((l) => l.id === current?.id)
  const next = idx >= 0 ? flat[idx + 1] : undefined
  const go = (id: string) => router.push(`/aprender/${course.slug}?l=${id}`)

  async function complete() {
    if (!lesson) return
    setBusy(true)
    try {
      const r = await lms.completeLesson(lesson.id)
      await Promise.all([mutateLesson(), mutateCourse(), globalMutate(lmsKeys.mine), globalMutate(lmsKeys.certificates)])
      if (r.certificate) toast.success("¡Curso aprobado! Ya tienes tu certificado.")
      else toast.success("Lección completada.")
      if (r.certificate) router.push(`/certificados/${r.certificate.id}`)
      else if (next) go(next.id)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos guardar tu avance.")
    } finally {
      setBusy(false)
    }
  }

  const videos = lesson?.assets.filter((a) => a.kind === "video") ?? []
  const subtitles = lesson?.assets.filter((a) => a.kind === "subtitle") ?? []
  const docs = lesson?.assets.filter((a) => a.kind === "document") ?? []

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-24" aria-label="Contenido del curso">
        <div className="flex flex-col gap-2">
          <Link href={`/cursos/${course.slug}`} className="text-xs underline" style={{ color: "var(--text-muted)" }}>← {course.title}</Link>
          {course.progress && <ProgressBar completed={course.progress.completed} total={course.progress.total} />}
        </div>
        <Outline course={course} currentId={current?.id} onPick={go} />
        {quizzes && quizzes.length > 0 && (
          <Card className="!p-4">
            <h2 className="mb-2 text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>EVALUACIONES</h2>
            <ul className="flex flex-col gap-1">
              {quizzes.map((q) => (
                <li key={q.id}>
                  <Link href={`/evaluacion/${q.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:underline" style={{ color: "var(--text-primary)" }}>
                    <ClipboardCheck size={16} aria-hidden="true" />
                    <span className="min-w-0 flex-1 break-words">{q.title}</span>
                    {q.passed ? <Badge variant="success">Aprobada</Badge> : q.required ? <Badge variant="warning">Pendiente</Badge> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </aside>

      <section className="flex min-w-0 flex-col gap-5" aria-live="polite">
        {lessonError ? (
          <ErrorState
            title={errorStatus(lessonError) === 403 ? "No tienes acceso a esta lección" : "No pudimos cargar la lección"}
            onRetry={() => mutateLesson()}
          />
        ) : !lesson ? (
          <LoadingBlock className="py-12" />
        ) : (
          <>
            <header className="flex flex-col gap-1">
              {lesson.isPreview && !course.access.canViewAll && <Badge variant="success">Vista previa gratuita</Badge>}
              <h1 className="font-display text-xl font-bold text-balance sm:text-2xl" style={{ color: "var(--text-primary)" }}>{lesson.title}</h1>
            </header>
            {videos[0] && <VideoPlayer lessonId={lesson.id} video={videos[0]} subtitles={subtitles} />}
            <LessonBody body={lesson.body} />
            {docs.length > 0 && (
              <div className="flex flex-col items-start gap-2">
                <h2 className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>MATERIAL</h2>
                {docs.map((d, i) => <DocumentButton key={d.id} lessonId={lesson.id} asset={d} index={i} />)}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {lesson.completed ? (
                <Badge variant="success"><CheckCircle2 size={14} className="mr-1 inline" aria-hidden="true" />Completada</Badge>
              ) : (
                <Button onClick={complete} loading={busy}>Marcar como completada</Button>
              )}
              {next && (course.access.canViewAll || next.isPreview) && (
                <Button variant="ghost" onClick={() => go(next.id)}>Siguiente lección <ChevronRight size={16} aria-hidden="true" /></Button>
              )}
              {course.progress && course.progress.completed === course.progress.total && (
                <Link href="/mis-cursos" className="inline-flex items-center gap-1 text-sm underline" style={{ color: "var(--accent)" }}>
                  <Award size={16} aria-hidden="true" /> Ver mis certificados
                </Link>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function Outline({ course, currentId, onPick }: { course: CourseDetail; currentId?: string; onPick: (id: string) => void }) {
  return (
    <nav className="flex flex-col gap-3" aria-label="Lecciones">
      {course.modules.map((m) => (
        <Card key={m.id} className="!p-4">
          <h2 className="mb-2 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{m.title}</h2>
          <ul className="flex flex-col gap-0.5">
            {m.lessons.map((l) => {
              const open = course.access.canViewAll || l.isPreview
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    disabled={!open}
                    onClick={() => onPick(l.id)}
                    aria-current={l.id === currentId ? "true" : undefined}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm disabled:opacity-50"
                    style={{ background: l.id === currentId ? "var(--accent-light)" : "transparent", color: l.id === currentId ? "var(--accent-text)" : "var(--text-primary)" }}
                  >
                    {l.completed ? <CheckCircle2 size={16} aria-hidden="true" style={{ color: "#059669" }} /> : <Circle size={16} aria-hidden="true" />}
                    <span className="min-w-0 flex-1 break-words">{l.title}</span>
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

export default function AprenderPage() {
  return (
    <Suspense fallback={<LoadingBlock className="py-12" />}>
      <Player />
    </Suspense>
  )
}
