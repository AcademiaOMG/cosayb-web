"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ListChecks, Pencil } from "lucide-react"
import { Badge, Card, EmptyState, ErrorPanel, Skeleton } from "@/components/lms/ui"
import { usePaths } from "@/components/lms/shell/area"
import { lms } from "@/lib/lms/api"
import { errorStatus } from "@/lib/lms/hooks"
import { SearchBox } from "@/components/lms/manage/parts"

/** Todas mis evaluaciones (de todos mis cursos), con sus resultados. Se editan y se prueban como las ve un estudiante. */
export default function MyQuizzes() {
  const paths = usePaths()
  const [q, setQ] = useState("")
  const { data, error, mutate } = useSWR("lms/admin/my-quizzes", () => lms.admin.myQuizzes(), { revalidateOnFocus: false })

  if (errorStatus(error) === 403) return <ErrorPanel title="Sin permisos" description="Las evaluaciones son para instructores." />
  if (error) return <ErrorPanel title="No pudimos cargar tus evaluaciones" onRetry={() => mutate()} />

  const term = q.trim().toLowerCase()
  const rows = (data ?? []).filter((r) => !term || r.title.toLowerCase().includes(term) || r.courseTitle.toLowerCase().includes(term))

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Evaluaciones</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Las evaluaciones de todos tus cursos y cómo les va a tus estudiantes. Para crear una nueva, abre el curso y entra a «Evaluaciones».</p>
        </div>
        <SearchBox value={q} onChange={setQ} placeholder="Buscar evaluación o curso…" label="Buscar evaluación" width={280} />
      </header>
      {!data ? (
        <Skeleton className="h-72 !rounded-[22px]" />
      ) : rows.length === 0 ? (
        <EmptyState title={data.length ? "Ninguna evaluación coincide" : "Aún no hay evaluaciones"} description={data.length ? "Prueba con otra búsqueda." : "Crea una desde la pestaña «Evaluaciones» de uno de tus cursos."} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="t-table">
            <caption className="sr-only">Evaluaciones de mis cursos</caption>
            <thead><tr><th scope="col">Evaluación</th><th scope="col">Curso</th><th scope="col">Preguntas</th><th scope="col">Intentos</th><th scope="col">Aprobación</th><th scope="col">Nota media</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><span className="block break-words font-extrabold">{r.title}</span><span className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>Mínimo {r.passingScore}%{r.required ? " · obligatoria" : ""}</span></td>
                  <td><Link href={paths.course(r.courseId)} className="font-bold hover:underline">{r.courseTitle}</Link>{r.courseStatus !== "published" && <Badge tone="amber" className="ml-1">{r.courseStatus === "draft" ? "Borrador" : "Archivado"}</Badge>}</td>
                  <td className="font-bold">{r.questions}</td>
                  <td className="font-bold">{r.attempts}</td>
                  <td className="font-bold">{r.passRate === null ? "—" : `${r.passRate}%`}</td>
                  <td className="font-bold">{r.avgScore === null ? "—" : `${r.avgScore}%`}</td>
                  <td>
                    <span className="flex flex-wrap gap-2">
                      <Link href={paths.quiz(r.courseId, r.id)} className="l-btn l-btn-soft l-btn-sm"><Pencil size={14} aria-hidden="true" /> Editar</Link>
                      <Link href={paths.viewQuiz(r.id)} className="l-btn l-btn-ghost l-btn-sm" title="Presentarla como un estudiante (no se guarda)"><ListChecks size={14} aria-hidden="true" /> Probar</Link>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
