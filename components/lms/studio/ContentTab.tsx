"use client"

import { useRef, useState } from "react"
import { ArrowDown, ArrowUp, Copy, ExternalLink, FileText, Film, FolderInput, Link2, MoreHorizontal, Plus, Trash2, Type, Upload } from "lucide-react"
import { Badge, Button, Card, EmptyState } from "@/components/lms/ui"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import { lms } from "@/lib/lms/api"
import { UPLOAD_RULES, formatBytes, validateUpload } from "@/lib/lms/validation"
import { applyOutline, moveLesson, moveModule, outlineOf, reorder } from "@/lib/lms/studio"
import { toast } from "@/lib/toast"
import type { AdminCourse, AdminLesson, AssetKind, LessonKind } from "@/lib/lms/types"
import { ActionMenu, AreaField, Grip, SaveBadge, SelectField, SwitchRow, TextField, errMsg, useAutosave, useSortable } from "./kit"

type Mod = AdminCourse["modules"][number]
type Handle = ReturnType<ReturnType<typeof useSortable>["handle"]>
const KIND_META: Record<LessonKind, { label: string; Icon: typeof Type }> = {
  reading: { label: "Lectura", Icon: Type },
  video: { label: "Video", Icon: Film },
  file: { label: "Archivo", Icon: FileText },
  link: { label: "Enlace", Icon: Link2 },
}
const ASSET_KINDS_FOR: Record<LessonKind, AssetKind[]> = { reading: ["document"], video: ["video", "subtitle"], file: ["document"], link: [] }
const MODULE_END = "module-end:"

interface Props {
  course: AdminCourse
  /** Aplica un curso nuevo en pantalla sin esperar al servidor (o null para recargar). */
  onChange: (next: AdminCourse | null) => void
}

export default function ContentTab({ course, onChange }: Props) {
  const confirm = useConfirm()
  const [title, setTitle] = useState("")
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const reload = () => onChange(null)

  async function applyOrder(next: ReturnType<typeof outlineOf>) {
    onChange(applyOutline(course, next))
    setSaving(true)
    try {
      await lms.admin.reorderOutline(course.id, next)
    } catch (e) {
      toast.error(errMsg(e))
    } finally {
      setSaving(false)
      reload()
    }
  }

  const modSort = useSortable((dragId, beforeId) => {
    const o = outlineOf(course)
    const to = beforeId ? o.findIndex((m) => m.id === beforeId) : o.length
    void applyOrder(moveModule(o, dragId, Math.max(0, to > o.findIndex((m) => m.id === dragId) ? to - 1 : to)))
  }, "module")

  const lessonSort = useSortable((dragId, targetId) => {
    const o = outlineOf(course)
    if (targetId?.startsWith(MODULE_END)) {
      const m = o.find((x) => x.id === targetId.slice(MODULE_END.length))
      if (m) void applyOrder(moveLesson(o, dragId, m.id, m.lessonIds.length))
      return
    }
    const target = o.find((m) => m.lessonIds.includes(targetId ?? ""))
    if (!target) return
    const t = target.lessonIds.indexOf(targetId!)
    const from = target.lessonIds.indexOf(dragId)
    void applyOrder(moveLesson(o, dragId, target.id, from >= 0 && from < t ? t - 1 : t))
  }, "lesson")

  async function addModule() {
    if (!title.trim()) return
    try {
      await lms.admin.createModule(course.id, title.trim())
      setTitle("")
      reload()
    } catch (e) {
      toast.error(errMsg(e))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "var(--l-muted)" }}>Arrastra el agarre ⋮⋮ para ordenar módulos y lecciones, o usa «Mover» en el menú de cada una.</p>
        <span aria-live="polite" className="text-xs font-bold" style={{ color: "var(--l-muted)" }}>{saving ? "Guardando orden…" : ""}</span>
      </div>

      {course.modules.length === 0 && <EmptyState title="Este curso aún no tiene contenido" description="Crea el primer módulo y agrega lecciones de lectura, video, archivo o enlace." />}

      {course.modules.map((m, mi) => (
        <section
          key={m.id}
          data-sortable
          aria-label={`Módulo ${mi + 1}: ${m.title}`}
          className={`l-card overflow-visible p-4 ${modSort.dragging === m.id ? "l-dragging" : ""} ${modSort.over === m.id && modSort.dragging ? "l-drop-before" : ""}`}
          {...modSort.target(m.id)}
        >
          <ModuleHeader
            module={m}
            index={mi}
            count={course.modules.length}
            handle={modSort.handle(m.id)}
            onMove={(to) => void applyOrder(moveModule(outlineOf(course), m.id, to))}
            onChanged={reload}
            onDelete={async () => {
              if (!(await confirm({ title: "Eliminar módulo", itemName: m.title, variant: "danger" }))) return
              try { await lms.admin.deleteModule(m.id); reload() } catch (e) { toast.error(errMsg(e)) }
            }}
          />
          <ul className="mt-3 flex flex-col gap-2">
            {m.lessons.map((l, li) => (
              <li
                key={l.id}
                data-sortable
                className={`rounded-2xl ${lessonSort.dragging === l.id ? "l-dragging" : ""} ${lessonSort.over === l.id && lessonSort.dragging ? "l-drop-before" : ""}`}
                style={{ background: "var(--l-bg)" }}
                {...lessonSort.target(l.id)}
              >
                <LessonRow
                  lesson={l}
                  index={li}
                  moduleLessons={m.lessons.length}
                  modules={course.modules}
                  expanded={open === l.id}
                  handle={lessonSort.handle(l.id)}
                  onToggle={() => setOpen(open === l.id ? null : l.id)}
                  onMoveUp={() => void applyOrder(moveLesson(outlineOf(course), l.id, m.id, li - 1))}
                  onMoveDown={() => void applyOrder(moveLesson(outlineOf(course), l.id, m.id, li + 1))}
                  onMoveToModule={(toId) => { const t = course.modules.find((x) => x.id === toId); if (t) void applyOrder(moveLesson(outlineOf(course), l.id, toId, t.lessons.length)) }}
                  onChanged={reload}
                />
              </li>
            ))}
            <li {...lessonSort.target(MODULE_END + m.id)} className={`rounded-2xl ${lessonSort.over === MODULE_END + m.id && lessonSort.dragging ? "l-drop-before" : ""}`}>
              <AddLesson moduleId={m.id} onAdded={(id) => { setOpen(id); reload() }} />
            </li>
          </ul>
        </section>
      ))}

      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="flex-1"><TextField label="Nuevo módulo" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Módulo 1: Fundamentos" onKeyDown={(e) => { if (e.key === "Enter") void addModule() }} /></div>
        <Button onClick={addModule}><Plus size={16} aria-hidden="true" /> Agregar módulo</Button>
      </Card>
    </div>
  )
}

