"use client"

import { useState, useCallback } from "react"
import { BarChart2, Plus, Trash2, Calculator, Download, Clock, TrendingUp, DollarSign, Package } from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Card from "@/components/ui/Card"
import Table from "@/components/ui/Table"
import type { BreakEvenRecord, FixedCostItem } from "@/types/domain"
import { createBreakEven, getBreakEvenHistory, exportBreakEvenExcel } from "@/lib/api"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

// ─── Componente: fila de costo fijo ──────────────────────────────────────────
interface FixedCostRowProps {
  index: number
  item: FixedCostItem
  onChange: (index: number, field: keyof FixedCostItem, value: string | number) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

function FixedCostRow({ index, item, onChange, onRemove, canRemove }: FixedCostRowProps) {
  return (
    <div className="flex gap-3 items-end">
      <div className="flex-1">
        <Input
          label={index === 0 ? "Nombre del costo" : undefined}
          placeholder="Ej: Arriendo, Nómina, Servicios…"
          value={item.name}
          onChange={(e) => onChange(index, "name", e.target.value)}
        />
      </div>
      <div className="w-40">
        <Input
          label={index === 0 ? "Monto (COP)" : undefined}
          type="number"
          min={0}
          placeholder="0"
          value={item.amount === 0 ? "" : item.amount}
          onChange={(e) => onChange(index, "amount", parseFloat(e.target.value) || 0)}
        />
      </div>
      <button
        onClick={() => onRemove(index)}
        disabled={!canRemove}
        className="mb-0.5 h-10 w-10 flex items-center justify-center rounded-xl transition-colors disabled:opacity-30"
        style={{
          border: "1px solid var(--border-light)",
          background: "transparent",
          color: "var(--text-muted)",
        }}
        title="Eliminar costo"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

// ─── Componente: tarjeta de resultado ────────────────────────────────────────
interface ResultCardProps {
  icon: React.ReactNode
  label: string
  value: string
  accent?: boolean
}

function ResultCard({ icon, label, value, accent = false }: ResultCardProps) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-2"
      style={{
        background: accent ? "var(--accent)" : "var(--bg-surface)",
        border: accent ? "none" : "1px solid var(--border-light)",
      }}
    >
      <div
        className="flex items-center gap-2 text-sm font-medium"
        style={{ color: accent ? "rgba(255,255,255,0.8)" : "var(--text-muted)" }}
      >
        {icon}
        {label}
      </div>
      <p
        className="text-2xl font-bold"
        style={{ color: accent ? "#fff" : "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PuntoEquilibrioPage() {
  // ── Formulario ──────────────────────────────────────────────────────────────
  const [fixedCosts, setFixedCosts] = useState<FixedCostItem[]>([
    { name: "", amount: 0 },
  ])
  const [salePrice, setSalePrice] = useState<string>("")
  const [variableCost, setVariableCost] = useState<string>("")

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [result, setResult] = useState<BreakEvenRecord | null>(null)
  const [history, setHistory] = useState<BreakEvenRecord[] | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)

  // ── Manejo de costos fijos ──────────────────────────────────────────────────
  const handleCostChange = useCallback(
    (index: number, field: keyof FixedCostItem, value: string | number) => {
      setFixedCosts((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], [field]: value }
        return next
      })
    },
    []
  )

  const addCost = useCallback(() => {
    setFixedCosts((prev) => [...prev, { name: "", amount: 0 }])
  }, [])

  const removeCost = useCallback((index: number) => {
    setFixedCosts((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // ── Carga del historial ─────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const res = await getBreakEvenHistory()
      setHistory(res.data)
      setHistoryLoaded(true)
    } catch {
      setHistory([])
      setHistoryLoaded(true)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  // ── Calcular y guardar ──────────────────────────────────────────────────────
  const handleCalcular = async () => {
    setFormError(null)

    const sp = parseFloat(salePrice)
    const vc = parseFloat(variableCost)

    if (fixedCosts.some((c) => !c.name.trim() || c.amount < 0)) {
      setFormError("Todos los costos fijos deben tener nombre y monto válido.")
      return
    }
    if (!sp || sp <= 0) {
      setFormError("El precio de venta debe ser mayor a 0.")
      return
    }
    if (isNaN(vc) || vc < 0) {
      setFormError("El costo variable no puede ser negativo.")
      return
    }
    if (sp <= vc) {
      setFormError("El precio de venta debe ser mayor al costo variable.")
      return
    }

    setCalculating(true)
    try {
      const res = await createBreakEven({
        fixedCosts,
        salePrice: sp,
        variableCost: vc,
      })
      setResult(res.data)
      // Refrescar historial si ya está visible
      if (historyLoaded) {
        setHistory((prev) => (prev ? [res.data, ...prev] : [res.data]))
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Error al guardar el cálculo."
      )
    } finally {
      setCalculating(false)
    }
  }

  // ── Exportar Excel ──────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportBreakEvenExcel()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `punto-equilibrio-${Date.now()}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert("No se pudo exportar el historial.")
    } finally {
      setExporting(false)
    }
  }

  // ── Columnas del historial ──────────────────────────────────────────────────
  const historyColumns = [
    {
      key: "createdAt",
      header: "Fecha",
      render: (v: unknown) => (
        <span style={{ color: "var(--text-muted)" }} className="text-xs">
          {formatDate(v as string)}
        </span>
      ),
    },
    {
      key: "totalFixedCosts",
      header: "Costos Fijos",
      render: (v: unknown) => formatCOP(v as number),
    },
    {
      key: "salePrice",
      header: "Precio Venta",
      render: (v: unknown) => formatCOP(v as number),
    },
    {
      key: "variableCost",
      header: "Costo Variable",
      render: (v: unknown) => formatCOP(v as number),
    },
    {
      key: "breakEvenUnits",
      header: "PE Unidades",
      render: (v: unknown) => (
        <span className="font-semibold" style={{ color: "var(--accent)" }}>
          {(v as number).toLocaleString("es-CO", { maximumFractionDigits: 1 })} uds.
        </span>
      ),
    },
    {
      key: "breakEvenRevenue",
      header: "PE Ingresos (COP)",
      render: (v: unknown) => (
        <span className="font-semibold">{formatCOP(v as number)}</span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Punto de Equilibrio"
        subtitle="Calcula cuántas unidades necesitas vender para cubrir todos tus costos"
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            loading={exporting}
            disabled={exporting}
            id="btn-exportar-excel"
          >
            <Download size={16} />
            Exportar Excel
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Formulario (izquierda) ────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Costos fijos */}
          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2
                  className="text-sm font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  Costos Fijos Mensuales
                </h2>
                <button
                  onClick={addCost}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    color: "var(--accent)",
                    background: "var(--accent-light)",
                  }}
                >
                  <Plus size={14} />
                  Agregar
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {fixedCosts.map((item, i) => (
                  <FixedCostRow
                    key={i}
                    index={i}
                    item={item}
                    onChange={handleCostChange}
                    onRemove={removeCost}
                    canRemove={fixedCosts.length > 1}
                  />
                ))}
              </div>

              {/* Total costos fijos */}
              <div
                className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-semibold"
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)",
                }}
              >
                <span>Total costos fijos</span>
                <span>
                  {formatCOP(fixedCosts.reduce((s, c) => s + (c.amount || 0), 0))}
                </span>
              </div>
            </div>
          </Card>

