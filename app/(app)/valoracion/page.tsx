"use client"

import { useEffect, useState, useCallback } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Table from "@/components/ui/Table"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import { ArrowLeft, Plus, TrendingUp, RotateCcw } from "lucide-react"
import type { Valuation, ValuationIndicator, ValuationRefType } from "@/types/domain"
import type { ValuationCreateResult } from "@/lib/api"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

// ─── Fórmulas (réplica exacta del backend) ────────────────────────────────────
function calcPricing(cost: number, pctMP: number, margin: number) {
  if (cost <= 0 || pctMP <= 0 || pctMP >= 100) return null
  const pct = pctMP / 100
  const withMargin = cost * (1 + margin / 100)
  const suggested = withMargin / pct
  const pctFixedCosts = ((1 - pct) / 1.8) * 100
  const pctProfit = (1 - (1 - pct) / 1.8 - pct) * 100
  const indicator: ValuationIndicator =
    pct < 0.32 ? "MUY BUENO" : pct > 0.37 ? "MALO" : "REGULAR"
  return { suggested, pctMateriaprima: pctMP, pctFixedCosts, pctProfit, indicator }
}

// ─── Indicador ────────────────────────────────────────────────────────────────
const IND: Record<ValuationIndicator, { color: string; bg: string; text: string; sublabel: string }> = {
  "MUY BUENO": { color: "#10B981", bg: "#ECFDF5", text: "#064E3B", sublabel: "Excelente rentabilidad" },
  "REGULAR":   { color: "#F59E0B", bg: "#FFFBEB", text: "#78350F", sublabel: "Margen moderado" },
  "MALO":      { color: "#EF4444", bg: "#FEF2F2", text: "#7F1D1D", sublabel: "Revisar estructura de costos" },
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ mp, fixed, profit, indicator }: {
  mp: number; fixed: number; profit: number; indicator: ValuationIndicator
}) {
  const r = 14
  const circ = 2 * Math.PI * r
  const gap = 1.5
  const sw = 6

  const arc = (pct: number) => Math.max(0, (pct / 100) * circ - gap)
  const base = -(circ / 4)
  const offMP     = base
  const offFixed  = base - (mp    / 100) * circ
  const offProfit = base - (mp    / 100) * circ - (fixed / 100) * circ

  const cfg = IND[indicator]

  return (
    <div className="relative" style={{ width: 200, height: 200 }}>
      <svg viewBox="0 0 36 36" width={200} height={200}>
        {/* Track */}
        <circle cx="18" cy="18" r={r} fill="none"
          stroke="var(--border-light)" strokeWidth={sw} />
        {/* Materia prima */}
        <circle cx="18" cy="18" r={r} fill="none" stroke="#3B82F6" strokeWidth={sw}
          strokeDasharray={`${arc(mp)} ${circ}`} strokeDashoffset={offMP}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        {/* Costos fijos */}
        <circle cx="18" cy="18" r={r} fill="none" stroke="#FB923C" strokeWidth={sw}
          strokeDasharray={`${arc(fixed)} ${circ}`} strokeDashoffset={offFixed}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        {/* Ganancia */}
        <circle cx="18" cy="18" r={r} fill="none" stroke="#10B981" strokeWidth={sw}
          strokeDasharray={`${arc(profit)} ${circ}`} strokeDashoffset={offProfit}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        {/* Centro — ganancia como métrica principal */}
        <text x="18" y="15" textAnchor="middle" fontFamily="system-ui,sans-serif"
          fill="var(--text-muted)" fontSize="2.6" fontWeight="500">
          GANANCIA
        </text>
        <text x="18" y="21.5" textAnchor="middle" fontFamily="system-ui,sans-serif"
          fill={cfg.color} fontSize="6.5" fontWeight="700"
          style={{ transition: "fill .35s ease" }}>
          {profit.toFixed(1)}%
        </text>
      </svg>
    </div>
  )
}

