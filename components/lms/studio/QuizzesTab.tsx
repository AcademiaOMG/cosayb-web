"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { mutate as globalMutate } from "swr"
import { ClipboardCheck, Clock, Copy, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { Badge, Button, Card, EmptyState, ErrorPanel, IconTile, Skeleton, rise } from "@/components/lms/ui"
import { usePaths } from "@/components/lms/shell/area"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { lms } from "@/lib/lms/api"
import { lmsKeys, useAdminQuizzes } from "@/lib/lms/hooks"
import { toast } from "@/lib/toast"
import { ActionMenu, TextField, errMsg } from "./kit"

export default function QuizzesTab({ courseId }: { courseId: string }) {
  const paths = usePaths()
  const { data, error, mutate } = useAdminQuizzes(courseId)
  const router = useRouter()
  const confirm = useConfirm()
  const [title, setTitle] = useState("")
  const [busy, setBusy] = useState(false)

  async function create() {
    if (!title.trim()) return void toast.warning("Escribe el título de la evaluación.")
    setBusy(true)
    try {
      const q = await lms.admin.createQuiz(courseId, { title: title.trim() })
      await mutate()
      router.push(paths.quiz(courseId, q.id))
    } catch (e) {
      toast.error(errMsg(e))
      setBusy(false)
    }
  }

  if (error) return <ErrorPanel title="No pudimos cargar las evaluaciones" onRetry={() => mutate()} />

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="flex-1"><TextField label="Nueva evaluación" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Evaluación final del módulo 1" onKeyDown={(e) => { if (e.key === "Enter") void create() }} /></div>
        <Button onClick={create} loading={busy}><Plus size={16} aria-hidden="true" /> Crear y abrir editor</Button>
      </Card>

      {!data ? (
        <Skeleton className="h-28 !rounded-[22px]" />
      ) : data.length === 0 ? (
        <EmptyState title="Aún no hay evaluaciones" description="Crea una para medir lo aprendido. Las calificaciones y certificados se calculan en el servidor." />
      ) : (
        <ul className="flex flex-col gap-3">
          {data.map((q, i) => (
            <li key={q.id} className="l-rise" style={rise(i)}>
              <Card hover className="flex flex-wrap items-center gap-4 p-4">
                <IconTile tone="brand" size={44}><ClipboardCheck size={20} /></IconTile>
                <div className="min-w-0 flex-1">
                  <Link href={paths.quiz(courseId, q.id)} className="block break-words font-extrabold hover:underline">{q.title}</Link>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone="neutral">{q.questions.length} pregunta{q.questions.length === 1 ? "" : "s"}</Badge>
                    <Badge tone="neutral">Mínimo {q.passingScore}%</Badge>
                    <Badge tone="neutral">{q.maxAttempts === null ? "Intentos ilimitados" : `${q.maxAttempts} intentos`}</Badge>
                    {q.timeLimitMinutes && <Badge tone="amber"><Clock size={12} aria-hidden="true" /> {q.timeLimitMinutes} min</Badge>}
                    {q.required ? <Badge tone="brand">Obligatoria</Badge> : <Badge tone="neutral">Opcional</Badge>}
                    {q.questions.length === 0 && <Badge tone="rose">Sin preguntas</Badge>}
                  </div>
                </div>
                <Link href={paths.quiz(courseId, q.id)} className="l-btn l-btn-soft l-btn-sm"><Pencil size={14} aria-hidden="true" /> Editar</Link>
                <ActionMenu label={`Acciones de ${q.title}`} trigger={<MoreHorizontal size={16} aria-hidden="true" />}>
                  {() => (
                    <>
                      <button type="button" role="menuitem" onClick={async () => {
                        try { await lms.admin.duplicateQuiz(q.id); await mutate(); toast.success("Evaluación duplicada.") } catch (e) { toast.error(errMsg(e)) }
                      }}><Copy size={15} aria-hidden="true" /> Duplicar</button>
                      <button type="button" role="menuitem" className="l-danger" onClick={async () => {
                        if (!(await confirm({ title: "Eliminar evaluación", itemName: q.title, variant: "danger" }))) return
                        try { await lms.admin.deleteQuiz(q.id); await Promise.all([mutate(), globalMutate(lmsKeys.adminQuiz(q.id))]) } catch (e) { toast.error(errMsg(e)) }
                      }}><Trash2 size={15} aria-hidden="true" /> Eliminar</button>
                    </>
                  )}
                </ActionMenu>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
