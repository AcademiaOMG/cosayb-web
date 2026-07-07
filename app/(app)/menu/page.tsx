"use client"

import useSWR from "swr"
import { useCallback, useEffect, useMemo, useState } from "react"
import SearchableSelect from "@/components/ui/SearchableSelect"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Table from "@/components/ui/Table"
import Modal from "@/components/ui/Modal"
import RatioDonut, { RatioRow, COLOR_MP, COLOR_FIXED, COLOR_PROFIT } from "@/components/ui/RatioDonut"
import InfoStat from "@/components/ui/InfoStat"
import {
  ArrowLeft, CheckCircle2, Plus, Trash2, UtensilsCrossed, ChefHat, Users, TrendingUp,
  Loader2, CalendarDays, Pencil, Eye, ShoppingCart, Printer, StickyNote, ArrowLeftCircle, Percent,
} from "lucide-react"
import type { Menu, Recipe, Ingrediente, CostoMenuResult, MenuIndicator } from "@/types/domain"
import {
  getMenus, getMenuById, getMenuCosto, createMenu, updateMenu, deleteMenu,
  getRecipes, getRecipeCost, getIngredientes, getListaCompras,
} from "@/lib/api"
import type { CreateMenuPayload } from "@/lib/api"
import { usePermissions } from "@/hooks/usePermissions"
import { useHelpAvailable } from "@/hooks/useHelpAvailable"

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

// ─── Estado local de ítems de receta en el formulario ─────────────────────────
interface RecipeLineItem {
  uid: string
  /** 'recipe' = plato en gramos/persona · 'ingredient' = extra en unidades/persona (gaseosa, desechables…) */
  componentType: "recipe" | "ingredient"
  recipeId: string
  ingredientId: string
  nombre: string
  /** Recetas: gramos por persona. Extras: unidades por persona */
  cantidadGramos: string
  costoGramo: number | null  // recetas: $/g · extras: $/unidad
  rawCostPerServing: number | null  // fallback when costoGramo is null
  costoLoading: boolean
  orden: number
}

