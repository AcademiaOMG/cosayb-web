"use client"

import useSWR from "swr"
import { useCallback, useEffect, useMemo, useState } from "react"
import SearchableSelect from "@/components/ui/SearchableSelect"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Table from "@/components/ui/Table"
import {
  ArrowLeft, CheckCircle2, Plus, Trash2, UtensilsCrossed, ChefHat, Users, TrendingUp, Loader2, CalendarDays, Pencil,
} from "lucide-react"
import type { Menu, Recipe, CostoMenuResult, MenuIndicator } from "@/types/domain"
import {
  getMenus, getMenuById, createMenu, updateMenu, deleteMenu,
  getRecipes, getRecipeCost,
} from "@/lib/api"
import type { CreateMenuPayload } from "@/lib/api"

// ─── Fórmulas (réplica exacta del backend calcularCostoMenu) ─────────────────
interface RecetaCalculo {
  cantidadGramos: number
  costoGramo: number
}

function calcularCosto(
  recetas: RecetaCalculo[],
  numPersonas: number,
  margenSeguridad: number,
  pctMateriaPrima: number
): CostoMenuResult | null {
  if (recetas.length === 0 || numPersonas <= 0 || pctMateriaPrima <= 0) return null
  const pctMP = pctMateriaPrima / 100
  const margin = margenSeguridad / 100

  const costoTotalPorcion = recetas.reduce(
    (s, r) => s + r.cantidadGramos * r.costoGramo, 0
  )
  const costoTotalPersonas = costoTotalPorcion * numPersonas
  const margenAplicadoPorcion = costoTotalPorcion * margin
  const costoConMargenPorcion = costoTotalPorcion + margenAplicadoPorcion
  const costoConMargenPersonas = costoConMargenPorcion * numPersonas
  const precioPotencialVentaPorcion = costoConMargenPorcion / pctMP
  const precioPotencialVentaTotal = precioPotencialVentaPorcion * numPersonas
  const pctCostosFijos = ((1 - pctMP) / 1.8) * 100
  const pctGanancia = (1 - (1 - pctMP) / 1.8 - pctMP) * 100
  const indicator: MenuIndicator =
    pctMP < 0.32 ? "MUY_BUENO" : pctMP > 0.37 ? "MALO" : "REGULAR"

  return {
    recetas: recetas.map((r) => ({
      recipeId: "", nombre: "", ...r,
      costoPorcionEnMenu: r.cantidadGramos * r.costoGramo,
      costoTotalEnMenu: r.cantidadGramos * r.costoGramo * numPersonas,
    })),
    costoTotalPorcion, costoTotalPersonas, margenAplicadoPorcion,
    costoConMargenPorcion, costoConMargenPersonas,
    precioPotencialVentaPorcion, precioPotencialVentaTotal,
    pctCostosFijos, pctGanancia, indicator,
  }
}

