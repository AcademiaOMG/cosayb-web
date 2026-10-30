"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { MoreHorizontal, RotateCcw, UserMinus } from "lucide-react"
import { Avatar, Badge, Card, Chip, EmptyState, ErrorPanel, ProgressBar, Skeleton } from "@/components/lms/ui"
import { ActionMenu, errMsg } from "@/components/lms/studio/kit"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { usePaths } from "@/components/lms/shell/area"
import { lms } from "@/lib/lms/api"
import { errorStatus } from "@/lib/lms/hooks"
import { toneForPct } from "@/lib/lms/format"
import { timeAgo } from "@/lib/lms/studio"
import { toast } from "@/lib/toast"
import type { ManageEnrollment } from "@/lib/lms/types"
import { Pager, SearchBox, dateLabel, useDebounced } from "./parts"

/**
 * Matrículas. scope "all": toda la academia (administrador). scope "mine": solo las de MIS cursos (instructor);
 * el servidor aplica el límite: aunque se pida otro curso, no devuelve matrículas ajenas.
 */
export default function EnrollmentsAdmin({ scope }: { scope: "all" | "mine" }) {
  const paths = usePaths()
  const confirm = useConfirm()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<"all" | "active" | "revoked">("all")
  const [offset, setOffset] = useState(0)
  const dq = useDebounced(q)
  const args = { q: dq || undefined, status: status === "all" ? undefined : status, offset }
  const { data, error, mutate } = useSWR(["lms/enrollments", scope, dq, status, offset], () => (scope === "all" ? lms.manage.enrollments(args) : lms.admin.myEnrollments(args)), { revalidateOnFocus: false })

  if (errorStatus(error) === 403) return <ErrorPanel title="Sin permisos" />
  if (error) return <ErrorPanel title="No pudimos cargar las matrículas" onRetry={() => mutate()} />

  async function setEnrollment(e: ManageEnrollment, to: "active" | "revoked") {
    if (to === "revoked" && !(await confirm({ title: "Revocar matrícula", itemName: `${e.name} · ${e.courseTitle}`, description: "Deja de ver el curso. Su avance se conserva por si se reactiva.", confirmLabel: "Revocar", variant: "danger" }))) return
    try {
      if (scope === "all") await lms.manage.setEnrollment(e.id, to)
      else await lms.admin.setEnrollmentStatus(e.courseId, e.id, to)
      await mutate()
      toast.success(to === "active" ? "Matrícula reactivada." : "Matrícula revocada.")
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{scope === "all" ? "Matrículas de la academia" : "Mis estudiantes"}</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>
          {scope === "all" ? "Todas las matrículas, con su avance. Revoca o reactiva cualquiera." : "Quién cursa tus cursos y cómo va. Para matricular a más personas, abre el curso y entra a «Estudiantes»."}
        </p>
      </header>
      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={(v) => { setQ(v); setOffset(0) }} placeholder="Buscar persona o curso…" label="Buscar matrícula" width={280} />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
          {([["all", "Todas"], ["active", "Activas"], ["revoked", "Revocadas"]] as const).map(([id, label]) => <Chip key={id} pressed={status === id} onClick={() => { setStatus(id); setOffset(0) }}>{label}</Chip>)}
        </div>
      </div>

      {!data ? (
        <Skeleton className="h-72 !rounded-[22px]" />
      ) : data.rows.length === 0 ? (
        <EmptyState title="No hay matrículas" description={scope === "mine" ? "Cuando alguien se matricule en uno de tus cursos aparecerá aquí." : "Ninguna matrícula coincide con el filtro."} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="t-table">
            <caption className="sr-only">Matrículas</caption>
            <thead><tr><th scope="col">Estudiante</th><th scope="col">Curso</th><th scope="col">Avance</th><th scope="col">Última actividad</th><th scope="col">Estado</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {data.rows.map((e) => (
                <tr key={e.id}>
                  <td><span className="flex items-center gap-3"><Avatar name={e.name} size={34} /><span className="min-w-0"><span className="block break-words font-extrabold">{e.name}</span><span className="block break-all text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{e.email}</span></span></span></td>
                  <td><Link href={`${paths.course(e.courseId)}?tab=students`} className="font-bold hover:underline">{e.courseTitle}</Link><span className="block text-xs font-semibold" style={{ color: "var(--l-muted)" }}>Desde {dateLabel(e.enrolledAt)}</span></td>
                  <td className="min-w-[140px]"><div className="flex items-center gap-2"><ProgressBar value={e.percent} tone={toneForPct(e.percent)} label={`Avance de ${e.name}`} height={6} /><span className="text-xs font-extrabold">{e.percent}%</span></div>{e.certificate && <Badge tone="mint" className="mt-1">Certificado</Badge>}</td>
                  <td className="text-sm font-semibold" style={{ color: "var(--l-muted)" }}>{e.lastActivity ? timeAgo(e.lastActivity) : "—"}</td>
                  <td><Badge tone={e.status === "active" ? "mint" : "rose"}>{e.status === "active" ? "Activa" : "Revocada"}</Badge></td>
                  <td>
                    <ActionMenu label={`Acciones de la matrícula de ${e.name}`} trigger={<MoreHorizontal size={18} aria-hidden="true" />}>
                      {() => e.status === "active"
                        ? <button type="button" role="menuitem" className="l-danger" onClick={() => void setEnrollment(e, "revoked")}><UserMinus size={15} aria-hidden="true" /> Revocar matrícula</button>
                        : <button type="button" role="menuitem" onClick={() => void setEnrollment(e, "active")}><RotateCcw size={15} aria-hidden="true" /> Reactivar</button>}
                    </ActionMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {data && <Pager total={data.total} offset={offset} onChange={setOffset} noun="matrículas" />}
    </div>
  )
}
