"use client"

import { useState, useEffect, useMemo, startTransition } from "react"
import useSWR from "swr"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import SearchableSelect from "@/components/ui/SearchableSelect"
import type { Ingrediente as Ingredient, Recipe } from "@/types/domain"
import type { RecipeItemPayload } from "@/lib/api"
import { createRecipe, updateRecipe, getRecipeById, getBaseRecipes, fetchAPI } from "@/lib/api"
import { Plus, Trash2, GripVertical, AlertCircle, CheckCircle2, ChefHat, Info } from "lucide-react"


interface ItemDraft {
  _key: string
  componentType: "ingredient" | "recipe"
  ingredientId: string
  subRecipeId: string
  quantityG: string
}

interface HeaderForm {
  name: string
  servings: string
  servingWeightG: string
  safetyMargin: string
  isBase: boolean
  description: string
}

export interface RecipePayload {
  name: string
  recipeNumber: string
  servings: number
  servingWeightG?: number
  safetyMargin: number
  isBase: boolean
  description?: string | null
  items: RecipeItemPayload[]
}

/**
 * Fuente de datos inyectable: el MISMO formulario sirve al Tenant Workspace
 * (recetas de la organización) y al Content Studio del banco público
 * (Platform Console), con distinto submit handler y distinto catálogo.
 */
export interface RecipeFormDataSource {
  /** Clave para el caché SWR — debe diferir entre superficies */
  sourceKey: string
  loadCatalog: () => Promise<{ ingredients: Ingredient[]; baseRecipes: Recipe[] }>
  loadRecipe: (id: string) => Promise<Recipe>
  create: (payload: RecipePayload) => Promise<unknown>
  update: (id: string, payload: RecipePayload) => Promise<unknown>
}

/** Fuente por defecto: recetas del tenant activo */
const TENANT_SOURCE: RecipeFormDataSource = {
  sourceKey: "tenant",
  loadCatalog: async () => {
    const [ingRes, baseRes] = await Promise.all([
      fetchAPI("/api/v1/ingredients").catch(() => ({ data: [] })),
      getBaseRecipes().catch(() => ({ data: [] })),
    ])
    return { ingredients: (ingRes as { data: Ingredient[] }).data ?? [], baseRecipes: baseRes.data ?? [] }
  },
  loadRecipe: (id) => getRecipeById(id).then((r) => r.data),
  create: (payload) => createRecipe(payload),
  update: (id, payload) => updateRecipe(id, payload),
}

interface RecipeFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editRecipeId?: string | null
  dataSource?: RecipeFormDataSource
}

function emptyItem(): ItemDraft {
  return {
    _key: crypto.randomUUID(),
    componentType: "ingredient",
    ingredientId: "",
    subRecipeId: "",
    quantityG: "",
  }
}

