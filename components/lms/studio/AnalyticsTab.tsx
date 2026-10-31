"use client"

import { useAnalytics } from "@/lib/lms/hooks"
import { Award, CheckCircle2, Clock, GraduationCap, Users } from "lucide-react"
import { Badge, Card, EmptyState, ErrorPanel, IconTile, Skeleton, rise } from "@/components/lms/ui"
import { secondsLabel } from "@/lib/lms/format"
import { QUESTION_TYPE_LABEL } from "@/lib/lms/validation"
import { BarChart, HBars } from "./charts"

const BUCKETS = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-100"]

export default function AnalyticsTab({ courseId }: { courseId: string }) {
  const { data, error, mutate } = useAnalytics(courseId)
  if (error) return <ErrorPanel title="No pudimos cargar la analítica" onRetry={() => mutate()} />
  if (!data) return <Skeleton className="h-72 !rounded-[22px]" />

  const n = Math.max(data.enrolled, 1)
  const steps = data.lessons.map((l, i) => ({ ...l, pct: Math.round((l.completions * 100) / n), drop: i === 0 ? 0 : Math.round(((data.lessons[i - 1].completions - l.completions) * 100) / n) }))
  const worst = steps.slice(1).reduce<(typeof steps)[number] | null>((w, s) => (s.drop > (w?.drop ?? 0) ? s : w), null)
  const tiles = [
    { tone: "brand" as const, icon: <Users size={20} />, label: "Matriculados", value: String(data.enrolled) },
    { tone: "amber" as const, icon: <GraduationCap size={20} />, label: "Avance promedio", value: `${data.avgProgress}%` },
    { tone: "sky" as const, icon: <CheckCircle2 size={20} />, label: "Terminaron el curso", value: `${data.completionRate}%` },
    { tone: "mint" as const, icon: <Award size={20} />, label: "Certificados", value: String(data.certificates) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Resumen" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tiles.map((t, i) => (
          <Card key={t.label} className="k-tile l-rise" style={rise(i)}>
            <div><p className="text-sm font-bold" style={{ color: "var(--l-muted)" }}>{t.label}</p><p className="mt-1 text-2xl font-extrabold">{t.value}</p></div>
            <IconTile tone={t.tone} size={42}>{t.icon}</IconTile>
          </Card>
        ))}
      </section>

      <Card className="p-5">
        <h2 className="text-lg font-extrabold">¿Dónde se quedan los estudiantes?</h2>
        <p className="mb-4 text-sm" style={{ color: "var(--l-muted)" }}>Porcentaje de matriculados que completó cada lección, en el orden del curso.</p>
        {data.lessons.length === 0 ? <p className="text-sm" style={{ color: "var(--l-muted)" }}>El curso aún no tiene lecciones.</p> : data.enrolled === 0 ? <p className="text-sm" style={{ color: "var(--l-muted)" }}>Cuando haya matriculados verás aquí el embudo.</p> : (
          <>
            <HBars summary="Lecciones completadas por porcentaje de matriculados" rows={steps.map((s, i) => ({ label: `${i + 1}. ${s.title}`, percent: s.pct, text: `${s.completions} de ${data.enrolled} · ${s.pct}%`, sub: s.drop >= 10 ? `Pierde ${s.drop} puntos respecto a la anterior` : undefined }))} />
            {worst && worst.drop >= 10 && <p role="note" className="mt-4 rounded-2xl p-3 text-sm font-bold" style={{ background: "var(--l-amber-bg)", color: "var(--l-amber-ink)" }}>Mayor abandono: «{worst.title}» (−{worst.drop} puntos). Revisa si es demasiado larga o difícil.</p>}
          </>
        )}
      </Card>

      {data.topFailed && data.topFailed.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-extrabold">Preguntas más falladas</h2>
          <p className="mb-4 text-sm" style={{ color: "var(--l-muted)" }}>Las que más estudiantes responden mal: buenas candidatas para reforzar la lección o mejorar el enunciado.</p>
          <HBars tone="rose" summary="Preguntas con mayor porcentaje de error" rows={data.topFailed.map((f) => ({ label: f.prompt, percent: f.failPct, text: `${f.failPct}% fallan`, sub: `${QUESTION_TYPE_LABEL[f.type]} · ${f.quizTitle} · ${f.responses} respuestas` }))} />
        </Card>
      )}

      {data.quizzes.length === 0 ? <EmptyState title="Sin evaluaciones" description="Crea una evaluación para ver notas, aprobación y preguntas difíciles." /> : data.quizzes.map((q) => (
        <Card key={q.id} className="flex flex-col gap-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-extrabold">{q.title}</h2><Badge tone="neutral">Mínimo {q.passingScore}%</Badge></div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Intentos enviados", String(q.submissions)], ["Nota promedio", `${q.avgScore}%`], ["Aprobación", `${q.passRate}%`], ["Tiempo medio", secondsLabel(q.avgSeconds)]].map(([k, v]) => (
              <div key={k} className="rounded-2xl p-3" style={{ background: "var(--l-bg)" }}><dt className="flex items-center gap-1 text-xs font-bold" style={{ color: "var(--l-muted)" }}>{k === "Tiempo medio" && <Clock size={12} aria-hidden="true" />}{k}</dt><dd className="text-xl font-extrabold">{v}</dd></div>
            ))}
          </dl>
          {q.submissions === 0 ? <p className="text-sm" style={{ color: "var(--l-muted)" }}>Aún nadie ha presentado esta evaluación.</p> : (
            <>
              <div>
                <h3 className="mb-2 text-sm font-extrabold">Distribución de notas</h3>
                <div className="max-w-xl"><BarChart labels={BUCKETS} values={q.scoreBuckets ?? new Array(10).fill(0)} summary={`Distribución de notas de ${q.title}: ${(q.scoreBuckets ?? []).map((v, i) => `${BUCKETS[i]} ${v}`).join(", ")}`} /></div>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-extrabold">Acierto por pregunta</h3>
                <ul className="flex flex-col gap-3">
                  {q.questions.map((x, i) => (
                    <li key={x.id} className="rounded-2xl border p-3" style={{ borderColor: "var(--l-line)" }}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="min-w-0 break-words text-sm font-bold">{i + 1}. {x.prompt}</p><span className="shrink-0 text-sm font-extrabold">{x.responses ? `${x.correctPct}% acierta` : "Sin respuestas"}</span></div>
                      <p className="l-hint">{x.type ? QUESTION_TYPE_LABEL[x.type] : ""} · {x.responses} respuestas</p>
                      {x.options.length > 0 && x.responses > 0 && (
                        <details className="mt-2"><summary className="cursor-pointer text-xs font-extrabold">Ver qué eligieron</summary>
                          <div className="mt-2"><HBars summary={`Opciones elegidas en la pregunta ${i + 1}`} rows={x.options.map((o) => ({ label: <>{o.text}{o.isCorrect && <Badge tone="mint" className="ml-2">Correcta</Badge>}</>, percent: o.pct, text: `${o.count} (${o.pct}%)` }))} /></div>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </Card>
      ))}
    </div>
  )
}
