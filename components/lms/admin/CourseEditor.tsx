"use client"

import { useRef, useState } from "react"
import { mutate as globalMutate } from "swr"
import { FileText, Film, Plus, Subtitles, Trash2, Upload } from "lucide-react"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import ErrorState from "@/components/ui/ErrorState"
import Input from "@/components/ui/Input"
import LoadingBlock from "@/components/ui/LoadingBlock"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import QuizEditor from "./QuizEditor"
import AnalyticsPanel from "./AnalyticsPanel"
import MetaFields from "./MetaFields"
import { Check, SectionTitle, TextArea, errMsg } from "./ui"
import { lms } from "@/lib/lms/api"
import { errorStatus, lmsKeys, useAdminCertificates, useAdminCourse, useAdminEnrollments } from "@/lib/lms/hooks"
import { UPLOAD_RULES, formatBytes, validateSlug, validateUpload } from "@/lib/lms/validation"
import { fmtDate } from "@/lib/saas/format"
import { toast } from "@/lib/toast"
import type { AdminLesson, AssetKind, CourseMeta, CourseStatus } from "@/lib/lms/types"

const TABS = [
  { id: "content", label: "Contenido" },
  { id: "quizzes", label: "Evaluaciones" },
  { id: "analytics", label: "Analítica" },
  { id: "enrollments", label: "Matriculados" },
  { id: "certificates", label: "Certificados" },
  { id: "settings", label: "Ajustes" },
] as const
type Tab = (typeof TABS)[number]["id"]

const STATUS_LABEL: Record<CourseStatus, string> = { draft: "Borrador", published: "Publicado", archived: "Archivado" }

