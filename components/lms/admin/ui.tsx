"use client"

import { forwardRef } from "react"
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react"

// Controles mínimos del panel del instructor (mismos tokens de color que el resto de la consola).

export const fieldStyle = {
  background: "var(--bg-surface)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-medium)",
  borderRadius: "var(--radius-md, 8px)",
} as const

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }>(
  ({ label, className, ...props }, ref) => (
    <label className="flex flex-col gap-1.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
      {label}
      <textarea ref={ref} className={`min-h-24 w-full p-3 text-sm font-normal ${className ?? ""}`} style={fieldStyle} {...props} />
    </label>
  )
)
TextArea.displayName = "TextArea"

export const NumberField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { label: string }>(
  ({ label, ...props }, ref) => (
    <label className="flex flex-col gap-1.5 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
      {label}
      <input ref={ref} type="number" className="h-10 w-full px-3 text-sm font-normal" style={fieldStyle} {...props} />
    </label>
  )
)
NumberField.displayName = "NumberField"

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm" style={{ color: "var(--text-primary)" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>{children}</h2>
}

export function errMsg(e: unknown, fallback = "No se pudo completar la acción."): string {
  return e instanceof Error && e.message ? e.message : fallback
}