function newLineItem(uid: string, orden: number, componentType: "recipe" | "ingredient" = "recipe"): RecipeLineItem {
  return {
    uid,
    componentType,
    recipeId: "",
    ingredientId: "",
    nombre: "",
    cantidadGramos: componentType === "ingredient" ? "1" : "200",
    costoGramo: null,
    rawCostPerServing: null,
    costoLoading: false,
    orden,
  }
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
          <RatioDonut mp={pctMP} fixed={costo.pctCostosFijos} profit={costo.pctGanancia} profitColor={cfg.color} />
        </div>

        <div className="flex flex-col gap-3">
          <RatioRow label="Materia prima" color={COLOR_MP} pct={pctMP} />
          <RatioRow label="Costos fijos"  color={COLOR_FIXED} pct={costo.pctCostosFijos} />
          <RatioRow label="Ganancia"       color={COLOR_PROFIT} pct={costo.pctGanancia} />
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
  availableIngredients,
  onBack,
  onSaved,
}: {
  menu: Menu | null
  availableRecipes: Recipe[]
  availableIngredients: Ingrediente[]
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
      const isIngredient = mr.componentType === "ingredient"
      const recipe = !isIngredient
        ? availableRecipes.find((r) => r.id === mr.recipeId)
        : undefined
      return {
        uid: mr.id,
        componentType: (mr.componentType ?? "recipe") as "recipe" | "ingredient",
        recipeId: mr.recipeId ?? "",
        ingredientId: mr.ingredientId ?? "",
        nombre: isIngredient
          ? (mr.ingredientName ?? "")
          : (recipe?.name ?? mr.recipeName ?? mr.recipeId ?? ""),
        cantidadGramos: isIngredient
          ? String(parseFloat(mr.cantidadUnidades ?? "1"))
          : String(parseFloat(mr.cantidadGramos ?? "0")),
        costoGramo: null,
        rawCostPerServing: null,
        costoLoading: true,
        orden: i,
      }
    })
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [shoppingOpen, setShoppingOpen] = useState(false)

  const recipeOptions = useMemo(
    () => availableRecipes.map((r) => ({ value: r.id, label: r.name })),
    [availableRecipes],
  )
  const ingredientOptions = useMemo(
    () => availableIngredients.map((i) => ({ value: i.id, label: i.name })),
    [availableIngredients],
  )

  // Resolver costo por unidad de los extras cuando cargue el catálogo
  useEffect(() => {
    if (availableIngredients.length === 0) return
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.componentType !== "ingredient" || !item.ingredientId || item.costoGramo !== null) {
          return item
        }
        const ing = availableIngredients.find((i) => i.id === item.ingredientId)
        return ing
          ? { ...item, nombre: ing.name, costoGramo: parseFloat(ing.costPerUnit), costoLoading: false }
          : { ...item, costoLoading: false }
      })
    )
  }, [availableIngredients])

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
      const rawCostPerServing = res.data.rawCostPerServing
      setLineItems((prev) =>
        prev.map((item) =>
          item.uid === uid ? { ...item, costoGramo, rawCostPerServing, costoLoading: false } : item
        )
      )
    } catch {
      setLineItems((prev) =>
        prev.map((item) =>
          item.uid === uid ? { ...item, costoGramo: null, rawCostPerServing: null, costoLoading: false } : item
        )
      )
    }
  }, [])

  // On mount: fetch costs for existing menu items (solo recetas; los extras
  // resuelven su costo desde el catálogo de ingredientes)
  useEffect(() => {
    lineItems.forEach((item) => {
      if (item.componentType === "recipe" && item.recipeId && item.costoLoading) {
        void fetchRecipeCost(item.uid, item.recipeId)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validItems = lineItems.filter((r) => {
    if (parseFloat(r.cantidadGramos) <= 0) return false
    if (r.componentType === "ingredient") {
      return !!r.ingredientId && r.costoGramo !== null
    }
    return !!r.recipeId && (r.costoGramo !== null || r.rawCostPerServing !== null)
  })
  const costo = calcularCosto(
    validItems.map((r) => ({
      cantidadGramos: parseFloat(r.cantidadGramos),
      costoGramo: r.costoGramo ?? (r.rawCostPerServing ?? 0) / parseFloat(r.cantidadGramos),
    })),
    nPers, margin, pctMP
  )

  const cfg = costo ? IND[costo.indicator] : null
  const sliderThumbColor = cfg?.color ?? "#1B4FD8"

  function addLineItem(componentType: "recipe" | "ingredient" = "recipe") {
    const uid = `new-${Date.now()}`
    setLineItems((prev) => [...prev, newLineItem(uid, prev.length, componentType)])
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

  function selectIngredient(uid: string, ingredientId: string) {
    const ing = availableIngredients.find((i) => i.id === ingredientId)
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.uid !== uid) return item
        return {
          ...item,
          ingredientId,
          nombre: ing?.name ?? "",
          // Extras: costo por UNIDAD directo del catálogo, sin fetch
          costoGramo: ing ? parseFloat(ing.costPerUnit) : null,
          costoLoading: false,
        }
      })
    )
  }

  function updateGrams(uid: string, value: string) {
    setLineItems((prev) =>
      prev.map((item) => item.uid === uid ? { ...item, cantidadGramos: value } : item)
    )
  }

  async function handleSave() {
    if (!nombre.trim()) { setError("El nombre del menú es obligatorio"); return }
    if (validItems.length === 0) { setError("Agrega al menos una receta con costo calculado"); return }
    setSaving(true)
    setError(null)
    const payload: CreateMenuPayload = {
      nombre: nombre.trim(),
      fecha,
      numPersonas: parseInt(numPersonas),
      margenSeguridad: parseFloat(margenSeguridad),
      pctMateriaPrima: parseFloat(pctMateriaPrima),
      notas: notas.trim() || undefined,
      recetas: validItems.map((r, i) =>
        r.componentType === "ingredient"
          ? {
              componentType: "ingredient" as const,
              ingredientId: r.ingredientId,
              cantidadUnidades: parseFloat(r.cantidadGramos),
              orden: i,
            }
          : {
              componentType: "recipe" as const,
              recipeId: r.recipeId,
              cantidadGramos: parseFloat(r.cantidadGramos),
              orden: i,
            }
      ),
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
          {!isNew && (
            <Button variant="ghost" onClick={() => setShoppingOpen(true)}>
              <ShoppingCart size={14} />
              Lista de compras
            </Button>
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

      {/* Modal: lista de compras (aquí SÍ es un modal independiente — DetailView es una página, no otro modal) */}
      {!isNew && (
        <Modal
          open={shoppingOpen}
          onClose={() => setShoppingOpen(false)}
          title={`Lista de compras — ${menu!.nombre}`}
          wide
          footer={<ShoppingListFooter menuId={menu!.id} onBack={() => setShoppingOpen(false)} backLabel="Cerrar" />}
        >
          <ShoppingListBody menuId={menu!.id} />
        </Modal>
      )}

      {/* ── Contenido ── */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-6">

        {/* ── Columna izquierda: parámetros + recetas ── */}
        <div className="flex flex-col gap-4">

          {/* Parámetros */}
          <Card>
            <p className="text-xs font-semibold tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
              PARÁMETROS
            </p>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Fecha del evento"
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  hint="¿Cuándo se sirve este menú?"
                />
                <Input
                  label="N° de personas"
                  type="number"
                  min="1"
                  value={numPersonas}
                  onChange={(e) => setNumPersonas(e.target.value)}
                  hint="¿Cuántos comensales?"
                />
              </div>

              {/* Slider % MP */}
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    % del precio que son ingredientes
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
                  Menor % = más rentabilidad — Ideal &lt;32% · Aceptable 32–37% · Revisar &gt;37%
                </p>
              </div>

              <Input
                label="Margen de seguridad (%)"
                type="number" min="0" max="50"
                placeholder="5"
                value={margenSeguridad}
                onChange={(e) => setMargenSeguridad(e.target.value)}
                hint="Colchón ante subidas de precio en ingredientes. Recomendado: 3–5%"
              />
            </div>
          </Card>

          {/* Recetas del menú */}
          <Card>
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                PLATOS Y EXTRAS DEL MENÚ
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => addLineItem("recipe")}
                  className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-accent, #1B4FD8)" }}
                >
                  <Plus size={12} />
                  Receta
                </button>
                <button
                  onClick={() => addLineItem("ingredient")}
                  className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
                  style={{ color: "var(--text-accent, #1B4FD8)" }}
                  title="Gaseosas, jugos, platos, servilletas y otros por unidad"
                >
                  <Plus size={12} />
                  Extra (bebidas, desechables…)
                </button>
              </div>
            </div>

            {lineItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
                <ChefHat size={28} style={{ color: "var(--text-muted)" }} />
                {availableRecipes.length === 0 ? (
                  <p className="text-sm px-4" style={{ color: "var(--text-muted)" }}>
                    Primero crea tus recetas en la sección <strong>Recetas</strong>, luego vuelve aquí para armar el menú.
                  </p>
                ) : (
                  <>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Agrega los platos que incluye este menú
                    </p>
                    <Button variant="primary" onClick={() => addLineItem("recipe")}>
                      <Plus size={14} />
                      Agregar primer plato
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {lineItems.map((item) => {
                  const costoPorcion = item.costoGramo !== null
                    ? parseFloat(item.cantidadGramos) * item.costoGramo
                    : item.rawCostPerServing
                  return (
                    <div key={item.uid} className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: "var(--bg-secondary)" }}>
                      {/* Selector de receta o de ingrediente extra */}
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        {item.componentType === "ingredient" && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase shrink-0"
                            style={{ background: "#FEF3C7", color: "#92400E" }}
                            title="Extra por unidad (bebidas, desechables…)"
                          >
                            Extra
                          </span>
                        )}
                        {item.componentType === "ingredient" ? (
                          ingredientOptions.length > 0 ? (
                            <SearchableSelect
                              options={ingredientOptions}
                              value={item.ingredientId}
                              onChange={(val) => selectIngredient(item.uid, val)}
                              placeholder="— Seleccionar ingrediente —"
                              emptyMessage="No se encontraron ingredientes"
                              ariaLabel="Ingrediente extra"
                            />
                          ) : (
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                              No hay ingredientes. Créalos en Inventario (ej. GASEOSA, PLATO DESECHABLE).
                            </span>
                          )
                        ) : availableRecipes.length > 0 ? (
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

                      {/* Cantidad (g por persona para recetas, unidades por persona para extras) */}
                      <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                        <input
                          type="number" min="1" step={item.componentType === "ingredient" ? 1 : 10}
                          value={item.cantidadGramos}
                          onChange={(e) => updateGrams(item.uid, e.target.value)}
                          className="text-sm tabular-nums outline-none text-right bg-transparent"
                          style={{ width: 56, color: "var(--text-primary)" }}
                        />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {item.componentType === "ingredient" ? "und" : "g"}
                        </span>
                      </div>

                      {/* Costo calculado o spinner */}
                      <div style={{ minWidth: 60, textAlign: "right", flexShrink: 0 }}>
                        {item.costoLoading ? (
                          <Loader2 size={12} style={{ color: "var(--text-muted)", display: "inline" }}
                            className="animate-spin" />
                        ) : item.costoGramo === null && item.rawCostPerServing === null && item.recipeId ? (
                          <span className="text-xs" style={{ color: "#F59E0B" }} title="Esta receta no tiene costo calculado. Asegúrate de que tenga ingredientes con precio definido.">
                            Sin costo ⚠
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
// MODAL: VER MENÚ (solo lectura, sin necesidad de entrar a editar)
// ═══════════════════════════════════════════════════════════════════════════════
type MenuViewSubview = "detalle" | "compras"

function MenuViewModal({
  open,
  menuId,
  onClose,
  onEdit,
}: {
  open: boolean
  menuId: string | null
  onClose: () => void
  onEdit: () => void
}) {
  const [subview, setSubview] = useState<MenuViewSubview>("detalle")

  // Al abrir un menú distinto (o cerrar), siempre arrancar en el detalle
  useEffect(() => {
    if (open) setSubview("detalle")
  }, [open, menuId])

  const { data, isLoading, error } = useSWR(
    open && menuId ? ["menu-view", menuId] : null,
    () => getMenuCosto(menuId!).then((r) => r.data),
  )

  const items = data?.costo?.recetas ?? []
  const pctMP = data ? parseFloat(data.pctMateriaPrima) : 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={subview === "compras" ? `Lista de compras — ${data?.nombre ?? ""}` : (data?.nombre ?? "Ver menú")}
      wide
      footer={
        subview === "compras" ? (
          <ShoppingListFooter menuId={menuId} onBack={() => setSubview("detalle")} />
        ) : (
          <div className="flex items-center justify-between w-full gap-3">
            <Button variant="ghost" onClick={() => setSubview("compras")} disabled={!menuId}>
              <ShoppingCart size={14} />
              Lista de compras
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cerrar</Button>
              <Button variant="primary" onClick={onEdit}>
                <Pencil size={14} />
                Editar
              </Button>
            </div>
          </div>
        )
      }
    >
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 size={22} className="animate-spin" style={{ color: "var(--text-muted)" }} />
        </div>
      )}

      {error && (
        <p className="text-sm text-center py-10" style={{ color: "#EF4444" }}>
          No se pudo cargar el menú.
        </p>
      )}

      {/* ═══ Subvista: detalle ═══ */}
      {data && subview === "detalle" && (
        <div className="flex flex-col gap-5">
          {/* Datos generales — mini-tarjetas (el indicador de rentabilidad ya se muestra en el panel de costo, a la derecha) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <InfoStat
              icon={<CalendarDays size={12} style={{ color: "var(--text-muted)" }} />}
              label="Fecha del evento"
              value={fmtDate(data.fecha)}
            />
            <InfoStat
              icon={<Users size={12} style={{ color: "var(--text-muted)" }} />}
              label="Personas"
              value={data.numPersonas}
            />
            <InfoStat
              icon={<Percent size={12} style={{ color: "var(--text-muted)" }} />}
              label="% Materia prima"
              value={`${pctMP.toFixed(0)}%`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-5">
            {/* ── Izquierda: platos y extras + notas ── */}
            <div className="flex flex-col gap-4 min-w-0">
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <ChefHat size={15} style={{ color: "var(--accent)" }} />
                  <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                    PLATOS Y EXTRAS ({items.length})
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {items.map((item) => (
                    <div
                      key={item.recipeId}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                      style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
                    >
                      {item.tipo === "ingredient" && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase shrink-0"
                          style={{ background: "#FEF3C7", color: "#92400E" }}
                        >
                          Extra
                        </span>
                      )}
                      <span className="flex-1 min-w-0 truncate text-sm" style={{ color: "var(--text-primary)" }}>
                        {item.nombre}
                      </span>
                      <span className="text-xs tabular-nums font-mono shrink-0" style={{ color: "var(--text-muted)" }}>
                        {item.cantidadGramos} {item.unidad ?? "g"}
                      </span>
                      <span
                        className="text-sm font-semibold tabular-nums font-mono shrink-0"
                        style={{ color: "var(--text-primary)", minWidth: 76, textAlign: "right" }}
                      >
                        {fmt(item.costoPorcionEnMenu)}
                      </span>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>Sin ítems.</p>
                  )}
                </div>
              </div>

              {data.notas && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <StickyNote size={14} style={{ color: "var(--text-muted)" }} />
                    <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                      NOTAS
                    </p>
                  </div>
                  <p
                    className="text-sm px-3 py-2.5 rounded-xl"
                    style={{ color: "var(--text-secondary)", background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}
                  >
                    {data.notas}
                  </p>
                </div>
              )}
            </div>

            {/* ── Derecha: análisis de costo ── */}
            <div className="min-w-0">
              {data.costo ? (
                <CostoPanel costo={data.costo} numPersonas={data.numPersonas} pctMP={pctMP} />
              ) : (
                <p className="text-sm text-center py-10" style={{ color: "var(--text-muted)" }}>
                  Sin análisis de costo disponible.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Subvista: lista de compras ═══ */}
      {menuId && subview === "compras" && <ShoppingListBody menuId={menuId} />}
    </Modal>
  )
}

// ─── Subvista: cuerpo de la lista de compras (sin modal propio) ───────────────
function ShoppingListBody({ menuId }: { menuId: string }) {
  const { data, isLoading, error } = useSWR(
    ["lista-compras", menuId],
    () => getListaCompras(menuId).then((r) => r.data),
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={22} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-center py-10" style={{ color: "#EF4444" }}>
        No se pudo generar la lista de compras.
      </p>
    )
  }

  if (!data || data.items.length === 0) {
    return (
      <p className="text-sm text-center py-10" style={{ color: "var(--text-muted)" }}>
        El menú no tiene ingredientes con costo registrado.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Cantidades totales para <strong style={{ color: "var(--text-primary)" }}>{data.numPersonas} personas</strong>,
        calculadas con los precios de tu inventario.
      </p>
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-light)" }}>
        <div
          className="flex items-center gap-3 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide"
          style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}
        >
          <span className="flex-1">Ingrediente</span>
          <span style={{ width: 90, textAlign: "right" }}>Cantidad</span>
          <span style={{ width: 90, textAlign: "right" }}>Costo est.</span>
        </div>
        {data.items.map((item, idx) => (
          <div
            key={item.ingredientId + item.unidad}
            className="flex items-center gap-3 px-3.5 py-2.5"
            style={{ background: idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-primary)" }}
          >
            <span className="flex-1 min-w-0 text-sm truncate" style={{ color: "var(--text-primary)" }}>
              {item.nombre}
            </span>
            <span
              className="text-sm tabular-nums font-mono shrink-0"
              style={{ color: "var(--text-secondary)", width: 90, textAlign: "right" }}
            >
              {item.unidad === "g" ? `${item.cantidad.toLocaleString("es-CO")} g` : `${item.cantidad} und`}
            </span>
            <span
              className="text-sm tabular-nums font-mono font-medium shrink-0"
              style={{ color: "var(--text-primary)", width: 90, textAlign: "right" }}
            >
              {fmt(item.costo)}
            </span>
          </div>
        ))}
        <div
          className="flex items-center justify-between px-3.5 py-3 font-semibold text-sm"
          style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}
        >
          <span>Total estimado</span>
          <span className="tabular-nums font-mono">{fmt(data.costoTotal)}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Subvista: footer de la lista de compras (volver + imprimir) ─────────────
function ShoppingListFooter({
  menuId,
  onBack,
  backLabel = "Volver al menú",
}: {
  menuId: string | null
  onBack: () => void
  backLabel?: string
}) {
  const { data } = useSWR(
    menuId ? ["lista-compras", menuId] : null,
    () => getListaCompras(menuId!).then((r) => r.data),
  )

  function handlePrint() {
    if (!data) return
    const rows = data.items
      .map((i) =>
        `<tr><td>${i.nombre}</td><td style="text-align:right">${
          i.unidad === "g" ? `${i.cantidad.toLocaleString("es-CO")} g` : `${i.cantidad} und`
        }</td><td style="text-align:right">${fmt(i.costo)}</td></tr>`
      )
      .join("")
    const w = window.open("", "_blank")
    if (!w) return
    w.document.write(`
      <html><head><title>Lista de compras — ${data.nombre}</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;max-width:640px;margin:0 auto}
        h1{font-size:18px} p{color:#666;font-size:13px}
        table{width:100%;border-collapse:collapse;margin-top:12px;font-size:14px}
        th,td{padding:8px 10px;border-bottom:1px solid #ddd;text-align:left}
        tfoot td{font-weight:bold;border-top:2px solid #333}
      </style></head><body>
      <h1>Lista de compras — ${data.nombre}</h1>
      <p>${data.numPersonas} personas · ${data.items.length} ingredientes</p>
      <table>
        <thead><tr><th>Ingrediente</th><th style="text-align:right">Cantidad</th><th style="text-align:right">Costo est.</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="2">Total estimado</td><td style="text-align:right">${fmt(data.costoTotal)}</td></tr></tfoot>
      </table>
      </body></html>`)
    w.document.close()
    w.print()
  }

  return (
    <div className="flex items-center justify-between w-full gap-3">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftCircle size={14} />
        {backLabel}
      </Button>
      <Button variant="primary" onClick={handlePrint} disabled={!data || data.items.length === 0}>
        <Printer size={14} />
        Imprimir / PDF
      </Button>
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
  onView,
  onEdit,
  onDelete,
}: {
  menus: Menu[]
  onView: (m: Menu) => void
  onEdit: (m: Menu) => void
  onDelete: (id: string) => void
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  return (
    <Table
      rowKey="id"
      data={menus as unknown as Record<string, unknown>[]}
      onRowClick={(row) => onView(row as unknown as Menu)}
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
          key: "recetasCount",
          label: "Recetas",
          render: (v, row) => {
            const menu = row as unknown as Menu
            const n = (v as number | undefined) ?? menu.recetas?.length ?? 0
            return (
              <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <ChefHat size={13} style={{ color: "var(--text-muted)" }} />
                {n}
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
          key: "indicator",
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
                    <button
                      onClick={() => onView(menu)}
                      title="Ver menú"
                      className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => onEdit(menu)}
                      title="Editar menú"
                      className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setConfirmId(id)}
                      title="Eliminar menú"
                      className="p-1.5 rounded-lg transition-colors hover:opacity-70"
                      style={{ color: "#EF4444" }}
                    >
                      <Trash2 size={14} />
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
  useHelpAvailable()
  const { can } = usePermissions()
  const { data: menus = [], isLoading: menusLoading, mutate: mutateMenus } = useSWR(
    "menus",
    () => getMenus().then((r) => r.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  // Catálogo completo (hasta 300): incluye recetas BASE del banco (salsas,
  // adobos) — antes el tope de 100 dejaba fuera muchas y "no aparecían"
  const { data: availableRecipes = [] } = useSWR(
    "recipes-catalog-menu",
    () => getRecipes(undefined, "all", 1, 300).then((r) => r.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  // Ingredientes para extras del menú (gaseosas, jugos, desechables…)
  const { data: availableIngredients = [] } = useSWR(
    "ingredients-catalog-menu",
    () => getIngredientes().then((r) => r.data ?? []),
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  )

  const [view, setView] = useState<PageView>("list")
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [viewingMenuId, setViewingMenuId] = useState<string | null>(null)

  useEffect(() => {
    function handleHelp() { setHelpOpen(true) }
    window.addEventListener("open-help", handleHelp)
    return () => window.removeEventListener("open-help", handleHelp)
  }, [])

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
        availableIngredients={availableIngredients}
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
          can("menus", "create") ? (
            <Button variant="primary" onClick={openCreate}>
              <Plus size={15} />
              Nuevo menú
            </Button>
          ) : undefined
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
          {can("menus", "create") && (
            <Button variant="ghost" onClick={openCreate}>
              <Plus size={14} />
              Crear primer menú
            </Button>
          )}
        </div>
      ) : (
        <MenuTable
          menus={menus}
          onView={(m) => setViewingMenuId(m.id)}
          onEdit={(m) => openEdit(m)}
          onDelete={(id) => handleDelete(id)}
        />
      )}

      {/* ── Modal: ver menú ──────────────────────────────────────────────── */}
      <MenuViewModal
        open={!!viewingMenuId}
        menuId={viewingMenuId}
        onClose={() => setViewingMenuId(null)}
        onEdit={() => {
          const menu = menus.find((m) => m.id === viewingMenuId)
          setViewingMenuId(null)
          if (menu) void openEdit(menu)
        }}
      />

      {/* ── Modal: help ──────────────────────────────────────────────────── */}
      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="Menús"
      >
        <div className="flex flex-col gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
          <p>Esta seccion te permite crear y gestionar menus para eventos y servicios, agrupando platos y calculando costos.</p>

          <div>
            <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Funcionalidades:</p>
            <ul className="flex flex-col gap-2 ml-1">
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Crear menu:</strong> Haz clic en Nuevo menu para agregar recetas, porciones y configurar costos.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Definir parametros:</strong> Establece fecha, numero de personas, margen de seguridad y porcentaje de materia prima.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Agregar recetas:</strong> Selecciona recetas existentes y define los gramos por porcion.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Analisis en tiempo real:</strong> Visualiza el costo total, precio sugerido e indicador de rentabilidad.</span>
              </li>
              <li className="flex gap-2">
                <span style={{ color: "var(--accent)" }}>•</span>
                <span><strong>Indicador de rentabilidad:</strong> MUY BUENO (&lt;32%), REGULAR (32-37%), MALO (&gt;37%).</span>
              </li>
            </ul>
          </div>

          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            <strong>Nota:</strong> El margen de seguridad protege contra subidas de precios. Recomendado: 3-5%.
          </p>
        </div>
      </Modal>
    </div>
  )
}
