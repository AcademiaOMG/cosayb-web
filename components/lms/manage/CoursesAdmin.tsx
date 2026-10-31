"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import useSWR, { mutate as globalMutate } from "swr"
import { Archive, Eye, MoreHorizontal, Pencil, Rocket, Undo2, UserCog } from "lucide-react"
import { Badge, Button, Card, Chip, EmptyState, ErrorPanel, Skeleton } from "@/components/lms/ui"
import { CourseThumb, StatusBadge } from "@/components/lms/parts"
import { ActionMenu, Dialog, SelectField, Switch, errMsg } from "@/components/lms/studio/kit"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { lms } from "@/lib/lms/api"
import { errorStatus, lmsKeys, useManageOverview } from "@/lib/lms/hooks"
import { toast } from "@/lib/toast"
import type { CourseStatus, ManageCourse } from "@/lib/lms/types"
import { LEVEL_LABEL } from "@/lib/lms/format"
import { Pager, SearchBox, dateLabel, useDebounced } from "./parts"

type StatusFilter = "all" | CourseStatus
const STATUS_ACTIONS: { to: "publish" | "archive" | "unpublish"; label: string; icon: typeof Rocket; from: CourseStatus[] }[] = [
  { to: "publish", label: "Publicar", icon: Rocket, from: ["draft", "archived"] },
  { to: "unpublish", label: "Pasar a borrador", icon: Undo2, from: ["published", "archived"] },
  { to: "archive", label: "Archivar", icon: Archive, from: ["published", "draft"] },
]

