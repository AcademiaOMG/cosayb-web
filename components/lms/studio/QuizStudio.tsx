"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowLeft, ArrowUp, CheckCircle2, Copy, Eye, ImagePlus, Library, ListChecks, MoreHorizontal, Plus, Search, Settings2, Trash2, X } from "lucide-react"
import { Avatar, Badge, Button, ErrorPanel, Skeleton } from "@/components/lms/ui"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { authClient } from "@/lib/auth"
import { lms } from "@/lib/lms/api"
import { errorStatus, useAdminQuiz } from "@/lib/lms/hooks"
import { QUESTION_TYPE_LABEL, splitBlanks, validateQuestionDraft } from "@/lib/lms/validation"
import { UPLOAD_RULES, validateUpload } from "@/lib/lms/validation"
import { type QDraft, convertType, defaultQuestion, isSavable, reorder, toDraft } from "@/lib/lms/studio"
import { toast } from "@/lib/toast"
import type { AdminQuestion, AdminQuiz, BankQuestion, QuestionType, QuizSettings } from "@/lib/lms/types"
import { ActionMenu, AreaField, Dialog, Field, Grip, SaveBadge, SelectField, Switch, SwitchRow, TextField, errMsg, useAutosave, useSortable } from "./kit"
import type { SaveState } from "./kit"
import QuizImage from "./QuizImage"

const TYPES: QuestionType[] = ["single", "multiple", "true_false", "fill_blank", "short_text"]
type Report = { status: SaveState; invalid: boolean }

