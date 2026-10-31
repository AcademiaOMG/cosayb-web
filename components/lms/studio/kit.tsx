"use client"

import { useEffect, useId, useRef, useState } from "react"
import type { ReactNode, SelectHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react"
import { GripVertical, X } from "lucide-react"

// Piezas de formulario y de interacción del estudio del instructor. Todas con teclado, foco visible y roles ARIA.

export function errMsg(e: unknown, fallback = "No se pudo completar la acción."): string {
  return e instanceof Error && e.message ? e.message : fallback
}

interface FieldProps {
  label: string
  hint?: string
  error?: string | null
  children: (id: string, describedBy: string | undefined) => ReactNode
  className?: string
}

/** Etiqueta + control + ayuda/error enlazados con aria-describedby. */
export function Field({ label, hint, error, children, className = "" }: FieldProps) {
  const id = useId()
  const msg = error ?? hint
  return (
    <div className={`l-label ${className}`}>
      <label htmlFor={id}>{label}</label>
      {children(id, msg ? `${id}-msg` : undefined)}
      {msg && (
        <span id={`${id}-msg`} className={error ? "l-err" : "l-hint"} role={error ? "alert" : undefined}>
          {msg}
        </span>
      )}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string | null }
export function TextField({ label, hint, error, className = "", ...rest }: InputProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id, d) => <input id={id} aria-describedby={d} aria-invalid={error ? true : undefined} className={`l-input ${className}`} {...rest} />}
    </Field>
  )
}

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string | null }
export function AreaField({ label, hint, error, className = "", ...rest }: AreaProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {(id, d) => <textarea id={id} aria-describedby={d} aria-invalid={error ? true : undefined} className={`l-textarea ${className}`} {...rest} />}
    </Field>
  )
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string; options: { value: string; label: string }[] }
export function SelectField({ label, hint, options, className = "", ...rest }: SelectProps) {
  return (
    <Field label={label} hint={hint}>
      {(id, d) => (
        <select id={id} aria-describedby={d} className={`l-input l-select ${className}`} {...rest}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </Field>
  )
}

/** Interruptor accesible (role="switch"). */
export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className="l-switch" onClick={() => onChange(!checked)} />
}

export function SwitchRow({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-bold">{label}</p>
        {hint && <p className="l-hint">{hint}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

/** Diálogo modal nativo: trampa de foco, Escape y fondo inerte los gestiona el navegador. */
export function Dialog({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} className={`l-dialog ${wide ? "l-dialog-wide" : ""}`} aria-labelledby={titleId} onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose() }}>
      {open && (
        <>
          <header className="flex items-center justify-between gap-3 border-b px-6 py-4" style={{ borderColor: "var(--l-line)" }}>
            <h2 id={titleId} className="text-lg font-extrabold">{title}</h2>
            <button type="button" className="l-btn l-btn-ghost !min-h-9 !w-9 !px-0" aria-label="Cerrar" onClick={onClose}><X size={16} aria-hidden="true" /></button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <footer className="flex flex-wrap justify-end gap-2 border-t px-6 py-4" style={{ borderColor: "var(--l-line)" }}>{footer}</footer>}
        </>
      )}
    </dialog>
  )
}

/** Menú de acciones (⋯): se cierra con Escape, al elegir o al hacer clic fuera. */
export function ActionMenu({ label, trigger, children }: { label: string; trigger: ReactNode; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", away)
    document.addEventListener("keydown", esc)
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc) }
  }, [open])
  return (
    <div ref={root} className="relative">
      <button type="button" className="l-btn l-btn-ghost !min-h-9 !w-9 !px-0" aria-haspopup="menu" aria-expanded={open} aria-label={label} onClick={() => setOpen((o) => !o)}>{trigger}</button>
      {open && <div role="menu" className="l-menu" onClick={() => setOpen(false)}>{children(() => setOpen(false))}</div>}
    </div>
  )
}

