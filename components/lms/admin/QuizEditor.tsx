"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import LoadingBlock from "@/components/ui/LoadingBlock"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { Check, NumberField, SectionTitle, TextArea, errMsg } from "./ui"
import { lms } from "@/lib/lms/api"
import { useAdminQuizzes } from "@/lib/lms/hooks"
import { validateQuestionDraft } from "@/lib/lms/validation"
import { toast } from "@/lib/toast"
import type { AdminQuiz, QuestionDraft } from "@/lib/lms/types"

const emptyQuestion = (): QuestionDraft => ({ prompt: "", explanation: "", points: 1, options: [{ text: "", isCorrect: true }, { text: "", isCorrect: false }] })

/** Evaluaciones del curso. El instructor ve las respuestas correctas; el estudiante nunca las recibe. */
export default function QuizEditor({ courseId }: { courseId: string }) {
  const { data: quizzes, mutate } = useAdminQuizzes(courseId)
  const confirm = useConfirm()
  const [title, setTitle] = useState("")
  const [busy, setBusy] = useState(false)

  async function create() {
    if (!title.trim()) return toast.warning("Escribe el título de la evaluación.")
    setBusy(true)
    try {
      await lms.admin.createQuiz(courseId, { title: title.trim(), description: "", passingScore: 70, maxAttempts: 3, required: true })
      setTitle("")
      await mutate()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  if (!quizzes) return <LoadingBlock className="py-8" />

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1"><Input label="Nueva evaluación" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Evaluación final" maxLength={200} /></div>
        <Button onClick={create} loading={busy}><Plus size={16} aria-hidden="true" /> Crear</Button>
      </Card>
      {quizzes.length === 0 && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Este curso aún no tiene evaluaciones. Sin evaluaciones obligatorias, el certificado se emite al completar todas las lecciones.</p>}
      {quizzes.map((q) => (
        <QuizCard key={q.id} quiz={q} onChange={() => mutate()} onDelete={async () => {
          if (!(await confirm({ title: "Eliminar evaluación", itemName: q.title, variant: "danger" }))) return
          try {
            await lms.admin.deleteQuiz(q.id)
            await mutate()
          } catch (e) {
            toast.error(errMsg(e))
          }
        }} />
      ))}
    </div>
  )
}

function QuizCard({ quiz, onChange, onDelete }: { quiz: AdminQuiz; onChange: () => void; onDelete: () => void }) {
  const confirm = useConfirm()
  const [meta, setMeta] = useState({ title: quiz.title, passingScore: quiz.passingScore, maxAttempts: quiz.maxAttempts, required: quiz.required })
  const [draft, setDraft] = useState<QuestionDraft | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function saveMeta() {
    setBusy(true)
    try {
      await lms.admin.updateQuiz(quiz.id, meta)
      toast.success("Evaluación guardada.")
      onChange()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  async function saveQuestion() {
    if (!draft) return
    const problem = validateQuestionDraft(draft)
    if (problem) return toast.warning(problem)
    const payload = { ...draft, options: draft.options.filter((o) => o.text.trim()).map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect })) }
    setBusy(true)
    try {
      if (editing) await lms.admin.updateQuestion(editing, payload)
      else await lms.admin.createQuestion(quiz.id, payload)
      setDraft(null)
      setEditing(null)
      onChange()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2"><Input label="Título" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} maxLength={200} /></div>
        <NumberField label="Nota mínima (%)" min={1} max={100} value={meta.passingScore} onChange={(e) => setMeta({ ...meta, passingScore: Number(e.target.value) })} />
        <NumberField label="Intentos (vacío = ilimitados)" min={1} max={50} value={meta.maxAttempts ?? ""} onChange={(e) => setMeta({ ...meta, maxAttempts: e.target.value === "" ? null : Number(e.target.value) })} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Check label="Obligatoria para el certificado" checked={meta.required} onChange={(v) => setMeta({ ...meta, required: v })} />
        <Button size="sm" onClick={saveMeta} loading={busy}>Guardar</Button>
        <Button size="sm" variant="danger" onClick={onDelete}><Trash2 size={14} aria-hidden="true" /> Eliminar</Button>
        {meta.maxAttempts === null && <Badge variant="warning">Con intentos ilimitados es posible deducir las respuestas por ensayo y error</Badge>}
      </div>

      <SectionTitle>PREGUNTAS ({quiz.questions.length})</SectionTitle>
      <ol className="flex flex-col gap-3">
        {quiz.questions.map((q, i) => (
          <li key={q.id} className="rounded-xl p-3" style={{ background: "var(--bg-secondary)" }}>
            <p className="whitespace-pre-wrap break-words text-sm font-medium" style={{ color: "var(--text-primary)" }}>{i + 1}. {q.prompt} <span style={{ color: "var(--text-muted)" }}>({q.points} pt)</span></p>
            <ul className="mt-1 flex flex-col gap-0.5 text-sm">
              {q.options.map((o) => (
                <li key={o.id} className="break-words" style={{ color: o.isCorrect ? "#065F46" : "var(--text-secondary)", fontWeight: o.isCorrect ? 600 : 400 }}>
                  {o.isCorrect ? "✓ " : "• "}{o.text}
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setEditing(q.id); setDraft({ prompt: q.prompt, explanation: q.explanation, points: q.points, options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })) }) }}>Editar</Button>
              <Button size="sm" variant="ghost" onClick={async () => {
                if (!(await confirm({ title: "Eliminar pregunta", itemName: q.prompt.slice(0, 60), variant: "danger" }))) return
                try { await lms.admin.deleteQuestion(q.id); onChange() } catch (e) { toast.error(errMsg(e)) }
              }}>Eliminar</Button>
            </div>
          </li>
        ))}
      </ol>

      {draft ? (
        <div className="flex flex-col gap-3 rounded-xl p-3" style={{ border: "1px solid var(--border-medium)" }}>
          <TextArea label="Enunciado" value={draft.prompt} maxLength={2000} onChange={(e) => setDraft({ ...draft, prompt: e.target.value })} />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>Opciones (marca la correcta)</legend>
            {draft.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name={`correct-${quiz.id}`} aria-label={`Opción ${i + 1} correcta`} checked={o.isCorrect} onChange={() => setDraft({ ...draft, options: draft.options.map((x, j) => ({ ...x, isCorrect: j === i })) })} />
                <div className="flex-1"><Input aria-label={`Texto de la opción ${i + 1}`} value={o.text} maxLength={500} onChange={(e) => setDraft({ ...draft, options: draft.options.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} /></div>
                {draft.options.length > 2 && (
                  <Button size="sm" variant="ghost" aria-label="Quitar opción" onClick={() => setDraft({ ...draft, options: draft.options.filter((_, j) => j !== i).map((x, j, arr) => ({ ...x, isCorrect: arr.some((y) => y.isCorrect) ? x.isCorrect : j === 0 })) })}><Trash2 size={14} aria-hidden="true" /></Button>
                )}
              </div>
            ))}
            {draft.options.length < 6 && <Button size="sm" variant="ghost" className="self-start" onClick={() => setDraft({ ...draft, options: [...draft.options, { text: "", isCorrect: false }] })}><Plus size={14} aria-hidden="true" /> Agregar opción</Button>}
          </fieldset>
          <TextArea label="Explicación (se muestra tras calificar, opcional)" value={draft.explanation} maxLength={2000} onChange={(e) => setDraft({ ...draft, explanation: e.target.value })} />
          <div className="max-w-40"><NumberField label="Puntos" min={1} max={100} value={draft.points} onChange={(e) => setDraft({ ...draft, points: Number(e.target.value) })} /></div>
          <div className="flex gap-2">
            <Button onClick={saveQuestion} loading={busy}>{editing ? "Guardar pregunta" : "Agregar pregunta"}</Button>
            <Button variant="ghost" onClick={() => { setDraft(null); setEditing(null) }}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" className="self-start" onClick={() => { setEditing(null); setDraft(emptyQuestion()) }}><Plus size={16} aria-hidden="true" /> Nueva pregunta</Button>
      )}
    </Card>
  )
}