export default function QuizStudio({ courseId, quizId }: { courseId: string; quizId: string }) {
  const { data: quiz, error, mutate } = useAdminQuiz(quizId)
  const router = useRouter()
  const confirm = useConfirm()
  const { data: session } = authClient.useSession()
  const [selected, setSelected] = useState<string | "result" | null>(null)
  const [q, setQ] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [reports, setReports] = useState<Record<string, Report>>({})
  const [busy, setBusy] = useState(false)

  const report = (id: string, r: Report) => setReports((m) => (m[id]?.status === r.status && m[id]?.invalid === r.invalid ? m : { ...m, [id]: r }))

  const sort = useSortable((dragId, beforeId) => {
    if (!quiz) return
    const ids = quiz.questions.map((x) => x.id)
    const from = ids.indexOf(dragId)
    const to = beforeId ? ids.indexOf(beforeId) : ids.length
    void order(reorder(ids, from, to > from ? to - 1 : to))
  }, "question")

  async function order(ids: string[]) {
    if (!quiz) return
    const byId = new Map(quiz.questions.map((x) => [x.id, x]))
    await mutate({ ...quiz, questions: ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])) }, { revalidate: false })
    try {
      await lms.admin.reorderQuestions(quizId, ids)
    } catch (e) {
      toast.error(errMsg(e))
    }
    await mutate()
  }

  async function addQuestion(type: QuestionType) {
    setBusy(true)
    try {
      const created = await lms.admin.createQuestion(quizId, defaultQuestion(type))
      await mutate()
      setSelected(created.id)
      requestAnimationFrame(() => document.getElementById(`q-${created.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }))
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const statusValues = Object.values(reports)
  const saving = statusValues.some((r) => r.status === "saving")
  const failed = statusValues.some((r) => r.status === "error")
  const invalidCount = statusValues.filter((r) => r.invalid).length
  const overall: SaveState = saving ? "saving" : failed ? "error" : "saved"

  const visible = useMemo(() => {
    if (!quiz) return []
    const t = q.trim().toLowerCase()
    return quiz.questions.map((x, i) => ({ x, i })).filter(({ x }) => !t || x.prompt.toLowerCase().includes(t))
  }, [quiz, q])

  if (errorStatus(error) === 403) return <ErrorPanel title="Sin permisos" description="Editar evaluaciones requiere permisos de instructor." />
  if (errorStatus(error) === 404) return <ErrorPanel title="La evaluación no existe" description="Pudo haberse eliminado." />
  if (error) return <ErrorPanel title="No pudimos cargar la evaluación" onRetry={() => mutate()} />
  if (!quiz) return <Skeleton className="h-[480px] !rounded-[22px]" />

  const back = `/instructor/${courseId}?tab=quizzes`
  const name = session?.user?.name ?? "Tú"

  return (
    <div className="flex flex-col gap-4">
      <div className="s-bar">
        <Link href={back} className="l-btn l-btn-ghost !min-h-10 !w-10 !px-0" aria-label="Volver a las evaluaciones del curso"><ArrowLeft size={18} aria-hidden="true" /></Link>
        <div className="hidden min-w-0 sm:block">
          <SaveBadge status={overall} invalid={invalidCount > 0 && !saving} />
        </div>
        <div className="mx-auto flex min-w-0 max-w-xl flex-1 items-center gap-2">
          <span aria-hidden="true" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--l-amber-bg)", color: "var(--l-amber-ink)" }}><ListChecks size={17} /></span>
          <QuizTitle quiz={quiz} onSaved={() => mutate()} />
        </div>
        <Avatar name={name} size={34} />
        <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)} aria-label="Ajustes de la evaluación"><Settings2 size={16} aria-hidden="true" /><span className="hidden md:inline"> Ajustes</span></Button>
        <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(true)}><Eye size={16} aria-hidden="true" /><span className="hidden md:inline"> Vista previa</span></Button>
        <Button size="sm" onClick={() => {
          if (invalidCount > 0) return void toast.warning(`${invalidCount} pregunta${invalidCount > 1 ? "s" : ""} sin completar: no se han guardado sus últimos cambios.`)
          if (quiz.questions.length === 0) return void toast.warning("Agrega al menos una pregunta.")
          router.push(back)
        }}>Listo</Button>
      </div>

      <div className="q-shell">
        <aside className="q-side" aria-label="Preguntas">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold tracking-wider" style={{ color: "var(--l-muted)" }}>PREGUNTAS ({quiz.questions.length})</h2>
            <ActionMenu label="Agregar pregunta" trigger={<Plus size={16} aria-hidden="true" />}>
              {() => (
                <>
                  {TYPES.map((t) => <button key={t} type="button" role="menuitem" disabled={busy} onClick={() => void addQuestion(t)}>{QUESTION_TYPE_LABEL[t]}</button>)}
                  <button type="button" role="menuitem" onClick={() => setBankOpen(true)}><Library size={15} aria-hidden="true" /> Del banco de preguntas</button>
                </>
              )}
            </ActionMenu>
          </div>
          <ol className="flex flex-col gap-2">
            {quiz.questions.map((x, i) => (
              <li key={x.id} data-sortable className={`${sort.dragging === x.id ? "l-dragging" : ""} ${sort.over === x.id && sort.dragging ? "l-drop-before" : ""} rounded-2xl`} {...sort.target(x.id)}>
                <div className="flex items-start gap-1">
                  <Grip label={`Reordenar la pregunta ${i + 1}`} {...sort.handle(x.id)} />
                  <button type="button" className="q-item min-w-0 flex-1" aria-current={selected === x.id} onClick={() => { setSelected(x.id); document.getElementById(`q-${x.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }) }}>
                    <span className="flex items-center gap-2"><span className="q-num">{i + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-bold">{x.prompt}</span></span>
                    <span className="flex items-center gap-2"><span className="q-chip">{QUESTION_TYPE_LABEL[x.type]}</span>{reports[x.id]?.invalid && <Badge tone="amber">Incompleta</Badge>}</span>
                  </button>
                </div>
              </li>
            ))}
            <li {...sort.target(null)} className={`h-3 rounded-lg ${sort.over === null && sort.dragging ? "l-drop-before" : ""}`} aria-hidden="true" />
          </ol>
          <button type="button" className="l-dashed justify-center" disabled={busy} onClick={() => void addQuestion("single")}><Plus size={15} aria-hidden="true" /> Añadir pregunta</button>
          <button type="button" className="q-item mt-auto" aria-current={selected === "result"} onClick={() => setSelected("result")}>
            <span className="flex items-center gap-2 text-sm font-extrabold"><CheckCircle2 size={16} aria-hidden="true" /> Pantalla de resultado</span>
            <span className="l-hint">Mensajes de aprobado y reprobado</span>
          </button>
        </aside>

        <main className="q-main flex flex-col gap-4" aria-label="Editor de preguntas">
          {selected === "result" ? (
            <ResultScreen quiz={quiz} onSaved={() => mutate()} onClose={() => setSelected(null)} />
          ) : (
            <>
              <div className="relative">
                <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--l-muted)" }} />
                <input className="l-input" style={{ paddingLeft: 40 }} type="search" placeholder="Buscar en las preguntas…" aria-label="Buscar en las preguntas" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              {quiz.questions.length === 0 && (
                <div className="rounded-2xl border-2 border-dashed p-8 text-center" style={{ borderColor: "var(--l-line)" }}>
                  <p className="font-extrabold">Esta evaluación aún no tiene preguntas</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Elige un tipo para empezar. También puedes traer preguntas del banco.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {TYPES.map((t) => <button key={t} type="button" className="l-dashed" disabled={busy} onClick={() => void addQuestion(t)}><Plus size={14} aria-hidden="true" /> {QUESTION_TYPE_LABEL[t]}</button>)}
                  </div>
                </div>
              )}
              {quiz.questions.length > 0 && visible.length === 0 && <p className="text-sm" style={{ color: "var(--l-muted)" }}>Ninguna pregunta coincide con «{q}».</p>}
              {visible.map(({ x, i }) => (
                <QuestionCard
                  key={x.id}
                  question={x}
                  index={i}
                  total={quiz.questions.length}
                  active={selected === x.id}
                  onActivate={() => setSelected(x.id)}
                  onReport={(r) => report(x.id, r)}
                  onSaved={() => mutate()}
                  onMove={(to) => { const ids = quiz.questions.map((y) => y.id); void order(reorder(ids, i, to)) }}
                  onDuplicate={async () => { try { await lms.admin.duplicateQuestion(x.id); await mutate(); toast.success("Pregunta duplicada.") } catch (e) { toast.error(errMsg(e)) } }}
                  onDelete={async () => {
                    if (!(await confirm({ title: "Eliminar pregunta", itemName: `Pregunta ${i + 1}`, variant: "danger" }))) return
                    try { await lms.admin.deleteQuestion(x.id); await mutate() } catch (e) { toast.error(errMsg(e)) }
                  }}
                />
              ))}
              {quiz.questions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {TYPES.map((t) => <button key={t} type="button" className="l-dashed" disabled={busy} onClick={() => void addQuestion(t)}><Plus size={14} aria-hidden="true" /> {QUESTION_TYPE_LABEL[t]}</button>)}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {settingsOpen && <SettingsDialog open quiz={quiz} onClose={() => setSettingsOpen(false)} onSaved={() => mutate()} />}
      {previewOpen && <PreviewDialog open quiz={quiz} onClose={() => setPreviewOpen(false)} />}
      {bankOpen && <BankDialog open quizId={quizId} onClose={() => setBankOpen(false)} onImported={() => mutate()} />}
    </div>
  )
}

