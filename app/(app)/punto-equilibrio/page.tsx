"use client"

import useSWR from "swr"
import { useState, useCallback, useEffect } from "react"
import {
  ArrowLeft, BarChart2, Plus, Trash2, Calculator, Download, TrendingUp,
  DollarSign, Package, Eye, Pencil, Printer, CheckCircle2,
} from "lucide-react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Card from "@/components/ui/Card"
import Table from "@/components/ui/Table"
import Modal from "@/components/ui/Modal"
import EmptyState from "@/components/ui/EmptyState"
import { RatioRow, COLOR_FIXED, COLOR_PROFIT } from "@/components/ui/RatioDonut"
import InfoStat from "@/components/ui/InfoStat"
import type { BreakEvenRecord, FixedCostItem } from "@/types/domain"
import { createBreakEven, getBreakEvenHistory, exportBreakEvenExcel } from "@/lib/api"
import { useHelpAvailable } from "@/hooks/useHelpAvailable"
import { usePermissions } from "@/hooks/usePermissions"
import ModuleLocked from "@/components/app/ModuleLocked"

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

function printRecord(record: BreakEvenRecord) {
  const rows = record.fixedCosts
    .map((c) => `<tr><td>${c.name}</td><td style="text-align:right">${formatCOP(c.amount)}</td></tr>`)
    .join("")
  const w = window.open("", "_blank")
  if (!w) return
  w.document.write(`
    <html><head><title>Punto de equilibrio — ${formatDate(record.createdAt)}</title>
    <style>
      body{font-family:system-ui,sans-serif;padding:24px;max-width:640px;margin:0 auto}
      h1{font-size:18px} p{color:#666;font-size:13px}
      table{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px}
      th,td{padding:8px 10px;border-bottom:1px solid #ddd;text-align:left}
      tfoot td{font-weight:bold;border-top:2px solid #333}
      .result{margin-top:20px;padding:16px;background:#F0F9FF;border-radius:8px}
      .result strong{font-size:20px}
    </style></head><body>
    <h1>Punto de equilibrio</h1>
    <p>Calculado el ${formatDate(record.createdAt)}</p>
    <table>
      <thead><tr><th>Costo fijo</th><th style="text-align:right">Monto</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td>Total costos fijos</td><td style="text-align:right">${formatCOP(record.totalFixedCosts)}</td></tr></tfoot>
    </table>
    <p>Precio de venta: <strong>${formatCOP(record.salePrice)}</strong> · Costo variable: <strong>${formatCOP(record.variableCost)}</strong></p>
    <div class="result">
      <p style="margin:0 0 4px">Necesitas vender</p>
      <strong>${record.breakEvenUnits.toLocaleString("es-CO", { maximumFractionDigits: 1 })} unidades</strong>
      <p style="margin:8px 0 0">Equivalen a ${formatCOP(record.breakEvenRevenue)} en ingresos.</p>
    </div>
    </body></html>`)
  w.document.close()
  w.print()
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

// ─── Skeleton de historial ────────────────────────────────────────────────────
function HistorySkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-xl animate-pulse" style={{ border: "1px solid var(--border-light)" }}>
      <div className="px-4 py-3 flex gap-4" style={{ background: "var(--bg-secondary)" }}>
        {[14, 16, 16, 16, 14, 16, 8].map((w, i) => (
          <div key={i} className="h-3 rounded" style={{ background: "var(--border-light)", width: `${w}%` }} />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="px-4 py-4 flex gap-4 items-center"
          style={{ borderTop: "1px solid var(--border-light)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-primary)" }}>
          {[14, 16, 16, 16, 14, 16].map((w, j) => (
            <div key={j} className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: `${w}%`, flexShrink: 0 }} />
          ))}
          <div className="flex gap-1 ml-auto">
            {[1, 2].map((j) => (
              <div key={j} className="h-7 w-7 rounded-lg" style={{ background: "var(--bg-secondary)" }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISTA DETALLE: nuevo cálculo (o reutilizar uno existente como base)
// ═══════════════════════════════════════════════════════════════════════════════
function DetailView({
  initialRecord,
  onBack,
  onSaved,
}: {
  initialRecord: BreakEvenRecord | null
  onBack: () => void
  onSaved: () => void
}) {
  const [fixedCosts, setFixedCosts] = useState<FixedCostItem[]>(
    initialRecord && initialRecord.fixedCosts.length > 0 ? initialRecord.fixedCosts : [{ name: "", amount: 0 }]
  )
  const [salePrice, setSalePrice] = useState<string>(initialRecord ? String(initialRecord.salePrice) : "")
  const [variableCost, setVariableCost] = useState<string>(initialRecord ? String(initialRecord.variableCost) : "")

  const [result, setResult] = useState<BreakEvenRecord | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [saved, setSaved] = useState(false)

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

  async function handleCalcular() {
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
      const res = await createBreakEven({ fixedCosts, salePrice: sp, variableCost: vc })
      setResult(res.data)
      setSaved(true)
      onSaved()
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar el cálculo.")
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={14} />
          Historial
        </button>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Nuevo cálculo
          </span>
          {initialRecord && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Partiendo del cálculo del {formatDate(initialRecord.createdAt)} — se guardará como uno nuevo
            </span>
          )}
        </div>
        {saved && (
          <span className="text-sm flex items-center gap-1.5 shrink-0" style={{ color: "#166534" }}>
            <CheckCircle2 size={14} />
            Cálculo guardado
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* ── Formulario (izquierda) ────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Costos fijos */}
          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  Costos Fijos Mensuales
                </h2>
                <button
                  onClick={addCost}
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: "var(--accent)", background: "var(--accent-light)" }}
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

              <div
                className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-semibold"
                style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}
              >
                <span>Total costos fijos</span>
                <span>{formatCOP(fixedCosts.reduce((s, c) => s + (c.amount || 0), 0))}</span>
              </div>
            </div>
          </Card>

          {/* Precio y costo variable */}
          <Card>
            <div className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Precio y Costo Variable
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {formError && (
            <div
              className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" }}
            >
              {formError}
            </div>
          )}

          <Button
            id="btn-calcular"
            variant="primary"
            size="lg"
            onClick={handleCalcular}
            loading={calculating}
            className="w-full"
          >
            <Calculator size={18} />
            Guardar cálculo
          </Button>
        </div>

        {/* ── Resultado (derecha) ────────────────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {result ? (
            <>
              <ResultCard
                icon={<Package size={14} />}
                label="Punto de equilibrio en unidades"
                value={`${result.breakEvenUnits.toLocaleString("es-CO", { maximumFractionDigits: 1 })} unidades`}
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

              <Card>
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
                  Desglose costos fijos
                </h3>
                <div className="flex flex-col gap-2">
                  {result.fixedCosts.map((c, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-secondary)" }}>{c.name}</span>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>{formatCOP(c.amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <div
              className="rounded-xl flex flex-col items-center justify-center gap-4 p-10 text-center h-full min-h-[340px]"
              style={{ border: "2px dashed var(--border-medium)", background: "var(--bg-surface)" }}
            >
              <div className="rounded-full p-4" style={{ background: "var(--accent-light)" }}>
                <Calculator size={32} style={{ color: "var(--accent)" }} />
              </div>
              <div>
                <p className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                  Sin resultado aún
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  Completa el formulario y presiona <strong>Guardar cálculo</strong> para ver tu punto de equilibrio.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
type PageView = "list" | "detail"

export default function PuntoEquilibrioPage() {
  useHelpAvailable()
  const { hasFeature, featureLockedMessage } = usePermissions()

  const { data: history = [], isLoading, error, mutate } = useSWR(
    "break-even-history",
    () => getBreakEvenHistory().then((r) => r.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  const [view, setView] = useState<PageView>("list")
  const [reuseRecord, setReuseRecord] = useState<BreakEvenRecord | null>(null)
  const [viewingRecord, setViewingRecord] = useState<BreakEvenRecord | null>(null)
  const [exporting, setExporting] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    function handleHelp() { setHelpOpen(true) }
    window.addEventListener("open-help", handleHelp)
    return () => window.removeEventListener("open-help", handleHelp)
  }, [])

  function openCreate() {
    setReuseRecord(null)
    setView("detail")
  }

  function openReuse(record: BreakEvenRecord) {
    setReuseRecord(record)
    setViewingRecord(null)
    setView("detail")
  }

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

  const historyColumns = [
    {
      key: "createdAt",
      header: "Fecha",
      render: (v: unknown) => (
        <span style={{ color: "var(--text-muted)" }} className="text-xs">{formatDate(v as string)}</span>
      ),
    },
    { key: "totalFixedCosts", header: "Costos Fijos", render: (v: unknown) => formatCOP(v as number) },
    { key: "salePrice", header: "Precio Venta", render: (v: unknown) => formatCOP(v as number) },
    { key: "variableCost", header: "Costo Variable", render: (v: unknown) => formatCOP(v as number) },
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
      render: (v: unknown) => <span className="font-semibold">{formatCOP(v as number)}</span>,
    },
    {
      key: "id",
      header: "",
      render: (_: unknown, row: Record<string, unknown>) => {
        const record = row as unknown as BreakEvenRecord
        return (
          <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewingRecord(record)}
              title="Ver cálculo"
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
              style={{ color: "var(--text-muted)" }}
            >
              <Eye size={14} />
            </button>
            <button
              onClick={() => openReuse(record)}
              title="Reutilizar como base para un nuevo cálculo"
              className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
              style={{ color: "var(--text-muted)" }}
            >
              <Pencil size={14} />
            </button>
          </div>
        )
      },
    },
  ]

  if (!hasFeature("module_breakEven")) {
    return <ModuleLocked message={featureLockedMessage("module_breakEven")} />
  }

  // ── Vista detalle ──
  if (view === "detail") {
    return (
      <DetailView
        initialRecord={reuseRecord}
        onBack={() => setView("list")}
        onSaved={() => void mutate()}
      />
    )
  }

  // ── Vista lista (historial) ──
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Punto de Equilibrio"
        subtitle="Calcula cuántas unidades necesitas vender para cubrir todos tus costos"
        action={
          <div className="flex gap-2">
            {history.length > 0 && (
              <Button variant="ghost" onClick={handleExport} loading={exporting} disabled={exporting}>
                <Download size={15} />
                Exportar Excel
              </Button>
            )}
            <Button variant="primary" onClick={openCreate}>
              <Plus size={15} />
              Nuevo cálculo
            </Button>
          </div>
        }
      />

      {isLoading && <HistorySkeleton />}

      {!isLoading && error && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p className="text-sm" style={{ color: "var(--text-muted)", marginBottom: "12px" }}>
            No se pudieron cargar los cálculos.
          </p>
          <Button variant="ghost" onClick={() => void mutate()}>Reintentar</Button>
        </div>
      )}

      {!isLoading && !error && history.length === 0 && (
        <EmptyState
          icon={<BarChart2 size={40} style={{ color: "var(--text-muted)" }} />}
          title="Aún no tienes cálculos"
          description="Descubre cuántas unidades necesitas vender cada mes para cubrir tus costos fijos y variables, y desde qué punto empiezas a ganar."
          action={
            <Button variant="primary" onClick={openCreate}>
              <Plus size={14} />
              Calcular tu primer punto de equilibrio
            </Button>
          }
        />
      )}

      {!isLoading && !error && history.length > 0 && (
        <Table
          columns={historyColumns}
          data={history as unknown as Record<string, unknown>[]}
          rowKey="id"
          onRowClick={(row) => setViewingRecord(row as unknown as BreakEvenRecord)}
        />
      )}

      {/* ── Modal: help ──────────────────────────────────────────────────── */}
      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Punto de Equilibrio">
        <div className="flex flex-col gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          <p>Esta seccion te permite calcular cuantas unidades necesitas vender para cubrir todos tus costos.</p>

          <div>
            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Funcionalidades:</p>
            <ul className="flex flex-col gap-2 ml-1">
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Costos fijos mensuales:</strong> Registra arriendo, nomina, servicios y otros costos fijos.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Precio de venta:</strong> Ingresa el precio promedio de tu producto o servicio.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Costo variable:</strong> Define el costo de materiales e insumos por unidad.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Guardar cálculo:</strong> Cada cálculo queda en tu historial, disponible para ver o reutilizar.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Historial:</strong> Consulta tus cálculos anteriores, e imprímelos o expórtalos a Excel.</span>
              </li>
            </ul>
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            <strong>Nota:</strong> El punto de equilibrio te indica cuantas unidades debes vender para no tener perdidas.
          </p>
        </div>
      </Modal>

      {/* ── Modal: ver cálculo (solo lectura) ────────────────────────────── */}
      <Modal
        open={!!viewingRecord}
        onClose={() => setViewingRecord(null)}
        title="Cálculo de punto de equilibrio"
        footer={
          <div className="flex items-center justify-between w-full gap-3">
            <Button variant="ghost" onClick={() => viewingRecord && printRecord(viewingRecord)}>
              <Printer size={14} />
              Imprimir
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setViewingRecord(null)}>Cerrar</Button>
              <Button variant="primary" onClick={() => viewingRecord && openReuse(viewingRecord)}>
                <Pencil size={14} />
                Reutilizar
              </Button>
            </div>
          </div>
        }
      >
        {viewingRecord && (
          <div className="flex flex-col gap-5">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Calculado el {formatDate(viewingRecord.createdAt)}
            </p>

            <Card>
              <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                UNIDADES PARA CUBRIR TUS COSTOS
              </p>
              <p className="font-display text-4xl font-bold tabular-nums mb-1" style={{ color: "var(--text-primary)", lineHeight: 1.1 }}>
                {viewingRecord.breakEvenUnits.toLocaleString("es-CO", { maximumFractionDigits: 1 })} uds.
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Equivalen a{" "}
                <strong style={{ color: "var(--text-secondary)" }}>{formatCOP(viewingRecord.breakEvenRevenue)}</strong>
                {" "}en ingresos.
              </p>

              <div className="mt-5 pt-4 flex flex-col gap-3" style={{ borderTop: "1px solid var(--border-light)" }}>
                <RatioRow
                  label="Costo variable"
                  color={COLOR_FIXED}
                  pct={(viewingRecord.variableCost / viewingRecord.salePrice) * 100}
                />
                <RatioRow
                  label="Margen de contribución"
                  color={COLOR_PROFIT}
                  pct={(viewingRecord.contributionMargin / viewingRecord.salePrice) * 100}
                />
              </div>
            </Card>

            <div>
              <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                DATOS DEL CÁLCULO
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoStat label="Precio de venta" value={formatCOP(viewingRecord.salePrice)} mono />
                <InfoStat label="Costo variable" value={formatCOP(viewingRecord.variableCost)} mono />
                <InfoStat label="Margen de contribución" value={formatCOP(viewingRecord.contributionMargin)} mono />
                <InfoStat label="Total costos fijos" value={formatCOP(viewingRecord.totalFixedCosts)} mono accent />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package size={14} style={{ color: "var(--text-muted)" }} />
                <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                  COSTOS FIJOS ({viewingRecord.fixedCosts.length})
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                {viewingRecord.fixedCosts.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm"
                    style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
                  >
                    <span style={{ color: "var(--text-primary)" }}>{c.name}</span>
                    <span className="tabular-nums font-mono font-medium" style={{ color: "var(--text-secondary)" }}>
                      {formatCOP(c.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
