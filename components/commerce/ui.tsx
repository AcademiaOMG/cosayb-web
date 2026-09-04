"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ShieldCheck } from "lucide-react"

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs font-medium text-red-600">{msg}</p>
}

const inputCls =
  "w-full rounded-xl border border-[#DDD6C8] bg-[#F7F5F2] px-3 py-3 text-sm outline-none transition focus:border-[#1B4FD8]"

export function TextField({
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  inputMode,
  className = "",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  type?: string
  inputMode?: "text" | "numeric" | "tel" | "email"
  className?: string
}) {
  return (
    <label className={`block space-y-1.5 text-sm ${className}`}>
      <span className="font-medium text-[#12213A]">{label}</span>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
        aria-invalid={!!error}
      />
      <FieldError msg={error} />
    </label>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  error,
  className = "",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  error?: string
  className?: string
}) {
  return (
    <label className={`block space-y-1.5 text-sm ${className}`}>
      <span className="font-medium text-[#12213A]">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        <option value="">Selecciona</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <FieldError msg={error} />
    </label>
  )
}

export function DemoNotice() {
  return (
    <div className="rounded-xl border border-[#DDD6C8] bg-[#F7F5F2] p-3 text-xs text-[#4A4438]">
      Entorno de demostración. No se realizará ningún cobro real.
    </div>
  )
}

/** Barra de pasos con nombres. */
export function Stepper({
  steps,
  activeIndex,
}: {
  steps: string[]
  activeIndex: number
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs font-semibold">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full border ${
              i < activeIndex
                ? "border-[#1B4FD8] bg-[#1B4FD8] text-white"
                : i === activeIndex
                  ? "border-[#1B4FD8] bg-white text-[#1B4FD8]"
                  : "border-[#DDD6C8] bg-[#F7F5F2] text-[#7A6E60]"
            }`}
          >
            {i + 1}
          </span>
          <span className={i === activeIndex ? "text-[#12213A]" : "text-[#7A6E60]"}>{label}</span>
          {i < steps.length - 1 && <span className="mx-1 hidden h-px w-6 bg-[#DDD6C8] sm:block" />}
        </li>
      ))}
    </ol>
  )
}

/** Resumen de compra — columna derecha en desktop, colapsable en mobile. */
export function OrderSummary({
  title,
  rows,
  total,
  totalNote,
}: {
  title: string
  rows: Array<{ label: string; value: string }>
  total: string
  totalNote?: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <aside className="rounded-3xl border border-[#DDD6C8] bg-[#12213A] p-6 text-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between lg:pointer-events-none"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7AAEFF]">Resumen</span>
        <ChevronDown className={`h-4 w-4 lg:hidden ${open ? "rotate-180" : ""}`} />
      </button>
      <h3 className="mt-3 text-2xl font-extrabold">{title}</h3>

      <div className={`${open ? "block" : "hidden"} lg:block`}>
        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between gap-3">
              <span className="text-[#C8D5E8]">{r.label}</span>
              <span className="text-right font-semibold">{r.value}</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-[#C8D5E8]">Total</span>
            <span className="text-lg font-extrabold">{total}</span>
          </div>
          {totalNote && <p className="text-xs text-[#9FB4D0]">{totalNote}</p>}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[#1B4FD8]/30 bg-[#0E1A2D] p-3 text-xs text-[#D9E7FF]">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7AAEFF]" />
          Pago simulado. No se realiza ningún cobro real ni se contacta una pasarela.
        </div>
      </div>
    </aside>
  )
}

export function ExitConfirmModal({
  open,
  onStay,
  onLeave,
}: {
  open: boolean
  onStay: () => void
  onLeave: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-[#12213A] shadow-xl">
        <h2 className="text-xl font-bold">¿Quieres salir del proceso?</h2>
        <p className="mt-2 text-sm text-[#4A4438]">Tu progreso se perderá.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            onClick={onStay}
            className="rounded-xl bg-[#1B4FD8] px-5 py-3 text-sm font-semibold text-white"
          >
            Continuar con la compra
          </button>
          <button
            onClick={onLeave}
            className="rounded-xl border border-[#DDD6C8] bg-white px-5 py-3 text-sm font-semibold text-[#12213A]"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  )
}

export function GlobalError({
  message,
  onRetry,
  onBack,
}: {
  message: string
  onRetry: () => void
  onBack: () => void
}) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <h2 className="text-2xl font-extrabold text-[#12213A]">Algo salió mal</h2>
      <p className="mt-2 text-sm text-[#7A2E2E]">{message}</p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button onClick={onRetry} className="rounded-xl bg-[#1B4FD8] px-5 py-3 text-sm font-semibold text-white">
          Intentar nuevamente
        </button>
        <button onClick={onBack} className="rounded-xl border border-[#DDD6C8] bg-white px-5 py-3 text-sm font-semibold text-[#12213A]">
          Volver
        </button>
      </div>
    </div>
  )
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-semibold text-[#1B4FD8]">
      ← {label}
    </Link>
  )
}
