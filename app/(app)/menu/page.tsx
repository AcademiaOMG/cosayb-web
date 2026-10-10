"use client"

import useSWR from "swr"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import SearchableSelect from "@/components/ui/SearchableSelect"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Card from "@/components/ui/Card"
import Table from "@/components/ui/Table"
import Modal from "@/components/ui/Modal"
import {
  CheckCircle2, Plus, Trash2, UtensilsCrossed, ChefHat, Users, Calculator, History,
  Loader2, CalendarDays, Pencil, Eye, ShoppingCart, Printer, StickyNote, ArrowLeftCircle,
} from "lucide-react"
import { scrollMainToTop } from "@/components/calculator/scrollMainToTop"
import RecipePickerModal from "@/components/app/recipes/RecipePickerModal"
import MenuCalculator, { type MenuCalcAdd } from "./MenuCalculator"
import MenuFicha from "./MenuFicha"
import { IND, fmt } from "./menuFormat"
import { calcularCosto } from "@/lib/menuFicha"
import type { Menu, Recipe, Ingrediente, MenuIndicator } from "@/types/domain"
import {
  getMenus, getMenuById, getMenuCosto, createMenu, updateMenu, deleteMenu,
  getRecipes, getRecipeCost, getIngredientes, getListaCompras,
} from "@/lib/api"
import type { CreateMenuPayload } from "@/lib/api"
import { usePermissions } from "@/hooks/usePermissions"
import ModuleLocked from "@/components/app/ModuleLocked"
import { useHelpAvailable } from "@/hooks/useHelpAvailable"
import { useRevalidateOnboarding } from "@/hooks/useOnboardingChecklist"

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })

/** Hoy en fecha local (YYYY-MM-DD): los menús nuevos se guardan con esta. */
const hoyLocal = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

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

let lineItemSeq = 0
const nextLineItemUid = () => `new-${++lineItemSeq}`

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

