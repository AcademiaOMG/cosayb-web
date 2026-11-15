"use client"

import { useId, useState } from "react"
import { AlertTriangle, CheckCircle2 } from "lucide-react"
import { parseHexInput } from "@/lib/branding/draft"
import type { ThemeIssue } from "@/lib/branding/theme"

interface ColorFieldProps {
  label: string
  hint: string
  value: string
  onChange: (hex: string) => void
  /** Problemas de contraste de este color; undefined = este color no tiene comprobación de contraste. */
  issues?: ThemeIssue[]
  checked?: boolean
}

export default function ColorField({ label, hint, value, onChange, issues, checked }: ColorFieldProps) {
  const id = useId()
  const [text, setText] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  // Si el valor cambia desde fuera (corrección automática, restablecer), el texto lo sigue.
  if (value !== prevValue) {
    setPrevValue(value)
    if (parseHexInput(text) !== value) setText(value)
  }
  const invalid = parseHexInput(text) === null
  const low = !!issues && issues.length > 0

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={`${id}-hex`} className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
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
          aria-describedby={`${id}-hint`}
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
      <p id={`${id}-hint`} className="text-xs" style={{ color: "var(--text-muted)" }}>
        {invalid ? "Escribe un color de 6 dígitos, por ejemplo #1B4FD8." : hint}
      </p>
      {checked && (
        <p
          className="flex items-start gap-1 text-xs font-medium"
          style={{ color: low ? "var(--warning-text)" : "var(--success-text)" }}
        >
          {low ? (
            <>
              <AlertTriangle size={14} className="mt-px shrink-0" aria-hidden />
              <span>{issues!.map((i) => i.message).join(" ")}</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} className="mt-px shrink-0" aria-hidden />
              <span>Contraste AA correcto</span>
            </>
          )}
        </p>
      )}
    </div>
  )
}