function ModuleHeader({ module: m, index, count, handle, onMove, onChanged, onDelete }: { module: Mod; index: number; count: number; handle: Handle; onMove: (to: number) => void; onChanged: () => void; onDelete: () => void }) {
  const [title, setTitle] = useState(m.title)
  const { status } = useAutosave(title, async (t) => { await lms.admin.updateModule(m.id, { title: t.trim() }); onChanged() }, { valid: title.trim().length > 0 })
  return (
    <div className="flex items-center gap-2">
      <Grip label={`Reordenar el módulo ${m.title}`} {...handle} />
      <div className="min-w-0 flex-1">
        <input className="l-input l-input-bare !min-h-10 text-base font-extrabold" aria-label={`Título del módulo ${index + 1}`} value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <SaveBadge status={status} />
      <Badge tone="neutral">{m.lessons.length} lecc.</Badge>
      <ActionMenu label={`Acciones del módulo ${m.title}`} trigger={<MoreHorizontal size={16} aria-hidden="true" />}>
        {() => (
          <>
            <button type="button" role="menuitem" disabled={index === 0} onClick={() => onMove(index - 1)}><ArrowUp size={15} aria-hidden="true" /> Subir</button>
            <button type="button" role="menuitem" disabled={index === count - 1} onClick={() => onMove(index + 1)}><ArrowDown size={15} aria-hidden="true" /> Bajar</button>
            <button type="button" role="menuitem" className="l-danger" onClick={onDelete}><Trash2 size={15} aria-hidden="true" /> Eliminar módulo</button>
          </>
        )}
      </ActionMenu>
    </div>
  )
}

function AddLesson({ moduleId, onAdded }: { moduleId: string; onAdded: (id: string) => void }) {
  const [title, setTitle] = useState("")
  const [kind, setKind] = useState<LessonKind>("reading")
  async function add() {
    if (!title.trim()) return
    try {
      // Un enlace nace sin URL: el servidor la exige, así que se crea como lectura y se cambia en el editor
      const l = await lms.admin.createLesson(moduleId, { title: title.trim(), body: "", isPreview: false, kind: kind === "link" ? "reading" : kind })
      setTitle("")
      onAdded(l.id)
    } catch (e) {
      toast.error(errMsg(e))
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <input className="l-input !min-h-10 min-w-[180px] flex-1" aria-label="Título de la nueva lección" placeholder="Nueva lección…" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void add() }} />
      <select className="l-input l-select !min-h-10 !w-auto" aria-label="Tipo de la nueva lección" value={kind} onChange={(e) => setKind(e.target.value as LessonKind)}>
        {(Object.keys(KIND_META) as LessonKind[]).map((k) => <option key={k} value={k}>{KIND_META[k].label}</option>)}
      </select>
      <button type="button" className="l-dashed" onClick={add}><Plus size={15} aria-hidden="true" /> Lección</button>
    </div>
  )
}

