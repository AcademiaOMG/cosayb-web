"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import useSWR, { mutate as globalMutate } from "swr"
import { Award, CheckCircle2, ChevronLeft, ChevronRight, Clock, RotateCcw, XCircle } from "lucide-react"
import SignInRequired from "@/components/lms/SignInRequired"
import InstructorBanner from "@/components/lms/InstructorBanner"
import { useArea, usePaths } from "@/components/lms/shell/area"
import { homeFor } from "@/lib/lms/roles"
import Confetti from "@/components/lms/fx/Confetti"
import CountUp from "@/components/lms/fx/CountUp"
import QuizImage from "@/components/lms/studio/QuizImage"
import { lms } from "@/lib/lms/api"
import { errorStatus, lmsKeys, useLmsAccess } from "@/lib/lms/hooks"
import { isAnswered, splitBlanks, unansweredCount } from "@/lib/lms/validation"
import { toast } from "@/lib/toast"
import type { AttemptQuestion, AttemptResult, RevealedKey, StudentAnswer } from "@/lib/lms/types"
import { Badge, Button, Card, Donut, ErrorPanel, LinkButton, ProgressBar, Skeleton } from "@/components/lms/ui"

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`

/** Reloj del intento: cuenta atrás si hay límite de tiempo (el servidor decide; esto es solo ayuda visual), cronómetro si no. */
function Clock_({ startedAt, expiresAt, onExpire }: { startedAt: number; expiresAt: number | null; onExpire: () => void }) {
  const [now, setNow] = useState(startedAt)
  const fired = useRef(false)
  const expireRef = useRef(onExpire)
  useEffect(() => {
    expireRef.current = onExpire
  })
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  const left = expiresAt === null ? null : Math.ceil((expiresAt - now) / 1000)
  useEffect(() => {
    if (left !== null && left <= 0 && !fired.current) {
      fired.current = true
      expireRef.current()
    }
  }, [left])
  const text = left === null ? mmss(Math.floor((now - startedAt) / 1000)) : mmss(left)
  const urgent = left !== null && left <= 60
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold" style={{ color: urgent ? "var(--l-rose-ink)" : undefined }} role={left !== null ? "timer" : undefined} aria-label={left !== null ? `Tiempo restante ${text}` : undefined}>
      <Clock size={14} aria-hidden="true" />{text}
    </span>
  )
}

function Option({ checked, shape, label, imageId, onChange, name, index, hasImage }: { checked: boolean; shape: "radio" | "checkbox"; label: string; imageId?: string | null; onChange: () => void; name: string; index: number; hasImage?: boolean }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition-all focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-[var(--l-brand)] ${checked ? "l-pop" : ""}`} style={{ borderColor: checked ? "var(--l-brand)" : "var(--l-line)", background: checked ? "var(--l-brand-50)" : "#fff" }}>
      <input type={shape} className="sr-only" name={name} checked={checked} onChange={onChange} />
      <span aria-hidden="true" className={`inline-flex h-8 w-8 shrink-0 items-center justify-center text-sm font-extrabold ${shape === "radio" ? "rounded-full" : "rounded-lg"}`} style={{ background: checked ? "var(--l-brand)" : "var(--l-bg)", color: checked ? "#fff" : "var(--l-ink-2)" }}>{String.fromCharCode(65 + index)}</span>
      {hasImage && imageId && <QuizImage id={imageId} alt={label} className="h-16 w-24 shrink-0 rounded-xl object-cover" />}
      <span className="min-w-0 flex-1 break-words font-bold">{label}</span>
      {checked && <CheckCircle2 size={20} aria-hidden="true" style={{ color: "var(--l-brand)" }} />}
    </label>
  )
}

