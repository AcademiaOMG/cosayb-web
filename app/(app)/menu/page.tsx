"use client"

import { useEffect, useState, useCallback } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import {
  ArrowLeft, Plus, Trash2, UtensilsCrossed, ChefHat, Users, TrendingUp,
} from "lucide-react"
import type { Menu, Receta, CostoMenuResult, MenuIndicator } from "@/types/domain"
import {
  getMenus, getMenuById, createMenu, updateMenu, deleteMenu, getRecetas,
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
      recetaId: "", nombre: "", ...r,
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
interface RecetaItem {
  uid: string
  recetaId: string
  nombre: string
  cantidadGramos: string
  costoGramo: number    // costoPorPorcion / pesoTotalGramos
  orden: number
}

function newItem(uid: string, orden: number): RecetaItem {
  return { uid, recetaId: "", nombre: "", cantidadGramos: "200", costoGramo: 0, orden }
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

        {/* Gráfica */}
        <div className="flex justify-center my-5">
          <DonutChart
            mp={pctMP}
            fixed={costo.pctCostosFijos}
            profit={costo.pctGanancia}
            indicator={costo.indicator}
          />
        </div>

        <div className="flex flex-col gap-3">
          <MetricRow label="Materia prima" color="#3B82F6" pct={pctMP} />
          <MetricRow label="Costos fijos"  color="#FB923C" pct={costo.pctCostosFijos} />
          <MetricRow label="Ganancia"       color="#10B981" pct={costo.pctGanancia} />
        </div>

        {/* Desglose de costos */}
        <div className="mt-5 pt-4 flex flex-col gap-2"
          style={{ borderTop: "1px solid var(--border-light)" }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-muted)" }}>Costo por porción</span>
            <strong style={{ color: "var(--text-secondary)" }}>{fmt(costo.costoTotalPorcion)}</strong>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: "var(--text-muted)" }}>Con margen ({parseFloat(String(costo.margenAplicadoPorcion / costo.costoTotalPorcion * 100 || 0)).toFixed(0)}%)</span>
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
  availableRecetas,
  onBack,
  onSaved,
}: {
  menu: Menu | null
  availableRecetas: Receta[]
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
    menu ? String(parseFloat(menu.pctMateriaPrima)) : "31"
  )
  const [notas, setNotas] = useState(menu?.notas ?? "")
  const [recetaItems, setRecetaItems] = useState<RecetaItem[]>(() => {
    if (!menu) return []
    return menu.recetas.map((mr, i) => {
      const r = availableRecetas.find((ar) => ar.id === mr.recetaId)
      const cg = r
        ? parseFloat(r.costoPorPorcion) / Math.max(parseFloat(r.pesoTotalGramos), 1)
        : 0
      return {
        uid: mr.id,
        recetaId: mr.recetaId,
        nombre: r?.nombre ?? mr.recetaId,
        cantidadGramos: String(parseFloat(mr.cantidadGramos)),
        costoGramo: cg,
        orden: i,
      }
    })
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pctMP   = parseFloat(pctMateriaPrima) || 0
  const nPers   = parseInt(numPersonas) || 0
  const margin  = parseFloat(margenSeguridad) || 0

  const validItems = recetaItems.filter((r) => r.recetaId && parseFloat(r.cantidadGramos) > 0)
  const costo = calcularCosto(
    validItems.map((r) => ({ cantidadGramos: parseFloat(r.cantidadGramos), costoGramo: r.costoGramo })),
    nPers, margin, pctMP
  )

  const cfg = costo ? IND[costo.indicator] : null

  // ── Slider track color ──
  const sliderThumbColor = cfg?.color ?? "#1B4FD8"

  function addRecetaItem() {
    const uid = `new-${Date.now()}`
    setRecetaItems((prev) => [...prev, newItem(uid, prev.length)])
  }

  function removeRecetaItem(uid: string) {
    setRecetaItems((prev) => prev.filter((r) => r.uid !== uid))
  }

  function updateRecetaItem(uid: string, field: keyof RecetaItem, value: string | number) {
    setRecetaItems((prev) =>
      prev.map((r) => {
        if (r.uid !== uid) return r
        if (field === "recetaId") {
          const receta = availableRecetas.find((ar) => ar.id === value)
          const costoGramo = receta
            ? parseFloat(receta.costoPorPorcion) / Math.max(parseFloat(receta.pesoTotalGramos), 1)
            : 0
          return { ...r, recetaId: String(value), nombre: receta?.nombre ?? "", costoGramo }
        }
        return { ...r, [field]: value }
      })
    )
  }

  async function handleSave() {
    if (!nombre.trim()) { setError("El nombre del menú es obligatorio"); return }
    if (validItems.length === 0) { setError("Agrega al menos una receta"); return }
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
        recetaId: r.recetaId,
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
      onSaved()
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
          <Button
            variant="primary"
            loading={saving}
            disabled={!nombre.trim() || validItems.length === 0}
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
                onClick={addRecetaItem}
                className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--text-accent, #1B4FD8)" }}
              >
                <Plus size={12} />
                Agregar
              </button>
            </div>

            {recetaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <ChefHat size={28} style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Sin recetas aún. Haz clic en "Agregar" para sumar la primera.
                </p>
                {availableRecetas.length === 0 && (
                  <p className="text-xs px-4" style={{ color: "var(--text-muted)" }}>
                    Tip: crea tus recetas en la sección Recetas primero.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {recetaItems.map((item) => {
                  const costoPorcion = parseFloat(item.cantidadGramos) * item.costoGramo
                  return (
                    <div key={item.uid} className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: "var(--bg-secondary)" }}>
                      {/* Selector de receta */}
                      <div className="flex-1 min-w-0">
                        {availableRecetas.length > 0 ? (
                          <select
                            value={item.recetaId}
                            onChange={(e) => updateRecetaItem(item.uid, "recetaId", e.target.value)}
                            className="w-full text-sm outline-none bg-transparent truncate"
                            style={{ color: item.recetaId ? "var(--text-primary)" : "var(--text-muted)" }}
                          >
                            <option value="">— Seleccionar receta —</option>
                            {availableRecetas.map((r) => (
                              <option key={r.id} value={r.id}>{r.nombre}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="Nombre receta..."
                            value={item.nombre}
                            onChange={(e) => updateRecetaItem(item.uid, "nombre", e.target.value)}
                            className="w-full text-sm outline-none bg-transparent"
                            style={{ color: "var(--text-primary)" }}
                          />
                        )}
                      </div>

                      {/* Cantidad */}
                      <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                        <input
                          type="number" min="1" step="10"
                          value={item.cantidadGramos}
                          onChange={(e) => updateRecetaItem(item.uid, "cantidadGramos", e.target.value)}
                          className="text-sm tabular-nums outline-none text-right bg-transparent"
                          style={{ width: 56, color: "var(--text-primary)" }}
                        />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>g</span>
                      </div>

                      {/* Costo calculado */}
                      {item.costoGramo > 0 && parseFloat(item.cantidadGramos) > 0 && (
                        <span className="text-xs tabular-nums font-medium" style={{ color: "var(--text-muted)", minWidth: 54, textAlign: "right" }}>
                          {fmt(costoPorcion)}
                        </span>
                      )}

                      {/* Borrar */}
                      <button
                        onClick={() => removeRecetaItem(item.uid)}
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

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
type PageView = "list" | "detail"

export default function MenuPage() {
  const [view, setView] = useState<PageView>("list")
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [availableRecetas, setAvailableRecetas] = useState<Receta[]>([])
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)

  const loadMenus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMenus()
      setMenus(res.data ?? [])
    } catch {
      setMenus([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Carga recetas disponibles para el selector
  const loadRecetas = useCallback(async () => {
    try {
      const res = await getRecetas()
      setAvailableRecetas(res.data ?? [])
    } catch {
      setAvailableRecetas([]) // recetas endpoint aún no está implementado — manejo silencioso
    }
  }, [])

  useEffect(() => { void loadMenus(); void loadRecetas() }, [loadMenus, loadRecetas])

  async function openEdit(menu: Menu) {
    // Carga el menú completo con sus recetas antes de abrir la vista detalle
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
      await loadMenus()
    } catch {
      // silencioso
    }
  }

  function handleSaved() {
    setView("list")
    void loadMenus()
  }

  // ── Vista detalle ──
  if (view === "detail") {
    return (
      <DetailView
        menu={editingMenu}
        availableRecetas={availableRecetas}
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
        subtitle="Diseña menús por evento, calcula costos y precio de venta"
        action={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={15} />
            Nuevo menú
          </Button>
        }
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
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
              Crea tu primer menú para calcular costos y precio de venta por persona.
            </p>
          </div>
          <Button variant="ghost" onClick={openCreate}>
            <Plus size={14} />
            Crear primer menú
          </Button>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {menus.map((m) => (
            <MenuCard
              key={m.id}
              menu={m}
              onClick={() => openEdit(m)}
              onDelete={() => handleDelete(m.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
