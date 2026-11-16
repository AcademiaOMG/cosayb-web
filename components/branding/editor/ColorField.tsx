"use client"

import { useId, useState, type ReactNode } from "react"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { parseHexInput } from "@/lib/branding/draft"
import type { ThemeIssue } from "@/lib/branding/theme"

interface ColorFieldProps {
  label: string
  value: string
  onChange: (hex: string) => void
  /** «Cambia: …» (qué elementos modifica este color). */
  affects?: string[]
  /** «No cambia: …» (evita confusiones). */
  doesNotAffect?: string[]
  /** Problemas de contraste/avisos de este color. */
  issues?: ThemeIssue[]
  /** Muestra «Contraste correcto» cuando no hay problemas (el color tiene comprobación). */
  checked?: boolean
  /** Aplica la corrección sugerida de un aviso. */
  onApplyFix?: (hex: string) => void
  /** Contenido extra bajo el campo (p. ej. «Volver a automático»). */
  children?: ReactNode
}

export default function ColorField({ label, value, onChange, affects, doesNotAffect, issues, checked, onApplyFix, children }: ColorFieldProps) {
  const id = useId()
  const [text, setText] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  // Si el valor cambia desde fuera (corrección automática, sugerencia, restablecer), el texto lo sigue.
  if (value !== prevValue) {
    setPrevValue(value)
    if (parseHexInput(text) !== value) setText(value)
  }
  const invalid = parseHexInput(text) === null
  const low = !!issues && issues.length > 0

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-hex`} className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label}: selector de color`}
          value={value.toLowerCase()}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          style={{ borderColor: "var(--border-medium)", background: "var(--bg-surface)" }}
        />
        <input
          id={`${id}-hex`}
          type="text"
          inputMode="text"
          spellCheck={false}
          autoComplete="off"
          maxLength={7}
          value={text}
          aria-invalid={invalid}
          aria-describedby={`${id}-desc`}
          onChange={(e) => {
            setText(e.target.value)
            const parsed = parseHexInput(e.target.value)
            if (parsed) onChange(parsed)
          }}
          onBlur={() => setText(value)}
          className="h-10 min-w-0 flex-1 rounded-[var(--radius-md)] border px-3 font-mono text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          style={{
            background: "var(--bg-surface)",
            borderColor: invalid ? "var(--error)" : "var(--border-light)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <div id={`${id}-desc`} className="flex flex-col gap-0.5 text-xs" style={{ color: "var(--text-secondary)" }}>
        {invalid && <p style={{ color: "var(--error-text)" }}>Escribe un color de 6 dígitos, por ejemplo #1B4FD8.</p>}
        {affects && affects.length > 0 && (
          <p>
            <strong style={{ color: "var(--text-primary)" }}>Cambia:</strong> {affects.join(" · ")}
          </p>
        )}
        {doesNotAffect && doesNotAffect.length > 0 && (
          <p>
            <strong style={{ color: "var(--text-primary)" }}>No cambia:</strong> {doesNotAffect.join(" · ")}
          </p>
        )}
      </div>

      {low && (
        <ul className="flex flex-col gap-1" aria-label={`Avisos de ${label}`}>
          {issues!.map((i, n) => (
            <li key={n} className="flex flex-wrap items-start gap-x-2 gap-y-1 text-xs font-medium" style={{ color: "var(--warning-text)" }}>
              <AlertTriangle size={14} className="mt-px shrink-0" aria-hidden />
              <span className="min-w-0 flex-1">{i.message}</span>
              {i.fix && onApplyFix && (
                <button
                  type="button"
                  onClick={() => onApplyFix(i.fix!)}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2 py-0.5 font-semibold focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                  style={{ borderColor: "var(--border-medium)", color: "var(--text-primary)", background: "var(--bg-surface)" }}
                >
                  <span aria-hidden className="inline-block h-3 w-3 rounded-sm border" style={{ background: i.fix, borderColor: "var(--border-medium)" }} />
                  Usar {i.fix}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!low && checked && (
        <p className="flex items-start gap-1 text-xs font-medium" style={{ color: "var(--success-text)" }}>
          <CheckCircle2 size={14} className="mt-px shrink-0" aria-hidden />
          <span>Contraste correcto (AA)</span>
        </p>
      )}
      {children}
    </div>
  )
}