/** Una pregunta según su tipo. El estado vive en el padre (answers). */
function QuestionView({ q, value, onChange }: { q: AttemptQuestion; value: StudentAnswer | undefined; onChange: (v: StudentAnswer) => void }) {
  const type = q.type ?? "single"
  const hasImg = q.options.some((o) => o.imageId)
  return (
    <fieldset>
      <legend className="mb-4 text-xl font-extrabold leading-snug sm:text-2xl">
        {type === "fill_blank" ? <span className="break-words">Completa los espacios</span> : <span className="break-words">{q.prompt}</span>}
        <span className="ml-2 align-middle text-xs font-bold" style={{ color: "var(--l-muted)" }}>{q.points} pt{q.points > 1 ? "s" : ""}{q.required ? " · obligatoria" : ""}</span>
      </legend>
      {q.imageId && <QuizImage id={q.imageId} alt="Imagen de la pregunta" className="mb-4 max-h-72 w-full rounded-2xl object-contain" style={{ background: "var(--l-bg)" }} />}

      {(type === "single" || type === "true_false") && (
        <div className="flex flex-col gap-3">
          {q.options.map((o, i) => <Option key={o.id} name={`q-${q.id}`} shape="radio" index={i} label={o.text} imageId={o.imageId} hasImage={hasImg} checked={value?.optionId === o.id} onChange={() => onChange({ optionId: o.id })} />)}
        </div>
      )}
      {type === "multiple" && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-bold" style={{ color: "var(--l-muted)" }}>Puede haber más de una respuesta correcta.</p>
          {q.options.map((o, i) => {
            const cur = value?.optionIds ?? []
            const on = cur.includes(o.id)
            return <Option key={o.id} name={`q-${q.id}-${o.id}`} shape="checkbox" index={i} label={o.text} imageId={o.imageId} hasImage={hasImg} checked={on} onChange={() => onChange({ optionIds: on ? cur.filter((x) => x !== o.id) : [...cur, o.id] })} />
          })}
        </div>
      )}
      {type === "short_text" && (
        <div className="flex flex-col gap-2">
          <label htmlFor={`t-${q.id}`} className="sr-only">Tu respuesta</label>
          <input id={`t-${q.id}`} className="l-input !min-h-14 text-lg" type="text" autoComplete="off" maxLength={300} placeholder="Escribe tu respuesta…" value={value?.text ?? ""} onChange={(e) => onChange({ text: e.target.value })} />
          <p className="l-hint">No importan las mayúsculas ni las tildes.</p>
        </div>
      )}
      {type === "fill_blank" && (
        <div className="flex flex-col gap-4">
          <p className="rounded-2xl p-4 text-lg leading-[2.4]" style={{ background: "var(--l-bg)" }}>
            {splitBlanks(q.prompt).map((p, i) => "text" in p ? <span key={i}>{p.text}</span> : (
              <span key={i} className="mx-1 inline-block align-middle">
                <label className="sr-only" htmlFor={`b-${q.id}-${p.blank}`}>Hueco {p.blank}</label>
                <select id={`b-${q.id}-${p.blank}`} className="l-input l-select !min-h-10 !w-auto min-w-[140px] font-bold" value={value?.blanks?.[p.blank] ?? ""} onChange={(e) => onChange({ blanks: { ...(value?.blanks ?? {}), [p.blank]: e.target.value } })}>
                  <option value="">({p.blank}) elige…</option>
                  {q.options.map((o) => <option key={o.id} value={o.id}>{o.text}</option>)}
                </select>
              </span>
            ))}
          </p>
          <p className="l-hint">Fichas disponibles: {q.options.map((o) => o.text).join(" · ")}</p>
        </div>
      )}
    </fieldset>
  )
}

/** Lo que respondió la persona, en texto, para la revisión. */
function answerText(q: AttemptQuestion, a: StudentAnswer | undefined): string {
  if (!a) return "Sin responder"
  const txt = (id?: string) => q.options.find((o) => o.id === id)?.text ?? "—"
  if (a.optionId) return txt(a.optionId)
  if (a.optionIds?.length) return a.optionIds.map(txt).join(", ")
  if (a.text) return a.text
  if (a.blanks) return Object.entries(a.blanks).filter(([, v]) => v).map(([k, v]) => `(${k}) ${txt(v)}`).join(" · ") || "Sin responder"
  return "Sin responder"
}

