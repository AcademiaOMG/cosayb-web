"use client"

import { useState } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { ArrowLeft, Award, BellRing, Check, Download, MoreHorizontal, RotateCcw, Search, UserMinus, UserPlus, Users, X } from "lucide-react"
import { Avatar, Badge, Button, Card, Chip, EmptyState, ErrorPanel, ProgressBar, Skeleton } from "@/components/lms/ui"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { lms } from "@/lib/lms/api"
import { lmsKeys, useAdminEnrollments } from "@/lib/lms/hooks"
import { toneForPct } from "@/lib/lms/format"
import { timeAgo } from "@/lib/lms/studio"
import { toast } from "@/lib/toast"
import type { AdminCourse, AdminEnrollment, StudentHit } from "@/lib/lms/types"
import { ActionMenu, TextField, errMsg } from "./kit"

const PAGE = 50
const refresh = (courseId: string) => globalMutate((k) => Array.isArray(k) && k[0] === lmsKeys.adminEnrollments(courseId))

export default function StudentsTab({ course }: { course: AdminCourse }) {
  const [wizard, setWizard] = useState(false)
  if (wizard) return <EnrollWizard course={course} onClose={() => { setWizard(false); void refresh(course.id) }} />
  return <EnrollmentsTable course={course} onAdd={() => setWizard(true)} />
}

// ─── Tabla de matriculados ──────────────────────────────────────────────────