function LessonRow({ lesson, index, moduleLessons, modules, expanded, handle, onToggle, onMoveUp, onMoveDown, onMoveToModule, onChanged }: {
  lesson: AdminLesson
  index: number
  moduleLessons: number
  modules: Mod[]
  expanded: boolean
  handle: Handle
  onToggle: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onMoveToModule: (id: string) => void
  onChanged: () => void
}) {
  const confirm = useConfirm()
  const { Icon, label } = { ...KIND_META[lesson.kind], Icon: KIND_META[lesson.kind].Icon }
  return (
    <div className="p-1.5">
      <div className="flex items-center gap-1.5">
        <Grip label={`Reordenar la lección ${lesson.title}`} {...handle} />
        <button type="button" className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left" aria-expanded={expanded} onClick={onToggle}>
          <span aria-hidden="true" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "var(--l-tint-bg)", color: "var(--l-tint-ink)" }}><Icon size={16} /></span>
          <span className="min-w-0 flex-1">
            <span className="block break-words text-sm font-extrabold">{lesson.title}</span>
            <span className="text-xs font-semibold" style={{ color: "var(--l-muted)" }}>{label}{lesson.assets.length > 0 ? ` · ${lesson.assets.length} archivo${lesson.assets.length > 1 ? "s" : ""}` : ""}</span>
          </span>
          {lesson.isPreview && <Badge tone="mint">Vista previa</Badge>}
        </button>
        <ActionMenu label={`Acciones de la lección ${lesson.title}`} trigger={<MoreHorizontal size={16} aria-hidden="true" />}>
          {() => (
            <>
              <button type="button" role="menuitem" disabled={index === 0} onClick={onMoveUp}><ArrowUp size={15} aria-hidden="true" /> Subir</button>
              <button type="button" role="menuitem" disabled={index === moduleLessons - 1} onClick={onMoveDown}><ArrowDown size={15} aria-hidden="true" /> Bajar</button>
              {modules.filter((m) => m.id !== lesson.moduleId).map((m) => (
                <button key={m.id} type="button" role="menuitem" onClick={() => onMoveToModule(m.id)}><FolderInput size={15} aria-hidden="true" /> Mover a «{m.title.slice(0, 22)}»</button>
              ))}
              <button type="button" role="menuitem" onClick={async () => { try { await lms.admin.duplicateLesson(lesson.id); onChanged() } catch (e) { toast.error(errMsg(e)) } }}><Copy size={15} aria-hidden="true" /> Duplicar</button>
              <button type="button" role="menuitem" className="l-danger" onClick={async () => {
                if (!(await confirm({ title: "Eliminar lección", itemName: lesson.title, variant: "danger" }))) return
                try { await lms.admin.deleteLesson(lesson.id); onChanged() } catch (e) { toast.error(errMsg(e)) }
              }}><Trash2 size={15} aria-hidden="true" /> Eliminar</button>
            </>
          )}
        </ActionMenu>
      </div>
      {expanded && <LessonPanel lesson={lesson} onChanged={onChanged} />}
    </div>
  )
}

interface Upload { name: string; percent: number; kind: AssetKind }