// ─── Indicador ────────────────────────────────────────────────────────────────
const IND: Record<MenuIndicator, { color: string; bg: string; text: string; label: string; sublabel: string }> = {
  MUY_BUENO: { color: "#10B981", bg: "#ECFDF5", text: "#064E3B", label: "MUY BUENO", sublabel: "Excelente rentabilidad" },
  REGULAR:   { color: "#F59E0B", bg: "#FFFBEB", text: "#78350F", label: "REGULAR",   sublabel: "Margen moderado" },
  MALO:      { color: "#EF4444", bg: "#FEF2F2", text: "#7F1D1D", label: "MALO",      sublabel: "Revisar estructura de costos" },
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ mp, fixed, profit, indicator }: {
  mp: number; fixed: number; profit: number; indicator: MenuIndicator
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
    <div className="relative" style={{ width: 180, height: 180 }}>
      <svg viewBox="0 0 36 36" width={180} height={180}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--border-light)" strokeWidth={sw} />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#3B82F6" strokeWidth={sw}
          strokeDasharray={`${arc(mp)} ${circ}`} strokeDashoffset={offMP}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#FB923C" strokeWidth={sw}
          strokeDasharray={`${arc(fixed)} ${circ}`} strokeDashoffset={offFixed}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        <circle cx="18" cy="18" r={r} fill="none" stroke="#10B981" strokeWidth={sw}
          strokeDasharray={`${arc(profit)} ${circ}`} strokeDashoffset={offProfit}
          style={{ transition: "stroke-dasharray .45s ease, stroke-dashoffset .45s ease" }} />
        <text x="18" y="15" textAnchor="middle" fontFamily="system-ui,sans-serif"
          fill="var(--text-muted)" fontSize="2.4" fontWeight="500">GANANCIA</text>
        <text x="18" y="21.5" textAnchor="middle" fontFamily="system-ui,sans-serif"
          fill={cfg.color} fontSize="6" fontWeight="700"
          style={{ transition: "fill .35s ease" }}>
          {profit.toFixed(1)}%
        </text>
      </svg>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  `$${v.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })

// ─── % Materia Prima: persistencia local ──────────────────────────────────────
function getStoredPctMP(fallback: string): string {
  if (typeof window === "undefined") return fallback
  return localStorage.getItem("cosayb_pct_mp") ?? fallback
}
function savePctMP(value: string) {
  if (typeof window !== "undefined") localStorage.setItem("cosayb_pct_mp", value)
}

function MetricRow({ label, color, pct }: { label: string; color: string; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
      <span className="text-sm flex-1" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <div className="flex items-center gap-2" style={{ width: 110 }}>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--border-light)" }}>
          <div className="h-full rounded-full"
            style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color, transition: "width .45s ease" }} />
        </div>
        <span className="text-sm font-semibold tabular-nums" style={{ color, width: 38, textAlign: "right" }}>
          {pct.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

// ─── Estado local de ítems de receta en el formulario ─────────────────────────
interface RecipeLineItem {
  uid: string
  recipeId: string
  nombre: string
  cantidadGramos: string
  costoGramo: number | null  // null = sin peso por porción definido o cargando
  costoLoading: boolean
  orden: number
}

function newLineItem(uid: string, orden: number): RecipeLineItem {
  return { uid, recipeId: "", nombre: "", cantidadGramos: "200", costoGramo: null, costoLoading: false, orden }
}

// ─── Vista de panel de costos ─────────────────────────────────────────────────
function CostoPanel({
  costo, numPersonas, pctMP,
}: {
  costo: CostoMenuResult
  numPersonas: number
  pctMP: number
}) {
  const cfg = IND[costo.indicator]
  return (
    <div className="flex flex-col gap-4">
      {/* Indicador */}
      <div className="rounded-xl px-4 py-3"
        style={{ background: cfg.bg, border: `1px solid ${cfg.color}30`, transition: "background .4s ease" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full" style={{ background: cfg.color, transition: "background .4s ease" }} />
            <span className="text-sm font-bold" style={{ color: cfg.text }}>{cfg.label}</span>
          </div>
          <span className="text-xs" style={{ color: cfg.text, opacity: 0.75 }}>{cfg.sublabel}</span>
        </div>
      </div>

      {/* Precio sugerido */}
      <Card>
        <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: "var(--text-muted)" }}>
          PRECIO SUGERIDO / PORCIÓN
        </p>
        <p className="text-4xl font-bold tabular-nums mb-1" style={{ color: "var(--text-primary)", lineHeight: 1.1 }}>
          {fmt(costo.precioPotencialVentaPorcion)}
        </p>
        {numPersonas > 1 && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Total {numPersonas} personas:{" "}
            <strong style={{ color: "var(--text-secondary)" }}>
              {fmt(costo.precioPotencialVentaTotal)}
            </strong>
          </p>
        )}

        <div className="flex justify-center my-5">
          <DonutChart mp={pctMP} fixed={costo.pctCostosFijos} profit={costo.pctGanancia} indicator={costo.indicator} />
        </div>

        <div className="flex flex-col gap-3">
          <MetricRow label="Materia prima" color="#3B82F6" pct={pctMP} />
          <MetricRow label="Costos fijos"  color="#FB923C" pct={costo.pctCostosFijos} />
          <MetricRow label="Ganancia"       color="#10B981" pct={costo.pctGanancia} />
        </div>

        <div className="mt-5 pt-4 flex flex-col gap-2"
          style={{ borderTop: "1px solid var(--border-light)" }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-muted)" }}>Costo por porción</span>
            <strong style={{ color: "var(--text-secondary)" }}>{fmt(costo.costoTotalPorcion)}</strong>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-muted)" }}>Con margen</span>
            <strong style={{ color: "var(--text-secondary)" }}>{fmt(costo.costoConMargenPorcion)}</strong>
          </div>
          {numPersonas > 1 && (
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-muted)" }}>Costo total ({numPersonas} pers.)</span>
              <strong style={{ color: "var(--text-secondary)" }}>{fmt(costo.costoTotalPersonas)}</strong>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISTA DETALLE / CREAR
// ═══════════════════════════════════════════════════════════════════════════════
function DetailView({
  menu,
  availableRecipes,
  onBack,
  onSaved,
}: {
  menu: Menu | null
  availableRecipes: Recipe[]
  onBack: () => void
  onSaved: () => void
}) {
  const isNew = menu === null

  const [nombre, setNombre] = useState(menu?.nombre ?? "")
  const [fecha, setFecha] = useState(menu?.fecha ?? new Date().toISOString().slice(0, 10))
  const [numPersonas, setNumPersonas] = useState(String(menu?.numPersonas ?? 10))
  const [margenSeguridad, setMargenSeguridad] = useState(
    menu ? String(parseFloat(menu.margenSeguridad)) : "5"
  )
  const [pctMateriaPrima, setPctMateriaPrima] = useState(
    menu ? String(parseFloat(menu.pctMateriaPrima)) : getStoredPctMP("31")
  )
  const [notas, setNotas] = useState(menu?.notas ?? "")
  const [lineItems, setLineItems] = useState<RecipeLineItem[]>(() => {
    if (!menu) return []
    return menu.recetas.map((mr, i) => {
      const recipe = availableRecipes.find((r) => r.id === mr.recipeId)
      return {
        uid: mr.id,
        recipeId: mr.recipeId,
        nombre: recipe?.name ?? mr.recipeId,
        cantidadGramos: String(parseFloat(mr.cantidadGramos)),
        costoGramo: null,
        costoLoading: true,
        orden: i,
      }
    })
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const recipeOptions = useMemo(
    () => availableRecipes.map((r) => ({ value: r.id, label: r.name })),
    [availableRecipes],
  )

  const pctMP   = parseFloat(pctMateriaPrima) || 0
  const nPers   = parseInt(numPersonas) || 0
  const margin  = parseFloat(margenSeguridad) || 0

  // Fetch cost for a recipe when selected
  const fetchRecipeCost = useCallback(async (uid: string, recipeId: string) => {
    setLineItems((prev) =>
      prev.map((item) =>
        item.uid === uid ? { ...item, costoLoading: true } : item
      )
    )
    try {
      const res = await getRecipeCost(recipeId)
      const costoGramo = res.data.costPerGram  // null if no servingWeightG defined
      setLineItems((prev) =>
        prev.map((item) =>
          item.uid === uid ? { ...item, costoGramo, costoLoading: false } : item
        )
      )
    } catch {
      setLineItems((prev) =>
        prev.map((item) =>
          item.uid === uid ? { ...item, costoGramo: null, costoLoading: false } : item
        )
      )
    }
  }, [])

  // On mount: fetch costs for existing menu items
  useEffect(() => {
    lineItems.forEach((item) => {
      if (item.recipeId && item.costoLoading) {
        void fetchRecipeCost(item.uid, item.recipeId)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validItems = lineItems.filter(
    (r) => r.recipeId && r.costoGramo !== null && parseFloat(r.cantidadGramos) > 0
  )
  const costo = calcularCosto(
    validItems.map((r) => ({ cantidadGramos: parseFloat(r.cantidadGramos), costoGramo: r.costoGramo! })),
    nPers, margin, pctMP
  )

  const cfg = costo ? IND[costo.indicator] : null
  const sliderThumbColor = cfg?.color ?? "#1B4FD8"

  function addLineItem() {
    const uid = `new-${Date.now()}`
    setLineItems((prev) => [...prev, newLineItem(uid, prev.length)])
  }

  function removeLineItem(uid: string) {
    setLineItems((prev) => prev.filter((r) => r.uid !== uid))
  }

  function selectRecipe(uid: string, recipeId: string) {
    const recipe = availableRecipes.find((r) => r.id === recipeId)
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.uid !== uid) return item
        return {
          ...item,
          recipeId,
          nombre: recipe?.name ?? "",
          costoGramo: null,
          costoLoading: !!recipeId,
        }
      })
    )
    if (recipeId) void fetchRecipeCost(uid, recipeId)
  }

  function updateGrams(uid: string, value: string) {
    setLineItems((prev) =>
      prev.map((item) => item.uid === uid ? { ...item, cantidadGramos: value } : item)
    )
  }

  async function handleSave() {
    if (!nombre.trim()) { setError("El nombre del menú es obligatorio"); return }
    if (validItems.length === 0) { setError("Agrega al menos una receta con peso por porción definido"); return }
    setSaving(true)
    setError(null)
    const payload: CreateMenuPayload = {
      nombre: nombre.trim(),
      fecha,
      numPersonas: parseInt(numPersonas),
      margenSeguridad: parseFloat(margenSeguridad),
      pctMateriaPrima: parseFloat(pctMateriaPrima),
      notas: notas.trim() || undefined,
      recetas: validItems.map((r, i) => ({
        recipeId: r.recipeId,
        cantidadGramos: parseFloat(r.cantidadGramos),
        orden: i,
      })),
    }
    try {
      if (isNew) {
        await createMenu(payload)
      } else {
        await updateMenu(menu!.id, payload)
      }
      savePctMP(pctMateriaPrima)
      setSuccess(true)
      setTimeout(() => onSaved(), 1000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar")
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
          Menús
        </button>

        <input
          type="text"
          placeholder="Nombre del menú..."
          value={nombre}
          onChange={(e) => { setNombre(e.target.value); setError(null) }}
          className="flex-1 bg-transparent text-lg font-semibold outline-none border-none"
          style={{ color: "var(--text-primary)" }}
        />

        <div className="flex items-center gap-3">
          {error && <span className="text-sm" style={{ color: "#EF4444" }}>{error}</span>}
          {success && (
            <span className="text-sm flex items-center gap-1.5" style={{ color: "#166534" }}>
              <CheckCircle2 size={14} />
              Guardado
            </span>
          )}
          <Button
            variant="primary"
            loading={saving}
            disabled={!nombre.trim() || validItems.length === 0 || success}
            onClick={handleSave}
          >
            {isNew ? "Crear menú" : "Guardar cambios"}
          </Button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1.1fr" }}>

        {/* ── Columna izquierda: parámetros + recetas ── */}
        <div className="flex flex-col gap-4">

          {/* Parámetros */}
          <Card>
            <p className="text-xs font-semibold tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
              PARÁMETROS
            </p>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Fecha del evento"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
                <Input
                  label="N° de personas"
                  type="number"
                  min="1"
                  value={numPersonas}
                  onChange={(e) => setNumPersonas(e.target.value)}
                />
              </div>

              {/* Slider % MP */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    % Materia prima
                  </label>
                  <div className="flex items-center gap-2">
                    {cfg && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.text, transition: "all 0.3s ease" }}>
                        {cfg.label}
                      </span>
                    )}
                    <span className="text-base font-bold tabular-nums"
                      style={{ color: cfg?.color ?? "var(--text-muted)", transition: "color 0.3s ease", minWidth: 44, textAlign: "right" }}>
                      {pctMateriaPrima}%
                    </span>
                  </div>
                </div>
                <input
                  type="range" min="1" max="99" step="0.5"
                  value={pctMateriaPrima}
                  onChange={(e) => setPctMateriaPrima(e.target.value)}
                  className="pct-slider w-full"
                  style={{ "--slider-thumb-color": sliderThumbColor } as React.CSSProperties}
                />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Verde &lt;32% · Amarillo 32–37% · Rojo &gt;37%
                </p>
              </div>

              <Input
                label="Margen de seguridad (%)"
                type="number" min="0" max="50"
                placeholder="5"
                value={margenSeguridad}
                onChange={(e) => setMargenSeguridad(e.target.value)}
                hint="Colchón para absorber variaciones de costo"
              />
            </div>
          </Card>

          {/* Recetas del menú */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                RECETAS DEL MENÚ
              </p>
              <button
                onClick={addLineItem}
                className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--text-accent, #1B4FD8)" }}
              >
                <Plus size={12} />
                Agregar
              </button>
            </div>

            {lineItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <ChefHat size={28} style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Sin recetas aún. Haz clic en "Agregar" para sumar la primera.
                </p>
                {availableRecipes.length === 0 && (
                  <p className="text-xs px-4" style={{ color: "var(--text-muted)" }}>
                    Tip: crea tus recetas en la sección Recetas primero.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {lineItems.map((item) => {
                  const costoPorcion = item.costoGramo !== null
                    ? parseFloat(item.cantidadGramos) * item.costoGramo
                    : null
                  return (
                    <div key={item.uid} className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: "var(--bg-secondary)" }}>
                      {/* Selector de receta */}
                      <div className="flex-1 min-w-0">
                        {availableRecipes.length > 0 ? (
                          <SearchableSelect
                            options={recipeOptions}
                            value={item.recipeId}
                            onChange={(val) => selectRecipe(item.uid, val)}
                            placeholder="— Seleccionar receta —"
                            emptyMessage="No se encontraron recetas"
                            ariaLabel="Receta"
                          />
                        ) : (
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                            No hay recetas. Crea una en la sección Recetas.
                          </span>
                        )}
                      </div>

                      {/* Cantidad */}
                      <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                        <input
                          type="number" min="1" step="10"
                          value={item.cantidadGramos}
                          onChange={(e) => updateGrams(item.uid, e.target.value)}
                          className="text-sm tabular-nums outline-none text-right bg-transparent"
                          style={{ width: 56, color: "var(--text-primary)" }}
                        />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>g</span>
                      </div>

                      {/* Costo calculado o spinner */}
                      <div style={{ minWidth: 60, textAlign: "right", flexShrink: 0 }}>
                        {item.costoLoading ? (
                          <Loader2 size={12} style={{ color: "var(--text-muted)", display: "inline" }}
                            className="animate-spin" />
                        ) : item.costoGramo === null && item.recipeId ? (
                          <span className="text-xs" style={{ color: "#F59E0B" }} title="Esta receta no tiene peso por porción definido. Edítala en Recetas para poder incluirla en el cálculo.">
                            Sin peso ⚠
                          </span>
                        ) : costoPorcion !== null && costoPorcion > 0 ? (
                          <span className="text-xs tabular-nums font-medium" style={{ color: "var(--text-muted)" }}>
                            {fmt(costoPorcion)}
                          </span>
                        ) : null}
                      </div>

                      {/* Borrar */}
                      <button
                        onClick={() => removeLineItem(item.uid)}
                        className="transition-opacity hover:opacity-70"
                        style={{ color: "var(--text-muted)", flexShrink: 0 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}

                {/* Total */}
                {costo && (
                  <div className="flex justify-between pt-2 mt-1 text-sm font-semibold"
                    style={{ borderTop: "1px solid var(--border-light)", color: "var(--text-primary)" }}>
                    <span>Total por porción</span>
                    <span className="tabular-nums">{fmt(costo.costoTotalPorcion)}</span>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Notas opcionales */}
          <Card>
            <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
              NOTAS
            </p>
            <textarea
              rows={2} placeholder="Observaciones del menú..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 text-sm outline-none resize-none"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
          </Card>
        </div>

        {/* ── Columna derecha: análisis en vivo ── */}
        {costo ? (
          <CostoPanel costo={costo} numPersonas={nPers} pctMP={pctMP} />
        ) : (
          <Card>
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--bg-secondary)" }}>
                <TrendingUp size={24} style={{ color: "var(--text-muted)" }} />
              </div>
              <div>
                <p className="font-medium" style={{ color: "var(--text-secondary)" }}>
                  Agrega recetas con gramos y configuración
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  El análisis de costo aparecerá aquí en tiempo real
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
// TARJETA DE MENÚ (vista lista)
// ═══════════════════════════════════════════════════════════════════════════════
function MenuCard({ menu, onClick, onDelete }: {
  menu: Menu
  onClick: () => void
  onDelete: () => void
}) {
  const pctMP = parseFloat(menu.pctMateriaPrima)
  const ind: MenuIndicator = pctMP < 32 ? "MUY_BUENO" : pctMP > 37 ? "MALO" : "REGULAR"
  const cfg = IND[ind]
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div
      className="rounded-2xl p-4 cursor-pointer transition-shadow hover:shadow-md flex flex-col gap-3"
      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base truncate" style={{ color: "var(--text-primary)" }}>
            {menu.nombre}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {fmtDate(menu.fecha)}
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
          style={{ background: cfg.bg, color: cfg.text }}>
          {cfg.label}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm" style={{ color: "var(--text-muted)" }}>
        <div className="flex items-center gap-1.5">
          <Users size={13} />
          <span>{menu.numPersonas} personas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ChefHat size={13} />
          <span>{menu.recetas.length} receta{menu.recetas.length !== 1 ? "s" : ""}</span>
        </div>
        <span className="ml-auto text-xs">{pctMP}% MP</span>
      </div>

      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
        {confirmDelete ? (
          <>
            <span className="text-xs self-center" style={{ color: "var(--text-muted)" }}>¿Eliminar?</span>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button variant="ghost" size="sm" onClick={onDelete}
              style={{ color: "#EF4444" }}>Confirmar</Button>
          </>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Tabla de menús ───────────────────────────────────────────────────────────
function MenuTable({
  menus,
  onEdit,
  onDelete,
}: {
  menus: Menu[]
  onEdit: (m: Menu) => void
  onDelete: (id: string) => void
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  return (
    <Table
      rowKey="id"
      data={menus as unknown as Record<string, unknown>[]}
      columns={[
        {
          key: "nombre",
          label: "Nombre",
          render: (v) => (
            <span className="font-medium" style={{ color: "var(--text-primary)" }}>{v as string}</span>
          ),
        },
        {
          key: "fecha",
          label: "Fecha evento",
          render: (v) => (
            <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <CalendarDays size={13} style={{ color: "var(--text-muted)" }} />
              {fmtDate(v as string)}
            </div>
          ),
        },
        {
          key: "numPersonas",
          label: "Personas",
          render: (v) => (
            <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <Users size={13} style={{ color: "var(--text-muted)" }} />
              {String(v)}
            </div>
          ),
        },
        {
          key: "recetas",
          label: "Recetas",
          render: (v) => {
            const arr = v as Menu["recetas"]
            return (
              <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <ChefHat size={13} style={{ color: "var(--text-muted)" }} />
                {arr.length}
              </div>
            )
          },
        },
        {
          key: "pctMateriaPrima",
          label: "% MP",
          render: (v) => (
            <span className="tabular-nums text-sm" style={{ color: "var(--text-secondary)" }}>
              {parseFloat(v as string).toFixed(0)}%
            </span>
          ),
        },
        {
          key: "pctMateriaPrima",
          label: "Indicador",
          render: (v) => {
            const pct = parseFloat(v as string)
            const ind: MenuIndicator = pct < 32 ? "MUY_BUENO" : pct > 37 ? "MALO" : "REGULAR"
            const cfg = IND[ind]
            return (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: cfg.bg, color: cfg.text }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                {cfg.label}
              </span>
            )
          },
        },
        {
          key: "id",
          label: "",
          render: (v, row) => {
            const menu = row as unknown as Menu
            const id = v as string
            return (
              <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                {confirmId === id ? (
                  <>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>¿Eliminar?</span>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>Cancelar</Button>
                    <Button variant="ghost" size="sm" onClick={() => { onDelete(id); setConfirmId(null) }}
                      style={{ color: "#EF4444" }}>Confirmar</Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(menu)}>
                      <Pencil size={13} />
                      Editar
                    </Button>
                    <button
                      onClick={() => setConfirmId(id)}
                      className="transition-opacity hover:opacity-70"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            )
          },
        },
      ]}
    />
  )
}

// ─── Skeleton de tabla ────────────────────────────────────────────────────────
function MenuListSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-xl animate-pulse" style={{ border: "1px solid var(--border-light)" }}>
      <div className="px-4 py-3 flex gap-4" style={{ background: "var(--bg-secondary)" }}>
        {[20, 12, 10, 8, 14, 12, 10].map((w, i) => (
          <div key={i} className="h-3 rounded" style={{ background: "var(--border-light)", width: `${w}%` }} />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="px-4 py-4 flex gap-4 items-center"
          style={{ borderTop: "1px solid var(--border-light)", background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-primary)" }}>
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "20%" }} />
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "12%" }} />
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "10%" }} />
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "8%" }} />
          <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "14%" }} />
          <div className="h-6 rounded-full" style={{ background: "var(--bg-secondary)", width: "12%" }} />
          <div className="h-7 rounded-lg ml-auto" style={{ background: "var(--bg-secondary)", width: 80 }} />
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
type PageView = "list" | "detail"

export default function MenuPage() {
  const { data: menus = [], isLoading: menusLoading, mutate: mutateMenus } = useSWR(
    "menus",
    () => getMenus().then((r) => r.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  const { data: availableRecipes = [] } = useSWR(
    "recipes",
    () => getRecipes().then((r) => r.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  const [view, setView] = useState<PageView>("list")
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)

  async function openEdit(menu: Menu) {
    try {
      const res = await getMenuById(menu.id)
      setEditingMenu(res.data)
    } catch {
      setEditingMenu(menu)
    }
    setView("detail")
  }

  function openCreate() {
    setEditingMenu(null)
    setView("detail")
  }

  async function handleDelete(id: string) {
    try {
      await deleteMenu(id)
      await mutateMenus()
    } catch {
      // silencioso
    }
  }

  async function handleSaved() {
    await mutateMenus()
    setView("list")
  }

  // ── Vista detalle ──
  if (view === "detail") {
    return (
      <DetailView
        menu={editingMenu}
        availableRecipes={availableRecipes}
        onBack={() => setView("list")}
        onSaved={handleSaved}
      />
    )
  }

  // ── Vista lista ──
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Menús"
        subtitle="Para eventos y servicios: agrupa platos, define gramos por porción y calcula el precio por persona"
        action={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={15} />
            Nuevo menú
          </Button>
        }
      />

      {menusLoading ? (
        <MenuListSkeleton />
      ) : menus.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--bg-secondary)" }}>
            <UtensilsCrossed size={28} style={{ color: "var(--text-muted)" }} />
          </div>
          <div>
            <p className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              No hay menús creados
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Úsalo para planear eventos o servicios: agrupa platos, define porciones y obtén el precio ideal por persona.
            </p>
          </div>
          <Button variant="ghost" onClick={openCreate}>
            <Plus size={14} />
            Crear primer menú
          </Button>
        </div>
      ) : (
        <MenuTable
          menus={menus}
          onEdit={(m) => openEdit(m)}
          onDelete={(id) => handleDelete(id)}
        />
      )}
    </div>
  )
}
