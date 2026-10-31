"use client"

import { useState } from "react"
import useSWR from "swr"
import { Download } from "lucide-react"
import { Badge, Button, Card, ErrorPanel, ProgressBar, Skeleton } from "@/components/lms/ui"
import { HBars } from "@/components/lms/studio/charts"
import { errMsg } from "@/components/lms/studio/kit"
import { lms } from "@/lib/lms/api"
import { errorStatus, useManageOverview } from "@/lib/lms/hooks"
import { LEVEL_LABEL, toneForPct } from "@/lib/lms/format"
import { csvFileName } from "@/lib/lms/roles"
import { toast } from "@/lib/toast"
import { StatusBadge } from "@/components/lms/parts"
import { downloadBlob } from "./parts"

/** Reportes globales: por curso y por instructor, con exportación CSV (el servidor neutraliza fórmulas y audita la descarga). */
export default function Reports() {
  const { data: overview, error: e1, mutate: m1 } = useManageOverview()
  const { data: courses, error: e2, mutate: m2 } = useSWR("lms/manage/report-courses", () => lms.manage.reportCourses(), { revalidateOnFocus: false })
  const [busy, setBusy] = useState<"courses" | "instructors" | null>(null)

  const error = e1 ?? e2
  if (errorStatus(error) === 403) return <ErrorPanel title="Solo para administradores" />
  if (error) return <ErrorPanel title="No pudimos cargar los reportes" onRetry={() => { void m1(); void m2() }} />

  async function exportCsv(kind: "courses" | "instructors") {
    setBusy(kind)
    try {
      downloadBlob(await (kind === "courses" ? lms.manage.coursesCsv() : lms.manage.instructorsCsv()), csvFileName(kind === "courses" ? "cursos" : "instructores"))
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(null)
    }
  }

  const inst = overview?.instructors ?? []
  const maxStudents = Math.max(1, ...inst.map((i) => i.students))

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Reportes</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Resultados por curso y por instructor. Descárgalos en CSV para Excel o Sheets.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="soft" onClick={() => void exportCsv("courses")} loading={busy === "courses"}><Download size={16} aria-hidden="true" /> Cursos (CSV)</Button>
          <Button variant="soft" onClick={() => void exportCsv("instructors")} loading={busy === "instructors"}><Download size={16} aria-hidden="true" /> Instructores (CSV)</Button>
        </div>
      </header>

      <Card className="p-5">
        <h2 className="text-base font-extrabold">Estudiantes por instructor</h2>
        <p className="mb-3 text-xs font-semibold" style={{ color: "var(--l-muted)" }}>Personas con una matrícula activa en sus cursos</p>
        {!overview ? <Skeleton className="h-40" /> : inst.length === 0 ? <p className="text-sm" style={{ color: "var(--l-muted)" }}>Aún no hay instructores con cursos.</p> : (
          <HBars
            summary={`Estudiantes por instructor: ${inst.map((i) => `${i.name} ${i.students}`).join(", ")}`}
            rows={inst.map((i) => ({ label: i.name, sub: `${i.courses} cursos · aprobación ${i.passRate === null ? "—" : `${i.passRate}%`}`, percent: Math.round((i.students * 100) / maxStudents), text: String(i.students) }))}
          />
        )}
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="px-5 pt-5 text-base font-extrabold">Resultados por curso</h2>
        {!courses ? <div className="p-5"><Skeleton className="h-48" /></div> : (
          <table className="t-table">
            <caption className="sr-only">Resultados por curso</caption>
            <thead><tr><th scope="col">Curso</th><th scope="col">Instructor</th><th scope="col">Estado</th><th scope="col">Matriculados</th><th scope="col">Avance medio</th><th scope="col">Terminaron</th><th scope="col">Aprobación</th><th scope="col">Certificados</th></tr></thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td><span className="block font-extrabold">{c.title}</span><span className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{LEVEL_LABEL[c.level]} · {c.lessonCount} lecciones</span></td>
                  <td className="text-sm font-bold">{c.instructor || <Badge tone="amber">Sin instructor</Badge>}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="font-bold">{c.enrolled}</td>
                  <td className="min-w-[130px]"><div className="flex items-center gap-2"><ProgressBar value={c.avgProgress} tone={toneForPct(c.avgProgress)} label={`Avance medio de ${c.title}`} height={6} /><span className="text-xs font-extrabold">{c.avgProgress}%</span></div></td>
                  <td className="font-bold">{c.finished}</td>
                  <td className="font-bold">{c.passRate === null ? "—" : `${c.passRate}%`}</td>
                  <td className="font-bold">{c.certificates}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
