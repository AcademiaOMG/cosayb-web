"use client"

import { useState } from "react"
import useSWR from "swr"
import { Badge, Card, EmptyState, ErrorPanel, Skeleton } from "@/components/lms/ui"
import { lms } from "@/lib/lms/api"
import { errorStatus, useManageOverview } from "@/lib/lms/hooks"
import { AUDIT_FILTERS, auditLabel } from "@/lib/lms/roles"
import { Pager, dateTimeLabel } from "./parts"

/** Metadatos legibles y acotados (nunca se vuelcan objetos enormes). */
function detail(m: Record<string, unknown> | null): string {
  if (!m) return ""
  const parts = Object.entries(m)
    .filter(([k, v]) => k !== "demo" && v !== null && v !== undefined && typeof v !== "object")
    .slice(0, 4)
    .map(([k, v]) => `${k}: ${String(v).slice(0, 60)}`)
  return parts.join(" · ")
}

const startOfDay = (d: string) => (d ? new Date(`${d}T00:00:00`).toISOString() : undefined)
const nextDay = (d: string) => (d ? new Date(new Date(`${d}T00:00:00`).getTime() + 86_400_000).toISOString() : undefined)

/** Registro de auditoría del LMS: quién hizo qué, filtrable por acción, persona y fechas. */
export default function AuditLog() {
  const [action, setAction] = useState("")
  const [actor, setActor] = useState("")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [offset, setOffset] = useState(0)
  const { data: overview } = useManageOverview()
  const reset = (fn: () => void) => { fn(); setOffset(0) }
  const { data, error, mutate } = useSWR(["lms/manage/audit", action, actor, from, to, offset], () => lms.manage.audit({ action: action || undefined, actorId: actor || undefined, from: startOfDay(from), to: nextDay(to), offset }), { revalidateOnFocus: false })

  if (errorStatus(error) === 403) return <ErrorPanel title="Solo para administradores" />
  if (error) return <ErrorPanel title="No pudimos cargar la auditoría" onRetry={() => mutate()} />

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Auditoría</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Quién hizo qué en la academia. No incluye contenido de los cursos ni datos sensibles.</p>
      </header>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-bold">Acción
          <select className="l-input l-select !min-h-10 !w-auto" value={action} onChange={(e) => reset(() => setAction(e.target.value))}>
            {AUDIT_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold">Persona
          <select className="l-input l-select !min-h-10 !w-auto" value={actor} onChange={(e) => reset(() => setActor(e.target.value))}>
            <option value="">Todas</option>
            {overview?.instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold">Desde
          <input type="date" className="l-input !min-h-10" value={from} max={to || undefined} onChange={(e) => reset(() => setFrom(e.target.value))} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-bold">Hasta
          <input type="date" className="l-input !min-h-10" value={to} min={from || undefined} onChange={(e) => reset(() => setTo(e.target.value))} />
        </label>
      </div>
      {!data ? (
        <Skeleton className="h-72 !rounded-[22px]" />
      ) : data.rows.length === 0 ? (
        <EmptyState title="Sin registros" description="No hay acciones que coincidan con el filtro." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="t-table">
            <caption className="sr-only">Registro de auditoría del LMS</caption>
            <thead><tr><th scope="col">Cuándo</th><th scope="col">Quién</th><th scope="col">Qué hizo</th><th scope="col">Detalle</th></tr></thead>
            <tbody>
              {data.rows.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap text-sm font-semibold">{dateTimeLabel(r.at)}</td>
                  <td><span className="block font-extrabold">{r.actorName}</span><span className="flex flex-wrap gap-1">{r.actorRoles.map((x) => <Badge key={x} tone={x === "lms_admin" ? "brand" : "sky"}>{x === "lms_admin" ? "Administrador" : x === "lms_instructor" ? "Instructor" : x}</Badge>)}</span></td>
                  <td className="font-bold">{auditLabel(r.action)}</td>
                  <td className="max-w-[320px] break-words text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{detail(r.metadata)}{r.resourceId && !detail(r.metadata) ? r.resourceId.slice(0, 36) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {data && <Pager total={data.total} offset={offset} onChange={setOffset} noun="registros" />}
    </div>
  )
}
