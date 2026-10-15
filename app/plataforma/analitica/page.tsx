"use client"

import { useRef, useState } from "react"
import PlatformPage from "@/components/plataforma/PlatformPage"
import ActividadView from "@/components/plataforma/analitica/ActividadView"
import ModulosView from "@/components/plataforma/analitica/ModulosView"
import EmbudoView from "@/components/plataforma/analitica/EmbudoView"
import RetencionView from "@/components/plataforma/analitica/RetencionView"
import PlanesView from "@/components/plataforma/analitica/PlanesView"
import { PeriodSelect } from "@/components/plataforma/analitica/Shared"
import { PERIODS } from "@/lib/plataforma/analitica"

const TABS = [
  { id: "actividad", label: "Actividad", usesPeriod: true },
  { id: "modulos", label: "Módulos", usesPeriod: true },
  { id: "embudo", label: "Nuevos clientes", usesPeriod: false },
  { id: "retencion", label: "Retención", usesPeriod: false },
  { id: "planes", label: "Planes y ventas", usesPeriod: true },
] as const

type TabId = (typeof TABS)[number]["id"]

export default function AnaliticaPage() {
  const [tab, setTab] = useState<TabId>("actividad")
  const [days, setDays] = useState(30)
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  const current = TABS.find((t) => t.id === tab)!

  function onKey(e: React.KeyboardEvent, index: number) {
    const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = TABS[(index + step + TABS.length) % TABS.length]
    setTab(next.id)
    refs.current[next.id]?.focus()
  }

  return (
    <PlatformPage
      title="Analítica de uso"
      description="Qué módulos se usan más, cuántas personas y negocios están activos, qué pasa con los clientes nuevos y dónde chocan con el plan."
      actions={current.usesPeriod ? <PeriodSelect value={days} onChange={setDays} options={PERIODS} /> : undefined}
    >
      <div role="tablist" aria-label="Secciones de la analítica" className="flex flex-wrap gap-1 border-b" style={{ borderColor: "var(--border-light)" }}>
        {TABS.map((t, i) => {
          const selected = t.id === tab
          return (
            <button
              key={t.id}
              ref={(el) => { refs.current[t.id] = el }}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onKey(e, i)}
              className="plat-focus -mb-px px-4 py-2.5 text-sm font-semibold"
              style={{
                color: selected ? "var(--accent)" : "var(--text-muted)",
                borderBottom: `2px solid ${selected ? "var(--accent)" : "transparent"}`,
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="outline-none">
        {tab === "actividad" && <ActividadView days={days} />}
        {tab === "modulos" && <ModulosView days={days} />}
        {tab === "embudo" && <EmbudoView />}
        {tab === "retencion" && <RetencionView />}
        {tab === "planes" && <PlanesView days={days} />}
      </div>
    </PlatformPage>
  )
}