// ─── Título con autoguardado ────────────────────────────────────────────────

function QuizTitle({ quiz, onSaved }: { quiz: AdminQuiz; onSaved: () => void }) {
  const [title, setTitle] = useState(quiz.title)
  useAutosave(title, async (t) => { await lms.admin.updateQuiz(quiz.id, { title: t.trim() }); onSaved() }, { valid: title.trim().length > 0 })
  return <input className="l-input l-input-bare !min-h-10 min-w-0 flex-1 text-base font-extrabold" aria-label="Título de la evaluación" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
}

// ─── Tarjeta de pregunta ────────────────────────────────────────────────────

function QuestionCard({ question, index, total, active, onActivate, onReport, onSaved, onMove, onDuplicate, onDelete }: {
  question: AdminQuestion
  index: number
  total: number
  active: boolean
  onActivate: () => void
  onReport: (r: Report) => void
  onSaved: () => void
  onMove: (to: number) => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const [d, setD] = useState<QDraft>(() => toDraft(question))
  const [imageMode, setImageMode] = useState(() => question.options.some((o) => o.imageId))
  const [upload, setUpload] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const target = useRef<{ kind: "question" } | { kind: "option"; id: string }>({ kind: "question" })
  const error = validateQuestionDraft(d)
  const savable = isSavable(d)
  const { status } = useAutosave(
    d,
    async (v) => {
      const res = await lms.admin.updateQuestion(question.id, v)
      // Los ids de las respuestas nuevas se conservan para no perder su imagen en el siguiente guardado
      setD((cur) => ({ ...cur, options: cur.options.map((o, i) => (o.id ? o : { ...o, id: res.options[i]?.id })) }))
      onSaved()
    },
    { valid: savable }
  )
  const reportRef = useRef(onReport)
  useEffect(() => {
    reportRef.current = onReport
  })
  useEffect(() => {
    reportRef.current({ status, invalid: !savable })
  }, [status, savable])

  const sort = useSortable((dragId, beforeId) => {
    const keys = d.options.map((o, i) => o.id ?? `new-${i}`)
    const from = keys.indexOf(dragId)
    const to = beforeId ? keys.indexOf(beforeId) : keys.length
    if (from >= 0) setD({ ...d, options: reorder(d.options, from, to > from ? to - 1 : to) })
  }, "option")

  const set = (patch: Partial<QDraft>) => setD((cur) => ({ ...cur, ...patch }))
  const setOpt = (i: number, patch: Partial<QDraft["options"][number]>) => setD((cur) => ({ ...cur, options: cur.options.map((o, k) => (k === i ? { ...o, ...patch } : o)) }))
  const pickCorrect = (i: number) => setD((cur) => ({ ...cur, options: cur.options.map((o, k) => (cur.type === "multiple" ? (k === i ? { ...o, isCorrect: !o.isCorrect } : o) : { ...o, isCorrect: k === i }))}))
  const addOpt = (isCorrect = false) => setD((cur) => ({ ...cur, options: [...cur.options, { text: "", isCorrect, blankIndex: cur.type === "fill_blank" && isCorrect ? 1 : null }] }))
  const removeOpt = (i: number) => setD((cur) => ({ ...cur, options: cur.options.filter((_, k) => k !== i) }))
  const moveOpt = (i: number, to: number) => setD((cur) => ({ ...cur, options: reorder(cur.options, i, to) }))

  const imageOf = (optId?: string) => question.options.find((o) => o.id === optId)?.imageId ?? null

  async function onFile(file: File | undefined) {
    const t = target.current
    if (fileRef.current) fileRef.current.value = ""
    if (!file) return
    const problem = validateUpload("thumbnail", file)
    if (problem) return void toast.error(problem)
    setUpload(0)
    try {
      if (t.kind === "question") await lms.admin.setQuestionImage(question.id, file, setUpload)
      else await lms.admin.setOptionImage(t.id, file, setUpload)
      onSaved()
    } catch (e) {
      toast.error(errMsg(e, "No se pudo subir la imagen."))
    } finally {
      setUpload(null)
    }
  }
  function attach(t: typeof target.current) {
    target.current = t
    if (fileRef.current) {
      fileRef.current.accept = UPLOAD_RULES.thumbnail.mimes.join(",")
      fileRef.current.click()
    }
  }
  async function removeImage(mediaId: string) {
    try { await lms.admin.deleteMedia(mediaId); onSaved() } catch (e) { toast.error(errMsg(e)) }
  }

  const isPick = d.type === "single" || d.type === "multiple" || d.type === "true_false"
  const qImage = question.imageId

  return (
    <article id={`q-${question.id}`} className="q-card" data-active={active} onFocusCapture={onActivate} aria-label={`Pregunta ${index + 1}`}>
      <div className="flex flex-wrap items-center gap-3 border-b p-4" style={{ borderColor: "var(--l-line)" }}>
        <select className="l-input l-select !min-h-10 !w-auto font-bold" aria-label={`Tipo de la pregunta ${index + 1}`} value={d.type} onChange={(e) => { setD(convertType(d, e.target.value as QuestionType)); setImageMode(false) }}>
          {TYPES.map((t) => <option key={t} value={t}>{QUESTION_TYPE_LABEL[t]}</option>)}
        </select>
        <span className="ml-auto flex items-center gap-2 text-sm font-bold">
          <SaveBadge status={status} invalid={!savable} />
          <Switch checked={d.required} onChange={(v) => set({ required: v })} label={`Pregunta ${index + 1} obligatoria`} />
          <span aria-hidden="true">Obligatoria</span>
        </span>
        <ActionMenu label={`Acciones de la pregunta ${index + 1}`} trigger={<MoreHorizontal size={16} aria-hidden="true" />}>
          {() => (
            <>
              <button type="button" role="menuitem" disabled={index === 0} onClick={() => onMove(index - 1)}><ArrowUp size={15} aria-hidden="true" /> Subir</button>
              <button type="button" role="menuitem" disabled={index === total - 1} onClick={() => onMove(index + 1)}><ArrowDown size={15} aria-hidden="true" /> Bajar</button>
              <button type="button" role="menuitem" onClick={onDuplicate}><Copy size={15} aria-hidden="true" /> Duplicar</button>
              <button type="button" role="menuitem" className="l-danger" onClick={onDelete}><Trash2 size={15} aria-hidden="true" /> Eliminar</button>
            </>
          )}
        </ActionMenu>
      </div>

      <div className="flex flex-col gap-4 p-4">
        <input ref={fileRef} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => void onFile(e.target.files?.[0])} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <AreaField label={`Pregunta ${index + 1}*`} value={d.prompt} onChange={(e) => set({ prompt: e.target.value })} maxLength={2000} rows={3} hint={d.type === "fill_blank" ? "Marca cada hueco con {{1}}, {{2}}… (hasta 5)." : undefined} />
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:w-44">
            {qImage ? (
              <div className="relative overflow-hidden rounded-2xl border" style={{ borderColor: "var(--l-line)" }}>
                <QuizImage id={qImage} admin alt="Imagen de la pregunta" className="block aspect-[4/3] w-full object-cover" />
                <button type="button" className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1.5 shadow" aria-label="Quitar imagen de la pregunta" onClick={() => void removeImage(qImage)}><X size={14} aria-hidden="true" /></button>
              </div>
            ) : (
              <button type="button" className="l-dashed justify-center" disabled={upload !== null} onClick={() => attach({ kind: "question" })}><ImagePlus size={16} aria-hidden="true" /> Imagen</button>
            )}
            {upload !== null && <div className="q-progress" role="progressbar" aria-label="Subiendo imagen" aria-valuemin={0} aria-valuemax={100} aria-valuenow={upload}><span style={{ width: `${upload}%` }} /></div>}
          </div>
        </div>

        {d.type === "fill_blank" && <FillPreview prompt={d.prompt} />}

        {/* Respuestas */}
        {isPick && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="text-sm font-extrabold">Respuestas*</span>
              {d.type !== "true_false" && (
                <>
                  <label className="flex items-center gap-2 text-sm font-bold">Respuesta múltiple <Switch checked={d.type === "multiple"} onChange={(v) => setD(convertType(d, v ? "multiple" : "single"))} label="Permitir varias respuestas correctas" /></label>
                  <label className="flex items-center gap-2 text-sm font-bold">Responder con imagen <Switch checked={imageMode} onChange={setImageMode} label="Responder con imagen" /></label>
                </>
              )}
            </div>
            <ul className={imageMode ? "grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-2"}>
              {d.options.map((o, i) => {
                const key = o.id ?? `new-${i}`
                const img = imageOf(o.id)
                return (
                  <li key={key} data-sortable className={`${imageMode ? "q-img-opt" : "q-opt"} ${sort.dragging === key ? "l-dragging" : ""} ${sort.over === key && sort.dragging ? "l-drop-before" : ""}`} {...sort.target(key)}>
                    {imageMode && (
                      <div className="relative">
                        {img ? <QuizImage id={img} admin alt={`Imagen de la respuesta ${i + 1}`} className="block aspect-[4/3] w-full object-cover" /> : (
                          <button type="button" className="flex aspect-[4/3] w-full items-center justify-center text-sm font-bold" style={{ background: "var(--l-bg)", color: "var(--l-muted)" }} disabled={!o.id || upload !== null} onClick={() => attach({ kind: "option", id: o.id! })} title={o.id ? undefined : "Se podrá subir cuando la respuesta se guarde"}>
                            <ImagePlus size={20} aria-hidden="true" /> <span className="ml-1.5">{o.id ? "Subir imagen" : "Guarda primero"}</span>
                          </button>
                        )}
                        {img && <button type="button" className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1.5 shadow" aria-label={`Quitar imagen de la respuesta ${i + 1}`} onClick={() => void removeImage(img)}><X size={14} aria-hidden="true" /></button>}
                      </div>
                    )}
                    <div className={imageMode ? "flex items-center gap-1.5 p-2" : "q-opt min-w-0 flex-1"}>
                      {!imageMode && d.type !== "true_false" && <Grip label={`Reordenar la respuesta ${i + 1}`} {...sort.handle(key)} onKeyDown={(e) => { if (e.altKey && e.key === "ArrowUp") { e.preventDefault(); moveOpt(i, i - 1) } if (e.altKey && e.key === "ArrowDown") { e.preventDefault(); moveOpt(i, i + 1) } }} />}
                      <button type="button" role={d.type === "multiple" ? "checkbox" : "radio"} aria-checked={o.isCorrect} aria-label={`Marcar la respuesta ${i + 1} como correcta`} data-shape={d.type === "multiple" ? "check" : "radio"} className="q-pick" onClick={() => pickCorrect(i)}>
                        {o.isCorrect && <CheckCircle2 size={13} aria-hidden="true" />}
                      </button>
                      {d.type === "true_false" ? (
                        <span className="min-w-0 flex-1 px-3 font-bold">{o.text}</span>
                      ) : (
                        <input className="l-input !min-h-10 min-w-0 flex-1" aria-label={`Texto de la respuesta ${i + 1}`} value={o.text} maxLength={500} onChange={(e) => setOpt(i, { text: e.target.value })} />
                      )}
                      {d.type !== "true_false" && <button type="button" className="rounded-lg p-2 hover:bg-[var(--l-rose-bg)]" style={{ color: "var(--l-rose-ink)" }} aria-label={`Eliminar la respuesta ${i + 1}`} disabled={d.options.length <= 2} onClick={() => removeOpt(i)}><Trash2 size={15} aria-hidden="true" /></button>}
                    </div>
                  </li>
                )
              })}
            </ul>
            {d.type !== "true_false" && d.options.length < (d.type === "multiple" ? 8 : 6) && <button type="button" className="l-dashed self-start" onClick={() => addOpt(false)}><Plus size={14} aria-hidden="true" /> Añadir respuesta</button>}
          </div>
        )}

        {d.type === "short_text" && (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-extrabold">Respuestas aceptadas*</span>
            <p className="l-hint">Se comparan sin importar mayúsculas, tildes ni espacios sobrantes.</p>
            {d.options.map((o, i) => (
              <div key={o.id ?? `new-${i}`} className="q-opt">
                <input className="l-input !min-h-10 flex-1" aria-label={`Respuesta aceptada ${i + 1}`} value={o.text} maxLength={500} onChange={(e) => setOpt(i, { text: e.target.value })} />
                <button type="button" className="rounded-lg p-2" style={{ color: "var(--l-rose-ink)" }} aria-label={`Eliminar la respuesta aceptada ${i + 1}`} disabled={d.options.length <= 1} onClick={() => removeOpt(i)}><Trash2 size={15} aria-hidden="true" /></button>
              </div>
            ))}
            {d.options.length < 10 && <button type="button" className="l-dashed self-start" onClick={() => addOpt(true)}><Plus size={14} aria-hidden="true" /> Añadir respuesta aceptada</button>}
          </div>
        )}

        {d.type === "fill_blank" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <button type="button" className="l-dashed" onClick={() => addOpt(true)}><Plus size={14} aria-hidden="true" /> Añadir respuesta correcta</button>
              <button type="button" className="l-dashed" onClick={() => addOpt(false)}><Plus size={14} aria-hidden="true" /> Añadir respuesta incorrecta</button>
            </div>
            <span className="text-sm font-extrabold">Fichas de respuesta*</span>
            <p className="l-hint">Quien estudia verá todas las fichas mezcladas y deberá colocarlas en cada hueco.</p>
            <ul className="flex flex-col gap-2">
              {d.options.map((o, i) => (
                <li key={o.id ?? `new-${i}`} className="q-opt">
                  <span className="q-token" data-good={o.isCorrect}>{o.isCorrect && <sup aria-hidden="true">{o.blankIndex ?? "?"}</sup>}{o.text || "…"}</span>
                  <input className="l-input !min-h-10 min-w-0 flex-1" aria-label={`Texto de la ficha ${i + 1}`} value={o.text} maxLength={500} onChange={(e) => setOpt(i, { text: e.target.value })} />
                  {o.isCorrect ? (
                    <select className="l-input l-select !min-h-10 !w-auto" aria-label={`Hueco de la ficha ${i + 1}`} value={o.blankIndex ?? 1} onChange={(e) => setOpt(i, { blankIndex: Number(e.target.value) })}>
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Hueco {n}</option>)}
                    </select>
                  ) : <Badge tone="neutral">Distractor</Badge>}
                  <button type="button" className="rounded-lg p-2" style={{ color: "var(--l-rose-ink)" }} aria-label={`Eliminar la ficha ${i + 1}`} disabled={d.options.length <= 2} onClick={() => removeOpt(i)}><Trash2 size={15} aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p role="alert" className="l-err">{error}</p>}

        <details className="rounded-2xl p-3" style={{ background: "var(--l-bg)" }}>
          <summary className="cursor-pointer text-sm font-extrabold">Explicación tras responder (opcional)</summary>
          <div className="mt-2"><AreaField label="Se muestra al estudiante junto al resultado" value={d.explanation} onChange={(e) => set({ explanation: e.target.value })} maxLength={2000} rows={2} /></div>
        </details>

        <div className="grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-3" style={{ borderColor: "var(--l-line)" }}>
          {isPick && d.type !== "true_false" ? (
            <SelectField label="Orden de las respuestas" value={d.shuffleOptions ? "shuffle" : "keep"} onChange={(e) => set({ shuffleOptions: e.target.value === "shuffle" })} options={[{ value: "keep", label: "Mantener el orden" }, { value: "shuffle", label: "Mezclar para cada estudiante" }]} />
          ) : <span aria-hidden="true" />}
          <TextField label="Tiempo estimado (min)" type="number" min={0} max={120} value={d.estimatedMinutes} onChange={(e) => set({ estimatedMinutes: Math.min(120, Math.max(0, Math.floor(Number(e.target.value) || 0))) })} />
          <TextField label="Puntos" type="number" min={1} max={100} value={d.points} onChange={(e) => set({ points: Math.min(100, Math.max(0, Math.floor(Number(e.target.value) || 0))) })} />
        </div>
      </div>
    </article>
  )
}

/** Muestra el enunciado con los huecos numerados, como lo verá el estudiante. */
function FillPreview({ prompt }: { prompt: string }) {
  return (
    <p className="rounded-2xl p-4 text-base leading-loose" style={{ background: "var(--l-bg)" }} aria-label="Vista del enunciado con huecos">
      {splitBlanks(prompt).map((p, i) => "text" in p ? <span key={i}>{p.text}</span> : <span key={i} className="q-token mx-1" data-good="true"><sup aria-hidden="true">{p.blank}</sup><span className="sr-only">hueco {p.blank}</span>&nbsp;&nbsp;&nbsp;&nbsp;</span>)}
    </p>
  )
}

// ─── Pantalla de resultado ──────────────────────────────────────────────────

function ResultScreen({ quiz, onSaved, onClose }: { quiz: AdminQuiz; onSaved: () => void; onClose: () => void }) {
  const [m, setM] = useState({ passMessage: quiz.passMessage, failMessage: quiz.failMessage })
  const { status } = useAutosave(m, async (v) => { await lms.admin.updateQuiz(quiz.id, v); onSaved() })
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-xl font-extrabold">Pantalla de resultado</h2><p className="text-sm" style={{ color: "var(--l-muted)" }}>Lo que ve el estudiante al terminar. Nota mínima para aprobar: <strong>{quiz.passingScore}%</strong> (se cambia en Ajustes).</p></div>
        <div className="flex items-center gap-3"><SaveBadge status={status} /><Button variant="ghost" size="sm" onClick={onClose}>Volver a las preguntas</Button></div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-2xl p-4" style={{ background: "var(--l-mint-bg)" }}>
          <Badge tone="mint">Si aprueba</Badge>
          <AreaField label="Mensaje de aprobado" placeholder="¡Excelente trabajo! Dominas este tema." value={m.passMessage} onChange={(e) => setM({ ...m, passMessage: e.target.value })} maxLength={500} rows={4} />
        </div>
        <div className="flex flex-col gap-3 rounded-2xl p-4" style={{ background: "var(--l-amber-bg)" }}>
          <Badge tone="amber">Si no aprueba</Badge>
          <AreaField label="Mensaje de reprobado" placeholder="Repasa las lecciones y vuelve a intentarlo." value={m.failMessage} onChange={(e) => setM({ ...m, failMessage: e.target.value })} maxLength={500} rows={4} />
        </div>
      </div>
      <p className="l-hint">Si los dejas vacíos se usan los mensajes por defecto. Los textos se muestran siempre como texto plano.</p>
    </div>
  )
}

