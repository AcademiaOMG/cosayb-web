"use client"

import { useState } from "react"
import useSWR from "swr"
import { HardDrive, Pencil, Plus, Trash2 } from "lucide-react"
import { Badge, Button, Card, ErrorPanel, Skeleton } from "@/components/lms/ui"
import { TextField, errMsg } from "@/components/lms/studio/kit"
import { StatusBadge } from "@/components/lms/parts"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { lms } from "@/lib/lms/api"
import { errorStatus } from "@/lib/lms/hooks"
import { formatBytes } from "@/lib/lms/roles"
import { slugify } from "@/lib/lms/validation"
import { toast } from "@/lib/toast"

function Categories() {
  const confirm = useConfirm()
  const { data, error, mutate } = useSWR("lms/manage/categories", () => lms.manage.categories(), { revalidateOnFocus: false })
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<{ slug: string; name: string } | null>(null)

  if (error) return <ErrorPanel title="No pudimos cargar las categorías" onRetry={() => mutate()} />

  async function add() {
    const slug = slugify(name).slice(0, 40)
    if (!name.trim() || slug.length < 2) return toast.warning("Escribe un nombre para la categoría.")
    setBusy(true)
    try {
      await lms.manage.createCategory(slug, name.trim())
      setName("")
      await mutate()
      toast.success("Categoría creada.")
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  async function rename() {
    if (!editing || !editing.name.trim()) return
    try {
      await lms.manage.renameCategory(editing.slug, editing.name.trim())
      setEditing(null)
      await mutate()
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  async function remove(slug: string, label: string) {
    if (!(await confirm({ title: "Eliminar categoría", itemName: label, confirmLabel: "Eliminar", variant: "danger" }))) return
    try {
      await lms.manage.deleteCategory(slug)
      await mutate()
      toast.success("Categoría eliminada.")
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-base font-extrabold">Categorías del catálogo</h2>
        <p className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>Los instructores clasifican sus cursos con estas categorías. Una categoría con cursos no se puede eliminar.</p>
      </div>
      <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); void add() }}>
        <div className="min-w-[220px] flex-1"><TextField label="Nueva categoría" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></div>
        <Button type="submit" loading={busy}><Plus size={16} aria-hidden="true" /> Añadir</Button>
      </form>
      {!data ? <Skeleton className="h-24" /> : (
        <ul className="flex flex-col divide-y" style={{ borderColor: "var(--l-line)" }}>
          {data.map((c) => (
            <li key={c.slug} className="flex flex-wrap items-center gap-3 py-2.5">
              {editing?.slug === c.slug ? (
                <form className="flex min-w-0 flex-1 items-center gap-2" onSubmit={(e) => { e.preventDefault(); void rename() }}>
                  <input className="l-input !min-h-10 flex-1" aria-label={`Nuevo nombre de ${c.name}`} value={editing.name} maxLength={60} autoFocus onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  <Button type="submit" size="sm">Guardar</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancelar</Button>
                </form>
              ) : (
                <>
                  <span className="min-w-0 flex-1"><span className="font-extrabold">{c.name}</span> <code className="text-xs" style={{ color: "var(--l-muted)" }}>{c.slug}</code></span>
                  <Badge tone="neutral">{c.courses} curso{c.courses === 1 ? "" : "s"}</Badge>
                  <button type="button" className="l-btn l-btn-ghost !min-h-9 !w-9 !px-0" aria-label={`Renombrar ${c.name}`} onClick={() => setEditing({ slug: c.slug, name: c.name })}><Pencil size={15} aria-hidden="true" /></button>
                  <button type="button" className="l-btn l-btn-ghost !min-h-9 !w-9 !px-0" aria-label={`Eliminar ${c.name}`} disabled={c.slug === "general" || c.courses > 0} onClick={() => void remove(c.slug, c.name)}><Trash2 size={15} aria-hidden="true" /></button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function Storage() {
  const { data, error, mutate } = useSWR("lms/manage/storage", () => lms.manage.storage(), { revalidateOnFocus: false })
  if (errorStatus(error) === 403) return <ErrorPanel title="Solo para administradores" />
  if (error) return <ErrorPanel title="No pudimos cargar el almacenamiento" onRetry={() => mutate()} />
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold">Almacenamiento y salud</h2>
          <p className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>Solo lectura. Videos, archivos e imágenes de evaluaciones, por curso.</p>
        </div>
        {data && <span className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-extrabold" style={{ background: "var(--l-bg)" }}><HardDrive size={16} aria-hidden="true" /> {formatBytes(data.totalBytes)} en total</span>}
      </div>
      {!data ? <Skeleton className="h-40" /> : (
        <>
          {data.reclaimableBytes > 0 && (
            <p className="rounded-2xl p-3 text-sm font-bold" style={{ background: "var(--l-amber-bg)", color: "var(--l-amber-ink)" }}>
              {formatBytes(data.reclaimableBytes)} pertenecen a cursos archivados o en borrador sin estudiantes: puedes revisarlos para liberar espacio. Aquí no se borra nada.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="t-table">
              <caption className="sr-only">Almacenamiento por curso</caption>
              <thead><tr><th scope="col">Curso</th><th scope="col">Estado</th><th scope="col">Archivos</th><th scope="col">Imágenes de evaluaciones</th><th scope="col">Tamaño</th></tr></thead>
              <tbody>
                {data.courses.map((c) => (
                  <tr key={c.id}>
                    <td><span className="block font-extrabold">{c.title}</span><span className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{c.owner ?? "Sin instructor"}</span></td>
                    <td><StatusBadge status={c.status} />{c.reclaimable && <Badge tone="amber" className="ml-1">Revisar</Badge>}</td>
                    <td className="font-bold">{c.assets}</td>
                    <td className="font-bold">{c.media}</td>
                    <td className="font-bold">{formatBytes(c.bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs" style={{ color: "var(--l-muted)" }}>La detección de archivos huérfanos dentro del almacenamiento (objetos que ningún curso referencia) no está disponible todavía: este panel cuenta lo que la base de datos conoce.</p>
        </>
      )}
    </Card>
  )
}

export default function SettingsHealth() {
  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">Ajustes y salud</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--l-muted)" }}>Categorías del catálogo y uso del almacenamiento privado. Qué cursos entran en el plan Academia se decide en cada curso, desde «Cursos».</p>
      </header>
      <Categories />
      <Storage />
    </div>
  )
}
