"use client"

import useSWR from "swr"
import { useRef, useState } from "react"
import { RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react"
import Button from "@/components/ui/Button"
import { bancoSyncPrices, bancoSyncPricesStatus, type SyncPricesStatus } from "@/lib/api"
import { friendlyError } from "@/lib/errorMessage"
import { toast } from "@/lib/toast"
import type { Ingrediente } from "@/types/domain"
import { compararPrecios, haceFecha, haceMinutos, type CambioPrecios } from "@/lib/plataforma/banco/tiempo"

const FUENTES: Record<string, string> = { exito: "Éxito", makro: "Makro" }

function textoCambio(c: CambioPrecios): string {
  if (c.cambiaron === 0) return "No cambió ningún precio: los del banco ya estaban al día."
  const partes = [`${c.subieron} ${c.subieron === 1 ? "subió" : "subieron"}`, `${c.bajaron} ${c.bajaron === 1 ? "bajó" : "bajaron"}`]
  return `Cambió el precio de ${c.cambiaron} ${c.cambiaron === 1 ? "ingrediente" : "ingredientes"} (${partes.join(", ")}).`
}

export default function SincronizarPrecios({
  ingredientes,
  puedeActualizar,
  recargar,
}: {
  ingredientes: Ingrediente[] | undefined
  puedeActualizar: boolean
  recargar: () => Promise<Ingrediente[] | undefined>
}) {
  const [error, setError] = useState<string | null>(null)
  const [cambio, setCambio] = useState<CambioPrecios | null>(null)
  const antes = useRef<Map<string, number> | null>(null)
  const faseAnterior = useRef<string | undefined>(undefined)

  async function terminar(fase: string) {
    const nuevos = await recargar()
    if (fase === "completed" && antes.current && nuevos) setCambio(compararPrecios(antes.current, nuevos))
    antes.current = null
    if (fase === "completed") toast.success("Precios de mercado actualizados")
    else toast.error("La actualización de precios no terminó bien", { description: "Inténtalo de nuevo en unos minutos." })
  }

  const { data, mutate } = useSWR("banco-sync-prices-status", bancoSyncPricesStatus, {
    // cada 5 s mientras corre; cada 60 s en reposo
    refreshInterval: (latest) => (latest?.data.progress?.phase === "running" ? 5_000 : 60_000),
    revalidateOnFocus: false,
    onSuccess: (res) => {
      const fase = res.data.progress?.phase
      if (faseAnterior.current === "running" && fase && fase !== "running") void terminar(fase)
      faseAnterior.current = fase
    },
  })

  const estado: SyncPricesStatus | undefined = data?.data
  const progreso = estado?.progress
  const sincronizando = progreso?.phase === "running"
  const porcentaje = progreso && progreso.total > 0 ? Math.min(100, Math.round((progreso.done / progreso.total) * 100)) : 0
  const terminoHace = haceFecha(progreso?.finishedAt)

  // «Qué cambió»: se compara contra los precios que había al pulsar el botón
  async function iniciar() {
    setError(null)
    setCambio(null)
    antes.current = new Map((ingredientes ?? []).map((i) => [i.id, parseFloat(i.costPerUnit)]))
    try {
      await bancoSyncPrices()
      void mutate()
    } catch (e) {
      antes.current = null
      setError(friendlyError(e, "No se pudo iniciar la actualización de precios."))
    }
  }

  const fuentes = Object.entries(estado?.sources ?? {}).map(([k, v]) => ({
    nombre: FUENTES[k] ?? "Otra tienda",
    cuando: v.maxAgeMinutes === null ? "sin datos" : haceMinutos(v.maxAgeMinutes),
  }))

  return (
    <section
      aria-label="Precios de mercado"
      className="flex flex-col gap-3 px-4 py-3.5 md:flex-row md:items-center md:px-5"
      style={{ background: "var(--bg-surface)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Precios de mercado</p>

        {sincronizando && progreso ? (
          <div className="flex flex-col gap-1.5" style={{ maxWidth: 360 }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }} aria-live="polite">
              Actualizando precios{progreso.current ? `: ${progreso.current}` : "…"} ({progreso.done} de {progreso.total})
            </p>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "var(--border-light)" }} role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-1.5 rounded-full" style={{ width: `${porcentaje}%`, background: "var(--accent)", transition: "width 0.4s ease" }} />
            </div>
          </div>
        ) : (
          <>
            <p className="flex flex-wrap items-center gap-x-2 text-xs" style={{ color: "var(--text-muted)" }}>
              {estado ? (
                <>
                  {estado.isFresh ? (
                    <span className="inline-flex items-center gap-1" style={{ color: "#15803D" }}><CheckCircle2 size={12} aria-hidden="true" /> Al día</span>
                  ) : (
                    <span className="inline-flex items-center gap-1" style={{ color: "#B45309" }}><AlertTriangle size={12} aria-hidden="true" /> Desactualizados</span>
                  )}
                  {fuentes.length > 0 && <span>Datos de las tiendas: {fuentes.map((f) => `${f.nombre} ${f.cuando}`).join(" · ")}</span>}
                  {progreso?.phase === "completed" && terminoHace && <span>· Última actualización {terminoHace}</span>}
                  {progreso?.phase === "failed" && <span style={{ color: "var(--error)" }}>· La última actualización falló{terminoHace ? ` (${terminoHace})` : ""}</span>}
                  {(!progreso || progreso.phase === "idle") && <span>· Todavía no se ha actualizado desde esta sesión del servidor</span>}
                </>
              ) : (
                "Consultando…"
              )}
            </p>
            {cambio && <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{textoCambio(cambio)}</p>}
          </>
        )}
        {error && <p role="alert" className="text-xs" style={{ color: "var(--error)" }}>{error}</p>}
      </div>

      {puedeActualizar && (
        <Button variant="ghost" onClick={() => void iniciar()} disabled={sincronizando} className="shrink-0">
          <RefreshCw size={15} aria-hidden="true" className={sincronizando ? "animate-spin" : undefined} />
          {sincronizando ? "Actualizando…" : "Actualizar precios"}
        </Button>
      )}
    </section>
  )
}