// ─── Ajustes ────────────────────────────────────────────────────────────────

function SettingsDialog({ open, quiz, onClose, onSaved }: { open: boolean; quiz: AdminQuiz; onClose: () => void; onSaved: () => void }) {
  // Solo estos ajustes: el título y los mensajes de resultado se editan en otros lugares y no deben pisarse
  const [f, setF] = useState<Omit<QuizSettings, "title" | "passMessage" | "failMessage">>(() => ({
    description: quiz.description, passingScore: quiz.passingScore, maxAttempts: quiz.maxAttempts, required: quiz.required, timeLimitMinutes: quiz.timeLimitMinutes, shuffleQuestions: quiz.shuffleQuestions, revealAnswers: quiz.revealAnswers,
  }))
  const [busy, setBusy] = useState(false)
  async function save() {
    if (f.passingScore < 1 || f.passingScore > 100) return void toast.warning("La nota mínima va de 1 a 100.")
    setBusy(true)
    try {
      await lms.admin.updateQuiz(quiz.id, f)
      onSaved()
      onClose()
      toast.success("Ajustes guardados.")
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open={open} onClose={onClose} title="Ajustes de la evaluación" footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save} loading={busy}>Guardar ajustes</Button></>}>
      <div className="flex flex-col gap-4">
        <AreaField label="Descripción" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={2000} rows={2} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label="Nota mínima para aprobar (%)" type="number" min={1} max={100} value={f.passingScore} onChange={(e) => setF({ ...f, passingScore: Math.floor(Number(e.target.value) || 0) })} />
          <Field label="Intentos permitidos">{(id) => (
            <div className="flex items-center gap-3">
              <input id={id} className="l-input" type="number" min={1} max={50} disabled={f.maxAttempts === null} value={f.maxAttempts ?? ""} onChange={(e) => setF({ ...f, maxAttempts: Math.min(50, Math.max(1, Math.floor(Number(e.target.value) || 1))) })} />
              <label className="flex shrink-0 items-center gap-2 text-sm font-bold">Ilimitados <Switch checked={f.maxAttempts === null} onChange={(v) => setF({ ...f, maxAttempts: v ? null : 3 })} label="Intentos ilimitados" /></label>
            </div>
          )}</Field>
          <Field label="Límite de tiempo" hint="Al vencer, las respuestas ya no cuentan.">{(id) => (
            <div className="flex items-center gap-3">
              <input id={id} className="l-input" type="number" min={1} max={600} disabled={f.timeLimitMinutes === null} value={f.timeLimitMinutes ?? ""} placeholder="Sin límite" onChange={(e) => setF({ ...f, timeLimitMinutes: Math.min(600, Math.max(1, Math.floor(Number(e.target.value) || 1))) })} />
              <label className="flex shrink-0 items-center gap-2 text-sm font-bold">Sin límite <Switch checked={f.timeLimitMinutes === null} onChange={(v) => setF({ ...f, timeLimitMinutes: v ? null : 30 })} label="Sin límite de tiempo" /></label>
            </div>
          )}</Field>
        </div>
        <SwitchRow checked={f.required} onChange={(v) => setF({ ...f, required: v })} label="Obligatoria para el certificado" hint="El estudiante debe aprobarla para obtener su certificado." />
        <SwitchRow checked={f.shuffleQuestions} onChange={(v) => setF({ ...f, shuffleQuestions: v })} label="Mezclar el orden de las preguntas" hint="Cada intento las presenta en otro orden." />
        <SwitchRow checked={f.revealAnswers} onChange={(v) => setF({ ...f, revealAnswers: v })} label="Mostrar las respuestas correctas al final" hint="Solo cuando el estudiante aprueba o agota sus intentos, para que no sirvan para copiar." />
      </div>
    </Dialog>
  )
}