function LessonPanel({ lesson, onChanged }: { lesson: AdminLesson; onChanged: () => void }) {
  const confirm = useConfirm()
  const [f, setF] = useState({ title: lesson.title, body: lesson.body, isPreview: lesson.isPreview, kind: lesson.kind, linkUrl: lesson.linkUrl ?? "" })
  const [uploads, setUploads] = useState<Upload[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const pickKind = useRef<AssetKind>("video")
  const linkOk = f.kind !== "link" || /^https?:\/\/\S+$/i.test(f.linkUrl.trim())
  const { status } = useAutosave(
    f,
    async (v) => {
      await lms.admin.updateLesson(lesson.id, { title: v.title.trim(), body: v.body, isPreview: v.isPreview, kind: v.kind, linkUrl: v.kind === "link" ? v.linkUrl.trim() : null })
      onChanged()
    },
    { valid: f.title.trim().length > 0 && linkOk }
  )

  async function onFile(file: File | undefined) {
    const kind = pickKind.current
    if (fileRef.current) fileRef.current.value = ""
    if (!file) return
    const problem = validateUpload(kind, file)
    if (problem) return void toast.error(problem)
    const item: Upload = { name: file.name, percent: 0, kind }
    setUploads((u) => [...u, item])
    try {
      await lms.admin.uploadAsset(lesson.id, kind, file, (p) => setUploads((u) => u.map((x) => (x === item ? { ...x, percent: p } : x))))
      toast.success("Archivo subido.")
      onChanged()
    } catch (e) {
      toast.error(errMsg(e, "No se pudo subir el archivo."))
    } finally {
      setUploads((u) => u.filter((x) => x !== item))
    }
  }

  function pick(kind: AssetKind) {
    pickKind.current = kind
    if (fileRef.current) {
      fileRef.current.accept = UPLOAD_RULES[kind].mimes.join(",")
      fileRef.current.click()
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-4 rounded-2xl bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold">Editar lección</h3>
        <SaveBadge status={status} invalid={!linkOk} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TextField label="Título" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} maxLength={200} />
        <SelectField label="Tipo de lección" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as LessonKind })} options={(Object.keys(KIND_META) as LessonKind[]).map((k) => ({ value: k, label: KIND_META[k].label }))} />
      </div>
      {f.kind === "link" && (
        <TextField label="Enlace externo" type="url" inputMode="url" placeholder="https://…" value={f.linkUrl} onChange={(e) => setF({ ...f, linkUrl: e.target.value })} error={f.linkUrl && !linkOk ? "Debe empezar por https:// o http://" : null} hint="Se abre en una pestaña nueva. Solo se permiten enlaces http(s)." />
      )}
      <AreaField
        label={f.kind === "reading" ? "Contenido" : "Descripción o indicaciones"}
        hint="Texto plano con **negrita**, `código`, ## títulos, listas con - y citas con >. Nunca se interpreta HTML."
        value={f.body}
        onChange={(e) => setF({ ...f, body: e.target.value })}
        maxLength={50000}
        rows={8}
      />
      <SwitchRow checked={f.isPreview} onChange={(v) => setF({ ...f, isPreview: v })} label="Vista previa gratuita" hint="Visible para quien aún no está matriculado." />

      {ASSET_KINDS_FOR[f.kind].length > 0 && (
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-extrabold tracking-wider" style={{ color: "var(--l-muted)" }}>ARCHIVOS PRIVADOS</h4>
          <ul className="flex flex-col gap-2">
            {lesson.assets.map((a) => (
              <li key={a.id} className="flex items-center gap-2 rounded-xl p-2 text-sm" style={{ background: "var(--l-bg)" }}>
                {a.kind === "video" ? <Film size={16} aria-hidden="true" /> : <FileText size={16} aria-hidden="true" />}
                <span className="min-w-0 flex-1 break-words font-bold">{UPLOAD_RULES[a.kind].label} <span className="font-semibold" style={{ color: "var(--l-muted)" }}>· {formatBytes(a.sizeBytes)}</span></span>
                <Button size="sm" variant="ghost" aria-label={`Eliminar ${UPLOAD_RULES[a.kind].label}`} onClick={async () => {
                  if (!(await confirm({ title: "Eliminar archivo", itemName: UPLOAD_RULES[a.kind].label, variant: "danger" }))) return
                  try { await lms.admin.deleteAsset(lesson.id, a.id); onChanged() } catch (e) { toast.error(errMsg(e)) }
                }}><Trash2 size={14} aria-hidden="true" /></Button>
              </li>
            ))}
            {uploads.map((u, i) => (
              <li key={i} className="flex flex-col gap-1 rounded-xl p-2 text-sm" style={{ background: "var(--l-bg)" }}>
                <div className="flex justify-between gap-2"><span className="min-w-0 truncate font-bold">{u.name}</span><span className="font-extrabold">{u.percent}%</span></div>
                <div className="q-progress" role="progressbar" aria-label={`Subiendo ${u.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={u.percent}><span style={{ width: `${u.percent}%` }} /></div>
              </li>
            ))}
          </ul>
          <input ref={fileRef} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => void onFile(e.target.files?.[0])} />
          <div className="flex flex-wrap gap-2">
            {ASSET_KINDS_FOR[f.kind].map((k) => (
              <button key={k} type="button" className="l-dashed" disabled={uploads.length > 0} onClick={() => pick(k)}><Upload size={15} aria-hidden="true" /> {UPLOAD_RULES[k].label}</button>
            ))}
          </div>
          <p className="l-hint">Se guardan en almacenamiento privado y solo se entregan a quien tiene acceso, con enlaces que vencen en 5 minutos. No se puede impedir que alguien con acceso grabe lo que ve.</p>
        </div>
      )}
      {f.kind === "link" && lesson.linkUrl && (
        <a href={lesson.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: "var(--l-brand)" }}><ExternalLink size={14} aria-hidden="true" /> Probar enlace</a>
      )}
    </div>
  )
}

export { reorder }
