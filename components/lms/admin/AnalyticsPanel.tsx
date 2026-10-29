"use client"

import "@/app/(learn)/lms.css"
import { useState } from "react"
import { Award, Clock, Target, Users } from "lucide-react"
import CountUp from "@/components/lms/fx/CountUp"
import { errorStatus, useAnalytics } from "@/lib/lms/hooks"
import { secondsLabel } from "@/lib/lms/format"
import type { CourseAnalytics, QuestionAnalytics } from "@/lib/lms/types"
import { Card, Donut, EmptyState, ErrorPanel, ProgressBar, Skeleton, Tabs, TONE, type Tone } from "@/components/lms/ui"

function Metric({ icon, label, value, suffix, tone }: { icon: React.ReactNode; label: string; value: number; suffix?: string; tone: Tone }) {
  return (
    <div className="rounded-[22px] p-4" style={{ background: TONE[tone].bg }}>
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: TONE[tone].fg }} aria-hidden="true">{icon}</span>
      <p className="mt-3 text-3xl font-extrabold leading-none" style={{ color: TONE[tone].ink }}><CountUp to={value} suffix={suffix} /></p>
      <p className="mt-1 text-sm font-bold">{label}</p>
    </div>
  )
}

/** Tarjeta de pregunta con barras horizontales por opción (verde = correcta), estilo referencia 9. */
function QuestionCard({ q, n, total }: { q: QuestionAnalytics; n: number; total: number }) {
  const wrong = q.options.filter((o) => !o.isCorrect).reduce((s, o) => s + o.count, 0)
  const right = q.options.filter((o) => o.isCorrect).reduce((s, o) => s + o.count, 0)
  return (
    <Card className="grid gap-5 p-5 lg:grid-cols-[1fr_220px]">
      <div className="min-w-0">
        <p className="mb-1 text-xs font-bold" style={{ color: "var(--l-muted)" }}>Pregunta {n} de {total} · {q.points} {q.points === 1 ? "punto" : "puntos"}</p>
        <p className="mb-4 break-words text-base font-extrabold">{q.prompt}</p>
        <ul className="flex flex-col gap-3">
          {q.options.map((o, i) => (
            <li key={o.id}>
              <p className="mb-1 flex items-center gap-2 text-sm font-bold"><span className="break-words">{o.text}</span>{o.isCorrect && <span className="l-badge" style={{ background: "var(--l-mint-bg)", color: "var(--l-mint-ink)" }}>Correcta</span>}</p>
              <ProgressBar value={o.pct} tone={o.isCorrect ? "mint" : "neutral"} label={`${o.text}: ${o.pct}%`} index={i} height={10} />
              <p className="mt-0.5 text-xs" style={{ color: "var(--l-muted)" }}>{o.count} resp. · {o.pct}%</p>
            </li>
          ))}
        </ul>
      </div>
      <aside className="rounded-2xl p-4" style={{ background: "var(--l-bg)" }} aria-label="Estadísticas de la pregunta">
        <p className="mb-2 font-extrabold">Estadísticas</p>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between"><dt className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--l-mint)" }} />Correctas</dt><dd className="font-extrabold">{right}</dd></div>
          <div className="flex items-center justify-between"><dt className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--l-rose)" }} />Incorrectas</dt><dd className="font-extrabold">{wrong}</dd></div>
          <div className="flex items-center justify-between"><dt>Precisión</dt><dd className="font-extrabold">{q.correctPct}%</dd></div>
        </dl>
      </aside>
    </Card>
  )
}

