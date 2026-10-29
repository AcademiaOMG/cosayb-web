"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR, { mutate as globalMutate } from "swr"
import { Award, CheckCircle2, ChevronLeft, ChevronRight, Clock, RotateCcw, XCircle } from "lucide-react"
import SignInRequired from "@/components/lms/SignInRequired"
import Confetti from "@/components/lms/fx/Confetti"
import CountUp from "@/components/lms/fx/CountUp"
import { lms } from "@/lib/lms/api"
import { errorStatus, lmsKeys } from "@/lib/lms/hooks"
import { unansweredCount } from "@/lib/lms/validation"
import { toast } from "@/lib/toast"
import type { AttemptQuestion, AttemptResult } from "@/lib/lms/types"
import { Badge, Button, Card, Donut, ErrorPanel, LinkButton, ProgressBar, Skeleton } from "@/components/lms/ui"

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

/** Cronómetro visual opcional (solo informativo: el servidor no limita el tiempo). */
function Stopwatch({ since }: { since: number }) {
  const [now, setNow] = useState(since)
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return <span className="font-mono text-sm font-bold" aria-hidden="true">{mmss(Math.max(0, Math.floor((now - since) / 1000)))}</span>
}

export default function EvaluacionPage() {
  const { id } = useParams<{ id: string }>()
  const { data: quiz, error, mutate } = useSWR(`lms/quiz/${id}`, () => lms.quiz(id), { revalidateOnFocus: false })
  const [attempt, setAttempt] = useState<{ id: string; questions: AttemptQuestion[]; startedAt: number } | null>(null)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ r: AttemptResult; questions: AttemptQuestion[]; answers: Record<string, string> } | null>(null)
  const [showTimer, setShowTimer] = useState(true)
  const [confirmMissing, setConfirmMissing] = useState(false)
  const [busy, setBusy] = useState(false)

  if (errorStatus(error) === 401) return <SignInRequired message="Inicia sesión para presentar la evaluación." />
  if (errorStatus(error) === 403) return <ErrorPanel title="Sin acceso" description="Necesitas estar matriculado en el curso para presentar esta evaluación." />
  if (errorStatus(error) === 404) return <ErrorPanel title="Evaluación no disponible" description="No existe o el curso no está publicado." />
  if (error) return <ErrorPanel title="No pudimos cargar la evaluación" onRetry={() => mutate()} />
  if (!quiz) return <Skeleton className="mx-auto h-80 w-full max-w-3xl !rounded-[22px]" />

  const attemptsLeft = quiz.maxAttempts === null ? null : Math.max(quiz.maxAttempts - quiz.attemptsUsed, 0)

  async function start() {
    setBusy(true)
    try {
      const a = await lms.startAttempt(id)
      setAttempt({ id: a.attemptId, questions: a.questions, startedAt: Date.now() })
      setAnswers({})
      setStep(0)
      setResult(null)
      setConfirmMissing(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos iniciar la evaluación.")
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    if (!attempt) return
    setBusy(true)
    try {
      const r = await lms.submitAttempt(attempt.id, answers)
      setResult({ r, questions: attempt.questions, answers })
      setAttempt(null)
      await Promise.all([mutate(), globalMutate(lmsKeys.certificates), globalMutate(lmsKeys.mine), globalMutate(lmsKeys.summary), globalMutate("lms/all-quizzes")])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos enviar tus respuestas.")
    } finally {
      setBusy(false)
    }
  }

  // ─── Resultado ────────────────────────────────────────────────────────────
  if (result) {
    const { r, questions } = result
    const passed = Boolean(r.passed)
    const score = r.score ?? 0
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <Card className="relative overflow-hidden p-8 text-center" >
          {passed && <Confetti />}
          <div className="relative flex flex-col items-center gap-4" role="status">
            <Donut value={score} tone={passed ? "mint" : "amber"} size={150} stroke={14} label="Tu nota">
              <span className="text-3xl font-extrabold"><CountUp to={score} suffix="%" /></span>
            </Donut>
            <h1 className="text-2xl font-extrabold sm:text-3xl">{passed ? "¡Aprobaste!" : "Casi lo logras"}</h1>
            <p className="max-w-md text-sm" style={{ color: "var(--l-muted)" }}>
              {passed ? "Excelente trabajo. Dominas este tema." : `Necesitas ${r.passingScore}% para aprobar. Repasa las explicaciones y vuelve a intentarlo: cada intento te acerca.`}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {r.certificate && <LinkButton href={`/certificados/${r.certificate.id}`}><Award size={16} aria-hidden="true" /> Ver mi certificado</LinkButton>}
              {!passed && (attemptsLeft === null || attemptsLeft - 1 > 0) && <Button onClick={start} loading={busy}><RotateCcw size={16} aria-hidden="true" /> Intentar de nuevo</Button>}
              <LinkButton href="/evaluaciones" variant="ghost">Mis evaluaciones</LinkButton>
            </div>
          </div>
        </Card>

        <section aria-labelledby="rev" className="flex flex-col gap-3">
          <h2 id="rev" className="text-lg font-extrabold">Revisión de respuestas</h2>
          {questions.map((q, i) => {
            const res = r.results?.find((x) => x.questionId === q.id)
            const chosen = q.options.find((o) => o.id === result.answers[q.id])
            return (
              <Card key={q.id} className="l-rise p-5" style={{ ["--i" as string]: i }}>
                <div className="flex items-start gap-3">
                  {res?.correct ? <CheckCircle2 size={22} aria-hidden="true" style={{ color: "var(--l-mint)" }} /> : <XCircle size={22} aria-hidden="true" style={{ color: "var(--l-rose)" }} />}
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold"><span className="sr-only">{res?.correct ? "Correcta. " : "Incorrecta. "}</span>{i + 1}. {q.prompt}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Tu respuesta: <strong style={{ color: "var(--l-ink)" }}>{chosen?.text ?? "Sin responder"}</strong></p>
                    {res?.explanation && <p className="mt-2 rounded-2xl p-3 text-sm" style={{ background: "var(--l-brand-50)", color: "var(--l-ink-2)" }}>{res.explanation}</p>}
                  </div>
                </div>
              </Card>
            )
          })}
        </section>
      </div>
    )
  }

  // ─── Intento en curso: una pregunta por pantalla ──────────────────────────
  if (attempt) {
    const q = attempt.questions[step]
    const total = attempt.questions.length
    const last = step === total - 1
    const missing = unansweredCount(attempt.questions, answers)
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-extrabold">Pregunta {step + 1} de {total}</span>
          <div className="flex-1"><ProgressBar value={(Object.keys(answers).length * 100) / total} label="Preguntas respondidas" /></div>
          <button type="button" className="l-chip" aria-pressed={showTimer} onClick={() => setShowTimer((v) => !v)}>
            <Clock size={14} aria-hidden="true" />{showTimer ? <Stopwatch since={attempt.startedAt} /> : "Cronómetro"}
          </button>
        </div>

        <Card className="l-page p-6 sm:p-8" key={q.id}>
          <fieldset>
            <legend className="mb-5 text-xl font-extrabold leading-snug sm:text-2xl"><span className="break-words">{q.prompt}</span></legend>
            <div className="flex flex-col gap-3">
              {q.options.map((o, oi) => {
                const on = answers[q.id] === o.id
                return (
                  <label key={o.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition-all focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[var(--l-brand)] ${on ? "l-pop" : ""}`} style={{ borderColor: on ? "var(--l-brand)" : "var(--l-line)", background: on ? "var(--l-brand-50)" : "#fff" }}>
                    <input type="radio" className="sr-only" name={`q-${q.id}`} value={o.id} checked={on} onChange={() => { setAnswers((a) => ({ ...a, [q.id]: o.id })); setConfirmMissing(false) }} />
                    <span aria-hidden="true" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold" style={{ background: on ? "var(--l-brand)" : "var(--l-bg)", color: on ? "#fff" : "var(--l-ink-2)" }}>{String.fromCharCode(65 + oi)}</span>
                    <span className="min-w-0 flex-1 break-words font-bold">{o.text}</span>
                    {on && <CheckCircle2 size={20} aria-hidden="true" style={{ color: "var(--l-brand)" }} />}
                  </label>
                )
              })}
            </div>
          </fieldset>
        </Card>

        {confirmMissing && missing > 0 && (
          <div role="alert" className="rounded-2xl p-4 text-sm font-bold" style={{ background: "var(--l-amber-bg)", color: "var(--l-amber-ink)" }}>
            Te faltan {missing} pregunta{missing > 1 ? "s" : ""} por responder. Puedes volver a ellas o enviar así.
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><ChevronLeft size={16} aria-hidden="true" /> Anterior</Button>
          <div className="hidden flex-wrap justify-center gap-1.5 sm:flex" aria-hidden="true">
            {attempt.questions.map((x, i) => <span key={x.id} className="h-2.5 w-2.5 rounded-full" style={{ background: i === step ? "var(--l-brand)" : answers[x.id] ? "var(--l-brand-100)" : "var(--l-line)" }} />)}
          </div>
          {last ? (
            missing > 0 && !confirmMissing ? (
              <Button onClick={() => setConfirmMissing(true)}>Finalizar</Button>
            ) : (
              <Button onClick={submit} loading={busy}>{missing > 0 ? "Enviar de todos modos" : "Enviar respuestas"}</Button>
            )
          ) : (
            <Button onClick={() => setStep((s) => s + 1)}>Siguiente <ChevronRight size={16} aria-hidden="true" /></Button>
          )}
        </div>
      </div>
    )
  }

  // ─── Introducción ─────────────────────────────────────────────────────────
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <Donut value={quiz.bestScore ?? 0} tone={quiz.passed ? "mint" : "brand"} size={110} stroke={11} label="Mejor nota" />
        <div>
          <h1 className="text-balance text-2xl font-extrabold sm:text-3xl">{quiz.title}</h1>
          {quiz.description && <p className="mx-auto mt-1 max-w-xl whitespace-pre-wrap break-words text-sm" style={{ color: "var(--l-muted)" }}>{quiz.description}</p>}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge tone="neutral">{quiz.questionCount} preguntas</Badge>
          <Badge tone="neutral">Nota mínima {quiz.passingScore}%</Badge>
          <Badge tone="neutral">{quiz.maxAttempts === null ? "Intentos ilimitados" : `Intentos: ${quiz.attemptsUsed}/${quiz.maxAttempts}`}</Badge>
          {quiz.passed && <Badge tone="mint">Aprobada · mejor nota {quiz.bestScore}%</Badge>}
        </div>
        <Button onClick={start} loading={busy} disabled={quiz.questionCount === 0 || attemptsLeft === 0}>{quiz.attemptsUsed > 0 ? "Intentar de nuevo" : "Comenzar evaluación"}</Button>
        {attemptsLeft === 0 && <p className="text-sm" style={{ color: "var(--l-muted)" }}>Agotaste los intentos de esta evaluación.</p>}
        {quiz.questionCount === 0 && <p className="text-sm" style={{ color: "var(--l-muted)" }}>Esta evaluación aún no tiene preguntas.</p>}
        <Link href="/evaluaciones" className="text-sm font-bold" style={{ color: "var(--l-brand)" }}>Volver a mis evaluaciones</Link>
      </Card>
    </div>
  )
}