export default function RecipeFormModal({
  open,
  onClose,
  onSaved,
  editRecipeId,
  dataSource = TENANT_SOURCE,
}: RecipeFormModalProps) {
  const isEditing = !!editRecipeId

  const [form, setForm] = useState<HeaderForm>({
    name: "",
    servings: "",
    servingWeightG: "",
    safetyMargin: "3",
    isBase: false,
    description: "",
  })

  const [items, setItems] = useState<ItemDraft[]>([emptyItem()])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = "move"
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    const updatedItems = [...items]
    const [draggedItem] = updatedItems.splice(draggedIndex, 1)
    updatedItems.splice(index, 0, draggedItem)
    setDraggedIndex(index)
    setItems(updatedItems)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [baseRecipes, setBaseRecipes] = useState<Recipe[]>([])

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { isLoading: catalogLoading } = useSWR(
    open ? ["recipes-catalog", dataSource.sourceKey] : null,
    async () => {
      const catalog = await dataSource.loadCatalog()
      setIngredients(catalog.ingredients)
      setBaseRecipes(catalog.baseRecipes)
    },
  )

  const { data: editData, isLoading: loadingRecipe } = useSWR(
    open && editRecipeId ? ["recipe-edit", dataSource.sourceKey, editRecipeId] : null,
    () => dataSource.loadRecipe(editRecipeId!),
  )

  useEffect(() => {
    if (!open) return
    if (editData) {
      startTransition(() => {
        setForm({
          name: editData.name,
          servings: editData.servings,
          servingWeightG: editData.servingWeightG ?? "",
          safetyMargin: editData.safetyMargin,
          isBase: editData.isBase,
          description: editData.description ?? "",
        })
        if (editData.items && editData.items.length > 0) {
          setItems(
            editData.items.map((item) => ({
              _key: crypto.randomUUID(),
              componentType: item.componentType,
              ingredientId: item.ingredientId ?? "",
              subRecipeId: item.subRecipeId ?? "",
              quantityG: item.quantityG,
            }))
          )
        } else {
          setItems([emptyItem()])
        }
      })
    } else if (!editRecipeId) {
      startTransition(() => {
        setForm({
          name: "",
          servings: "",
          servingWeightG: "",
          safetyMargin: "3",
          isBase: false,
          description: "",
        })
        setItems([emptyItem()])
      })
    }
  }, [open, editData, editRecipeId])

  function addItem() {
    setItems((prev) => [...prev, emptyItem()])
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i._key !== key))
  }

  function updateItem(key: string, patch: Partial<ItemDraft>) {
    setItems((prev) =>
      prev.map((i) => {
        if (i._key !== key) return i
        const updated = { ...i, ...patch }
        if (patch.componentType) {
          updated.ingredientId = ""
          updated.subRecipeId = ""
        }
        return updated
      })
    )
  }

  // ── Resumen en vivo ──────────────────────────────────────────────────────
  const totalWeightG = useMemo(
    () => items.reduce((s, i) => s + (parseFloat(i.quantityG) || 0), 0),
    [items],
  )

  const servingsNum = useMemo(() => {
    const n = parseInt(form.servings, 10)
    return isNaN(n) || n <= 0 ? 0 : n
  }, [form.servings])

  const autoServingWeightG = useMemo(() => {
    if (servingsNum <= 0 || totalWeightG <= 0) return null
    return (totalWeightG / servingsNum).toFixed(1)
  }, [totalWeightG, servingsNum])

  const estimatedCost = useMemo(() => {
    let total = 0
    for (const item of items) {
      const qty = parseFloat(item.quantityG) || 0
      if (qty <= 0) continue
      if (item.componentType === "ingredient" && item.ingredientId) {
        const ing = ingredients.find((i) => i.id === item.ingredientId)
        if (ing) total += qty * parseFloat(ing.costPerGram)
      }
    }
    const margin = parseFloat(form.safetyMargin) || 0
    return total * (1 + margin / 100)
  }, [items, ingredients, form.safetyMargin])

  const estimatedCostPerServing = useMemo(() => {
    if (servingsNum <= 0) return 0
    return estimatedCost / servingsNum
  }, [estimatedCost, servingsNum])

  // ── Guardado ─────────────────────────────────────────────────────────────
  async function handleSave() {
    setFormError(null)

    if (!form.name.trim()) return setFormError("El nombre de la receta es requerido.")
    if (!servingsNum || servingsNum <= 0)
      return setFormError("Las porciones deben ser un número entero positivo.")
    const safetyMargin = parseFloat(form.safetyMargin)
    if (isNaN(safetyMargin) || safetyMargin < 0 || safetyMargin > 5)
      return setFormError("El margen de seguridad debe estar entre 0% y 5%.")

    if (items.length === 0) return setFormError("La receta debe tener al menos un componente.")
    for (const item of items) {
      if (item.componentType === "ingredient" && !item.ingredientId)
        return setFormError("Selecciona un ingrediente en cada fila.")
      if (item.componentType === "recipe" && !item.subRecipeId)
        return setFormError("Selecciona una sub-receta en cada fila.")
      const qty = parseFloat(item.quantityG)
      if (!item.quantityG || isNaN(qty) || qty <= 0)
        return setFormError("La cantidad en gramos debe ser positiva en todos los componentes.")
    }

    setSaving(true)
    try {
      const servingWeightG = form.servingWeightG
        ? parseFloat(form.servingWeightG)
        : autoServingWeightG
          ? parseFloat(autoServingWeightG)
          : undefined

      const recipeNumber = `R-${Date.now().toString(36).toUpperCase().slice(-5)}`

      const payload: RecipePayload = {
        name: form.name.trim(),
        recipeNumber,
        servings: servingsNum,
        servingWeightG,
        safetyMargin,
        isBase: form.isBase,
        description: form.description.trim() || null,
        items: items.map(
          (item, idx): RecipeItemPayload => ({
            componentType: item.componentType,
            ingredientId: item.componentType === "ingredient" ? item.ingredientId : undefined,
            subRecipeId: item.componentType === "recipe" ? item.subRecipeId : undefined,
            quantityG: parseFloat(item.quantityG),
            sortOrder: idx,
          })
        ),
      }

      if (isEditing && editRecipeId) {
        await dataSource.update(editRecipeId, payload)
      } else {
        await dataSource.create(payload)
      }

      setSuccess(true)
      onSaved() // revalidar de una — la lista se actualiza mientras cierra el modal
      setTimeout(() => {
        onClose()
      }, 350)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al guardar la receta."
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar receta" : "Nueva receta"}
      wide
      footer={
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            id="btn-save-recipe"
            variant="primary"
            loading={saving}
            onClick={handleSave}
          >
            <ChefHat size={16} />
            {isEditing ? "Guardar cambios" : "Crear receta"}
          </Button>
        </div>
      }
    >
      {loadingRecipe ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <LoadingSpinner size={32} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Sección 1: Info general */}
          <section
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "var(--accent-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>1</span>
              </div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Información general
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr]" style={{ gap: "12px" }}>
              <div>
                <Input
                  id="recipe-name"
                  label="Nombre de la receta"
                  placeholder="Ej. Arroz con pollo"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <Input
                id="recipe-servings"
                label="Porciones"
                type="number"
                min="1"
                step="1"
                placeholder="Ej. 10"
                value={form.servings}
                onChange={(e) => setForm((f) => ({ ...f, servings: e.target.value }))}
              />
            </div>

            {/* Descripción */}
            <div style={{ marginTop: "12px" }}>
              <label
                htmlFor="recipe-description"
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Descripción (opcional)
              </label>
              <textarea
                id="recipe-description"
                rows={2}
                placeholder="Breve descripción del plato…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: "1px solid var(--border-light)",
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: "12px", marginTop: "12px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
                <div style={{ flex: 1 }}>
                  <Input
                    id="recipe-margin"
                    label="Margen seguridad (%)"
                    type="number"
                    min="0"
                    max="5"
                    step="0.5"
                    placeholder="3"
                    value={form.safetyMargin}
                    onChange={(e) => setForm((f) => ({ ...f, safetyMargin: e.target.value }))}
                  />
                </div>
                <div style={{ position: "relative", paddingBottom: "8px" }} className="group">
                  <Info
                    size={14}
                    style={{ color: "var(--text-muted)", cursor: "help" }}
                  />
                  <div
                    style={{
                      display: "none",
                      position: "absolute",
                      bottom: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      marginBottom: "8px",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      background: "#1E293B",
                      color: "#fff",
                      fontSize: "11px",
                      lineHeight: "1.5",
                      width: "240px",
                      zIndex: 50,
                      pointerEvents: "none",
                    }}
                    className="group-hover:!block"
                  >
                    <strong>¿Qué es el margen de seguridad?</strong>
                    <br />
                    Es un porcentaje (0–5%) que se añade al costo de materia prima para cubrir variaciones de precio, mermas inesperadas o cambios en el mercado. Ejemplo: si el costo es $10.000 y el margen es 3%, el costo ajustado es $10.300.
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        border: "5px solid transparent",
                        borderTopColor: "#1E293B",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Toggle: receta base */}
              <label
                htmlFor="recipe-is-base"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  paddingBottom: "8px",
                }}
              >
                <div
                  onClick={() => setForm((f) => ({ ...f, isBase: !f.isBase }))}
                  style={{
                    position: "relative",
                    width: "36px",
                    height: "20px",
                    borderRadius: "100px",
                    background: form.isBase ? "var(--accent)" : "var(--border-medium)",
                    transition: "background 0.2s ease",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: form.isBase ? "18px" : "2px",
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "left 0.2s ease",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
                <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  Receta base (sub-receta en otras fichas)
                </p>
              </label>
            </div>
          </section>

          {/* Sección 2: Componentes */}
          <section
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: "var(--accent-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>2</span>
                </div>
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  Ingredientes y sub-recetas ({items.length})
                </h3>
              </div>
              {catalogLoading && <LoadingSpinner size={14} />}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "24px 100px 1fr 80px 32px",
                gap: "8px",
                padding: "6px 12px",
                marginBottom: "6px",
              }}
            >
              {["", "Tipo", "Componente", "Cantidad (g)", "del"].map((h, i) => (
                <p
                  key={i}
                  className="text-xs font-semibold"
                  style={{ color: "var(--text-muted)", textAlign: h === "Cantidad (g)" ? "right" : "left" }}
                >
                  {h === "del" ? "" : h}
                </p>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {items.map((item, idx) => (
                <ItemRow
                  key={item._key}
                  item={item}
                  index={idx}
                  ingredients={ingredients}
                  baseRecipes={baseRecipes}
                  onUpdate={(patch) => updateItem(item._key, patch)}
                  onRemove={() => removeItem(item._key)}
                  canRemove={items.length > 1}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === idx}
                />
              ))}
            </div>

            <Button
              id="btn-add-item"
              variant="ghost"
              size="sm"
              onClick={addItem}
              style={{ marginTop: "10px" }}
            >
              <Plus size={14} />
              Agregar componente
            </Button>
          </section>

          {/* Sección 3: Resumen en vivo */}
          <section
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  background: "var(--accent-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span className="text-xs font-bold" style={{ color: "var(--accent)" }}>3</span>
              </div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Resumen
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: "10px" }}>
              <SummaryItem
                label="Peso total"
                value={totalWeightG > 0 ? `${totalWeightG.toFixed(0)} g` : "—"}
              />
              <SummaryItem
                label="Peso porción"
                value={autoServingWeightG ? `${autoServingWeightG} g` : "—"}
              />
              <SummaryItem
                label="Costo estimado"
                value={estimatedCost > 0 ? COP.format(estimatedCost) : "—"}
              />
              <SummaryItem
                label="Costo por porción"
                value={estimatedCostPerServing > 0 ? COP.format(estimatedCostPerServing) : "—"}
                accent
              />
            </div>
          </section>

          {formError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: "#B42020",
              }}
            >
              <AlertCircle size={16} />
              <p className="text-sm">{formError}</p>
            </div>
          )}

          {success && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                color: "#166534",
              }}
            >
              <CheckCircle2 size={16} />
              <p className="text-sm font-medium">
                {isEditing ? "Receta actualizada." : "Receta creada."}
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

