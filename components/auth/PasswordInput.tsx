"use client"

import { useId, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { passwordStrength } from "@/lib/auth/validation"

export interface PasswordInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: string
  autoComplete?: "current-password" | "new-password"
  showStrength?: boolean
  name?: string
  disabled?: boolean
}

const STRENGTH_COLORS = ["var(--error)", "var(--warning)", "var(--accent)", "var(--success)"]

/** Campo de contraseña con mostrar/ocultar y, opcionalmente, indicador de fortaleza. */
export default function PasswordInput({
  label,
  value,
  onChange,
  error,
  hint,
  autoComplete = "current-password",
  showStrength,
  name,
  disabled,
}: PasswordInputProps) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const strength = passwordStrength(value)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="h-10 w-full pl-3 pr-11 text-sm outline-none transition-colors focus:ring-2 disabled:opacity-60"
          style={{
            background: "var(--bg-surface)",
            border: error ? "1px solid var(--error)" : "1px solid var(--border-light)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-primary)",
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center"
          style={{ color: "var(--text-muted)" }}
        >
          {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
        </button>
      </div>
      {showStrength && value && (
        <div className="flex items-center gap-2" aria-live="polite">
          <div className="flex gap-1 flex-1" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-1 flex-1 rounded-full"
                style={{ background: i <= strength.score ? STRENGTH_COLORS[strength.score] : "var(--border-light)" }}
              />
            ))}
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{strength.label}</span>
        </div>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs" role="alert" style={{ color: "var(--error)" }}>{error}</p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs" style={{ color: "var(--text-muted)" }}>{hint}</p>
      )}
    </div>
  )
}
