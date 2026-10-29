"use client"

import "@/app/(learn)/lms.css"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LayoutGrid, List, Plus, Users } from "lucide-react"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import ErrorState from "@/components/ui/ErrorState"
import PlatformPage from "@/components/plataforma/PlatformPage"
import { Check, TextArea, errMsg } from "@/components/lms/admin/ui"
import MetaFields, { DEFAULT_META } from "@/components/lms/admin/MetaFields"
import { CardSkeletonGrid, CourseCard, CourseThumb, StatusBadge, type CardCourse } from "@/components/lms/parts"
import { Tabs as LTabs, EmptyState, rise } from "@/components/lms/ui"
import { lms } from "@/lib/lms/api"
import { errorStatus, useAdminCourses } from "@/lib/lms/hooks"
import { slugify, validateSlug } from "@/lib/lms/validation"
import { durationLabel } from "@/lib/lms/format"
import { fmtDate } from "@/lib/saas/format"
import { toast } from "@/lib/toast"
import type { CourseMeta, CourseStatus } from "@/lib/lms/types"

type Tab = "all" | CourseStatus

export default function CursosAdminPage() {
  const router = useRouter()
  const { data, error, mutate } = useAdminCourses()
  const [f, setF] = useState({ title: "", slug: "", description: "", includedInAcademia: true })
  const [meta, setMeta] = useState<CourseMeta>(DEFAULT_META)
  const [creating, setCreating] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [tab, setTab] = useState<Tab>("all")
  const [view, setView] = useState<"grid" | "list">("grid")
  const slug = slugTouched ? f.slug : slugify(f.title)
  const slugError = slug ? validateSlug(slug) : null

  async function create() {
    if (!f.title.trim() || !slug || slugError) return toast.warning("Completa el título y un identificador válido.")
    setBusy(true)
    try {
      const c = await lms.admin.createCourse({ title: f.title.trim(), slug, description: f.description.trim(), includedInAcademia: f.includedInAcademia, ...meta })
      router.push(`/plataforma/cursos/${c.id}`)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const rows = data ?? []
  const shown = rows.filter((c) => tab === "all" || c.status === tab)
  const cards: (CardCourse & { id: string; updatedAt: string })[] = shown.map((c) => ({
    id: c.id, slug: c.slug, href: `/plataforma/cursos/${c.id}`, title: c.title, coverKey: c.coverKey, level: c.level, tags: c.tags, durationMinutes: c.durationMinutes,
    lessonCount: c.lessonCount, enrolledCount: c.enrolledCount, status: c.status, updatedAt: c.updatedAt,
  }))
  const count = (s: CourseStatus) => rows.filter((c) => c.status === s).length

  return (
    <PlatformPage title="Cursos" description="Monta cursos, lecciones, evaluaciones y matrículas de Academia OMG.">
      {errorStatus(error) === 403 ? (
        <ErrorState title="Sin permisos" description="Gestionar cursos requiere el permiso de instructor." />
      ) : (
        <div className="lms-root !min-h-0 flex flex-col gap-5 !bg-transparent">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <LTabs label="Estado de los cursos" value={tab} onChange={setTab} tabs={[{ id: "all", label: "Todos", count: rows.length }, { id: "published", label: "Publicados", count: count("published") }, { id: "draft", label: "Borradores", count: count("draft") }, { id: "archived", label: "Archivados", count: count("archived") }]} />
            <div className="flex items-center gap-2">
              <div className="l-seg" role="tablist" aria-label="Vista">
                <button type="button" role="tab" aria-selected={view === "grid"} aria-label="Vista de cuadrícula" onClick={() => setView("grid")}><LayoutGrid size={16} aria-hidden="true" /></button>
                <button type="button" role="tab" aria-selected={view === "list"} aria-label="Vista de lista" onClick={() => setView("list")}><List size={16} aria-hidden="true" /></button>
              </div>
              <button type="button" className="l-btn l-btn-primary l-btn-sm" aria-expanded={creating} onClick={() => setCreating((c) => !c)}><Plus size={16} aria-hidden="true" /> Nuevo curso</button>
            </div>
          </div>

          {creating && (
            <section className="l-card l-rise flex flex-col gap-4 p-5" aria-label="Nuevo curso">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input label="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={200} />
                <Input label="Identificador (slug)" value={slug} onChange={(e) => { setSlugTouched(true); setF({ ...f, slug: e.target.value }) }} error={slugError ?? undefined} />
              </div>
              <TextArea label="Descripción" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={5000} rows={3} />
              <MetaFields value={meta} onChange={setMeta} />
              <Check label="Incluido en el plan Academia" checked={f.includedInAcademia} onChange={(v) => setF({ ...f, includedInAcademia: v })} />
              <Button className="self-start" onClick={create} loading={busy}>Crear curso</Button>
            </section>
          )}

          {error ? (
            <ErrorState title="No pudimos cargar los cursos" onRetry={() => mutate()} />
          ) : !data ? (
            <CardSkeletonGrid n={3} />
          ) : cards.length === 0 ? (
            <EmptyState title={rows.length ? "No hay cursos en este estado" : "Aún no hay cursos"} description="Crea el primero con el botón Nuevo curso." />
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{cards.map((c, i) => <CourseCard key={c.id} c={c} index={i % 9} />)}</div>
          ) : (
            <div className="l-card overflow-hidden">
              <ul className="divide-y" style={{ borderColor: "var(--l-line)" }}>
                {cards.map((c, i) => (
                  <li key={c.id} className="l-rise" style={rise(i % 9)}>
                    <Link href={c.href!} className="flex flex-wrap items-center gap-4 p-4 transition-colors hover:bg-[var(--l-bg)]">
                      <CourseThumb coverKey={c.coverKey} size={56} />
                      <span className="min-w-0 flex-1"><span className="block truncate font-extrabold">{c.title}</span><span className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{c.lessonCount} lecciones · {durationLabel(c.durationMinutes)} · editado {fmtDate(c.updatedAt, "short")}</span></span>
                      <span className="inline-flex items-center gap-1 text-sm font-bold"><Users size={14} aria-hidden="true" />{c.enrolledCount}</span>
                      <StatusBadge status={c.status!} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </PlatformPage>
  )
}
