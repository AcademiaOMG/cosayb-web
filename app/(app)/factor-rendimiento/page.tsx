"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Badge from "@/components/ui/Badge"
import Toast from "@/components/ui/Toast"
import EmptyState from "@/components/ui/EmptyState"
import YieldFactorTable from "@/components/app/factor-rendimiento/YieldFactorTable"
import {
  getFactoresRendimiento, createFactorRendimiento, updateFactorRendimiento,
  deleteFactorRendimiento, saveFactorRendimientoAsIngrediente,
} from "@/lib/api"
import type { FactorRendimiento } from "@/types/domain"
import { Scale, Plus, Search, X, ArrowLeft, Trash2 } from "lucide-react"

// ─── Tipos y helpers ──────────────────────────────────────────────────────────
const WASTE_SUGGESTIONS: Record<"bfactor" | "bfactorveg", string[]> = {
  bfactor: ["Huesos", "Grasa visible", "Piel", "Cabeza", "Cola", "Patas"],
  bfactorveg: ["Cascara", "Tallo", "Hojas externas", "Raiz", "Semillas"],
}

interface WasteItem { name: string; weightGrams: string }

function calcPreview(totalCost: string, totalWeight: string, wasteItems: WasteItem[]) {
  const tc = parseFloat(totalCost)
  const tw = parseFloat(totalWeight)
  const wasteSum = wasteItems.reduce((s, i) => s + (parseFloat(i.weightGrams) || 0), 0)
  if (!tc || !tw) return null
  const netWeight = tw - wasteSum
  if (netWeight <= 0) return null
  return {
    netWeight,
    yieldFactor: netWeight / tw,
    realCostPerGram: tc / netWeight,
    wasteGrams: wasteSum,
    wastePercent: (wasteSum / tw) * 100,
  }
}