// ─── Vista previa (como la verá el estudiante) ──────────────────────────────

function PreviewDialog({ open, quiz, onClose }: { open: boolean; quiz: AdminQuiz; onClose: () => void }) {
  const [reveal, setReveal] = useState(false)
  return (
    <Dialog open={open} onClose={onClose} wide title={`Vista previa: ${quiz.title}`} footer={<label className="mr-auto flex items-center gap-2 text-sm font-bold">Mostrar respuestas correctas <Switch checked={reveal} onChange={setReveal} label="Mostrar respuestas correctas en la vista previa" /></label>}>
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <div className="flex flex-wrap gap-2"><Badge tone="neutral">{quiz.questions.length} preguntas</Badge><Badge tone="neutral">Nota mínima {quiz.passingScore}%</Badge>{quiz.timeLimitMinutes && <Badge tone="amber">{quiz.timeLimitMinutes} min</Badge>}</div>
        {quiz.questions.map((x, i) => (
          <section key={x.id} className="l-card p-5" aria-label={`Pregunta ${i + 1}`}>
            <p className="font-extrabold">{i + 1}. {x.type === "fill_blank" ? splitBlanks(x.prompt).map((p) => "text" in p ? p.text : `[ ${p.blank} ]`).join("") : x.prompt} <span className="l-hint">· {x.points} pt</span></p>
            {x.imageId && <QuizImage id={x.imageId} admin alt="Imagen de la pregunta" className="mt-3 max-h-60 rounded-xl object-contain" />}
            <ul className="mt-3 flex flex-col gap-2">
              {x.type === "short_text" ? (
                <li className="l-input flex items-center" style={{ color: "var(--l-muted)" }}>{reveal ? `Acepta: ${x.options.map((o) => o.text).join(" · ")}` : "Escribe tu respuesta…"}</li>
              ) : x.options.map((o) => (
                <li key={o.id} className="flex items-center gap-3 rounded-2xl border-2 p-3" style={{ borderColor: reveal && o.isCorrect ? "var(--l-mint)" : "var(--l-line)", background: reveal && o.isCorrect ? "var(--l-mint-bg)" : "#fff" }}>
                  {o.imageId && <QuizImage id={o.imageId} admin alt={o.text} className="h-14 w-20 rounded-lg object-cover" />}
                  <span className="min-w-0 flex-1 break-words font-bold">{o.text}</span>
                  {reveal && o.isCorrect && <Badge tone="mint">{x.type === "fill_blank" ? `Hueco ${o.blankIndex}` : "Correcta"}</Badge>}
                </li>
              ))}
            </ul>
          </section>
        ))}
        {quiz.questions.length === 0 && <p style={{ color: "var(--l-muted)" }}>Aún no hay preguntas.</p>}
      </div>
    </Dialog>
  )
}

