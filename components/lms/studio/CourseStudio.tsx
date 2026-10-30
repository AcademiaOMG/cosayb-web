"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { mutate as globalMutate } from "swr"
import { AlertTriangle, Archive, ArrowLeft, CheckCircle2, Circle, Eye, ExternalLink, Rocket, Undo2 } from "lucide-react"
import { Badge, Button, ErrorPanel, Skeleton, Tabs } from "@/components/lms/ui"
import { StatusBadge } from "@/components/lms/parts"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { lms } from "@/lib/lms/api"
import { usePaths } from "@/components/lms/shell/area"
import { errorStatus, lmsKeys, useAdminCourse, useAdminQuizzes, useLmsAccess } from "@/lib/lms/hooks"
import { canPublish, publishChecklist, timeAgo } from "@/lib/lms/studio"
import { slugify, validateSlug } from "@/lib/lms/validation"
import { toast } from "@/lib/toast"
import type { AdminCourse, CourseMeta } from "@/lib/lms/types"
import { Dialog, SwitchRow, TextField, AreaField, errMsg } from "./kit"
import { CourseMetaForm } from "./forms"
import ContentTab from "./ContentTab"
import QuizzesTab from "./QuizzesTab"
import StudentsTab from "./StudentsTab"
import CertificateTab from "./CertificateTab"
import AnalyticsTab from "./AnalyticsTab"

const TABS = [
  { id: "content", label: "Contenido" },
  { id: "quizzes", label: "Evaluaciones" },
  { id: "students", label: "Estudiantes" },
  { id: "certificate", label: "Certificado" },
  { id: "settings", label: "Ajustes" },
  { id: "analytics", label: "Analítica" },
] as const
type Tab = (typeof TABS)[number]["id"]
const isTab = (v: string | null): v is Tab => TABS.some((t) => t.id === v)

export default function CourseStudio({ id }: { id: string }) {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const paths = usePaths()
  const raw = params.get("tab")
  const tab: Tab = isTab(raw) ? raw : "content"
  const { data: course, error, mutate } = useAdminCourse(id)
  const { data: quizzes } = useAdminQuizzes(id)
  const [publishOpen, setPublishOpen] = useState(false)

  const setTab = (t: Tab) => router.replace(t === "content" ? pathname : `${pathname}?tab=${t}`, { scroll: false })

  if (errorStatus(error) === 403) return <ErrorPanel title="Sin permisos" description="Gestionar cursos requiere permisos de instructor." />
  if (errorStatus(error) === 404) return <ErrorPanel title="El curso no existe" description="Pudo haberse eliminado." />
  if (error) return <ErrorPanel title="No pudimos cargar el curso" onRetry={() => mutate()} />
  if (!course) return <Skeleton className="h-96 !rounded-[22px]" />

  const reload = (next: AdminCourse | null) => (next ? void mutate(next, { revalidate: false }) : void mutate())
  const counts = { quizzes: quizzes?.length, content: course.modules.reduce((n, m) => n + m.lessons.length, 0) }

  return (
    <div className="flex flex-col gap-5">
      <div className="s-bar">
        <Link href={paths.courses} className="l-btn l-btn-ghost !min-h-10 !w-10 !px-0" aria-label="Volver a los cursos"><ArrowLeft size={18} aria-hidden="true" /></Link>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>Editado {timeAgo(course.updatedAt)}</p>
          <h1 className="truncate text-lg font-extrabold leading-tight sm:text-xl">{course.title}</h1>
        </div>
        <StatusBadge status={course.status} />
        <Link href={paths.view(course.slug)} className="l-btn l-btn-soft l-btn-sm" title="Abre el curso tal como lo ve un estudiante (nada se guarda)"><Eye size={16} aria-hidden="true" /><span className="hidden sm:inline"> Ver como estudiante</span></Link>
        <Button size="sm" onClick={() => setPublishOpen(true)}>
          {course.status === "published" ? <><CheckCircle2 size={16} aria-hidden="true" /> Publicado</> : <><Rocket size={16} aria-hidden="true" /> Publicar</>}
        </Button>
      </div>

      <Tabs label="Secciones del curso" value={tab} onChange={setTab} tabs={TABS.map((t) => ({ id: t.id, label: t.label, count: t.id === "quizzes" ? counts.quizzes : t.id === "content" ? counts.content : undefined }))} />

      <div id={`panel-${tab}`} role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.label}>
        {tab === "content" && <ContentTab course={course} onChange={reload} />}
        {tab === "quizzes" && <QuizzesTab courseId={id} />}
        {tab === "students" && <StudentsTab course={course} />}
        {tab === "certificate" && <CertificateTab course={course} onChanged={() => void mutate()} />}
        {tab === "settings" && <SettingsTab course={course} onChanged={() => void mutate()} />}
        {tab === "analytics" && <AnalyticsTab courseId={id} />}
      </div>

      {publishOpen && <PublishDialog course={course} quizzes={quizzes} onClose={() => setPublishOpen(false)} onChanged={() => void mutate()} />}
    </div>
  )
}