// ─── Barra de desglose ────────────────────────────────────────────────────────
function MetricRow({ label, color, pct }: { label: string; color: string; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span className="text-sm flex-1" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <div className="flex items-center gap-2" style={{ width: 120 }}>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--border-light)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color, transition: "width .45s ease" }}
          />
        </div>
        <span className="text-sm font-semibold tabular-nums" style={{ color, width: 38, textAlign: "right" }}>
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number | string) =>
  `$${parseFloat(String(v)).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const fmtPct = (v: number | string) => `${parseFloat(String(v)).toFixed(1)}%`

const refLabel = (r: ValuationRefType) =>
  r === "recipe" ? "Receta" : r === "menu" ? "Menú" : "Standalone"

// ─── Tipos locales ────────────────────────────────────────────────────────────
interface FormState {
  name: string
  refType: ValuationRefType
  costMateriaprima: string
  pctMateriaprima: string
  safetyMargin: string
  actualPrice: string
  notes: string
}

const EMPTY: FormState = {
  name: "",
  refType: "standalone",
  costMateriaprima: "",
  pctMateriaprima: "35",
  safetyMargin: "3",
  actualPrice: "",
  notes: "",
}

function fromValuation(v: Valuation): FormState {
  return {
    name: v.name,
    refType: v.refType,
    costMateriaprima: parseFloat(v.costMateriaprima).toString(),
    pctMateriaprima: parseFloat(v.pctMateriaprima).toString(),
    safetyMargin: parseFloat(v.safetyMargin).toString(),
    actualPrice: v.actualPrice ? parseFloat(v.actualPrice).toString() : "",
    notes: v.notes ?? "",
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISTA DETALLE / CREAR
// ═══════════════════════════════════════════════════════════════════════════════
function DetailView({
  initialForm,
  isNew,
  onBack,
  onSaved,
}: {
  initialForm: FormState
  isNew: boolean
  onBack: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(initialForm)
  // originalForm se fija al montar — nunca cambia, permite restaurar
  const [originalForm] = useState<FormState>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cost   = parseFloat(form.costMateriaprima) || 0
  const pctMP  = parseFloat(form.pctMateriaprima) || 0
  const margin = parseFloat(form.safetyMargin) || 3
  const preview = calcPricing(cost, pctMP, margin)
  const cfg = preview ? IND[preview.indicator] : null

  // ¿El usuario modificó algo respecto al original?
  const isDirty = JSON.stringify(form) !== JSON.stringify(originalForm)

  function f<K extends keyof FormState>(k: K, v: string) {
    setForm(p => ({ ...p, [k]: v }))
    setError(null)
  }

  async function handleSave() {
    if (!preview || !form.name.trim()) {
      setError("Completa el nombre y los parámetros antes de guardar.")
      return
    }
    setSaving(true)
    setError(null)
    const body: Record<string, unknown> = {
      name: form.name.trim(), refType: form.refType,
      costMateriaprima: cost, pctMateriaprima: pctMP, safetyMargin: margin,
    }
    if (form.actualPrice) body.actualPrice = parseFloat(form.actualPrice)
    if (form.notes.trim()) body.notes = form.notes.trim()
    try {
      const res = await fetch(`${API}/api/v1/valuations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(e.error ?? "Error al guardar")
      }
      await res.json() as { data: ValuationCreateResult }
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-0">

      {/* ── Barra superior ── */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={14} />
          Historial
        </button>

        {/* Nombre inline */}
        <input
          type="text"
          placeholder="Nombre del plato o producto..."
          value={form.name}
          onChange={(e) => f("name", e.target.value)}
          className="flex-1 bg-transparent text-lg font-semibold outline-none border-none"
          style={{ color: "var(--text-primary)" }}
        />

        <div className="flex items-center gap-3">
          {error && <span className="text-sm" style={{ color: "#EF4444" }}>{error}</span>}
          {/* Restaurar: solo cuando viene del historial y hay cambios */}
          {!isNew && isDirty && (
            <Button variant="ghost" onClick={() => { setForm(originalForm); setError(null) }}>
              <RotateCcw size={14} />
              Restaurar
            </Button>
          )}
          <Button
            variant="primary"
            loading={saving}
            disabled={!preview || !form.name.trim()}
            onClick={handleSave}
          >
            Guardar valoración
          </Button>
        </div>
      </div>

      {/* ── Contenido principal ── */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1.2fr" }}>

        {/* ── Columna izquierda: parámetros ── */}
        <div className="flex flex-col gap-4">
          <Card>
            <p className="text-xs font-semibold tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
              PARÁMETROS
            </p>
            <div className="flex flex-col gap-5">

              {/* Tipo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Tipo</label>
                <select
                  value={form.refType}
                  onChange={(e) => f("refType", e.target.value)}
                  className="h-10 w-full rounded-xl px-3 text-sm outline-none"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                >
                  <option value="standalone">Standalone</option>
                  <option value="recipe">Receta</option>
                  <option value="menu">Menú</option>
                </select>
              </div>

              <Input
                label="Costo materia prima (COP)"
                type="number" min="0"
                placeholder="Ej. 8500"
                value={form.costMateriaprima}
                onChange={(e) => f("costMateriaprima", e.target.value)}
                hint="Costo total de ingredientes por porción"
              />

              {/* Slider % MP — rediseñado */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    % Materia prima
                  </label>
                  <div className="flex items-center gap-2">
                    {preview && cfg && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.text, transition: "all 0.3s ease" }}
                      >
                        {preview.indicator}
                      </span>
                    )}
                    <span
                      className="text-base font-bold tabular-nums"
                      style={{
                        color: cfg?.color ?? "var(--text-muted)",
                        transition: "color 0.3s ease",
                        minWidth: 44,
                        textAlign: "right",
                      }}
                    >
                      {form.pctMateriaprima}%
                    </span>
                  </div>
                </div>

                {/* Slider con track de colores via CSS */}
                <input
                  type="range"
                  min="1"
                  max="99"
                  step="0.5"
                  value={form.pctMateriaprima}
                  onChange={(e) => f("pctMateriaprima", e.target.value)}
                  className="pct-slider w-full"
                  style={{ "--slider-thumb-color": cfg?.color ?? "#1B4FD8" } as React.CSSProperties}
                />

                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Verde &lt;32% · Amarillo 32–37% · Rojo &gt;37%
                </p>
              </div>

              <Input
                label="Margen de seguridad (%)"
                type="number" min="0" max="50"
                placeholder="3"
                value={form.safetyMargin}
                onChange={(e) => f("safetyMargin", e.target.value)}
                hint="Colchón para absorber variaciones de costo"
              />
            </div>
          </Card>

          {/* Sección opcional */}
          <Card>
            <p className="text-xs font-semibold tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
              OPCIONAL
            </p>
            <div className="flex flex-col gap-4">
              <Input
                label="Precio real de venta (COP)"
                type="number" min="0"
                placeholder="Ej. 28000"
                value={form.actualPrice}
                onChange={(e) => f("actualPrice", e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Notas</label>
                <textarea
                  rows={2} placeholder="Observaciones..."
                  value={form.notes}
                  onChange={(e) => f("notes", e.target.value)}
                  className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* ── Columna derecha: resultados en vivo ── */}
        {preview && cfg ? (
          <div className="flex flex-col gap-4">

            {/* Banner indicador */}
            <div
              className="rounded-xl px-4 py-3"
              style={{
                background: cfg.bg,
                border: `1px solid ${cfg.color}30`,
                transition: "background .4s ease",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: cfg.color, transition: "background .4s ease" }}
                  />
                  <span className="text-sm font-bold" style={{ color: cfg.text }}>
                    {preview.indicator}
                  </span>
                </div>
                <span className="text-xs" style={{ color: cfg.text, opacity: 0.75 }}>
                  {cfg.sublabel}
                </span>
              </div>
            </div>

            {/* Precio + Gráfica + Desglose — todo en un card */}
            <Card>
              {/* Precio sugerido */}
              <div className="mb-6">
                <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                  PRECIO SUGERIDO
                </p>
                <p
                  className="text-5xl font-bold tabular-nums"
                  style={{ color: "var(--text-primary)", lineHeight: 1.1 }}
                >
                  {fmt(preview.suggested)}
                </p>

                {form.actualPrice && parseFloat(form.actualPrice) > 0 && (() => {
                  const actual = parseFloat(form.actualPrice)
                  const diff = actual - preview.suggested
                  const pct = (diff / preview.suggested) * 100
                  const up = diff >= 0
                  return (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                        Precio real: <strong style={{ color: "var(--text-secondary)" }}>{fmt(actual)}</strong>
                      </span>
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: up ? "#ECFDF5" : "#FEF2F2",
                          color: up ? "#065F46" : "#7F1D1D",
                        }}
                      >
                        {up ? "+" : ""}{pct.toFixed(1)}% vs sugerido
                      </span>
                    </div>
                  )
                })()}
              </div>

              {/* Gráfica donut centrada */}
              <div className="flex justify-center mb-6">
                <DonutChart
                  mp={preview.pctMateriaprima}
                  fixed={preview.pctFixedCosts}
                  profit={preview.pctProfit}
                  indicator={preview.indicator}
                />
              </div>

              {/* Desglose */}
              <div className="flex flex-col gap-3">
                <MetricRow label="Materia prima" color="#3B82F6" pct={preview.pctMateriaprima} />
                <MetricRow label="Costos fijos"  color="#FB923C" pct={preview.pctFixedCosts} />
                <MetricRow label="Ganancia"       color="#10B981" pct={preview.pctProfit} />
              </div>

              {/* Costo con margen */}
              <div
                className="mt-5 pt-4 flex justify-between text-sm"
                style={{ borderTop: "1px solid var(--border-light)", color: "var(--text-muted)" }}
              >
                <span>Costo con margen de seguridad</span>
                <strong style={{ color: "var(--text-secondary)" }}>
                  {fmt(cost * (1 + margin / 100))}
                </strong>
              </div>
            </Card>
          </div>
        ) : (
          /* Estado vacío del panel de resultados */
          <Card>
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--bg-secondary)" }}
              >
                <TrendingUp size={24} style={{ color: "var(--text-muted)" }} />
              </div>
              <div>
                <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
                  Ingresa el costo y el % de materia prima
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

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
type PageView = "list" | "detail"