function EnrollmentsTable({ course, onAdd }: { course: AdminCourse; onAdd: () => void }) {
  const confirm = useConfirm()
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<"all" | "active" | "revoked">("all")
  const [offset, setOffset] = useState(0)
  const { data, error, mutate } = useAdminEnrollments(course.id, q, status === "all" ? undefined : status, offset)
  const [exporting, setExporting] = useState(false)

  async function exportCsv() {
    setExporting(true)
    try {
      const blob = await lms.admin.exportEnrollments(course.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `matriculados-${course.slug}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setExporting(false)
    }
  }

  async function setEnrollment(e: AdminEnrollment, to: "active" | "revoked") {
    if (to === "revoked" && !(await confirm({ title: "Revocar matrícula", itemName: e.email, variant: "danger" }))) return
    try {
      await lms.admin.setEnrollmentStatus(course.id, e.id, to)
      await mutate()
      toast.success(to === "active" ? "Matrícula reactivada." : "Matrícula revocada.")
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  async function remind(e: AdminEnrollment) {
    try {
      await lms.admin.remind(course.id, e.id)
      await mutate()
      toast.success(`Recordatorio enviado a ${e.email}.`)
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  async function issue(e: AdminEnrollment) {
    if (!(await confirm({ title: "Emitir certificado", description: `Se emitirá el certificado a ${e.name} aunque no haya terminado el curso.`, itemName: e.email, confirmLabel: "Emitir" }))) return
    try {
      await lms.admin.issueCertificate(course.id, e.userId)
      await mutate()
      toast.success("Certificado emitido.")
    } catch (err) {
      toast.error(errMsg(err))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--l-muted)" }} />
            <input className="l-input !min-h-10" style={{ paddingLeft: 36, width: 250 }} type="search" placeholder="Buscar por nombre o correo…" aria-label="Buscar matriculados" value={q} onChange={(e) => { setQ(e.target.value); setOffset(0) }} />
          </div>
          {([["all", "Todos"], ["active", "Activos"], ["revoked", "Revocados"]] as const).map(([id, label]) => (
            <Chip key={id} pressed={status === id} onClick={() => { setStatus(id); setOffset(0) }}>{label}</Chip>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={exportCsv} loading={exporting}><Download size={15} aria-hidden="true" /> Exportar CSV</Button>
          <Button size="sm" onClick={onAdd}><UserPlus size={15} aria-hidden="true" /> Matricular estudiantes</Button>
        </div>
      </div>

      {error ? <ErrorPanel title="No pudimos cargar los matriculados" onRetry={() => mutate()} /> : !data ? <Skeleton className="h-64 !rounded-[22px]" /> : data.rows.length === 0 ? (
        <EmptyState title={q || status !== "all" ? "Ninguna matrícula coincide" : "Nadie matriculado todavía"} description="Matricula a tus estudiantes para que vean el curso en «Mis cursos»." action={<Button onClick={onAdd}><UserPlus size={16} aria-hidden="true" /> Matricular estudiantes</Button>} />
      ) : (
        <Card className="overflow-x-auto">
          <table className="t-table">
            <caption className="sr-only">Estudiantes matriculados en {course.title}</caption>
            <thead><tr><th scope="col">Estudiante</th><th scope="col">Avance</th><th scope="col">Última actividad</th><th scope="col">Nota</th><th scope="col">Estado</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
            <tbody>
              {data.rows.map((e) => (
                <tr key={e.id}>
                  <td><div className="flex items-center gap-3"><Avatar name={e.name} size={36} /><div className="min-w-0"><p className="break-words font-extrabold">{e.name}</p><p className="break-all text-xs" style={{ color: "var(--l-muted)" }}>{e.email}</p></div></div></td>
                  <td className="min-w-[150px]"><div className="flex items-center gap-2"><ProgressBar value={e.percent} tone={toneForPct(e.percent)} label={`Avance de ${e.name}`} height={6} /><span className="w-10 text-right text-xs font-extrabold">{e.percent}%</span></div><span className="l-hint">{e.completed}/{e.total} lecciones</span></td>
                  <td className="whitespace-nowrap text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{timeAgo(e.lastActivity)}</td>
                  <td className="font-extrabold">{e.score === null ? "—" : `${e.score}%`}</td>
                  <td><div className="flex flex-wrap gap-1"><Badge tone={e.status === "active" ? "mint" : "neutral"}>{e.status === "active" ? "Activa" : "Revocada"}</Badge>{e.certificate && <Badge tone="brand"><Award size={12} aria-hidden="true" /> Certificado</Badge>}</div></td>
                  <td>
                    <ActionMenu label={`Acciones para ${e.name}`} trigger={<MoreHorizontal size={16} aria-hidden="true" />}>
                      {() => (
                        <>
                          {e.status === "active" && course.status === "published" && <button type="button" role="menuitem" onClick={() => void remind(e)}><BellRing size={15} aria-hidden="true" /> Enviar recordatorio</button>}
                          {e.status === "active" && !e.certificate && <button type="button" role="menuitem" onClick={() => void issue(e)}><Award size={15} aria-hidden="true" /> Emitir certificado</button>}
                          {e.status === "active" ? (
                            <button type="button" role="menuitem" className="l-danger" onClick={() => void setEnrollment(e, "revoked")}><UserMinus size={15} aria-hidden="true" /> Revocar matrícula</button>
                          ) : (
                            <button type="button" role="menuitem" onClick={() => void setEnrollment(e, "active")}><RotateCcw size={15} aria-hidden="true" /> Reactivar</button>
                          )}
                        </>
                      )}
                    </ActionMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between gap-3 p-3 text-sm font-semibold" style={{ color: "var(--l-muted)" }}>
            <span>{offset + 1}–{offset + data.rows.length} de {data.total}</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Anterior</Button>
              <Button variant="ghost" size="sm" disabled={offset + PAGE >= data.total} onClick={() => setOffset(offset + PAGE)}>Siguiente</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

// ─── Asistente: asignar estudiantes ─────────────────────────────────────────

function EnrollWizard({ course, onClose }: { course: AdminCourse; onClose: () => void }) {
  const confirm = useConfirm()
  const [step, setStep] = useState<2 | 3 | 4>(2)
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<"available" | "all">("available")
  const [offset, setOffset] = useState(0)
  const [picked, setPicked] = useState<Map<string, StudentHit>>(new Map())
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ enrolled: number; unknown: number } | null>(null)
  const { data, error, mutate } = useSWR(["lms/admin/students", course.id, q, filter, offset], () => lms.admin.students(course.id, { q, filter, offset, limit: 48 }), { revalidateOnFocus: false, keepPreviousData: true })

  const toggle = (s: StudentHit) => setPicked((m) => { const n = new Map(m); if (n.has(s.id)) n.delete(s.id); else n.set(s.id, s); return n })
  const selectable = (data ?? []).filter((s) => !s.enrolled)

  async function selectAll() {
    if (selectable.length === 0) return
    if (!(await confirm({ title: "Seleccionar a todos", description: `Se agregarán ${selectable.length} personas de la lista actual a la selección.`, itemName: `${selectable.length} estudiantes`, confirmLabel: "Seleccionar" }))) return
    setPicked((m) => { const n = new Map(m); selectable.forEach((s) => n.set(s.id, s)); return n })
  }

  async function addByEmail() {
    if (!email.trim()) return
    try {
      await lms.admin.enroll(course.id, email.trim())
      toast.success("Matrícula registrada.")
      setEmail("")
      void mutate()
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  async function confirmEnroll() {
    setBusy(true)
    try {
      setResult(await lms.admin.bulkEnroll(course.id, [...picked.keys()]))
      setStep(4)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const labels = ["Curso", "Asignar estudiantes", "Confirmación"]
  const current = step === 4 ? 3 : step
  const next = step === 2 ? "Confirmación" : null

  return (
    <Card className="overflow-hidden">
      <div className="border-b p-4" style={{ borderColor: "var(--l-line)" }}>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Volver a los matriculados"><ArrowLeft size={16} aria-hidden="true" /></Button>
          <p className="min-w-0 flex-1 text-center text-sm font-bold" aria-live="polite">
            <span style={{ color: "var(--l-muted)" }}>Paso {current}: </span>{labels[current - 1]}
          </p>
          {next && <span className="hidden text-sm font-semibold sm:inline" style={{ color: "var(--l-muted)" }}>Siguiente: <strong style={{ color: "var(--l-ink)" }}>{next}</strong></span>}
          {step === 2 && <Button size="sm" disabled={picked.size === 0} onClick={() => setStep(3)}>Continuar</Button>}
          {step === 3 && <Button size="sm" loading={busy} onClick={confirmEnroll}><Check size={15} aria-hidden="true" /> Confirmar matrícula</Button>}
        </div>
        <div className="mt-3 flex gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={current} aria-label="Progreso del asistente">
          {labels.map((l, i) => <span key={l} className="p-seg" data-on={i < current} />)}
        </div>
      </div>

      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4 p-5">
            <div>
              <h2 className="text-xl font-extrabold">Selecciona estudiantes</h2>
              <p className="text-sm" style={{ color: "var(--l-muted)" }}>Matricula personas que ya tienen cuenta en «{course.title}». No necesitan tener un negocio.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px] flex-1">
                <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--l-muted)" }} />
                <input className="l-input !min-h-10" style={{ paddingLeft: 36 }} type="search" placeholder="Buscar por nombre o correo…" aria-label="Buscar estudiantes" value={q} onChange={(e) => { setQ(e.target.value); setOffset(0) }} />
              </div>
              <Chip pressed={filter === "available"} onClick={() => { setFilter("available"); setOffset(0) }}>Disponibles</Chip>
              <Chip pressed={filter === "all"} onClick={() => { setFilter("all"); setOffset(0) }}>Todos</Chip>
              <Button variant="soft" size="sm" onClick={selectAll} disabled={selectable.length === 0}><Users size={15} aria-hidden="true" /> Matricular a todos los de la lista</Button>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[220px] flex-1"><TextField label="¿No aparece? Matricula por correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@correo.com" onKeyDown={(e) => { if (e.key === "Enter") void addByEmail() }} /></div>
              <Button variant="ghost" size="sm" onClick={addByEmail}>Matricular ya</Button>
            </div>

            {error ? <ErrorPanel title="No pudimos cargar a las personas" onRetry={() => mutate()} /> : !data ? <Skeleton className="h-64" /> : data.length === 0 ? (
              <EmptyState title="Nadie coincide" description="Prueba con otro nombre o correo." />
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Personas disponibles">
                {data.map((s) => (
                  <li key={s.id}>
                    <button type="button" className="p-card w-full disabled:cursor-not-allowed disabled:opacity-60" aria-pressed={picked.has(s.id)} disabled={s.enrolled} onClick={() => toggle(s)}>
                      <span className="flex items-center gap-3"><Avatar name={s.name} size={34} /><span className="min-w-0 flex-1"><span className="block truncate font-extrabold">{s.name}</span><span className="block truncate text-xs" style={{ color: "var(--l-muted)" }}>{s.email}</span></span>{picked.has(s.id) && <Check size={18} aria-hidden="true" />}</span>
                      <span className="flex flex-wrap gap-1.5"><span className="p-tag">{s.courses} curso{s.courses === 1 ? "" : "s"}</span>{s.enrolled && <span className="p-tag" style={{ background: "var(--l-mint-bg)", color: "var(--l-mint-ink)" }}>Ya matriculado</span>}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 48))}>Anterior</Button>
              <Button variant="ghost" size="sm" disabled={!data || data.length < 48} onClick={() => setOffset(offset + 48)}>Siguiente</Button>
            </div>
          </div>

          <aside className="border-t p-5 lg:border-l lg:border-t-0" style={{ borderColor: "var(--l-line)", background: "#f8faff" }} aria-label="Estudiantes asignados">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-extrabold">Estudiantes asignados <Badge tone="neutral">{picked.size}</Badge></h3>
              <button type="button" className="text-sm font-bold" style={{ color: "var(--l-brand)" }} disabled={picked.size === 0} onClick={() => setPicked(new Map())}>Deseleccionar todo</button>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {[...picked.values()].map((s) => (
                <li key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-2 text-sm font-bold shadow-sm">
                  <Avatar name={s.name} size={24} /><span className="max-w-[140px] truncate">{s.name}</span>
                  <button type="button" aria-label={`Quitar a ${s.name}`} onClick={() => toggle(s)}><X size={14} aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
            {picked.size === 0 && <p className="mt-3 text-sm" style={{ color: "var(--l-muted)" }}>Toca las tarjetas para elegir a quién matricular.</p>}
          </aside>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4 p-6">
          <h2 className="text-xl font-extrabold">Confirma la matrícula</h2>
          <p className="text-sm" style={{ color: "var(--l-muted)" }}>Vas a matricular a <strong>{picked.size}</strong> persona{picked.size === 1 ? "" : "s"} en <strong>{course.title}</strong>. Verán el curso de inmediato en «Mis cursos».</p>
          <ul className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
            {[...picked.values()].map((s) => <li key={s.id} className="flex items-center gap-3 rounded-2xl p-2" style={{ background: "var(--l-bg)" }}><Avatar name={s.name} size={30} /><span className="min-w-0"><span className="block truncate text-sm font-extrabold">{s.name}</span><span className="block truncate text-xs" style={{ color: "var(--l-muted)" }}>{s.email}</span></span></li>)}
          </ul>
          {course.status !== "published" && <p role="note" className="rounded-2xl p-3 text-sm font-bold" style={{ background: "var(--l-amber-bg)", color: "var(--l-amber-ink)" }}>El curso aún no está publicado: verán el curso cuando lo publiques.</p>}
          <div><Button variant="ghost" onClick={() => setStep(2)}>Volver y ajustar</Button></div>
        </div>
      )}

      {step === 4 && result && (
        <div className="flex flex-col items-center gap-3 p-10 text-center" role="status">
          <span className="inline-flex h-16 w-16 items-center justify-center rounded-full l-pop" style={{ background: "var(--l-mint-bg)", color: "var(--l-mint-ink)" }}><Check size={32} aria-hidden="true" /></span>
          <h2 className="text-2xl font-extrabold">¡Listo!</h2>
          <p style={{ color: "var(--l-muted)" }}>{result.enrolled} persona{result.enrolled === 1 ? "" : "s"} matriculada{result.enrolled === 1 ? "" : "s"}{result.unknown ? ` · ${result.unknown} no se encontraron` : ""}.</p>
          <Button onClick={onClose}>Ver matriculados</Button>
        </div>
      )}
    </Card>
  )
}
