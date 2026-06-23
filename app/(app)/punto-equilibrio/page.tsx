"use client"

import { useState, useEffect, useMemo } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { BarChart2, Plus, Trash2, AlertCircle } from "lucide-react"

interface CostoFijo {
  id: string
  nombre: string
  monto: string
}

const STORAGE_KEY = "cosayb_pe_data"

function loadFromStorage() {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveToStorage(data: object) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}

const DEFAULT_COSTOS: CostoFijo[] = [
  { id: "1", nombre: "Arriendo", monto: "" },
  { id: "2", nombre: "Nómina / Sueldos", monto: "" },
  { id: "3", nombre: "Servicios públicos", monto: "" },
  { id: "4", nombre: "Agua", monto: "" },
  { id: "5", nombre: "Energía eléctrica", monto: "" },
  { id: "6", nombre: "Gas", monto: "" },
  { id: "7", nombre: "Teléfono / Internet", monto: "" },
  { id: "8", nombre: "Marketing digital", monto: "" },
  { id: "9", nombre: "Impuestos", monto: "" },
  { id: "10", nombre: "Otros", monto: "" },
]

const fmt = (v: number) =>
  `$${v.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function PuntoEquilibrioPage() {
  const [costosFijos, setCostosFijos] = useState<CostoFijo[]>(DEFAULT_COSTOS)
  const [precioVenta, setPrecioVenta] = useState("")
  const [costoVariable, setCostoVariable] = useState("")

  useEffect(() => {
    const saved = loadFromStorage()
    if (saved) {
      if (saved.costosFijos) setCostosFijos(saved.costosFijos)
      if (saved.precioVenta) setPrecioVenta(saved.precioVenta)
      if (saved.costoVariable) setCostoVariable(saved.costoVariable)
    }
  }, [])

  useEffect(() => {
    saveToStorage({ costosFijos, precioVenta, costoVariable })
  }, [costosFijos, precioVenta, costoVariable])

  const totalCostosFijos = useMemo(() =>
    costosFijos.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0),
  [costosFijos])

  const precio = parseFloat(precioVenta) || 0
  const costoVar = parseFloat(costoVariable) || 0
  const margenContribucion = precio - costoVar
  const hasError = precio > 0 && costoVar > 0 && margenContribucion <= 0
  const puntoEquilibrio = margenContribucion > 0 && totalCostosFijos > 0
    ? Math.ceil(totalCostosFijos / margenContribucion)
    : null
  const ingresoNecesario = puntoEquilibrio != null ? puntoEquilibrio * precio : null
  const unidadesDia = puntoEquilibrio != null ? Math.ceil(puntoEquilibrio / 22) : null
  const pctMargen = precio > 0 ? (margenContribucion / precio) * 100 : 0

  function addCostoFijo() {
    setCostosFijos(prev => [...prev, { id: Date.now().toString(), nombre: "", monto: "" }])
  }

  function removeCostoFijo(id: string) {
    setCostosFijos(prev => prev.filter(c => c.id !== id))
  }

  function updateCostoFijo(id: string, field: "nombre" | "monto", value: string) {
    setCostosFijos(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const canCalculate = totalCostosFijos > 0 && precio > 0 && costoVar > 0

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Punto de Equilibrio"
        subtitle="Cuántas unidades necesitas vender al mes para cubrir todos tus costos"
      />

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1.1fr" }}>

        {/* ── Izquierda: inputs ── */}
        <div className="flex flex-col gap-4">

          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                COSTOS FIJOS MENSUALES
              </p>
              <button
                onClick={addCostoFijo}
                className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--accent, #1B4FD8)" }}
              >
                <Plus size={12} /> Agregar
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {costosFijos.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nombre (ej. Arriendo)"
                    value={c.nombre}
                    onChange={e => updateCostoFijo(c.id, "nombre", e.target.value)}
                    className="flex-1 h-9 rounded-lg px-3 text-sm outline-none"
                    style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                  />
                  <input
                    type="number"
                    placeholder="COP"
                    value={c.monto}
                    onChange={e => updateCostoFijo(c.id, "monto", e.target.value)}
                    className="h-9 rounded-lg px-3 text-sm outline-none text-right"
                    style={{ width: 110, background: "var(--bg-surface)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                  />
                  {costosFijos.length > 1 && (
                    <button
                      onClick={() => removeCostoFijo(c.id)}
                      className="transition-opacity hover:opacity-70"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {totalCostosFijos > 0 && (
                <div
                  className="flex justify-between pt-2 mt-1 text-sm font-semibold"
                  style={{ borderTop: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                >
                  <span>Total costos fijos</span>
                  <span className="tabular-nums">{fmt(totalCostosFijos)}</span>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <p className="text-xs font-semibold tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
              POR UNIDAD VENDIDA
            </p>
            <div className="flex flex-col gap-4">
              <Input
                label="Precio de venta promedio (COP)"
                type="number"
                min="0"
                placeholder="Ej. 25000"
                value={precioVenta}
                onChange={e => setPrecioVenta(e.target.value)}
                hint="Precio al que vendes un plato o producto"
              />
              <Input
                label="Costo variable por unidad (COP)"
                type="number"
                min="0"
                placeholder="Ej. 8000"
                value={costoVariable}
                onChange={e => setCostoVariable(e.target.value)}
                hint="Ingredientes, empaque y otros costos directos por plato"
              />
            </div>

            {hasError && (
              <div
                className="flex items-center gap-2 mt-3 p-3 rounded-lg"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B42020" }}
              >
                <AlertCircle size={14} />
                <p className="text-xs">El costo variable supera el precio de venta — revisa los valores.</p>
              </div>
            )}
          </Card>
        </div>

        {/* ── Derecha: resultados ── */}
        {canCalculate && !hasError && puntoEquilibrio != null ? (
          <div className="flex flex-col gap-4">
            <Card>
              <p className="text-xs font-semibold tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
                RESULTADOS
              </p>

              <div className="flex flex-col gap-5">
                <div className="flex items-end gap-8">
                  <div>
                    <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Debes vender al mes</p>
                    <p className="text-5xl font-bold tabular-nums" style={{ color: "var(--text-primary)", lineHeight: 1.1 }}>
                      {puntoEquilibrio.toLocaleString("es-CO")}
                    </p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>unidades / mes</p>
                  </div>
                  <div className="pb-1">
                    <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Por día (22 días)</p>
                    <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--text-secondary)", lineHeight: 1.1 }}>
                      {unidadesDia!.toLocaleString("es-CO")}
                    </p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>unidades / día</p>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: 16 }}>
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-muted)" }}>Ingresos necesarios</span>
                      <strong className="tabular-nums" style={{ color: "var(--text-primary)" }}>
                        {fmt(ingresoNecesario!)}
                      </strong>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-muted)" }}>Margen de contribución</span>
                      <strong className="tabular-nums" style={{ color: "var(--text-primary)" }}>
                        {fmt(margenContribucion)} / unidad
                      </strong>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-muted)" }}>% Margen de contribución</span>
                      <strong
                        className="tabular-nums"
                        style={{ color: pctMargen >= 50 ? "#10B981" : pctMargen >= 30 ? "#F59E0B" : "#EF4444" }}
                      >
                        {pctMargen.toFixed(1)}%
                      </strong>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-muted)" }}>Total costos fijos</span>
                      <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>
                        {fmt(totalCostosFijos)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>Margen de contribución</span>
                    <span>{pctMargen.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--border-light)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(pctMargen, 100)}%`,
                        background: pctMargen >= 50 ? "#10B981" : pctMargen >= 30 ? "#F59E0B" : "#EF4444",
                        transition: "width 0.45s ease",
                      }}
                    />
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Ideal &gt;50% · Aceptable 30–50% · Crítico &lt;30%
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--bg-secondary)" }}
              >
                <BarChart2 size={24} style={{ color: "var(--text-muted)" }} />
              </div>
              <div>
                <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
                  Ingresa tus costos fijos, precio de venta y costo variable
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  El análisis aparecerá aquí en tiempo real
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