/** Aviso informativo que se puede cerrar (recuerda la decisión en este navegador). */
export function Notice({ storeKey, children }: { storeKey: string; children: ReactNode }) {
  const [hidden, setHidden] = useState(true)
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de localStorage tras hidratar
      setHidden(window.localStorage.getItem(storeKey) === "1")
    } catch {
      setHidden(false)
    }
  }, [storeKey])
  if (hidden) return null
  return (
    <div role="note" className="l-rise flex items-start gap-3 rounded-2xl p-4 text-sm" style={{ background: "var(--l-sky-bg)", color: "var(--l-sky-ink)" }}>
      <div className="min-w-0 flex-1">{children}</div>
      <button type="button" className="rounded-lg p-1 hover:bg-white/60" aria-label="Cerrar aviso" onClick={() => { setHidden(true); try { window.localStorage.setItem(storeKey, "1") } catch { /* sin almacenamiento */ } }}>
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}

// ─── Arrastrar y soltar (HTML5, con alternativa de teclado en los menús) ────

export function Grip({ label, ...rest }: { label: string } & React.HTMLAttributes<HTMLButtonElement> & { draggable?: boolean }) {
  return <button type="button" className="l-grip" aria-label={label} title="Arrastra para reordenar" {...rest}><GripVertical size={16} aria-hidden="true" /></button>
}

/**
 * Lista ordenable: `handle(id)` va en el agarre; `target(id)` en cada fila. `onMove(id, beforeId)` recibe el elemento
 * arrastrado y delante de qué otro se suelta (null = al final). El orden real lo decide el padre.
 */
export function useSortable(onMove: (id: string, beforeId: string | null) => void, kind = "item") {
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const mime = `application/x-lms-${kind}`
  return {
    dragging,
    over,
    handle: (id: string) => ({
      draggable: true as const,
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.setData(mime, id)
        e.dataTransfer.effectAllowed = "move"
        const row = (e.currentTarget as HTMLElement).closest("[data-sortable]") as HTMLElement | null
        if (row) e.dataTransfer.setDragImage(row, 16, 16)
        setDragging(id)
      },
      onDragEnd: () => { setDragging(null); setOver(null) },
    }),
    target: (id: string | null) => ({
      onDragOver: (e: React.DragEvent) => {
        if (!e.dataTransfer.types.includes(mime)) return
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
        if (over !== id) setOver(id)
      },
      onDrop: (e: React.DragEvent) => {
        const dragged = e.dataTransfer.getData(mime)
        setDragging(null)
        setOver(null)
        if (dragged && dragged !== id) {
          e.preventDefault()
          e.stopPropagation()
          onMove(dragged, id)
        }
      },
    }),
  }
}

// ─── Autoguardado ───────────────────────────────────────────────────────────

export type SaveState = "idle" | "saving" | "saved" | "error"

/**
 * Guarda `value` pasado `delay` ms sin cambios (solo si `valid`). Devuelve el estado para mostrarlo ("Guardando…", "Guardado").
 * El valor se compara serializado: usa datos planos (strings, números, listas, objetos).
 */
export function useAutosave<T>(value: T, save: (v: T) => Promise<void>, { valid = true, delay = 900 }: { valid?: boolean; delay?: number } = {}) {
  const [status, setStatus] = useState<SaveState>("idle")
  const key = JSON.stringify(value)
  const last = useRef(key)
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  })
  useEffect(() => {
    if (key === last.current || !valid) return
    const t = setTimeout(async () => {
      setStatus("saving")
      try {
        await saveRef.current(JSON.parse(key) as T)
        last.current = key
        setStatus("saved")
      } catch {
        setStatus("error")
      }
    }, delay)
    return () => clearTimeout(t)
  }, [key, valid, delay])
  return { status }
}

const SAVE_TEXT: Record<SaveState, string> = { idle: "", saving: "Guardando…", saved: "Guardado", error: "No se pudo guardar" }

/** Indicador discreto del estado de guardado (aria-live para lectores de pantalla). */
export function SaveBadge({ status, invalid }: { status: SaveState; invalid?: boolean }) {
  const text = invalid ? "Falta completar para guardar" : SAVE_TEXT[status]
  const color = invalid ? "var(--l-amber-ink)" : status === "error" ? "var(--l-rose-ink)" : status === "saved" ? "var(--l-mint-ink)" : "var(--l-muted)"
  return <span role="status" aria-live="polite" className="text-xs font-bold" style={{ color }}>{text}</span>
}
