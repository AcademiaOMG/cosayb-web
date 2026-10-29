"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import EmptyState from "@/components/ui/EmptyState"
import ErrorState from "@/components/ui/ErrorState"
import Input from "@/components/ui/Input"
import LoadingBlock from "@/components/ui/LoadingBlock"
import PlatformPage from "@/components/plataforma/PlatformPage"
import { Check, TextArea, errMsg } from "@/components/lms/admin/ui"
import { lms } from "@/lib/lms/api"
import { errorStatus, useAdminCourses } from "@/lib/lms/hooks"
import { slugify, validateSlug } from "@/lib/lms/validation"
import { fmtDate } from "@/lib/saas/format"
import { toast } from "@/lib/toast"
import type { CourseStatus } from "@/lib/lms/types"

const STATUS: Record<CourseStatus, { label: string; variant: "success" | "warning" | "muted" }> = {
  draft: { label: "Borrador", variant: "warning" },
  published: { label: "Publicado", variant: "success" },
  archived: { label: "Archivado", variant: "muted" },
}

export default function CursosAdminPage() {
  const router = useRouter()
  const { data, error, mutate } = useAdminCourses()
  const [f, setF] = useState({ title: "", slug: "", description: "", includedInAcademia: true })
  const [slugTouched, setSlugTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const slug = slugTouched ? f.slug : slugify(f.title)
  const slugError = slug ? validateSlug(slug) : null

  async function create() {
    if (!f.title.trim() || !slug || slugError) return toast.warning("Completa el título y un identificador válido.")
    setBusy(true)
    try {
      const c = await lms.admin.createCourse({ title: f.title.trim(), slug, description: f.description.trim(), includedInAcademia: f.includedInAcademia })
      router.push(`/plataforma/cursos/${c.id}`)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <PlatformPage title="Cursos" description="Monta cursos, lecciones, evaluaciones y matrículas de Academia OMG.">
      {errorStatus(error) === 403 ? (
        <ErrorState title="Sin permisos" description="Gestionar cursos requiere el permiso de instructor." />
      ) : (
        <>
          <Card className="flex flex-col gap-4">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Nuevo curso</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input label="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={200} />
              <Input label="Identificador (slug)" value={slug} onChange={(e) => { setSlugTouched(true); setF({ ...f, slug: e.target.value }) }} error={slugError ?? undefined} />
            </div>
            <TextArea label="Descripción" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} maxLength={5000} rows={3} />
            <Check label="Incluido en el plan Academia" checked={f.includedInAcademia} onChange={(v) => setF({ ...f, includedInAcademia: v })} />
            <Button className="self-start" onClick={create} loading={busy}>Crear curso</Button>
          </Card>

          {error ? <ErrorState title="No pudimos cargar los cursos" onRetry={() => mutate()} /> : !data ? <LoadingBlock className="py-8" /> : data.length === 0 ? (
            <EmptyState title="Aún no hay cursos" description="Crea el primero con el formulario de arriba." />
          ) : (
            <ul className="flex flex-col gap-2">
              {data.map((c) => (
                <li key={c.id}>
                  <Link href={`/plataforma/cursos/${c.id}`} className="flex flex-wrap items-center gap-3 rounded-xl p-4" style={{ background: "var(--bg-surface)", boxShadow: "var(--shadow-sm)" }}>
                    <span className="min-w-0 flex-1">
                      <span className="block break-words text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{c.title}</span>
                      <span className="block text-xs" style={{ color: "var(--text-muted)" }}>{c.lessonCount} lecciones · {c.enrolledCount} matriculados · actualizado {fmtDate(c.updatedAt, "short")}</span>
                    </span>
                    <Badge variant={STATUS[c.status].variant}>{STATUS[c.status].label}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </PlatformPage>
  )
}