function QuizSection({ quiz }: { quiz: CourseAnalytics["quizzes"][number] }) {
  const [tab, setTab] = useState<"questions" | "overview">("questions")
  return (
    <section className="flex flex-col gap-4" aria-label={`Evaluación ${quiz.title}`}>
      <Card className="p-5">
        <h3 className="text-lg font-extrabold">{quiz.title}</h3>
        <div className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4">
          <div className="flex items-center gap-3"><Donut value={quiz.avgScore} tone={quiz.avgScore >= quiz.passingScore ? "mint" : "amber"} size={56} stroke={7} label="Nota promedio" /><div><p className="text-xs font-bold" style={{ color: "var(--l-muted)" }}>Nota promedio</p><p className="text-xl font-extrabold">{quiz.avgScore}%</p></div></div>
          <div className="flex items-center gap-3"><Donut value={quiz.passRate} tone="mint" size={56} stroke={7} label="Tasa de aprobación" /><div><p className="text-xs font-bold" style={{ color: "var(--l-muted)" }}>Aprobación</p><p className="text-xl font-extrabold">{quiz.passRate}%</p></div></div>
          <div><p className="text-xs font-bold" style={{ color: "var(--l-muted)" }}>Envíos</p><p className="text-xl font-extrabold">{quiz.submissions}</p></div>
          <div><p className="text-xs font-bold" style={{ color: "var(--l-muted)" }}>Tiempo medio</p><p className="text-xl font-extrabold">{secondsLabel(quiz.avgSeconds)}</p></div>
        </div>
      </Card>
      <Tabs label="Vista de la evaluación" value={tab} onChange={setTab} tabs={[{ id: "questions", label: "Preguntas" }, { id: "overview", label: "Resumen" }]} />
      {tab === "questions" ? (
        quiz.questions.length === 0 ? <p className="text-sm" style={{ color: "var(--l-muted)" }}>Esta evaluación aún no tiene preguntas.</p> :
        <>
          <p className="text-xs font-bold" style={{ color: "var(--l-muted)" }}>Datos acumulados de todos los intentos enviados (anónimos).</p>
          {quiz.questions.map((q, i) => <QuestionCard key={q.id} q={q} n={i + 1} total={quiz.questions.length} />)}
        </>
      ) : (
        <Card className="p-5">
          <p className="mb-3 font-extrabold">Preguntas con menor precisión</p>
          <ul className="flex flex-col gap-3">
            {[...quiz.questions].sort((a, b) => a.correctPct - b.correctPct).slice(0, 5).map((q, i) => (
              <li key={q.id}><p className="mb-1 break-words text-sm font-bold">{q.prompt}</p><ProgressBar value={q.correctPct} tone={q.correctPct < 50 ? "rose" : q.correctPct < 75 ? "amber" : "mint"} label={`Precisión: ${q.correctPct}%`} index={i} /></li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  )
}

export default function AnalyticsPanel({ courseId }: { courseId: string }) {
  const { data, error, mutate } = useAnalytics(courseId)
  if (errorStatus(error) === 403) return <ErrorPanel title="Sin permisos" description="La analítica requiere permisos de instructor." />
  if (error) return <ErrorPanel title="No pudimos cargar la analítica" onRetry={() => mutate()} />
  if (!data) return <div className="lms-root !min-h-0 !bg-transparent grid gap-4 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32 !rounded-[22px]" />)}</div>
  const max = Math.max(1, ...data.lessons.map((l) => l.completions))
  return (
    <div className="lms-root !min-h-0 flex flex-col gap-6 !bg-transparent">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric icon={<Users size={18} />} label="Inscritos" value={data.enrolled} tone="brand" />
        <Metric icon={<Target size={18} />} label="Avance promedio" value={data.avgProgress} suffix="%" tone="amber" />
        <Metric icon={<Clock size={18} />} label="Terminaron el curso" value={data.completionRate} suffix="%" tone="sky" />
        <Metric icon={<Award size={18} />} label="Certificados" value={data.certificates} tone="mint" />
      </div>
      {data.enrolled === 0 ? (
        <EmptyState title="Todavía no hay inscritos" description="Cuando matricules estudiantes verás aquí su avance y resultados." />
      ) : (
        <Card className="p-5">
          <h3 className="mb-3 text-lg font-extrabold">Lecciones completadas</h3>
          <ul className="flex flex-col gap-2.5">
            {data.lessons.map((l, i) => (
              <li key={l.id} className="grid grid-cols-[minmax(0,1fr)_minmax(80px,40%)_auto] items-center gap-3 text-sm">
                <span className="truncate font-bold" title={l.title}>{l.title}</span>
                <ProgressBar value={(l.completions * 100) / max} label={`${l.title}: ${l.completions}`} index={i} tone="brand" />
                <span className="w-8 text-right font-extrabold">{l.completions}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {data.quizzes.map((q) => <QuizSection key={q.id} quiz={q} />)}
    </div>
  )
}