// ═══════════════════════════════════════════════════════════════════════════════
// VISTA DETALLE / CREAR
// ═══════════════════════════════════════════════════════════════════════════════
function DetailView({
  menu,
  availableRecipes,
  availableIngredients,
  onSaved,
  onDirtyChange,
}: {
  menu: Menu | null
  availableRecipes: Recipe[]
  availableIngredients: Ingrediente[]
  onSaved: () => void
  /** Avisa a la página si quedan datos sin guardar (guard de pestañas) */
  onDirtyChange: (dirty: boolean) => void
}) {
  const isNew = menu === null

  // La fecha ya no se elige: los menús nuevos se guardan con la de hoy y al
  // editar se conserva la original.
  const [fecha] = useState(menu?.fecha ?? hoyLocal())
  // El nombre se escribe en el modal de resultado, junto a "Guardar": un menú
  // nuevo arranca sin nombre (se ve el placeholder) y al editar, con el original.
  const [nombre, setNombre] = useState(menu?.nombre ?? "")
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
  const [resultOpen, setResultOpen] = useState(false)

  // Datos escritos sin guardar: cambiar de pestaña pide confirmación. La
  // firma excluye campos que cambian solo por cargas asíncronas (costos).
  const sig = JSON.stringify({
    nombre, fecha, numPersonas, margenSeguridad, pctMateriaPrima, notas,
    items: lineItems.map((i) => [i.componentType, i.recipeId, i.ingredientId, i.cantidadGramos]),
  })
  const baselineRef = useRef(sig)
  useEffect(() => {
    onDirtyChange(sig !== baselineRef.current)
  }, [sig, onDirtyChange])

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

  // Selector de platos con la lista de recetas del módulo Recetas
  const [recipePickerOpen, setRecipePickerOpen] = useState(false)
  const [recipePickerTarget, setRecipePickerTarget] = useState<string | null>(null)

  // Cambios de la calculadora del menú → states del formulario
  function handleCalcChange(field: "persons" | "margin" | "pctMP", raw: string) {
    if (field === "persons") setNumPersonas(raw)
    else if (field === "margin") setMargenSeguridad(raw)
    else setPctMateriaPrima(raw)
  }

  // Valores con que abrió la vista: con ellos arranca "Limpiar" en la calculadora
  const [calcReset] = useState(() => ({
    persons: numPersonas,
    margin: margenSeguridad,
    pctMP: pctMateriaPrima,
  }))

  /** Agrega desde la calculadora: receta (con costo) o ingrediente, con sus gramos por porción */
  function addFromCalc({ componentType, id, grams }: MenuCalcAdd) {
    const uid = nextLineItemUid()
    if (componentType === "recipe") {
      const recipe = availableRecipes.find((r) => r.id === id)
      setLineItems((prev) => [
        ...prev,
        { ...newLineItem(uid, prev.length, "recipe"), recipeId: id, nombre: recipe?.name ?? "", cantidadGramos: grams },
      ])
      void fetchRecipeCost(uid, id)
      return
    }
    const ing = availableIngredients.find((i) => i.id === id)
    setLineItems((prev) => [
      ...prev,
      {
        ...newLineItem(uid, prev.length, "ingredient"),
        ingredientId: id,
        nombre: ing?.name ?? "",
        // Extras: costo por UNIDAD directo del catálogo, sin fetch
        costoGramo: ing ? parseFloat(ing.costPerUnit) : null,
        cantidadGramos: grams,
      },
    ])
  }

  /** Abre la lista de recetas: targetUid = null agrega un plato nuevo, con uid cambia el de esa línea */
  function openRecipePicker(targetUid: string | null) {
    setRecipePickerTarget(targetUid)
    setRecipePickerOpen(true)
  }

  function handlePickRecipe(recipe: Recipe) {
    setRecipePickerOpen(false)
    if (recipePickerTarget) {
      selectRecipe(recipePickerTarget, recipe.id)
      return
    }
    const uid = nextLineItemUid()
    setLineItems((prev) => [
      ...prev,
      { ...newLineItem(uid, prev.length, "recipe"), recipeId: recipe.id, nombre: recipe.name },
    ])
    void fetchRecipeCost(uid, recipe.id)
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

  function handleCalcular() {
    if (!costo) {
      setError(
        "No se puede calcular: agrega al menos un plato con costo, define el número de personas y el % de materia prima."
      )
      return
    }
    setError(null)
    setResultOpen(true)
  }

  async function handleSave() {
    if (!nombre.trim()) { setError("El nombre del menú es obligatorio"); return }
    if (validItems.length === 0) { setError("Agrega al menos una receta con costo calculado"); return }
    const personas = parseInt(numPersonas)
    if (!personas || personas < 1) { setError("Define el número de personas en la calculadora"); return }
    const pct = parseFloat(pctMateriaPrima)
    if (!(pct > 0)) { setError("Define el % de materia prima en la calculadora"); return }
    setSaving(true)
    setError(null)
    const payload: CreateMenuPayload = {
      nombre: nombre.trim(),
      fecha: isNew ? hoyLocal() : fecha,
      numPersonas: personas,
      margenSeguridad: parseFloat(margenSeguridad) || 0,
      pctMateriaPrima: pct,
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

      {/* ── Barra superior: acciones ── */}
      <div className="flex flex-wrap items-center justify-end gap-3 mb-6">
        {error && !resultOpen && (
          <span role="alert" className="text-sm break-words" style={{ color: "var(--error)" }}>{error}</span>
        )}
        {!isNew && (
          <Button variant="ghost" onClick={() => setShoppingOpen(true)}>
            <ShoppingCart size={14} />
            Lista de compras
          </Button>
        )}
      </div>

      {/* Modal: lista de compras (aquí SÍ es un modal independiente — DetailView es una página, no otro modal) */}
      {!isNew && (
        <Modal
          open={shoppingOpen}
          onClose={() => setShoppingOpen(false)}
          title={`Lista de compras — ${menu!.nombre}`}
          wide
          blur
          footer={<ShoppingListFooter menuId={menu!.id} onBack={() => setShoppingOpen(false)} backLabel="Cerrar" />}
        >
          <ShoppingListBody menuId={menu!.id} />
        </Modal>
      )}

      {/* ── Contenido: calculadora (izq.) + platos, extras y notas (der.) ── */}
      <div className="w-full max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* Columna izquierda: calculadora del menú (sin tarjeta: el aparato se ve directo) */}
          <MenuCalculator
            key={menu?.id ?? "new"}
            values={{ persons: numPersonas, margin: margenSeguridad, pctMP: pctMateriaPrima }}
            resetValues={calcReset}
            itemCount={lineItems.length}
            costoPorcion={costo ? costo.costoTotalPorcion : null}
            loading={lineItems.some((i) => i.costoLoading)}
            
            onChange={handleCalcChange}
            recipes={availableRecipes.map((r) => ({ id: r.id, name: r.name }))}
            ingredients={availableIngredients.map((i) => ({ id: i.id, name: i.name }))}
            onAddItem={addFromCalc}
            onCalculate={handleCalcular}
          />

          {/* Columna derecha: platos, extras y notas */}
          <div className="flex flex-col gap-4">

          {/* Recetas del menú */}
          <Card>
            <div className="flex items-center justify-between gap-2 mb-4">
              <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                PLATOS Y EXTRAS DEL MENÚ
              </p>
              {lineItems.length > 0 && (
                <span
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums"
                  style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}
                >
                  {lineItems.length}
                </span>
              )}
            </div>

            {lineItems.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-8 text-center gap-3 rounded-xl"
                style={{ border: "1.5px dashed var(--border-medium)" }}
              >
                <ChefHat size={28} style={{ color: "var(--text-muted)" }} />
                {availableRecipes.length === 0 ? (
                  <p className="text-sm px-4" style={{ color: "var(--text-muted)" }}>
                    Primero crea tus recetas en la sección <strong>Recetas</strong>, luego vuelve aquí para armar el menú.
                  </p>
                ) : (
                  <p className="text-sm px-4" style={{ color: "var(--text-muted)" }}>
                    Agrega los platos que incluye este menú con el botón <strong>Agregar a la lista</strong> de la calculadora
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {lineItems.map((item) => {
                  const costoPorcion = item.costoGramo !== null
                    ? parseFloat(item.cantidadGramos) * item.costoGramo
                    : item.rawCostPerServing
                  return (
                    <div key={item.uid} className="flex items-center gap-2 px-3 py-2 rounded-xl transition-shadow hover:shadow-sm"
                      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}>
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
                        ) : item.recipeId ? (
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate text-sm" style={{ color: "var(--text-primary)" }}>
                              {item.nombre}
                            </span>
                            <button
                              type="button"
                              onClick={() => openRecipePicker(item.uid)}
                              className="shrink-0 transition-opacity hover:opacity-70"
                              style={{ color: "var(--text-muted)" }}
                              title="Cambiar receta"
                              aria-label={`Cambiar receta ${item.nombre}`}
                            >
                              <Pencil size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openRecipePicker(item.uid)}
                            className="text-xs font-medium transition-opacity hover:opacity-70"
                            style={{ color: "var(--text-accent, #1B4FD8)" }}
                          >
                            Elegir receta
                          </button>
                        )}
                      </div>

                      {/* Cantidad (g por persona para recetas, unidades por persona para extras) */}
                      <div
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm tabular-nums"
                        style={{ flexShrink: 0, background: "var(--bg-secondary)", color: "var(--text-secondary)" }}
                        title="Para cambiar la cantidad, quita el ítem y agrégalo de nuevo desde la calculadora"
                      >
                        <span>{item.cantidadGramos}</span>
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
                        type="button"
                        onClick={() => removeLineItem(item.uid)}
                        aria-label={`Quitar ${item.nombre || "ítem"} de la lista`}
                        title="Quitar de la lista"
                        className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-secondary)]"
                        style={{ color: "var(--text-muted)", flexShrink: 0 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}

                {/* Total */}
                {costo && (
                  <div className="flex justify-between px-3 py-2.5 mt-1 text-sm font-semibold rounded-xl"
                    style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}>
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
        </div>
      </div>

      {/* ── Modal: selector de platos (lista de recetas) ───────────────────── */}
      <RecipePickerModal
        open={recipePickerOpen}
        recipes={availableRecipes}
        onClose={() => setRecipePickerOpen(false)}
        onSelect={handlePickRecipe}
      />

      {/* ── Modal: resultado del cálculo (fondo desenfocado) ── */}
      <Modal
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        title="Resultado del cálculo"
        wide
        blur
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="min-w-0 flex-1 sm:max-w-sm">
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                maxLength={120}
                placeholder="Nombre del menú (ej. Cumpleaños de Tuty)"
                aria-label="Nombre del menú"
                disabled={success}
                className="w-full h-10 rounded-xl px-3 text-sm outline-none"
                style={{
                  background: "var(--bg-surface)",
                  border: `1px solid ${error && !nombre.trim() ? "var(--error)" : "var(--border-medium)"}`,
                  color: "var(--text-primary)",
                }}
              />
              {success && (
                <span role="status" className="text-xs mt-1 flex items-center gap-1.5" style={{ color: "#166534" }}>
                  <CheckCircle2 size={13} />
                  Guardado
                </span>
              )}
              {error && !success && (
                <span role="alert" className="text-xs mt-1 block break-words" style={{ color: "var(--error)" }}>{error}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
              <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setResultOpen(false)}>
                Cerrar
              </Button>
              <Button
                variant="primary"
                className="w-full sm:w-auto"
                loading={saving}
                disabled={!nombre.trim() || validItems.length === 0 || success}
                onClick={handleSave}
              >
                {isNew ? "Guardar menú" : "Guardar cambios"}
              </Button>
            </div>
          </div>
        }
      >
        {costo && (
          <div className="flex flex-col gap-5">
            <MenuFicha
              costo={costo}
              numPersonas={nPers}
              margenPct={margin}
              pctMP={pctMP}
              items={validItems.map((item) => {
                const cantidad = parseFloat(item.cantidadGramos)
                const porPorcion = item.costoGramo !== null
                  ? cantidad * item.costoGramo
                  : (item.rawCostPerServing ?? 0)
                return {
                  key: item.uid,
                  nombre: item.nombre,
                  extra: item.componentType === "ingredient",
                  cantidad,
                  unidad: item.componentType === "ingredient" ? "und" : "g",
                  costoUnit: item.costoGramo ?? porPorcion / cantidad,
                }
              })}
            />
          </div>
        )}
      </Modal>
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
      blur
      footer={
        subview === "compras" ? (
          <ShoppingListFooter menuId={menuId} onBack={() => setSubview("detalle")} />
        ) : (
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setSubview("compras")} disabled={!menuId}>
              <ShoppingCart size={14} />
              Lista de compras
            </Button>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
              <Button variant="ghost" className="w-full sm:w-auto" onClick={onClose}>Cerrar</Button>
              <Button variant="primary" className="w-full sm:w-auto" onClick={onEdit}>
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
        <p className="text-sm text-center py-10" style={{ color: "var(--error)" }}>
          No se pudo cargar el menú.
        </p>
      )}

      {/* ═══ Subvista: detalle ═══ */}
      {data && subview === "detalle" && (
        <div className="flex flex-col gap-5">
          {data.costo ? (
            <>
              <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <CalendarDays size={14} />
                <span>Menú del <strong style={{ color: "var(--text-secondary)" }}>{fmtDate(data.fecha)}</strong></span>
              </div>
              <MenuFicha
                costo={data.costo}
                numPersonas={data.numPersonas}
                margenPct={parseFloat(data.margenSeguridad) || 0}
                pctMP={pctMP}
                items={items.map((item) => ({
                  key: item.recipeId,
                  nombre: item.nombre,
                  extra: item.tipo === "ingredient",
                  cantidad: item.cantidadGramos,
                  unidad: item.unidad ?? "g",
                  costoUnit: item.costoGramo,
                }))}
              />
            </>
          ) : (
            <p className="text-sm text-center py-10" style={{ color: "var(--text-muted)" }}>
              Sin análisis de costo disponible.
            </p>
          )}

          {data.notas && (
            <div className="rounded-2xl px-4 py-3" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}>
              <div className="flex items-center gap-2 mb-1.5">
                <StickyNote size={14} style={{ color: "var(--text-muted)" }} />
                <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>
                  NOTAS
                </p>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{data.notas}</p>
            </div>
          )}
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
      <p className="text-sm text-center py-10" style={{ color: "var(--error)" }}>
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
    <div className="flex flex-wrap items-center justify-between w-full gap-3">
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
              style={{ color: "var(--error)" }}>Confirmar</Button>
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
                      style={{ color: "var(--error)" }}>Confirmar</Button>
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
                      style={{ color: "var(--error)" }}
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
      {/* Mobile: bloques a ancho completo (sin columnas que se recorten) */}
      <div className="md:hidden flex flex-col">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-2 px-4 py-4"
            style={{
              borderTop: i === 1 ? undefined : "1px solid var(--border-light)",
              background: i % 2 === 1 ? "var(--bg-surface)" : "var(--bg-primary)",
            }}
          >
            <div className="h-4 rounded" style={{ background: "var(--bg-secondary)", width: "55%" }} />
            <div className="h-3 rounded" style={{ background: "var(--bg-secondary)", width: "40%" }} />
            <div className="h-6 rounded-full self-start" style={{ background: "var(--bg-secondary)", width: "30%" }} />
          </div>
        ))}
      </div>

      {/* Desktop: columnas de la tabla */}
      <div className="hidden md:block">
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
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
type PageView = "list" | "detail"

export default function MenuPage() {
  useHelpAvailable()
  const { can, hasFeature, featureLockedMessage, isLoading: permsLoading } = usePermissions()
  const revalidateOnboarding = useRevalidateOnboarding()
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

  // Al cargar, la pestaña inicial es la Calculadora (si el rol puede crear
  // menús); el Historial solo se muestra al elegirlo o si no hay permiso.
  const [chosenView, setView] = useState<PageView | null>(null)
  const view: PageView = chosenView ?? (can("menus", "create") ? "detail" : "list")
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [viewingMenuId, setViewingMenuId] = useState<string | null>(null)
  // Datos escritos sin guardar en la calculadora + confirmación de salida
  const [calcDirty, setCalcDirty] = useState(false)
  const [exitConfirm, setExitConfirm] = useState(false)

  useEffect(() => {
    function handleHelp() { setHelpOpen(true) }
    window.addEventListener("open-help", handleHelp)
    return () => window.removeEventListener("open-help", handleHelp)
  }, [])

  /** Cambio de pestaña: salir de la calculadora con datos sin guardar pide confirmación. */
  function switchView(next: PageView) {
    if (next === view) return
    if (next === "list" && calcDirty) {
      setExitConfirm(true)
      return
    }
    if (next === "detail") setCalcDirty(false)
    setExitConfirm(false)
    setView(next)
    scrollMainToTop()
  }

  /** Salida aceptada de la calculadora (tras guardar o con la confirmación visible). */
  function backToHistory() {
    setCalcDirty(false)
    setExitConfirm(false)
    setView("list")
    scrollMainToTop()
  }

  async function openEdit(menu: Menu) {
    try {
      const res = await getMenuById(menu.id)
      setEditingMenu(res.data)
    } catch {
      setEditingMenu(menu)
    }
    switchView("detail")
  }

  function openCreate() {
    setEditingMenu(null)
    switchView("detail")
  }

  async function handleDelete(id: string) {
    try {
      await deleteMenu(id)
      await mutateMenus()
      revalidateOnboarding()
    } catch {
      // silencioso
    }
  }

  async function handleSaved() {
    setCalcDirty(false)
    setExitConfirm(false)
    await mutateMenus()
    revalidateOnboarding()
    setView("list")
    scrollMainToTop()
  }

  // Mientras cargan los permisos no se sabe si el módulo está habilitado —
  // no mostrar "módulo bloqueado" por un instante a quien sí lo tiene.
  if (permsLoading) return null

  if (!hasFeature("module_menus")) {
    return <ModuleLocked message={featureLockedMessage("module_menus")} />
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    borderRadius: "var(--radius-sm)",
    ...(active
      ? { background: "var(--bg-surface)", color: "var(--text-primary)", boxShadow: "var(--shadow-sm)" }
      : { color: "var(--text-muted)" }),
  })

  // La ayuda debe abrir también dentro de la calculadora (el botón de la app sigue visible).
  const helpModal = (
    <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Menús" blur>
      <div className="flex flex-col gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
        <p>Esta sección te permite crear y gestionar menús para eventos y servicios, agrupando platos y calculando costos.</p>

        <div>
          <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Cómo usarla:</p>
          <ul className="flex flex-col gap-2 ml-1">
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Calculadora:</strong> en las pestañas del encabezado toca &quot;Calculadora&quot; para armar un menú nuevo. Para retomar uno guardado, ábrelo desde el historial con &quot;Editar&quot;.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Parámetros:</strong> número de personas, margen de seguridad y % de materia prima se ajustan con el teclado de la calculadora; la fecha se pone sola al guardar el menú.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Agregar platos:</strong> elige <strong>Recetas</strong> o <strong>Ingredientes</strong>, búscalo en el selector, escribe con el teclado los gramos (o unidades) por porción y pulsa <strong>Agregar a la lista</strong>; el producto queda en la lista de la derecha.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Calcular:</strong> pulsa &quot;Calcular&quot; y el resultado se abre en un modal: precio sugerido, indicador de rentabilidad, reparto de precios y el desglose por plato. Desde ahí guarda el menú.</span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: "var(--accent)" }}>•</span>
              <span><strong>Historial:</strong> en la pestaña &quot;Historial&quot; consulta tus menús guardados, ver su detalle y lista de compras, o elimínalos.</span>
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
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Menús"
        subtitle="Para eventos y servicios: agrupa platos, define gramos por porción y calcula el precio por persona"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Pestañas de vista — mismo patrón que el módulo de Valoración */}
            <div
              className="hidden sm:flex items-center gap-1 p-1 shrink-0"
              style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}
            >
              <button
                type="button"
                onClick={() => { if (view === "list" && can("menus", "create")) openCreate() }}
                className="px-3 py-1.5 text-sm font-medium transition-colors"
                style={tabStyle(view === "detail")}
              >
                Calculadora
              </button>
              <button
                type="button"
                onClick={() => switchView("list")}
                className="px-3 py-1.5 text-sm font-medium transition-colors"
                style={tabStyle(view === "list")}
              >
                Historial
              </button>
            </div>
            <button
              type="button"
              onClick={() => (view === "detail" ? switchView("list") : can("menus", "create") && openCreate())}
              className="sm:hidden flex items-center gap-1.5 h-10 px-3.5 text-sm font-semibold shrink-0"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {view === "detail" ? (
                <>
                  <History size={16} style={{ color: "var(--text-muted)" }} />
                  Historial
                </>
              ) : (
                <>
                  <Calculator size={16} style={{ color: "var(--text-muted)" }} />
                  Calculadora
                </>
              )}
            </button>
          </div>
        }
      />

      {view === "detail" && exitConfirm && (
        <div
          role="alertdialog"
          aria-label="Salir sin guardar"
          className="flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center"
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E" }}
        >
          <p className="text-sm flex-1">Lo que escribiste no se ha guardado y se perderá si sales.</p>
          <div className="flex gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => setExitConfirm(false)}
              className="h-9 px-3 rounded-lg text-sm font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Seguir editando
            </button>
            <button
              type="button"
              onClick={backToHistory}
              className="h-9 px-3 rounded-lg text-sm font-semibold"
              style={{ background: "transparent", color: "#92400E", border: "1px solid #FDE68A" }}
            >
              Salir sin guardar
            </button>
          </div>
        </div>
      )}

      {view === "detail" ? (
        <DetailView
          // Reiniciar el formulario al cambiar de menú (nuevo / editar)
          key={editingMenu?.id ?? "new"}
          menu={editingMenu}
          availableRecipes={availableRecipes}
          availableIngredients={availableIngredients}
          onSaved={handleSaved}
          onDirtyChange={setCalcDirty}
        />
      ) : (
        <>
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
        </>
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

      {helpModal}
    </div>
  )
}
