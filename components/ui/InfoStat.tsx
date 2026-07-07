"use client"

import type { ReactNode } from "react"

/** Mini tarjeta de dato (icono + etiqueta + valor) — usada en modales de detalle/registro histórico */
export default function InfoStat({
  icon,
  label,
  value,
  accent = false,
  mono = false,
}: {
  icon?: ReactNode
  label: string
  value: ReactNode
  accent?: boolean
  mono?: boolean
}) {
  return (
    <div
      className="rounded-xl px-3 py-2.5"
      style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{label}</span>
      </div>
      <p
        className={`text-sm font-semibold ${mono ? "font-mono tabular-nums" : ""}`}
        style={{ color: accent ? "var(--accent)" : "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  )
}