function keyText(q: AttemptQuestion, k: RevealedKey): string {
  const txt = (id: string) => q.options.find((o) => o.id === id)?.text ?? ""
  if (k.blanks) return Object.entries(k.blanks).map(([n, opts]) => `(${n}) ${opts.join(" / ")}`).join(" · ")
  if (k.optionIds?.length) return k.optionIds.map(txt).filter(Boolean).join(", ")
  return (k.texts ?? []).join(" / ")
}

/** Evaluación: la MISMA pantalla del estudiante, también en la «vista de instructor» (cada área la monta en su shell). */
export default function QuizRunner() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const area = useArea()
  const paths = usePaths()
  const { data: access } = useLmsAccess(area === "student")
  const { data: quiz, error, mutate } = useSWR(`lms/quiz/${id}`, () => lms.quiz(id), { revalidateOnFocus: false })
  const [attempt, setAttempt] = useState<{ id: string; questions: AttemptQuestion[]; startedAt: number; expiresAt: number | null } | null>(null)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({})
  const [result, setResult] = useState<{ r: AttemptResult; questions: AttemptQuestion[]; answers: Record<string, StudentAnswer> } | null>(null)
  const [showTimer, setShowTimer] = useState(true)
  const [confirmMissing, setConfirmMissing] = useState(false)
  const [busy, setBusy] = useState(false)
  // Un instructor/administrador que abre la evaluación por la URL de estudiante pasa a SU área (sin menú de estudiante)
  const toStaff = area === "student" && quiz?.instructorView && access ? `${homeFor(access)}/ver/evaluacion/${id}` : null
  useEffect(() => {
    if (toStaff) router.replace(toStaff)
  }, [toStaff, router])
  const latest = useRef({ attempt, answers })
  useEffect(() => {
    latest.current = { attempt, answers }
  })

  if (errorStatus(error) === 401) return <SignInRequired message="Inicia sesión para presentar la evaluación." />
  if (errorStatus(error) === 403) return <ErrorPanel title="Sin acceso" description="Necesitas estar matriculado en el curso para presentar esta evaluación." />
  if (errorStatus(error) === 404) return <ErrorPanel title="Evaluación no disponible" description="No existe o el curso no está publicado." />
  if (error) return <ErrorPanel title="No pudimos cargar la evaluación" onRetry={() => mutate()} />
  if (!quiz) return <Skeleton className="mx-auto h-80 w-full max-w-3xl !rounded-[22px]" />

  const iv = Boolean(quiz.instructorView)
  const backHref = area === "student" ? "/evaluaciones" : `${paths.course(quiz.courseId, "")}?tab=quizzes`
  const backLabel = area === "student" ? "Mis evaluaciones" : "Volver al estudio"
  const banner = iv ? <InstructorBanner backHref={backHref} what="esta evaluación" /> : null
  // Intentos de prueba del instructor: ilimitados y descartables
  const attemptsLeft = iv || quiz.maxAttempts === null ? null : Math.max(quiz.maxAttempts - quiz.attemptsUsed, 0)

  async function start() {
    setBusy(true)
    try {
      const a = await lms.startAttempt(id)
      setAttempt({ id: a.attemptId, questions: a.questions, startedAt: Date.now(), expiresAt: a.expiresAt ? new Date(a.expiresAt).getTime() : null })
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
    const { attempt: att, answers: ans } = latest.current
    if (!att) return
    setBusy(true)
    try {
      const r = await lms.submitAttempt(att.id, ans)
      setResult({ r, questions: att.questions, answers: ans })
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
        {banner}
        <Card className="relative overflow-hidden p-8 text-center">
          {passed && <Confetti />}
          <div className="relative flex flex-col items-center gap-4" role="status">
            <Donut value={score} tone={passed ? "mint" : "amber"} size={150} stroke={14} label="Tu nota">
              <span className="text-3xl font-extrabold"><CountUp to={score} suffix="%" /></span>
            </Donut>
            <h1 className="text-2xl font-extrabold sm:text-3xl">{r.expired ? "Se acabó el tiempo" : passed ? "¡Aprobaste!" : "Casi lo logras"}</h1>
            <p className="max-w-md whitespace-pre-wrap break-words text-sm" style={{ color: "var(--l-muted)" }}>
              {r.expired ? "El tiempo límite terminó antes de enviar y las respuestas no cuentan. Puedes intentarlo de nuevo si te quedan intentos." : r.message?.trim() ? r.message : passed ? "Excelente trabajo. Dominas este tema." : `Necesitas ${r.passingScore}% para aprobar. Repasa las explicaciones y vuelve a intentarlo: cada intento te acerca.`}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {r.preview && <Badge tone="amber">Intento de prueba: no se guardó</Badge>}
              {r.certificate && <LinkButton href={`/certificados/${r.certificate.id}`}><Award size={16} aria-hidden="true" /> Ver mi certificado</LinkButton>}
              {!passed && (attemptsLeft === null || attemptsLeft - 1 > 0) && <Button onClick={start} loading={busy}><RotateCcw size={16} aria-hidden="true" /> Intentar de nuevo</Button>}
              <LinkButton href={backHref} variant="ghost">{backLabel}</LinkButton>
            </div>
          </div>
        </Card>

        <section aria-labelledby="rev" className="flex flex-col gap-3">
          <h2 id="rev" className="text-lg font-extrabold">Revisión de respuestas</h2>
          {questions.map((q, i) => {
            const res = r.results?.find((x) => x.questionId === q.id)
            const key = r.reveal?.find((x) => x.questionId === q.id)
            return (
              <Card key={q.id} className="l-rise p-5" style={{ ["--i" as string]: i }}>
                <div className="flex items-start gap-3">
                  {res?.correct ? <CheckCircle2 size={22} aria-hidden="true" style={{ color: "var(--l-mint)" }} /> : <XCircle size={22} aria-hidden="true" style={{ color: "var(--l-rose)" }} />}
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold"><span className="sr-only">{res?.correct ? "Correcta. " : "Incorrecta. "}</span>{i + 1}. {q.type === "fill_blank" ? splitBlanks(q.prompt).map((p) => ("text" in p ? p.text : `[${p.blank}]`)).join("") : q.prompt}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Tu respuesta: <strong style={{ color: "var(--l-ink)" }}>{answerText(q, result.answers[q.id])}</strong></p>
                    {key && !res?.correct && <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Respuesta correcta: <strong style={{ color: "var(--l-mint-ink)" }}>{keyText(q, key)}</strong></p>}
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
    const answeredCount = attempt.questions.filter((x) => isAnswered(x, answers[x.id])).length
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        {banner}
        <div className="flex items-center gap-3">
          <span className="text-sm font-extrabold">Pregunta {step + 1} de {total}</span>
          <div className="flex-1"><ProgressBar value={(answeredCount * 100) / total} label="Preguntas respondidas" /></div>
          {attempt.expiresAt !== null ? (
            <Clock_ startedAt={attempt.startedAt} expiresAt={attempt.expiresAt} onExpire={() => void submit()} />
          ) : (
            <button type="button" className="l-chip" aria-pressed={showTimer} onClick={() => setShowTimer((v) => !v)}>{showTimer ? <Clock_ startedAt={attempt.startedAt} expiresAt={null} onExpire={() => undefined} /> : <><Clock size={14} aria-hidden="true" /> Cronómetro</>}</button>
          )}
        </div>

        <Card className="l-page p-6 sm:p-8" key={q.id}>
          <QuestionView q={q} value={answers[q.id]} onChange={(v) => { setAnswers((a) => ({ ...a, [q.id]: v })); setConfirmMissing(false) }} />
        </Card>

        {confirmMissing && missing > 0 && (
          <div role="alert" className="rounded-2xl p-4 text-sm font-bold" style={{ background: "var(--l-amber-bg)", color: "var(--l-amber-ink)" }}>
            Te faltan {missing} pregunta{missing > 1 ? "s" : ""} por responder. Puedes volver a ellas o enviar así{attempt.questions.some((x) => x.required && !isAnswered(x, answers[x.id])) ? ", pero hay preguntas obligatorias sin responder" : ""}.
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}><ChevronLeft size={16} aria-hidden="true" /> Anterior</Button>
          <div className="hidden flex-wrap justify-center gap-1.5 sm:flex" aria-hidden="true">
            {attempt.questions.map((x, i) => <span key={x.id} className="h-2.5 w-2.5 rounded-full" style={{ background: i === step ? "var(--l-brand)" : isAnswered(x, answers[x.id]) ? "var(--l-brand-100)" : "var(--l-line)" }} />)}
          </div>
          {last ? (
            missing > 0 && !confirmMissing ? (
              <Button onClick={() => setConfirmMissing(true)}>Finalizar</Button>
            ) : (
              <Button onClick={() => void submit()} loading={busy}>{missing > 0 ? "Enviar de todos modos" : "Enviar respuestas"}</Button>
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
      {banner}
      <Card className="flex flex-col items-center gap-4 p-8 text-center">
        <Donut value={quiz.bestScore ?? 0} tone={quiz.passed ? "mint" : "brand"} size={110} stroke={11} label="Mejor nota" />
        <div>
          <h1 className="text-balance text-2xl font-extrabold sm:text-3xl">{quiz.title}</h1>
          {quiz.description && <p className="mx-auto mt-1 max-w-xl whitespace-pre-wrap break-words text-sm" style={{ color: "var(--l-muted)" }}>{quiz.description}</p>}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Badge tone="neutral">{quiz.questionCount} preguntas</Badge>
          <Badge tone="neutral">Nota mínima {quiz.passingScore}%</Badge>
          <Badge tone="neutral">{iv ? "Intentos de prueba ilimitados" : quiz.maxAttempts === null ? "Intentos ilimitados" : `Intentos: ${quiz.attemptsUsed}/${quiz.maxAttempts}`}</Badge>
          {quiz.timeLimitMinutes ? <Badge tone="amber"><Clock size={12} aria-hidden="true" /> {quiz.timeLimitMinutes} min</Badge> : null}
          {quiz.passed && <Badge tone="mint">Aprobada · mejor nota {quiz.bestScore}%</Badge>}
        </div>
        {quiz.timeLimitMinutes ? <p className="max-w-md text-sm font-bold" style={{ color: "var(--l-amber-ink)" }}>Tendrás {quiz.timeLimitMinutes} minutos desde que empieces. Al terminar el tiempo, las respuestas sin enviar no cuentan.</p> : null}
        <Button onClick={start} loading={busy} disabled={quiz.questionCount === 0 || attemptsLeft === 0}>{quiz.attemptsUsed > 0 ? "Intentar de nuevo" : "Comenzar evaluación"}</Button>
        {attemptsLeft === 0 && <p className="text-sm" style={{ color: "var(--l-muted)" }}>Agotaste los intentos de esta evaluación.</p>}
        {quiz.questionCount === 0 && <p className="text-sm" style={{ color: "var(--l-muted)" }}>Esta evaluación aún no tiene preguntas.</p>}
        <Link href={backHref} className="text-sm font-bold" style={{ color: "var(--l-brand)" }}>{area === "student" ? "Volver a mis evaluaciones" : backLabel}</Link>
      </Card>
    </div>
  )
}
