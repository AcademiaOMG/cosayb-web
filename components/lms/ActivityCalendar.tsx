"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Flame } from "lucide-react"

const DOW = ["L", "M", "X", "J", "V", "S", "D"]
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const key = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`

/** Calendario mensual de actividad (lecciones y evaluaciones) con racha. Días con actividad en azul de marca; rango de racha unido. */
export default function ActivityCalendar({ activity, streak }: { activity: { date: string; count: number }[]; streak: number }) {
  const today = new Date()
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() })
  const counts = useMemo(() => new Map(activity.map((a) => [a.date, a.count])), [activity])

  const first = new Date(cursor.y, cursor.m, 1)
  const lead = (first.getDay() + 6) % 7
  const days = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)]
  const todayKey = key(today.getFullYear(), today.getMonth(), today.getDate())
  const move = (d: number) => setCursor((c) => { const n = new Date(c.y, c.m + d, 1); return { y: n.getFullYear(), m: n.getMonth() } })
  const monthTotal = [...counts.entries()].filter(([k]) => k.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}`)).reduce((n, [, v]) => n + v, 0)

  return (
    <section className="l-card p-5" aria-label="Calendario de actividad">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold">Actividad</h2>
        <div className="flex items-center gap-1">
          <button type="button" className="l-btn l-btn-ghost !min-h-9 !w-9 !px-0" aria-label="Mes anterior" onClick={() => move(-1)}><ChevronLeft size={16} aria-hidden="true" /></button>
          <button type="button" className="l-btn l-btn-ghost !min-h-9 !w-9 !px-0" aria-label="Mes siguiente" onClick={() => move(1)}><ChevronRight size={16} aria-hidden="true" /></button>
        </div>
      </div>
      <p className="mb-3 text-sm font-bold capitalize" aria-live="polite">{MONTHS[cursor.m]} {cursor.y}</p>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs" role="grid" aria-label={`${MONTHS[cursor.m]} ${cursor.y}`}>
        {DOW.map((d) => <span key={d} role="columnheader" className="pb-1 font-bold" style={{ color: "var(--l-muted)" }}>{d}</span>)}
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} role="gridcell" />
          const k = key(cursor.y, cursor.m, d)
          const c = counts.get(k) ?? 0
          const prev = c > 0 && (counts.get(key(cursor.y, cursor.m, d - 1)) ?? 0) > 0 && (i % 7) !== 0
          const next = c > 0 && (counts.get(key(cursor.y, cursor.m, d + 1)) ?? 0) > 0 && (i % 7) !== 6
          const isToday = k === todayKey
          return (
            <span key={k} role="gridcell" className="relative flex h-9 items-center justify-center" aria-label={`${d} de ${MONTHS[cursor.m]}${c ? `: ${c} actividad${c > 1 ? "es" : ""}` : ""}`}>
              {(prev || next) && <span aria-hidden="true" className="absolute inset-y-1" style={{ left: prev ? 0 : "50%", right: next ? 0 : "50%", background: "var(--l-brand-50)" }} />}
              <span className="relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold"
                style={{ background: c ? (c > 2 ? "var(--l-brand)" : "var(--l-brand-100)") : "transparent", color: c > 2 ? "#fff" : c ? "var(--l-tint-ink)" : "var(--l-ink-2)", boxShadow: isToday ? "0 0 0 2px var(--l-brand)" : undefined }}>
                {d}
              </span>
            </span>
          )
        })}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: streak ? "var(--l-amber-bg)" : "var(--l-bg)" }}>
        <span className="inline-flex items-center gap-2 text-sm font-extrabold" style={{ color: streak ? "var(--l-amber-ink)" : "var(--l-ink-2)" }}>
          <Flame size={18} aria-hidden="true" /> {streak > 0 ? `Racha de ${streak} día${streak > 1 ? "s" : ""}` : "Empieza tu racha hoy"}
        </span>
        <span className="text-xs font-bold" style={{ color: "var(--l-muted)" }}>{monthTotal} este mes</span>
      </div>
    </section>
  )
}
