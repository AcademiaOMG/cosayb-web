"use client"

import useSWR from "swr"
import { useState, useEffect, useCallback } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Table from "@/components/ui/Table"
import SearchableSelect from "@/components/ui/SearchableSelect"
import Modal from "@/components/ui/Modal"
import { ArrowLeft, CheckCircle2, Plus, Calculator, RotateCcw } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { useHelpAvailable } from "@/hooks/useHelpAvailable"
import type { Valuation, ValuationIndicator, ValuationRefType, Recipe } from "@/types/domain"
import { getValuations, createValuation, getRecipes, getRecipeCost } from "@/lib/api"
import type { ValuationCreateResult, CreateValuationPayload } from "@/lib/api"

// ─── Fórmulas ─────────────────────────────────────────────────────────────────
const PCT_IMPUESTOS = 5  // impuestos de ley — fijo igual que Excel COSTOALAMINUTA
const PCT_OTROS     = 5  // otros costos — fijo igual que Excel COSTOALAMINUTA

function calcPricing(cost: number, pctMP: number, margin: number) {
  if (cost <= 0 || pctMP <= 0 || pctMP >= 100) return null
  const pct = pctMP / 100
  const withMargin = cost * (1 + margin / 100)
  const suggested = withMargin / pct
  const pctFixedCosts = ((1 - pct) / 1.8) * 100
  const pctProfit = Math.max(0, (1 - (1 - pct) / 1.8 - pct) * 100 - PCT_IMPUESTOS - PCT_OTROS)
  const indicator: ValuationIndicator =
    pct < 0.32 ? "MUY BUENO" : pct > 0.37 ? "MALO" : "REGULAR"
  return { suggested, pctMateriaprima: pctMP, pctFixedCosts, pctProfit, pctImpuestos: PCT_IMPUESTOS, pctOtros: PCT_OTROS, indicator }
}

// ─── Indicador ────────────────────────────────────────────────────────────────
const IND: Record<ValuationIndicator, { color: string; bg: string; text: string; sublabel: string }> = {
  "MUY BUENO": { color: "#10B981", bg: "#ECFDF5", text: "#064E3B", sublabel: "Excelente rentabilidad" },
  "REGULAR":   { color: "#F59E0B", bg: "#FFFBEB", text: "#78350F", sublabel: "Margen moderado" },
  "MALO":      { color: "#EF4444", bg: "#FEF2F2", text: "#7F1D1D", sublabel: "Revisar estructura de costos" },
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ mp, fixed, taxes, others, profit, indicator }: {
  mp: number; fixed: number; taxes: number; others: number; profit: number; indicator: ValuationIndicator
}) {
  const r = 14
  const circ = 2 * Math.PI * r
  const gap = 1.5
  const sw = 6

  const arc = (pct: number) => Math.max(0, (pct / 100) * circ - gap)
  const base = -(circ / 4)
  const offMP     = base
  const offFixed  = base - (mp     / 100) * circ
  const offTaxes  = base - (mp     / 100) * circ - (fixed  / 100) * circ
  const offOthers = base - (mp     / 100) * circ - (fixed  / 100) * circ - (taxes  / 100) * circ
  const offProfit = base - (mp     / 100) * circ - (fixed  / 100) * circ - (taxes  / 100) * circ - (others / 100) * circ

  const cfg = IND[indicator]

  return (
    <div className="relative" style={{ width: 200, height: 200 }}>
      <svg viewBox="0 0 36 36" width={200} height={200}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--border-light)" strokeWidth={sw} />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#3B82F6" strokeWidth={sw}
          strokeDasharray={`${arc(mp)} ${circ}`} strokeDashoffset={offMP}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#FB923C" strokeWidth={sw}
          strokeDasharray={`${arc(fixed)} ${circ}`} strokeDashoffset={offFixed}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#A78BFA" strokeWidth={sw}
          strokeDasharray={`${arc(taxes)} ${circ}`} strokeDashoffset={offTaxes}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#94A3B8" strokeWidth={sw}
          strokeDasharray={`${arc(others)} ${circ}`} strokeDashoffset={offOthers}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#10B981" strokeWidth={sw}
          strokeDasharray={`${arc(profit)} ${circ}`} strokeDashoffset={offProfit}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        <text x="18" y="15" textAnchor="middle" fontFamily="system-ui,sans-serif"
          fill="var(--text-muted)" fontSize="2.6" fontWeight="500">GANANCIA</text>
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
  r === "recipe" ? "Receta" : r === "menu" ? "Menú" : "Independiente"

// ─── Skeleton de historial ────────────────────────────────────────────────────
function HistorySkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-xl animate-pulse" style={{ border: "1px solid var(--border-light)" }}>
      <div className="px-4 py-3 flex gap-4" style={{ background: "var(--bg-secondary)" }}>
        {[24, 16, 8, 12, 16, 12, 10, 12].map((pct, i) => (
          <div key={i} className="h-3 rounded"
            style={{ background: "var(--border-light)", width: `${pct}%`, flexShrink: 0 }} />
        ))}
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="px-4 py-4 flex gap-4 items-center"
          style={{ borderTop: "1px solid var(--border-light)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-primary)" }}>
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "24%", flexShrink: 0 }} />
          <div className="h-5 rounded-full" style={{ background: "var(--bg-secondary)", width: "16%", flexShrink: 0 }} />
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "8%", flexShrink: 0 }} />
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "12%", flexShrink: 0 }} />
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "16%", flexShrink: 0 }} />
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "12%", flexShrink: 0 }} />
          <div className="h-5 rounded-full" style={{ background: "var(--bg-secondary)", width: "10%", flexShrink: 0 }} />
          <div className="h-7 rounded-lg ml-auto" style={{ background: "var(--bg-secondary)", width: 160, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  )
}

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