// ─── Publicar / despublicar con lista de requisitos ─────────────────────────

function PublishDialog({ course, quizzes, onClose, onChanged }: { course: AdminCourse; quizzes: Parameters<typeof publishChecklist>[1]; onClose: () => void; onChanged: () => void }) {
  const confirm = useConfirm()
  const items = publishChecklist(course, quizzes)
  const ready = canPublish(items)
  const [busy, setBusy] = useState(false)

  async function run(action: "publish" | "archive" | "unpublish") {
    if (action === "archive" && !(await confirm({ title: "Archivar curso", description: "Dejará de verse en el catálogo. Las matrículas se conservan.", itemName: course.title, confirmLabel: "Archivar", variant: "danger" }))) return
    setBusy(true)
    try {
      await lms.admin.setStatus(course.id, action)
      await Promise.all([globalMutate(lmsKeys.overview), globalMutate(lmsKeys.adminCourses), globalMutate(lmsKeys.catalog)])
      onChanged()
      toast.success(action === "publish" ? "Curso publicado." : action === "archive" ? "Curso archivado." : "Curso devuelto a borrador.")
      onClose()
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={course.status === "published" ? "Estado del curso" : "Publicar el curso"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          {course.status !== "archived" && course.status === "published" && <Button variant="ghost" onClick={() => run("archive")} loading={busy}><Archive size={15} aria-hidden="true" /> Archivar</Button>}
          {course.status === "published" && <Button variant="soft" onClick={() => run("unpublish")} loading={busy}><Undo2 size={15} aria-hidden="true" /> Volver a borrador</Button>}
          {course.status !== "published" && <Button onClick={() => run("publish")} loading={busy} disabled={!ready}><Rocket size={15} aria-hidden="true" /> {course.status === "archived" ? "Volver a publicar" : "Publicar ahora"}</Button>}
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2"><StatusBadge status={course.status} /><span className="text-sm" style={{ color: "var(--l-muted)" }}>/cursos/{course.slug}</span></div>
        <h3 className="text-sm font-extrabold">Antes de publicar</h3>
        <ul className="flex flex-col gap-2">
          {items.map((i) => (
            <li key={i.id} className="flex items-start gap-3 rounded-2xl p-3" style={{ background: i.ok ? "var(--l-mint-bg)" : i.required ? "var(--l-rose-bg)" : "var(--l-amber-bg)" }}>
              {i.ok ? <CheckCircle2 size={18} aria-hidden="true" style={{ color: "var(--l-mint-ink)" }} /> : i.required ? <AlertTriangle size={18} aria-hidden="true" style={{ color: "var(--l-rose-ink)" }} /> : <Circle size={18} aria-hidden="true" style={{ color: "var(--l-amber-ink)" }} />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold">{i.label} {i.required && !i.ok && <Badge tone="rose">Obligatorio</Badge>}{!i.required && !i.ok && <Badge tone="amber">Recomendado</Badge>}</p>
                {!i.ok && i.hint && <p className="l-hint">{i.hint}</p>}
              </div>
            </li>
          ))}
        </ul>
        {course.status === "published" && <a className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: "var(--l-brand)" }} href={`/cursos/${course.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} aria-hidden="true" /> Ver en el catálogo</a>}
      </div>
    </Dialog>
  )
}

// ─── Ajustes ────────────────────────────────────────────────────────────────

function SettingsTab({ course, onChanged }: { course: AdminCourse; onChanged: () => void }) {
  const paths = usePaths()
  const confirm = useConfirm()
  const router = useRouter()
  const [f, setF] = useState({ title: course.title, slug: course.slug, description: course.description, includedInAcademia: course.includedInAcademia })
  const [meta, setMeta] = useState<CourseMeta>({ category: course.category, level: course.level, durationMinutes: course.durationMinutes, tags: course.tags, coverKey: course.coverKey, instructorName: course.instructorName })
  const [busy, setBusy] = useState(false)
  const isAdmin = Boolean(useLmsAccess().data?.isAdmin)
  const slugError = f.slug !== course.slug ? validateSlug(f.slug) : null

  async function save() {
    if (slugError || !f.title.trim()) return
    setBusy(true)
    try {
      const patch: Record<string, unknown> = { title: f.title.trim(), description: f.description, ...meta }
      // Solo un administrador decide qué cursos entran en el plan Academia
      if (isAdmin && f.includedInAcademia !== course.includedInAcademia) patch.includedInAcademia = f.includedInAcademia
      if (f.slug !== course.slug) patch.slug = f.slug
      await lms.admin.updateCourse(course.id, patch)
      await Promise.all([globalMutate(lmsKeys.overview), globalMutate(lmsKeys.catalog)])
      onChanged()
      toast.success("Ajustes guardados.")
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="l-card flex flex-col gap-4 p-5">
        <h2 className="text-lg font-extrabold">Información del curso</h2>
        <TextField label="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={200} />
        <TextField label="Identificador en la URL (slug)" value={f.slug} onChange={(e) => setF({ ...f, slug: slugify(e.target.value) })} disabled={course.status !== "draft"} error={slugError} hint={course.status !== "draft" ? "Solo se puede cambiar mientras es borrador." : `/cursos/${f.slug}`} />
        <AreaField label="Descripción" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={5000} rows={5} />
        <CourseMetaForm value={meta} onChange={setMeta} />
        {isAdmin ? (
          <SwitchRow checked={f.includedInAcademia} onChange={(v) => setF({ ...f, includedInAcademia: v })} label="Incluido en el plan Academia" hint="Los negocios con ese plan acceden sin matrícula." />
        ) : (
          <p className="l-hint">{course.includedInAcademia ? "Este curso está incluido en el plan Academia." : "Este curso no está incluido en el plan Academia."} Solo un administrador de la academia lo cambia.</p>
        )}
        <div><Button onClick={save} loading={busy} disabled={Boolean(slugError) || !f.title.trim()}>Guardar ajustes</Button></div>
      </div>
      <aside className="flex flex-col gap-4">
        <div className="l-card p-5">
          <h2 className="font-extrabold">Zona delicada</h2>
          <p className="l-hint mb-3 mt-1">Solo se pueden eliminar cursos en borrador. Los demás se archivan.</p>
          {course.status === "draft" ? (
            <Button variant="ghost" className="!text-[var(--l-rose-ink)]" onClick={async () => {
              if (!(await confirm({ title: "Eliminar curso", description: "Se borran sus lecciones, evaluaciones y archivos. No se puede deshacer.", itemName: course.title, variant: "danger" }))) return
              try { await lms.admin.deleteCourse(course.id); await globalMutate(lmsKeys.overview); router.push(paths.courses) } catch (e) { toast.error(errMsg(e)) }
            }}>Eliminar curso</Button>
          ) : <p className="text-sm font-bold" style={{ color: "var(--l-muted)" }}>Vuelve a borrador (botón Publicado) para poder eliminarlo.</p>}
        </div>
      </aside>
    </div>
  )
}