export default function CourseEditor({ id }: { id: string }) {
  const { data: course, error, mutate } = useAdminCourse(id)
  const [tab, setTab] = useState<Tab>("content")
  const [busy, setBusy] = useState(false)

  if (errorStatus(error) === 403) return <ErrorState title="Sin permisos" description="Gestionar cursos requiere permisos de instructor." />
  if (error) return <ErrorState title="No pudimos cargar el curso" onRetry={() => mutate()} />
  if (!course) return <LoadingBlock className="py-12" />

  async function setStatus(action: "publish" | "archive" | "unpublish") {
    setBusy(true)
    try {
      await lms.admin.setStatus(id, action)
      await Promise.all([mutate(), globalMutate(lmsKeys.adminCourses), globalMutate(lmsKeys.catalog)])
      toast.success(action === "publish" ? "Curso publicado." : action === "archive" ? "Curso archivado." : "Curso devuelto a borrador.")
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={course.status === "published" ? "success" : course.status === "draft" ? "warning" : "muted"}>{STATUS_LABEL[course.status]}</Badge>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>/cursos/{course.slug}</span>
        <div className="ml-auto flex flex-wrap gap-2">
          {course.status !== "published" && <Button size="sm" onClick={() => setStatus("publish")} loading={busy}>Publicar</Button>}
          {course.status === "published" && <Button size="sm" variant="ghost" onClick={() => setStatus("unpublish")} loading={busy}>Volver a borrador</Button>}
          {course.status !== "archived" && <Button size="sm" variant="ghost" onClick={() => setStatus("archive")} loading={busy}>Archivar</Button>}
        </div>
      </div>

      <div role="tablist" aria-label="Secciones del curso" className="flex gap-1 overflow-x-auto" style={{ borderBottom: "1px solid var(--border-light)" }}>
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => setTab(t.id)} className="shrink-0 px-3 py-2 text-sm font-medium" style={{ borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent", color: tab === t.id ? "var(--accent-text)" : "var(--text-secondary)" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "content" && <ContentTab courseId={id} modules={course.modules} reload={() => mutate()} />}
      {tab === "quizzes" && <QuizEditor courseId={id} />}
      {tab === "analytics" && <AnalyticsPanel courseId={id} />}
      {tab === "enrollments" && <EnrollmentsTab courseId={id} />}
      {tab === "certificates" && <CertificatesTab courseId={id} />}
      {tab === "settings" && <SettingsTab course={course} reload={() => mutate()} />}
    </div>
  )
}

// ─── Contenido ──────────────────────────────────────────────────────────────

function ContentTab({ courseId, modules, reload }: { courseId: string; modules: { id: string; title: string; lessons: AdminLesson[] }[]; reload: () => void }) {
  const confirm = useConfirm()
  const [title, setTitle] = useState("")

  async function addModule() {
    if (!title.trim()) return
    try {
      await lms.admin.createModule(courseId, title.trim())
      setTitle("")
      reload()
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {modules.map((m) => (
        <ModuleCard key={m.id} module={m} reload={reload} onDelete={async () => {
          if (!(await confirm({ title: "Eliminar módulo", itemName: m.title, variant: "danger" }))) return
          try { await lms.admin.deleteModule(m.id); reload() } catch (e) { toast.error(errMsg(e)) }
        }} />
      ))}
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1"><Input label="Nuevo módulo" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Módulo 1: Fundamentos" /></div>
        <Button onClick={addModule}><Plus size={16} aria-hidden="true" /> Agregar módulo</Button>
      </Card>
    </div>
  )
}

function ModuleCard({ module: m, reload, onDelete }: { module: { id: string; title: string; lessons: AdminLesson[] }; reload: () => void; onDelete: () => void }) {
  const [title, setTitle] = useState(m.title)
  const [newLesson, setNewLesson] = useState("")

  async function rename() {
    if (!title.trim() || title === m.title) return
    try { await lms.admin.updateModule(m.id, { title: title.trim() }); reload() } catch (e) { toast.error(errMsg(e)) }
  }
  async function addLesson() {
    if (!newLesson.trim()) return
    try { await lms.admin.createLesson(m.id, { title: newLesson.trim(), body: "", isPreview: false }); setNewLesson(""); reload() } catch (e) { toast.error(errMsg(e)) }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <div className="flex-1"><Input label="Módulo" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={rename} maxLength={200} /></div>
        <Button size="sm" variant="danger" onClick={onDelete} aria-label={`Eliminar módulo ${m.title}`}><Trash2 size={14} aria-hidden="true" /></Button>
      </div>
      {m.lessons.map((l) => <LessonEditor key={l.id} lesson={l} reload={reload} />)}
      <div className="flex items-end gap-2">
        <div className="flex-1"><Input aria-label="Título de la nueva lección" placeholder="Nueva lección" value={newLesson} onChange={(e) => setNewLesson(e.target.value)} maxLength={200} /></div>
        <Button size="sm" variant="ghost" onClick={addLesson}><Plus size={14} aria-hidden="true" /> Lección</Button>
      </div>
    </Card>
  )
}

const KIND_ICON = { video: Film, document: FileText, subtitle: Subtitles, thumbnail: FileText } as const

function LessonEditor({ lesson, reload }: { lesson: AdminLesson; reload: () => void }) {
  const confirm = useConfirm()
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ title: lesson.title, body: lesson.body, isPreview: lesson.isPreview })
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState<AssetKind | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const kindRef = useRef<AssetKind>("video")

  async function save() {
    setBusy(true)
    try { await lms.admin.updateLesson(lesson.id, f); toast.success("Lección guardada."); reload() } catch (e) { toast.error(errMsg(e)) } finally { setBusy(false) }
  }

  async function onFile(file: File | undefined) {
    if (!file) return
    const kind = kindRef.current
    const problem = validateUpload(kind, file)
    if (problem) {
      toast.error(problem)
      return
    }
    setUploading(kind)
    try {
      await lms.admin.uploadAsset(lesson.id, kind, file)
      toast.success("Archivo subido.")
      reload()
    } catch (e) {
      toast.error(errMsg(e, "No se pudo subir el archivo."))
    } finally {
      setUploading(null)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function pick(kind: AssetKind) {
    kindRef.current = kind
    if (fileRef.current) {
      fileRef.current.accept = UPLOAD_RULES[kind].mimes.join(",")
      fileRef.current.click()
    }
  }

  return (
    <div className="rounded-xl p-3" style={{ background: "var(--bg-secondary)" }}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center gap-2 text-left text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        <span className="min-w-0 flex-1 break-words">{lesson.title}</span>
        {lesson.isPreview && <Badge variant="success">Vista previa</Badge>}
        <Badge variant="muted">{lesson.assets.length} archivos</Badge>
      </button>
      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <Input label="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={200} />
          <TextArea label="Contenido (texto plano; se muestra tal cual, sin HTML)" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} maxLength={50000} rows={8} />
          <Check label="Lección de vista previa (visible sin matrícula)" checked={f.isPreview} onChange={(v) => setF({ ...f, isPreview: v })} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={save} loading={busy}>Guardar lección</Button>
            <Button size="sm" variant="danger" onClick={async () => {
              if (!(await confirm({ title: "Eliminar lección", itemName: lesson.title, variant: "danger" }))) return
              try { await lms.admin.deleteLesson(lesson.id); reload() } catch (e) { toast.error(errMsg(e)) }
            }}><Trash2 size={14} aria-hidden="true" /> Eliminar</Button>
          </div>

          <SectionTitle>ARCHIVOS PRIVADOS</SectionTitle>
          <ul className="flex flex-col gap-1">
            {lesson.assets.map((a) => {
              const Icon = KIND_ICON[a.kind]
              return (
                <li key={a.id} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
                  <Icon size={16} aria-hidden="true" />
                  <span className="min-w-0 flex-1 break-words">{UPLOAD_RULES[a.kind].label} · {formatBytes(a.sizeBytes)}</span>
                  <Button size="sm" variant="ghost" aria-label="Eliminar archivo" onClick={async () => {
                    if (!(await confirm({ title: "Eliminar archivo", itemName: UPLOAD_RULES[a.kind].label, variant: "danger" }))) return
                    try { await lms.admin.deleteAsset(lesson.id, a.id); reload() } catch (e) { toast.error(errMsg(e)) }
                  }}><Trash2 size={14} aria-hidden="true" /></Button>
                </li>
              )
            })}
          </ul>
          <input ref={fileRef} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => onFile(e.target.files?.[0])} />
          <div className="flex flex-wrap gap-2">
            {(["video", "document", "subtitle"] as const).map((k) => (
              <Button key={k} size="sm" variant="ghost" loading={uploading === k} disabled={uploading !== null} onClick={() => pick(k)}>
                <Upload size={14} aria-hidden="true" /> {UPLOAD_RULES[k].label}
              </Button>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Los archivos se guardan en almacenamiento privado y solo se entregan a quien tiene acceso, con enlaces que vencen en 5 minutos.</p>
        </div>
      )}
    </div>
  )
}

// ─── Matrículas ─────────────────────────────────────────────────────────────

function EnrollmentsTab({ courseId }: { courseId: string }) {
  const { data, mutate, error } = useAdminEnrollments(courseId)
  const confirm = useConfirm()
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)

  async function enroll() {
    if (!email.trim()) return
    setBusy(true)
    try {
      await lms.admin.enroll(courseId, email.trim())
      setEmail("")
      toast.success("Matrícula registrada.")
      await mutate()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1"><Input label="Matricular por correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@correo.com" hint="La persona debe tener una cuenta. No necesita tener un negocio." /></div>
        <Button onClick={enroll} loading={busy}>Matricular</Button>
      </Card>
      {error ? <ErrorState title="No pudimos cargar los matriculados" onRetry={() => mutate()} /> : !data ? <LoadingBlock className="py-6" /> : data.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Nadie matriculado todavía.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-2 rounded-xl p-3" style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)" }}>
              <span className="min-w-0 flex-1 break-words text-sm" style={{ color: "var(--text-primary)" }}>{e.name} <span style={{ color: "var(--text-muted)" }}>· {e.email}</span></span>
              <Badge variant={e.status === "active" ? "success" : "muted"}>{e.status === "active" ? "Activa" : "Revocada"}</Badge>
              {e.status === "active" && (
                <Button size="sm" variant="ghost" onClick={async () => {
                  if (!(await confirm({ title: "Revocar matrícula", itemName: e.email, variant: "danger" }))) return
                  try { await lms.admin.revoke(courseId, e.id); await mutate() } catch (err) { toast.error(errMsg(err)) }
                }}>Revocar</Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Certificados ───────────────────────────────────────────────────────────

function CertificatesTab({ courseId }: { courseId: string }) {
  const { data, mutate, error } = useAdminCertificates(courseId)
  const confirm = useConfirm()
  if (error) return <ErrorState title="No pudimos cargar los certificados" onRetry={() => mutate()} />
  if (!data) return <LoadingBlock className="py-6" />
  if (data.length === 0) return <p className="text-sm" style={{ color: "var(--text-muted)" }}>Aún no se han emitido certificados.</p>
  return (
    <ul className="flex flex-col gap-2">
      {data.map((c) => (
        <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl p-3" style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)" }}>
          <span className="min-w-0 flex-1 break-words text-sm" style={{ color: "var(--text-primary)" }}>{c.recipientName} <span style={{ color: "var(--text-muted)" }}>· {c.email} · {c.code} · {fmtDate(c.issuedAt, "short")}</span></span>
          {c.revokedAt ? <Badge variant="muted">Revocado</Badge> : (
            <Button size="sm" variant="ghost" onClick={async () => {
              if (!(await confirm({ title: "Revocar certificado", itemName: c.code, variant: "danger" }))) return
              try { await lms.admin.revokeCertificate(courseId, c.id); await mutate() } catch (e) { toast.error(errMsg(e)) }
            }}>Revocar</Button>
          )}
        </li>
      ))}
    </ul>
  )
}

// ─── Ajustes ────────────────────────────────────────────────────────────────

function SettingsTab({ course, reload }: { course: { id: string; slug: string; title: string; description: string; status: CourseStatus; includedInAcademia: boolean } & CourseMeta; reload: () => void }) {
  const confirm = useConfirm()
  const [f, setF] = useState({ title: course.title, slug: course.slug, description: course.description, includedInAcademia: course.includedInAcademia })
  const [meta, setMeta] = useState<CourseMeta>({ category: course.category, level: course.level, durationMinutes: course.durationMinutes, tags: course.tags, coverKey: course.coverKey, instructorName: course.instructorName })
  const [busy, setBusy] = useState(false)
  const slugError = f.slug !== course.slug ? validateSlug(f.slug) : null

  async function save() {
    if (slugError) return
    setBusy(true)
    try {
      const patch: Record<string, unknown> = { title: f.title, description: f.description, includedInAcademia: f.includedInAcademia, ...meta }
      if (f.slug !== course.slug) patch.slug = f.slug
      await lms.admin.updateCourse(course.id, patch)
      toast.success("Ajustes guardados.")
      reload()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <Input label="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={200} />
      <Input label="Identificador en la URL (slug)" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} disabled={course.status !== "draft"} error={slugError ?? undefined} hint={course.status !== "draft" ? "Solo se puede cambiar mientras es borrador." : undefined} />
      <TextArea label="Descripción" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={5000} rows={5} />
      <MetaFields value={meta} onChange={setMeta} />
      <Check label="Incluido en el plan Academia (los negocios con ese plan acceden sin matrícula)" checked={f.includedInAcademia} onChange={(v) => setF({ ...f, includedInAcademia: v })} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={save} loading={busy} disabled={!!slugError}>Guardar ajustes</Button>
        {course.status === "draft" && (
          <Button variant="danger" onClick={async () => {
            if (!(await confirm({ title: "Eliminar curso", itemName: course.title, variant: "danger" }))) return
            try { await lms.admin.deleteCourse(course.id); window.location.assign("/instructor") } catch (e) { toast.error(errMsg(e)) }
          }}>Eliminar curso</Button>
        )}
      </div>
    </Card>
  )
}