// ─── Banco de preguntas ─────────────────────────────────────────────────────

function BankDialog({ open, quizId, onClose, onImported }: { open: boolean; quizId: string; onClose: () => void; onImported: () => void }) {
  const [term, setTerm] = useState("")
  const [rows, setRows] = useState<BankQuestion[] | null>(null)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  async function search(t = term) {
    try { setRows(await lms.admin.questionBank(t)) } catch (e) { toast.error(errMsg(e)) }
  }
  async function importAll() {
    setBusy(true)
    try {
      await lms.admin.importQuestions(quizId, [...picked])
      toast.success(`${picked.size} pregunta${picked.size > 1 ? "s" : ""} importada${picked.size > 1 ? "s" : ""}.`)
      setPicked(new Set())
      onImported()
      onClose()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open={open} onClose={onClose} wide title="Banco de preguntas" footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={importAll} loading={busy} disabled={picked.size === 0}>Importar {picked.size || ""}</Button></>}>
      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); void search() }} role="search">
        <input className="l-input" type="search" aria-label="Buscar preguntas en todas tus evaluaciones" placeholder="Buscar por texto del enunciado…" value={term} onChange={(e) => setTerm(e.target.value)} autoFocus />
        <Button type="submit" variant="soft">Buscar</Button>
      </form>
      <p className="l-hint mb-3">Se importan como copias editables (las imágenes no se copian).</p>
      {rows === null ? <Button variant="ghost" onClick={() => void search("")}>Ver las más recientes</Button> : rows.length === 0 ? <p style={{ color: "var(--l-muted)" }}>No hay preguntas que coincidan.</p> : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.id}>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border p-3" style={{ borderColor: picked.has(r.id) ? "var(--l-brand)" : "var(--l-line)", background: picked.has(r.id) ? "var(--l-brand-50)" : "#fff" }}>
                <input type="checkbox" className="mt-1" checked={picked.has(r.id)} onChange={() => setPicked((p) => { const n = new Set(p); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n })} />
                <span className="min-w-0 flex-1"><span className="block break-words text-sm font-bold">{r.prompt}</span><span className="l-hint">{QUESTION_TYPE_LABEL[r.type]} · {r.quizTitle} · {r.courseTitle}</span></span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  )
}