/** Todos los cursos de la academia: propietario, estado forzable, plan Academia y reasignación. */
export default function CoursesAdmin() {
  const params = useSearchParams()
  const confirm = useConfirm()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [owner, setOwner] = useState(params.get("ownerId") ?? "")
  const [offset, setOffset] = useState(0)
  const [reassign, setReassign] = useState<ManageCourse | null>(null)
  const dq = useDebounced(q)
  const { data: overview } = useManageOverview()
  const key = ["lms/manage/courses", dq, status, owner, offset]
  const { data, error, mutate } = useSWR(key, () => lms.manage.courses({ q: dq || undefined, status: status === "all" ? undefined : status, ownerId: owner || undefined, offset }), { revalidateOnFocus: false })

  if (errorStatus(error) === 403) return <ErrorPanel title="Solo para administradores" />
  if (error) return <ErrorPanel title="No pudimos cargar los cursos" onRetry={() => mutate()} />

  const refresh = () => Promise.all([mutate(), globalMutate(`${lmsKeys.manage}/overview`)])

  async function setCourseStatus(c: ManageCourse, to: "publish" | "archive" | "unpublish", label: string) {
    if (to !== "publish" && c.enrolled > 0 && !(await confirm({ title: `${label}: ${c.title}`, description: `${c.enrolled} estudiantes matriculados dejarán de verlo hasta que se publique de nuevo.`, confirmLabel: label, variant: "danger" }))) return
    try {
      await lms.admin.setStatus(c.id, to)
      await refresh()
      toast.success("Estado actualizado.")
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  async function toggleAcademia(c: ManageCourse, v: boolean) {
    try {
      await lms.admin.updateCourse(c.id, { includedInAcademia: v })
      await mutate()
      toast.success(v ? "Incluido en el plan Academia." : "Fuera del plan Academia.")
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Cursos de la academia</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Todos los cursos, con su instructor responsable. Aquí puedes publicar, archivar o reasignar cualquiera.</p>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={(v) => { setQ(v); setOffset(0) }} placeholder="Buscar curso…" label="Buscar curso" />
        <select className="l-input l-select !min-h-10 !w-auto" aria-label="Instructor responsable" value={owner} onChange={(e) => { setOwner(e.target.value); setOffset(0) }}>
          <option value="">Todos los instructores</option>
          {overview?.instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        {([["all", "Todos"], ["published", "Publicados"], ["draft", "Borradores"], ["archived", "Archivados"]] as const).map(([id, label]) => (
          <Chip key={id} pressed={status === id} onClick={() => { setStatus(id); setOffset(0) }}>{label}</Chip>
        ))}
      </div>

      {!data ? (
        <Skeleton className="h-72 !rounded-[22px]" />
      ) : data.rows.length === 0 ? (
        <EmptyState title="Ningún curso coincide" description="Prueba con otro filtro o búsqueda." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="t-table">
            <caption className="sr-only">Cursos de la academia</caption>
            <thead><tr><th scope="col">Curso</th><th scope="col">Instructor</th><th scope="col">Estado</th><th scope="col">Estudiantes</th><th scope="col">Plan Academia</th><th scope="col">Editado</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {data.rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/administracion/cursos/${c.id}`} className="flex items-center gap-3 font-extrabold hover:underline">
                      <CourseThumb coverKey={c.coverKey} size={40} rounded={12} />
                      <span className="min-w-0"><span className="block break-words">{c.title}</span><span className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{c.lessons} lecciones · {LEVEL_LABEL[c.level]}</span></span>
                    </Link>
                  </td>
                  <td>{c.owner ? <span className="text-sm font-bold">{c.owner.name}</span> : <Badge tone="amber">Sin instructor</Badge>}</td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="font-bold">{c.enrolled}</td>
                  <td><Switch checked={c.includedInAcademia} onChange={(v) => void toggleAcademia(c, v)} label={`Incluir «${c.title}» en el plan Academia`} /></td>
                  <td className="text-sm font-semibold" style={{ color: "var(--l-muted)" }}>{dateLabel(c.updatedAt)}</td>
                  <td>
                    <ActionMenu label={`Acciones de ${c.title}`} trigger={<MoreHorizontal size={18} aria-hidden="true" />}>
                      {() => (
                        <>
                          <Link role="menuitem" href={`/administracion/ver/${c.slug}`}><Eye size={15} aria-hidden="true" /> Abrir como estudiante</Link>
                          <Link role="menuitem" href={`/administracion/cursos/${c.id}`}><Pencil size={15} aria-hidden="true" /> Editar curso</Link>
                          <button type="button" role="menuitem" onClick={() => setReassign(c)}><UserCog size={15} aria-hidden="true" /> Cambiar instructor</button>
                          {STATUS_ACTIONS.filter((a) => a.from.includes(c.status)).map((a) => (
                            <button key={a.to} type="button" role="menuitem" className={a.to === "archive" ? "l-danger" : undefined} onClick={() => void setCourseStatus(c, a.to, a.label)}><a.icon size={15} aria-hidden="true" /> {a.label}</button>
                          ))}
                        </>
                      )}
                    </ActionMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {data && <Pager total={data.total} offset={offset} onChange={setOffset} noun="cursos" />}
      {reassign && <ReassignDialog course={reassign} onClose={() => setReassign(null)} onDone={() => { setReassign(null); void refresh() }} />}
    </div>
  )
}

function ReassignDialog({ course, onClose, onDone }: { course: ManageCourse; onClose: () => void; onDone: () => void }) {
  const { data } = useManageOverview()
  const [to, setTo] = useState(course.owner?.id ?? "")
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    try {
      await lms.manage.reassign(course.id, to || null)
      toast.success(to ? "Instructor actualizado." : "El curso quedó sin instructor responsable.")
      onDone()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open onClose={onClose} title={`Instructor de «${course.title}»`} footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={save} loading={busy} disabled={to === (course.owner?.id ?? "")}>Guardar</Button></>}>
      <div className="flex flex-col gap-3">
        <SelectField label="Instructor responsable" value={to} onChange={(e) => setTo(e.target.value)} hint="Solo quien tiene el rol de instructor o administrador. El anterior deja de ver este curso." options={[{ value: "", label: "Sin instructor (solo administradores)" }, ...(data?.instructors.map((i) => ({ value: i.id, label: `${i.name} · ${i.email}` })) ?? [])]} />
        {!data && <Skeleton className="h-10" />}
      </div>
    </Dialog>
  )
}