// ── ItemRow ───────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: ItemDraft
  index: number
  ingredients: Ingredient[]
  baseRecipes: Recipe[]
  onUpdate: (patch: Partial<ItemDraft>) => void
  onRemove: () => void
  canRemove: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnd: () => void
  isDragging: boolean
}

function ItemRow({
  item,
  ingredients,
  baseRecipes,
  onUpdate,
  onRemove,
  canRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}: ItemRowProps) {
  const isIngredient = item.componentType === "ingredient"

  const handleMouseDown = (e: React.MouseEvent) => {
    const row = e.currentTarget.closest(".draggable-row") as HTMLElement
    if (row) row.setAttribute("draggable", "true")
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    const row = e.currentTarget.closest(".draggable-row") as HTMLElement
    if (row) row.setAttribute("draggable", "false")
  }

  const ingredientOptions = useMemo(() => {
    return ingredients.map((ing) => ({
      value: ing.id,
      label: `${ing.name} (${parseFloat(ing.costPerGram).toFixed(2)} $/g)`,
    }))
  }, [ingredients])

  const recipeOptions = useMemo(() => {
    return baseRecipes.map((r) => ({
      value: r.id,
      label: `${r.name} (N.° ${r.recipeNumber})`,
    }))
  }, [baseRecipes])

  return (
    <div
      className="draggable-row"
      draggable={isDragging}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      style={{
        display: "grid",
        gridTemplateColumns: "24px 100px 1fr 80px 32px",
        gap: "8px",
        alignItems: "center",
        padding: "8px 10px",
        borderRadius: "10px",
        background: "var(--bg-surface)",
        border: isDragging ? "1px dashed var(--accent)" : "1px solid var(--border-light)",
        opacity: isDragging ? 0.5 : 1,
        transition: "all 0.15s ease",
      }}
    >
      <div
        className="drag-handle"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{ display: "flex", alignItems: "center", cursor: "grab" }}
      >
        <GripVertical size={14} style={{ color: "var(--border-medium)" }} />
      </div>

      <select
        aria-label="Tipo de componente"
        value={item.componentType}
        onChange={(e) => onUpdate({ componentType: e.target.value as "ingredient" | "recipe" })}
        style={{
          height: "34px",
          borderRadius: "8px",
          border: "1px solid var(--border-light)",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          fontSize: "12px",
          padding: "0 6px",
          cursor: "pointer",
        }}
      >
        <option value="ingredient">Ingrediente</option>
        <option value="recipe">Sub-receta</option>
      </select>

      {isIngredient ? (
        <SearchableSelect
          options={ingredientOptions}
          value={item.ingredientId}
          onChange={(val) => onUpdate({ ingredientId: val })}
          placeholder="Selecciona..."
          emptyMessage="Sin resultados"
          ariaLabel="Ingrediente"
        />
      ) : (
        <SearchableSelect
          options={recipeOptions}
          value={item.subRecipeId}
          onChange={(val) => onUpdate({ subRecipeId: val })}
          placeholder="Selecciona..."
          emptyMessage="Sin resultados"
          ariaLabel="Sub-receta"
        />
      )}

      <input
        type="number"
        aria-label="Cantidad en gramos"
        placeholder="g"
        min="0.1"
        step="1"
        value={item.quantityG}
        onChange={(e) => onUpdate({ quantityG: e.target.value })}
        style={{
          height: "34px",
          borderRadius: "8px",
          border: "1px solid var(--border-light)",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          fontSize: "13px",
          padding: "0 8px",
          outline: "none",
          textAlign: "right",
        }}
      />

      <button
        aria-label="Eliminar componente"
        onClick={onRemove}
        disabled={!canRemove}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "28px",
          height: "28px",
          borderRadius: "6px",
          border: "none",
          background: "transparent",
          color: canRemove ? "#B42020" : "var(--border-medium)",
          cursor: canRemove ? "pointer" : "not-allowed",
        }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function SummaryItem({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "8px",
        background: accent ? "var(--accent-light)" : "var(--bg-surface)",
        border: accent ? "1px solid var(--accent)" : "1px solid var(--border-light)",
      }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)", marginBottom: "2px" }}>
        {label}
      </p>
      <p
        className="text-sm font-bold"
        style={{ color: accent ? "var(--accent)" : "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  )
}

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})
