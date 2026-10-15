"use client"

import type { ReactNode } from "react"
import { Info } from "lucide-react"
import ErrorState from "@/components/ui/ErrorState"
import LoadingBlock from "@/components/ui/LoadingBlock"
import { SaasError } from "@/lib/saas/types"
import { historyNotice, type Capture } from "@/lib/plataforma/analitica"

/** 403 del API = el rol no tiene el permiso; reintentar no sirve. */
const isForbidden = (err: unknown) => err instanceof SaasError && err.code === "HTTP_403"

/** Carga, error y contenido de un bloque con datos del API. */
export function AsyncBlock<T>({
  data, error, onRetry, label, children,
}: { data: T | undefined; error: unknown; onRetry: () => void; label: string; children: (data: T) => ReactNode }) {
  if (error) {
    return isForbidden(error) ? (
      <ErrorState title="Tu rol no incluye la analítica de uso" description="Pide acceso a un administrador de la plataforma si lo necesitas." />
    ) : (
      <ErrorState title={`No pudimos cargar ${label}`} onRetry={onRetry} />
    )
  }
  if (!data) return <LoadingBlock label={`Cargando ${label}…`} />
  return <>{children(data)}</>
}

/** Aviso cuando hay poca historia de uso (o ninguna). No se muestra si ya hay suficiente. */
export function HistoryNotice({ capture }: { capture: Capture }) {
  const text = historyNotice(capture)
  if (!text) return null
  return (
    <p role="status" className="flex items-start gap-2 rounded-[var(--radius-md)] px-4 py-3 text-sm" style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>
      <Info size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span>{text}</span>
    </p>
  )
}

/** Sección con título y explicación corta de qué es y cómo se calcula. */
export function Section({
  id, title, intro, explain, children,
}: { id: string; title: string; intro?: string; explain: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <div>
        <h2 id={id} className="text-lg font-bold console-title">{title}</h2>
        {intro && <p className="text-sm console-muted mt-1">{intro}</p>}
        <details className="mt-1 text-xs console-muted">
          <summary className="cursor-pointer plat-focus">Qué es y cómo se calcula</summary>
          <p className="mt-1 max-w-3xl leading-snug">{explain}</p>
        </details>
      </div>
      {children}
    </section>
  )
}

export function PeriodSelect({
  value, onChange, options, label = "Periodo",
}: { value: number; onChange: (n: number) => void; options: readonly { value: number; label: string }[]; label?: string }) {
  return (
    <label className="flex items-center gap-2 text-sm console-muted">
      {label}
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className="console-input text-sm" style={{ height: 36, paddingInline: 10 }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

export function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <th scope="col" className={`px-3 py-2 text-left text-xs font-semibold console-muted whitespace-nowrap ${className}`}>{children}</th>
}