          {/* Precio y costo variable */}
          <Card>
            <div className="flex flex-col gap-4">
              <h2
                className="text-sm font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}
              >
                Precio y Costo Variable
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="input-precio-venta"
                  label="Precio de venta (COP)"
                  type="number"
                  min={0}
                  placeholder="Ej: 25000"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  hint="Precio promedio de tu producto o servicio"
                />
                <Input
                  id="input-costo-variable"
                  label="Costo variable unitario (COP)"
                  type="number"
                  min={0}
                  placeholder="Ej: 8000"
                  value={variableCost}
                  onChange={(e) => setVariableCost(e.target.value)}
                  hint="Costo de materiales e insumos por unidad"
                />
              </div>
            </div>
          </Card>

          {/* Error */}
          {formError && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#B91C1C",
              }}
            >
              {formError}
            </div>
          )}

          {/* Botón calcular */}
          <Button
            id="btn-calcular"
            variant="primary"
            size="lg"
            onClick={handleCalcular}
            loading={calculating}
            className="w-full"
          >
            <Calculator size={18} />
            Calcular y Guardar
          </Button>
        </div>

        {/* ── Resultado (derecha) ────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {result ? (
            <>
              <div
                className="rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
                style={{
                  background: "#ECFDF5",
                  color: "#065F46",
                  border: "1px solid #A7F3D0",
                }}
              >
                <TrendingUp size={14} />
                Resultado guardado automáticamente ✓
              </div>

              <ResultCard
                icon={<Package size={14} />}
                label="Punto de equilibrio en unidades"
                value={`${result.breakEvenUnits.toLocaleString("es-CO", {
                  maximumFractionDigits: 1,
                })} unidades`}
                accent
              />

              <ResultCard
                icon={<DollarSign size={14} />}
                label="Punto de equilibrio en ingresos"
                value={formatCOP(result.breakEvenRevenue)}
              />

              <ResultCard
                icon={<TrendingUp size={14} />}
                label="Margen de contribución unitario"
                value={formatCOP(result.contributionMargin)}
              />

              <ResultCard
                icon={<BarChart2 size={14} />}
                label="Total costos fijos"
                value={formatCOP(result.totalFixedCosts)}
              />

              {/* Desglose costos fijos */}
              <Card>
                <h3
                  className="text-xs font-semibold uppercase tracking-wide mb-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  Desglose costos fijos
                </h3>
                <div className="flex flex-col gap-2">
                  {result.fixedCosts.map((c, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-secondary)" }}>{c.name}</span>
                      <span
                        className="font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {formatCOP(c.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <div
              className="rounded-xl flex flex-col items-center justify-center gap-4 p-10 text-center h-full min-h-[340px]"
              style={{
                border: "2px dashed var(--border-medium)",
                background: "var(--bg-surface)",
              }}
            >
              <div
                className="rounded-full p-4"
                style={{ background: "var(--accent-light)" }}
              >
                <Calculator size={32} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p
                  className="font-semibold text-base"
                  style={{ color: "var(--text-primary)" }}
                >
                  Sin resultado aún
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Completa el formulario y presiona{" "}
                  <strong>Calcular y Guardar</strong> para ver tu punto de
                  equilibrio.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Historial ──────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2
            className="flex items-center gap-2 text-base font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            <Clock size={18} style={{ color: "var(--text-muted)" }} />
            Historial de cálculos
          </h2>

          {!historyLoaded && (
            <Button
              id="btn-ver-historial"
              variant="ghost"
              size="sm"
              onClick={loadHistory}
              loading={loadingHistory}
            >
              Ver historial
            </Button>
          )}
        </div>

        {historyLoaded && (
          <>
            {history && history.length > 0 ? (
              <Table
                columns={historyColumns}
                data={history as unknown as Record<string, unknown>[]}
                rowKey="id"
              />
            ) : (
              <div
                className="rounded-xl px-6 py-10 text-center text-sm"
                style={{
                  border: "1px solid var(--border-light)",
                  background: "var(--bg-surface)",
                  color: "var(--text-muted)",
                }}
              >
                No hay cálculos guardados aún. ¡Realiza tu primer cálculo!
              </div>
            )}
          </>
        )}

        {!historyLoaded && (
          <div
            className="rounded-xl px-6 py-8 text-center text-sm"
            style={{
              border: "1px dashed var(--border-light)",
              color: "var(--text-muted)",
            }}
          >
            Presiona <strong>Ver historial</strong> para cargar tus cálculos
            anteriores.
          </div>
        )}
      </section>
    </div>
  )
}