// ─── % Materia Prima: persistencia local ──────────────────────────────────────
function getStoredPctMP(fallback: string): string {
  if (typeof window === "undefined") return fallback
  return localStorage.getItem("cosayb_pct_mp") ?? fallback
}
function savePctMP(value: string) {
  if (typeof window !== "undefined") localStorage.setItem("cosayb_pct_mp", value)
}
function emptyForm(): FormState {
  return { ...EMPTY, pctMateriaprima: getStoredPctMP("35") }
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
  sourceValuationName,
  availableRecipes,
  onBack,
  onSaved,
}: {
  initialForm: FormState
  isNew: boolean
  sourceValuationName?: string
  availableRecipes: Recipe[]
  onBack: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [originalForm] = useState<FormState>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // ── Selector de receta ────────────────────────────────────────────────────
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("")
  const [recipeLoading, setRecipeLoading] = useState(false)

  const recipeOptions = availableRecipes.map((r) => ({ value: r.id, label: r.name }))

  const handleRecipeSelect = useCallback(async (recipeId: string) => {
    setSelectedRecipeId(recipeId)
    if (!recipeId) {
      setForm((prev) => ({ ...prev, refType: "standalone" }))
      return
    }
    setRecipeLoading(true)
    try {
      const res = await getRecipeCost(recipeId)
      if (res.data?.rawCostPerServing != null) {
        setForm((prev) => ({ ...prev, costMateriaprima: String(Math.round(res.data.rawCostPerServing)), refType: "recipe" }))
        setError(null)
      }
    } catch {
      // el usuario puede seguir ingresando el costo manualmente
    } finally {
      setRecipeLoading(false)
    }
  }, [])

  const cost   = parseFloat(form.costMateriaprima) || 0
  const pctMP  = parseFloat(form.pctMateriaprima) || 0
  const margin = parseFloat(form.safetyMargin) || 3
  const preview = calcPricing(cost, pctMP, margin)
  const cfg = preview ? IND[preview.indicator] : null

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
    const payload: CreateValuationPayload = {
      name: form.name.trim(),
      refType: form.refType,
      costMateriaprima: cost,
      pctMateriaprima: pctMP,
      safetyMargin: margin,
    }
    if (form.actualPrice) payload.actualPrice = parseFloat(form.actualPrice)
    if (form.notes.trim()) payload.notes = form.notes.trim()
    try {
      await createValuation(payload)
      savePctMP(form.pctMateriaprima)
      setSuccess(true)
      setTimeout(() => onSaved(), 1000)
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

        <div className="flex flex-col flex-1 min-w-0">
          <input
            type="text"
            placeholder="Nombre del plato o producto..."
            value={form.name}
            onChange={(e) => f("name", e.target.value)}
            className="bg-transparent text-lg font-semibold outline-none border-none"
            style={{ color: "var(--text-primary)" }}
          />
          {!isNew && sourceValuationName && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Copia de «{sourceValuationName}» — se guardará como nueva valoración
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {error && <span className="text-sm" style={{ color: "#EF4444" }}>{error}</span>}
          {success && (
            <span className="text-sm flex items-center gap-1.5" style={{ color: "#166534" }}>
              <CheckCircle2 size={14} />
              Guardado
            </span>
          )}
          {isNew && isDirty && !success && (
            <Button variant="ghost" onClick={() => { setForm(originalForm); setError(null) }}>
              <RotateCcw size={14} />
              Restaurar
            </Button>
          )}
          <Button
            variant="primary"
            loading={saving}
            disabled={!preview || !form.name.trim() || success}
            onClick={handleSave}
          >
            {isNew ? "Guardar valoración" : "Guardar como nueva valoración"}
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

              {/* Selector de receta */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  Cargar desde una receta <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(opcional)</span>
                </label>
                <SearchableSelect
                  options={recipeOptions}
                  value={selectedRecipeId}
                  onChange={handleRecipeSelect}
                  placeholder="— Seleccionar receta —"
                  emptyMessage="No se encontraron recetas"
                  ariaLabel="Receta para autocompleto de costo"
                />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {recipeLoading
                    ? "Calculando costo de la receta…"
                    : "Selecciona una receta y el costo se llena solo"}
                </p>
              </div>

              <Input
                label="Costo de ingredientes por porción (COP)"
                type="number" min="0"
                placeholder="Ej. 8.500"
                value={form.costMateriaprima}
                onChange={(e) => f("costMateriaprima", e.target.value)}
                hint="¿Cuánto te cuestan los ingredientes de una sola porción?"
              />

              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    % del precio que son ingredientes
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
                  Ej. si el plato cuesta $8.000 en ingredientes y lo vendes a $25.000, el % es 32% — Ideal &lt;32%
                </p>
              </div>

              <Input
                label="Margen de seguridad (%)"
                type="number" min="0" max="50"
                placeholder="3"
                value={form.safetyMargin}
                onChange={(e) => f("safetyMargin", e.target.value)}
                hint="Colchón ante subidas de precio en ingredientes. Recomendado: 3–5%"
              />
            </div>
          </Card>

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
                  <div className="w-2 h-2 rounded-full" style={{ background: cfg.color, transition: "background .4s ease" }} />
                  <span className="text-sm font-bold" style={{ color: cfg.text }}>
                    {preview.indicator}
                  </span>
                </div>
                <span className="text-xs" style={{ color: cfg.text, opacity: 0.75 }}>
                  {cfg.sublabel}
                </span>
              </div>
            </div>

            <Card>
              <div className="mb-6">
                <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
                  PRECIO SUGERIDO DE VENTA
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

              <div className="flex justify-center mb-6">
                <DonutChart
                  mp={preview.pctMateriaprima}
                  fixed={preview.pctFixedCosts}
                  taxes={preview.pctImpuestos}
                  others={preview.pctOtros}
                  profit={preview.pctProfit}
                  indicator={preview.indicator}
                />
              </div>

              <div className="flex flex-col gap-3">
                <MetricRow label="Materia prima"    color="#3B82F6" pct={preview.pctMateriaprima} />
                <MetricRow label="Costos fijos"     color="#FB923C" pct={preview.pctFixedCosts} />
                <MetricRow label="Impuestos de ley" color="#A78BFA" pct={preview.pctImpuestos} />
                <MetricRow label="Otros"            color="#94A3B8" pct={preview.pctOtros} />
                <MetricRow label="Ganancia neta"    color="#10B981" pct={preview.pctProfit} />
              </div>

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
          <Card>
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--bg-secondary)" }}
              >
                <Calculator size={24} style={{ color: "var(--text-muted)" }} />
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
  useHelpAvailable()
  const { can } = usePermissions()
  const { data: history = [], isLoading, mutate } = useSWR(
    "valuations",
    () => getValuations().then((r) => r.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  const { data: availableRecipes = [] } = useSWR(
    "recipes",
    () => getRecipes(undefined, "all", 1, 100).then((r) => r.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  const [view, setView]               = useState<PageView>("list")
  const [initForm, setInitForm]       = useState<FormState>(EMPTY)
  const [isNew, setIsNew]             = useState(true)
  const [sourceName, setSourceName]   = useState<string | undefined>(undefined)
  const [helpOpen, setHelpOpen]       = useState(false)

  useEffect(() => {
    function handleHelp() { setHelpOpen(true) }
    window.addEventListener("open-help", handleHelp)
    return () => window.removeEventListener("open-help", handleHelp)
  }, [])

  function openCreate() {
    setInitForm(emptyForm())
    setIsNew(true)
    setSourceName(undefined)
    setView("detail")
  }

  function openFromHistory(item: Valuation) {
    setInitForm(fromValuation(item))
    setIsNew(false)
    setSourceName(item.name)
    setView("detail")
  }

  async function handleSaved() {
    await mutate()
    setView("list")
  }

  // ── Vista detalle ──
  if (view === "detail") {
    return (
      <DetailView
        initialForm={initForm}
        isNew={isNew}
        sourceValuationName={sourceName}
        availableRecipes={availableRecipes}
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
        subtitle="Fija el precio de venta de un plato a partir de su costo de ingredientes por porción"
        action={
          can("valuations", "create") ? (
            <Button variant="primary" onClick={openCreate}>
              <Plus size={15} />
              Nueva valoración
            </Button>
          ) : undefined
        }
      />

      {isLoading && <HistorySkeleton />}

      {!isLoading && history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--bg-secondary)" }}
          >
            <Calculator size={28} style={{ color: "var(--text-muted)" }} />
          </div>
          <div>
            <p className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              No hay valoraciones registradas
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Úsalo para fijar el precio de venta de cualquier plato a partir de su costo de materia prima.
            </p>
          </div>
          {can("valuations", "create") && (
            <Button variant="ghost" onClick={openCreate}>
              <Plus size={14} />
              Crear primera valoración
            </Button>
          )}
        </div>
      )}

      {!isLoading && history.length > 0 && (
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
              key: "costMateriaprima",
              label: "Costo MP",
              render: (v) => (
                <span className="tabular-nums text-sm" style={{ color: "var(--text-secondary)" }}>
                  {fmt(v as string)}
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
                  Nuevo análisis desde este
                </Button>
              ),
            },
          ]}
          data={history as unknown as Record<string, unknown>[]}
          rowKey="id"
        />
      )}

      {/* ── Modal: help ──────────────────────────────────────────────────── */}
      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Valoración de Costos"
      >
        <div className="flex flex-col gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          <p>Esta seccion te permite fijar el precio de venta de un plato a partir de su costo de ingredientes.</p>

          <div>
            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Funcionalidades:</p>
            <ul className="flex flex-col gap-2 ml-1">
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Crear valoracion:</strong> Haz clic en Nueva valoracion para analizar la rentabilidad de un plato.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Cargar desde receta:</strong> Selecciona una receta existente y el costo se llena automaticamente.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Definir % Materia Prima:</strong> Establece que porcentaje del precio final son ingredientes.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Margen de seguridad:</strong> Agrega un colchon del 3-5% ante subidas de precios.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Analisis en tiempo real:</strong> Visualiza el precio sugerido, desglose de costos e indicador de rentabilidad.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Comparar precios:</strong> Ingresa el precio real de venta para comparar con el sugerido.</span>
              </li>
            </ul>
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            <strong>Nota:</strong> El indicador MUY BUENO significa que el plato es altamente rentable (menos del 32% son ingredientes).
          </p>
        </div>
      </Modal>
    </div>
  )
}