export default function ValoracionPage() {
  const [view, setView]   = useState<PageView>("list")
  const [initForm, setInitForm] = useState<FormState>(EMPTY)
  const [history, setHistory]   = useState<Valuation[]>([])
  const [loading, setLoading]   = useState(true)

  const loadHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/v1/valuations`, { credentials: "include" })
      const body = (await res.json()) as { data?: Valuation[] }
      setHistory(body.data ?? [])
    } catch {
      setHistory([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadHistory() }, [loadHistory])

  const [isNew, setIsNew] = useState(true)

  function openCreate() {
    setInitForm(EMPTY)
    setIsNew(true)
    setView("detail")
  }

  function openFromHistory(item: Valuation) {
    setInitForm(fromValuation(item))
    setIsNew(false)
    setView("detail")
  }

  function handleSaved() {
    setView("list")
    void loadHistory()
  }

  // ── Vista detalle ──
  if (view === "detail") {
    return (
      <DetailView
        initialForm={initForm}
        isNew={isNew}
        onBack={() => setView("list")}
        onSaved={handleSaved}
      />
    )
  }

  // ── Vista historial (principal) ──
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Valoración de Costos"
        subtitle="Calcula el precio sugerido basado en el costo de materia prima"
        action={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={15} />
            Nueva valoración
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : history.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--bg-secondary)" }}
          >
            <TrendingUp size={28} style={{ color: "var(--text-muted)" }} />
          </div>
          <div>
            <p className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              No hay valoraciones registradas
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Crea tu primera valoración para calcular el precio sugerido de un plato.
            </p>
          </div>
          <Button variant="ghost" onClick={openCreate}>
            <Plus size={14} />
            Crear primera valoración
          </Button>
        </div>
      ) : (
        /* Tabla historial */
        <Table
          columns={[
            {
              key: "name",
              label: "Nombre",
              render: (v) => (
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {v as string}
                </span>
              ),
            },
            {
              key: "indicator",
              label: "Indicador",
              render: (v) => {
                const ind = v as ValuationIndicator
                const c = IND[ind]
                return (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: c.bg, color: c.text }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                    {ind}
                  </span>
                )
              },
            },
            {
              key: "pctMateriaprima",
              label: "% MP",
              render: (v) => (
                <span className="tabular-nums text-sm" style={{ color: "var(--text-secondary)" }}>
                  {fmtPct(v as string)}
                </span>
              ),
            },
            {
              key: "suggestedPrice",
              label: "Precio sugerido",
              render: (v) => (
                <span className="font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {fmt(v as string)}
                </span>
              ),
            },
            {
              key: "actualPrice",
              label: "Precio real",
              render: (v) =>
                v ? (
                  <span className="tabular-nums text-sm" style={{ color: "var(--text-secondary)" }}>
                    {fmt(v as string)}
                  </span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>—</span>
                ),
            },
            {
              key: "refType",
              label: "Tipo",
              render: (v) => (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
                >
                  {refLabel(v as ValuationRefType)}
                </span>
              ),
            },
            {
              key: "createdAt",
              label: "Fecha",
              render: (v) => (
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {new Date(v as string).toLocaleDateString("es-CO", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </span>
              ),
            },
            {
              key: "id",
              label: "",
              render: (_, row) => (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openFromHistory(row as unknown as Valuation)}
                >
                  Recalcular
                </Button>
              ),
            },
          ]}
          data={history as unknown as Record<string, unknown>[]}
          rowKey="id"
        />
      )}
    </div>
  )
}