function fmt(n: number) {
  return `$ ${n.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

// ─── Skeleton de tabla ────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="w-full overflow-hidden rounded-xl animate-pulse" style={{ border: "1px solid var(--border-light)" }}>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ background: "var(--bg-secondary)" }}>
            {["Tipo", "Ingrediente", "Rendimiento", "Costo/g", "Última modif.", "Acciones"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-muted)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4].map((i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--border-light)" }}>
              <td className="px-4 py-3"><div className="h-5 w-16 rounded-full" style={{ background: "var(--bg-secondary)" }} /></td>
              <td className="px-4 py-3">
                <div className="h-4 rounded mb-1" style={{ background: "var(--bg-secondary)", width: "55%" }} />
                <div className="h-3 rounded" style={{ background: "var(--bg-secondary)", width: "40%" }} />
              </td>
              <td className="px-4 py-3"><div className="h-5 w-12 rounded ml-auto" style={{ background: "var(--bg-secondary)" }} /></td>
              <td className="px-4 py-3"><div className="h-4 w-20 rounded ml-auto" style={{ background: "var(--bg-secondary)" }} /></td>
              <td className="px-4 py-3"><div className="h-3 w-24 rounded ml-auto" style={{ background: "var(--bg-secondary)" }} /></td>
              <td className="px-4 py-3"><div className="flex gap-1 justify-end">{[1,2,3].map(j => <div key={j} className="h-7 w-7 rounded-lg" style={{ background: "var(--bg-secondary)" }} />)}</div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// VISTA DETALLE / CREAR
// ═══════════════════════════════════════════════════════════════════════════════
function FactorDetailView({
  factor,
  onBack,
  onSaved,
}: {
  factor: FactorRendimiento | null
  onBack: () => void
  onSaved: () => void
}) {
  const isNew = factor === null

  const [variant, setVariant] = useState<"bfactor" | "bfactorveg">(factor?.variant ?? "bfactor")
  const [ingredientName, setIngredientName] = useState(factor?.ingredientName ?? "")
  const [totalCost, setTotalCost] = useState(factor ? String(parseFloat(factor.totalCost)) : "")
  const [totalWeightGrams, setTotalWeightGrams] = useState(factor ? String(parseFloat(factor.totalWeightGrams)) : "")
  const [wasteItems, setWasteItems] = useState<WasteItem[]>(
    factor?.wasteItems.map((w) => ({ name: w.name, weightGrams: String(parseFloat(w.weightGrams)) })) ?? []
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [savingAsIngredient, setSavingAsIngredient] = useState(false)

  const preview = calcPreview(totalCost, totalWeightGrams, wasteItems)

  function addWaste() {
    setWasteItems((prev) => [...prev, { name: "", weightGrams: "" }])
  }
  function updateWaste(idx: number, field: keyof WasteItem, val: string) {
    setWasteItems((prev) => prev.map((w, i) => i === idx ? { ...w, [field]: val } : w))
  }
  function removeWaste(idx: number) {
    setWasteItems((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    if (!ingredientName.trim()) { setError("Ingresa el nombre del ingrediente"); return }
    if (!totalCost || parseFloat(totalCost) <= 0) { setError("Ingresa el costo total"); return }
    if (!totalWeightGrams || parseFloat(totalWeightGrams) <= 0) { setError("Ingresa el peso completo"); return }
    setSaving(true)
    setError(null)
    const payload = {
      variant,
      ingredientName: ingredientName.trim(),
      totalCost: parseFloat(totalCost),
      totalWeightGrams: parseFloat(totalWeightGrams),
      wasteItems: wasteItems
        .filter((w) => w.name.trim() && parseFloat(w.weightGrams) > 0)
        .map((w) => ({ name: w.name.trim(), weightGrams: parseFloat(w.weightGrams) })),
    }
    try {
      if (isNew) {
        await createFactorRendimiento(payload)
      } else {
        await updateFactorRendimiento(factor!.id, payload)
      }
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAsIngredient() {
    if (!factor) return
    setSavingAsIngredient(true)
    setSaveMsg(null)
    try {
      const res = await saveFactorRendimientoAsIngrediente(factor.id)
      setSaveMsg(res.message ?? "Ingrediente guardado en inventario")
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : "No se pudo guardar como ingrediente")
    } finally {
      setSavingAsIngredient(false)
    }
  }

  const suggestions = WASTE_SUGGESTIONS[variant]

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
          Factor de Rendimiento
        </button>

        <span className="flex-1 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          {isNew ? "Nuevo ingrediente" : ingredientName || factor?.ingredientName}
        </span>

        <div className="flex items-center gap-3">
          {error && <span className="text-sm" style={{ color: "#EF4444" }}>{error}</span>}
          <Button
            variant="primary"
            loading={saving}
            disabled={!preview}
            onClick={handleSave}
          >
            {isNew ? "Registrar ingrediente" : "Guardar cambios"}
          </Button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>

        {/* ── Columna izquierda: formulario ── */}
        <div className="flex flex-col gap-4">

          {/* Tipo */}
          <div className="rounded-2xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}>
            <p className="text-xs font-semibold tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>TIPO DE INGREDIENTE</p>
            <div className="flex gap-2">
              {[
                { key: "bfactor" as const, label: "Carnes, pescados, mariscos" },
                { key: "bfactorveg" as const, label: "Verduras, frutas, hortalizas" },
              ].map((v) => (
                <button
                  key={v.key}
                  onClick={() => setVariant(v.key)}
                  className="flex-1 px-3 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: variant === v.key ? "var(--accent)" : "var(--bg-primary)",
                    color: variant === v.key ? "white" : "var(--text-secondary)",
                    border: `1px solid ${variant === v.key ? "var(--accent)" : "var(--border-light)"}`,
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre + Costo + Peso */}
          <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}>
            <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>DATOS DEL INGREDIENTE</p>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Nombre</label>
              <input
                type="text"
                value={ingredientName}
                onChange={(e) => { setIngredientName(e.target.value); setError(null) }}
                placeholder="Pechuga de pollo, Lomo de res..."
                className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Costo total ($)</label>
                <input
                  type="number"
                  value={totalCost}
                  onChange={(e) => { setTotalCost(e.target.value); setError(null) }}
                  placeholder="25000"
                  className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Peso completo (g)</label>
                <input
                  type="number"
                  value={totalWeightGrams}
                  onChange={(e) => { setTotalWeightGrams(e.target.value); setError(null) }}
                  placeholder="5420"
                  className="w-full h-10 px-3 rounded-xl text-sm outline-none"
                  style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                />
              </div>
            </div>
          </div>

          {/* Desperdicios */}
          <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>DESPERDICIOS</p>
              <button
                onClick={addWaste}
                className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
                style={{ color: "var(--text-accent, #1B4FD8)" }}
              >
                <Plus size={12} />
                Agregar
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Lo que se desecha: huesos, piel, cáscara, tallo, etc.
            </p>

            {wasteItems.length === 0 ? (
              <div className="rounded-xl p-3 text-center" style={{ background: "var(--bg-primary)", border: "1px dashed var(--border-light)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Sin desperdicio — rendimiento del 100%
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {wasteItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateWaste(idx, "name", e.target.value)}
                      placeholder="Nombre"
                      list={`waste-names-${variant}`}
                      className="flex-1 h-9 px-3 rounded-lg text-sm outline-none"
                      style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                    />
                    <input
                      type="number"
                      value={item.weightGrams}
                      onChange={(e) => updateWaste(idx, "weightGrams", e.target.value)}
                      placeholder="gramos"
                      className="w-24 h-9 px-3 rounded-lg text-sm outline-none"
                      style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                    />
                    <button
                      onClick={() => removeWaste(idx)}
                      className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity hover:opacity-70"
                      style={{ color: "#EF4444", background: "rgba(239,68,68,0.08)" }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <datalist id={`waste-names-${variant}`}>
              {suggestions.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
        </div>

        {/* ── Columna derecha: resultado en vivo + acción ── */}
        <div className="flex flex-col gap-4">

          {/* Preview resultado */}
          {preview ? (
            <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}>
              <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>RESULTADO</p>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background: "var(--bg-secondary)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Peso útil</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {preview.netWeight.toFixed(0)}g
                  </p>
                </div>
                <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background: "var(--bg-secondary)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Rendimiento</p>
                  <p className="text-xl font-bold tabular-nums" style={{ color: "var(--accent-text)" }}>
                    {(preview.yieldFactor * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl p-3 flex flex-col gap-1" style={{ background: "var(--bg-secondary)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Costo / gramo</p>
                  <p className="text-lg font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {fmt(preview.realCostPerGram)}/g
                  </p>
                </div>
              </div>

              {preview.wasteGrams > 0 && (
                <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
                  <p style={{ color: "#B42020" }}>
                    Se desechan <strong>{preview.wasteGrams.toFixed(0)}g</strong> ({preview.wastePercent.toFixed(1)}% del total comprado)
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-center"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)", minHeight: 200 }}>
              <Scale size={28} style={{ color: "var(--text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Ingresa el costo y peso para ver el resultado del factor de rendimiento
              </p>
            </div>
          )}

          {/* Detalle del factor existente */}
          {!isNew && factor && (
            <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-widest flex-1" style={{ color: "var(--text-muted)" }}>INFORMACIÓN</p>
                <Badge variant={factor.variant === "bfactor" ? "accent" : "success"}>
                  {factor.variant === "bfactor" ? "Proteína" : "Vegetal"}
                </Badge>
              </div>

              {factor.wasteItems.length > 0 && (
                <div className="flex flex-col gap-1">
                  {factor.wasteItems.map((w) => (
                    <div key={w.id} className="flex justify-between text-sm">
                      <span style={{ color: "var(--text-secondary)" }}>{w.name}</span>
                      <span className="font-mono font-semibold" style={{ color: "#B42020" }}>
                        -{parseFloat(w.weightGrams).toFixed(0)}g
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs pt-1" style={{ borderTop: "1px solid var(--border-light)" }}>
                <div style={{ color: "var(--text-muted)" }}>
                  Creado: <span style={{ color: "var(--text-secondary)" }}>{fmtDate(factor.createdAt)}</span>
                </div>
                <div style={{ color: "var(--text-muted)" }}>
                  Modificado: <span style={{ color: "var(--text-secondary)" }}>{fmtDate(factor.updatedAt)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Guardar como ingrediente limpio */}
          {!isNew && factor && (
            <div className="rounded-2xl p-5" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}>
              <p className="text-xs font-semibold tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>ACCIÓN</p>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    Guardar como ingrediente limpio
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Crea o actualiza un ingrediente en el Inventario con el costo real calculado.
                  </p>
                  {saveMsg && (
                    <p className="text-xs mt-2"
                      style={{ color: saveMsg.includes("No se pudo") || saveMsg.includes("Error") ? "#EF4444" : "#16A34A" }}>
                      {saveMsg}
                    </p>
                  )}
                </div>
                <Button variant="primary" disabled={savingAsIngredient} onClick={handleSaveAsIngredient}>
                  {savingAsIngredient ? "Guardando…" : "Guardar"}
                </Button>
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
type SortKey = "name" | "updatedAt" | "createdAt" | "yieldFactor"
type SortDir = "asc" | "desc"
type PageView = "list" | "detail"

export default function FactorRendimientoPage() {
  const [view, setView] = useState<PageView>("list")
  const [factors, setFactors] = useState<FactorRendimiento[]>([])
  const [firstLoad, setFirstLoad] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "bfactor" | "bfactorveg">("all")
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [selectedFactor, setSelectedFactor] = useState<FactorRendimiento | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FactorRendimiento | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const fetchFactors = useCallback(async () => {
    try {
      const variant = filter === "all" ? undefined : filter
      const res = await getFactoresRendimiento(variant)
      setFactors(res.data)
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Error al cargar factores" })
    } finally {
      setFirstLoad(false)
    }
  }, [filter])

  useEffect(() => { void fetchFactors() }, [fetchFactors])

  const filteredAndSorted = useMemo(() => {
    let result = factors
    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter((f) => f.ingredientName.toLowerCase().includes(term))
    }
    return [...result].sort((a, b) => {
      let cmp = 0
      if (sortKey === "name") cmp = a.ingredientName.localeCompare(b.ingredientName, "es")
      else if (sortKey === "yieldFactor") cmp = parseFloat(a.yieldFactor) - parseFloat(b.yieldFactor)
      else cmp = new Date(a[sortKey]).getTime() - new Date(b[sortKey]).getTime()
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [factors, search, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc") }
  }

  function sortLabel(key: SortKey) {
    const arrow = sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : ""
    const labels: Record<SortKey, string> = { name: "Nombre", updatedAt: "Últ. modif.", createdAt: "Fecha", yieldFactor: "Rendimiento" }
    return labels[key] + arrow
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteFactorRendimiento(deleteTarget.id)
      setToast({ type: "success", message: `"${deleteTarget.ingredientName}" eliminado` })
      setDeleteTarget(null)
      void fetchFactors()
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "No se pudo eliminar" })
    } finally {
      setIsDeleting(false)
    }
  }

  function openCreate() {
    setSelectedFactor(null)
    setView("detail")
  }

  function openEdit(f: FactorRendimiento) {
    setSelectedFactor(f)
    setView("detail")
  }

  function handleSaved() {
    setView("list")
    void fetchFactors()
    setToast({ type: "success", message: selectedFactor ? `"${selectedFactor.ingredientName}" actualizado` : "Ingrediente registrado" })
  }

  // ── Vista detalle ──
  if (view === "detail") {
    return (
      <FactorDetailView
        factor={selectedFactor}
        onBack={() => setView("list")}
        onSaved={handleSaved}
      />
    )
  }

  // ── Vista lista ──
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Factor de Rendimiento"
        subtitle="¿Cuánto producto útil obtienes después de limpiar, deshuesar o pelar?"
        action={
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} />
            Nuevo ingrediente
          </Button>
        }
      />

      {/* Barra de búsqueda + filtros + orden */}
      <div className="flex flex-col gap-3 p-4 rounded-xl"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-xl text-sm outline-none"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: "var(--text-muted)" }}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {[
              { key: "all" as const, label: "Todos" },
              { key: "bfactor" as const, label: "Carnes y pescados" },
              { key: "bfactorveg" as const, label: "Vegetales" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap"
                style={{
                  background: filter === f.key ? "var(--accent)" : "var(--bg-primary)",
                  color: filter === f.key ? "white" : "var(--text-secondary)",
                  border: `1px solid ${filter === f.key ? "var(--accent)" : "var(--border-light)"}`,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Ordenar:</span>
          {(["name", "updatedAt", "createdAt", "yieldFactor"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{
                background: sortKey === key ? "var(--accent-light)" : "transparent",
                color: sortKey === key ? "var(--accent-text)" : "var(--text-muted)",
              }}
            >
              {sortLabel(key)}
            </button>
          ))}
        </div>
      </div>

      {/* Confirmación inline de borrado */}
      {deleteTarget && (
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <Trash2 size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
          <p className="flex-1 text-sm" style={{ color: "#991B1B" }}>
            ¿Eliminar <strong>{deleteTarget.ingredientName}</strong>? Esta acción no se puede deshacer.
          </p>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
          <Button variant="danger" loading={isDeleting} onClick={handleDelete}>Eliminar</Button>
        </div>
      )}

      {/* Contenido */}
      {firstLoad ? (
        <TableSkeleton />
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState
          icon={<Scale size={48} />}
          title={search ? "No encontramos nada" : "Aún no tienes factores de rendimiento"}
          description={
            search
              ? `No hay ingredientes que coincidan con "${search}".`
              : "Registra tu primer ingrediente para calcular cuánto producto útil obtienes después de la limpieza."
          }
          action={
            !search ? (
              <Button variant="primary" onClick={openCreate}>
                <Plus size={16} />
                Registrar primer ingrediente
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {filteredAndSorted.length} ingrediente{filteredAndSorted.length !== 1 ? "s" : ""}
            {search && ` encontrado${filteredAndSorted.length !== 1 ? "s" : ""} para "${search}"`}
          </div>
          <YieldFactorTable
            data={filteredAndSorted}
            onView={openEdit}
            onEdit={openEdit}
            onDelete={setDeleteTarget}
          />
        </>
      )}

      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
