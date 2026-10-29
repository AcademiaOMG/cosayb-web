"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import useSWR, { mutate as globalMutate } from "swr"
import { Award, CheckCircle2, XCircle } from "lucide-react"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import SignInRequired from "@/components/lms/SignInRequired"
import { lms } from "@/lib/lms/api"
import { errorStatus, lmsKeys } from "@/lib/lms/hooks"
import { unansweredCount } from "@/lib/lms/validation"
import { toast } from "@/lib/toast"
import type { AttemptQuestion, AttemptResult } from "@/lib/lms/types"

export default function EvaluacionPage() {
  const { id } = useParams<{ id: string }>()
  const { data: quiz, error, mutate } = useSWR(`lms/quiz/${id}`, () => lms.quiz(id), { revalidateOnFocus: false })
  const [attempt, setAttempt] = useState<{ id: string; questions: AttemptQuestion[] } | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [busy, setBusy] = useState(false)

  if (errorStatus(error) === 401) return <SignInRequired message="Inicia sesión para presentar la evaluación." />
  if (errorStatus(error) === 403) return <ErrorState title="Sin acceso" description="Necesitas estar matriculado en el curso para presentar esta evaluación." />
  if (errorStatus(error) === 404) return <ErrorState title="Evaluación no disponible" />
  if (error) return <ErrorState title="No pudimos cargar la evaluación" onRetry={() => mutate()} />
  if (!quiz) return <LoadingBlock className="py-12" />

  const attemptsLeft = quiz.maxAttempts === null ? null : Math.max(quiz.maxAttempts - quiz.attemptsUsed, 0)

  async function start() {
    setBusy(true)
    try {
      const a = await lms.startAttempt(id)
      setAttempt({ id: a.attemptId, questions: a.questions })
      setAnswers({})
      setResult(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos iniciar la evaluación.")
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    if (!attempt) return
    const missing = unansweredCount(attempt.questions, answers)
    if (missing > 0 && !window.confirm(`Te faltan ${missing} pregunta(s) por responder. ¿Enviar de todos modos?`)) return
    setBusy(true)
    try {
      const r = await lms.submitAttempt(attempt.id, answers)
      setResult(r)
      setAttempt(null)
      await Promise.all([mutate(), globalMutate(lmsKeys.certificates), globalMutate(lmsKeys.mine)])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No pudimos enviar tus respuestas.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold text-balance sm:text-3xl" style={{ color: "var(--text-primary)" }}>{quiz.title}</h1>
        {quiz.description && <p className="whitespace-pre-wrap break-words text-sm" style={{ color: "var(--text-secondary)" }}>{quiz.description}</p>}
        <div className="flex flex-wrap gap-2">
          <Badge variant="muted">{quiz.questionCount} preguntas</Badge>
          <Badge variant="muted">Nota mínima {quiz.passingScore}%</Badge>
          <Badge variant="muted">{quiz.maxAttempts === null ? "Intentos ilimitados" : `Intentos: ${quiz.attemptsUsed}/${quiz.maxAttempts}`}</Badge>
          {quiz.passed && <Badge variant="success">Aprobada · mejor nota {quiz.bestScore}%</Badge>}
        </div>
      </header>

      {result ? (
        <Card className="flex flex-col gap-4" role="status">
          <div className="flex items-center gap-3">
            {result.passed ? <CheckCircle2 size={28} style={{ color: "#059669" }} aria-hidden="true" /> : <XCircle size={28} style={{ color: "#B91C1C" }} aria-hidden="true" />}
            <div>
              <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{result.passed ? "¡Aprobaste!" : "No alcanzaste la nota mínima"}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Tu nota: {result.score}% (mínimo {result.passingScore}%)</p>
            </div>
          </div>
          {result.certificate && (
            <Link href={`/certificados/${result.certificate.id}`} className="inline-flex items-center gap-2 text-sm font-semibold underline" style={{ color: "var(--accent)" }}>
              <Award size={16} aria-hidden="true" /> Ver mi certificado
            </Link>
          )}
          <ol className="flex flex-col gap-2">
            {result.results?.map((r, i) => (
              <li key={r.questionId} className="flex flex-col gap-0.5 text-sm">
                <span className="flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  {r.correct ? <CheckCircle2 size={16} style={{ color: "#059669" }} aria-hidden="true" /> : <XCircle size={16} style={{ color: "#B91C1C" }} aria-hidden="true" />}
                  Pregunta {i + 1}: {r.correct ? "correcta" : "incorrecta"}
                </span>
                {r.explanation && <span className="whitespace-pre-wrap break-words pl-6 text-xs" style={{ color: "var(--text-muted)" }}>{r.explanation}</span>}
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      {attempt ? (
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          {attempt.questions.map((q, i) => (
            <fieldset key={q.id} className="flex flex-col gap-2 rounded-2xl p-4" style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)" }}>
              <legend className="px-1 text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                <span className="whitespace-pre-wrap break-words">{i + 1}. {q.prompt}</span>
              </legend>
              {q.options.map((o) => (
                <label key={o.id} className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-sm" style={{ background: answers[q.id] === o.id ? "var(--accent-light)" : "transparent", color: "var(--text-primary)" }}>
                  <input type="radio" name={`q-${q.id}`} value={o.id} checked={answers[q.id] === o.id} onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))} className="mt-0.5" />
                  <span className="min-w-0 break-words">{o.text}</span>
                </label>
              ))}
            </fieldset>
          ))}
          <div className="flex justify-end">
            <Button type="submit" loading={busy}>Enviar respuestas</Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-col gap-2">
          <Button onClick={start} loading={busy} disabled={quiz.questionCount === 0 || attemptsLeft === 0} className="self-start">
            {result ? "Intentar de nuevo" : "Comenzar evaluación"}
          </Button>
          {attemptsLeft === 0 && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Agotaste los intentos de esta evaluación.</p>}
          {quiz.questionCount === 0 && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Esta evaluación aún no tiene preguntas.</p>}
        </div>
      )}
    </div>
  )
}
