"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import PageHeader from "@/components/ui/PageHeader"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import Modal from "@/components/ui/Modal"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import SearchableSelect from "@/components/ui/SearchableSelect"
import type { Ingrediente as Ingredient, Recipe } from "@/types/domain"
import type { RecipeItemPayload } from "@/lib/api"
import { createRecipe, getBaseRecipes } from "@/lib/api"
import {
  ArrowLeft, Plus, Trash2, ChefHat, Package,
  GripVertical, AlertCircle, CheckCircle2
} from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

// ── Tipos locales ─────────────────────────────────────────────────────────────

interface ItemDraft {
  _key: string
  componentType: "ingredient" | "recipe"
  ingredientId: string
  subRecipeId: string
  quantityG: string
}

interface HeaderForm {
  name: string
  recipeNumber: string
  servings: string
  servingWeightG: string
  safetyMargin: string
  isBase: boolean
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NuevaRecetaPage() {
  const router = useRouter()

  // Header form
  const [form, setForm] = useState<HeaderForm>({
    name: "",
    recipeNumber: "",
    servings: "",
    servingWeightG: "",
    safetyMargin: "3",
    isBase: false,
  })

  // Items
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()])

  // Catálogos
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [baseRecipes, setBaseRecipes] = useState<Recipe[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)

  // Submit
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // ── Cargar catálogos ─────────────────────────────────────────────────────
  const loadCatalogs = useCallback(async () => {
    setCatalogLoading(true)
    try {
      const [ingRes, baseRes] = await Promise.all([
        fetch(`${API}/api/v1/ingredients`, { credentials: "include" }).then((r) =>
          r.ok ? r.json() : { data: [] }
        ),
        getBaseRecipes().catch(() => ({ data: [] })),
      ])
      setIngredients(ingRes.data ?? [])
      setBaseRecipes(baseRes.data ?? [])
    } catch {
      // silent — catálogos vacíos si falla
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCatalogs()
  }, [loadCatalogs])

  // ── Gestión de items ─────────────────────────────────────────────────────
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
        // Reset selector al cambiar tipo
        if (patch.componentType) {
          updated.ingredientId = ""
          updated.subRecipeId = ""
        }
        return updated
      })
    )
  }

  // ── Validación y guardado ────────────────────────────────────────────────
  async function handleSave() {
    setFormError(null)

    // Validar header
    if (!form.name.trim()) return setFormError("El nombre de la receta es requerido.")
    if (!form.recipeNumber.trim()) return setFormError("El número de receta es requerido.")
    const servings = parseFloat(form.servings)
    if (!form.servings || isNaN(servings) || servings <= 0)
      return setFormError("Las porciones deben ser un número positivo.")
    const safetyMargin = parseFloat(form.safetyMargin)
    if (isNaN(safetyMargin) || safetyMargin < 0 || safetyMargin > 5)
      return setFormError("El margen de seguridad debe estar entre 0 y 5.")

    // Validar items
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
      const payload = {
        name: form.name.trim(),
        recipeNumber: form.recipeNumber.trim(),
        servings,
        servingWeightG: form.servingWeightG ? parseFloat(form.servingWeightG) : undefined,
        safetyMargin,
        isBase: form.isBase,
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

      await createRecipe(payload)
      setSuccess(true)
      setTimeout(() => router.push("/recetas"), 1200)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar la receta.")
    } finally {
      setSaving(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6" style={{ maxWidth: "760px", margin: "0 auto" }}>

      {/* Header */}
      <PageHeader
        title="Nueva receta"
        subtitle="Ficha técnica con ingredientes y porciones"
        action={
          <Button variant="ghost" onClick={() => router.push("/recetas")}>
            <ArrowLeft size={16} />
            Volver
          </Button>
        }
      />

      {/* ── Sección 1: Encabezado ─────────────────────────────────── */}
      <section
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          borderRadius: "16px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
          Información general
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div style={{ gridColumn: "span 2" }}>
            <Input
              id="recipe-name"
              label="Nombre de la receta"
              placeholder="Ej. Arroz con pollo"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <Input
            id="recipe-number"
            label="Número de receta"
            placeholder="Ej. R-001"
            value={form.recipeNumber}
            onChange={(e) => setForm((f) => ({ ...f, recipeNumber: e.target.value }))}
          />
          <Input
            id="recipe-servings"
            label="Porciones"
            type="number"
            min="0.1"
            step="0.5"
            placeholder="Ej. 4"
            value={form.servings}
            onChange={(e) => setForm((f) => ({ ...f, servings: e.target.value }))}
          />
          <Input
            id="recipe-weight"
            label="Peso por porción (g) — opcional"
            type="number"
            min="0"
            placeholder="Ej. 250"
            value={form.servingWeightG}
            onChange={(e) => setForm((f) => ({ ...f, servingWeightG: e.target.value }))}
            hint="Requerido para calcular costo/g"
          />
          <Input
            id="recipe-margin"
            label="Margen de seguridad (%)"
            type="number"
            min="0"
            max="5"
            step="0.5"
            placeholder="3"
            value={form.safetyMargin}
            onChange={(e) => setForm((f) => ({ ...f, safetyMargin: e.target.value }))}
            hint="Máximo 5 %"
          />
        </div>

        {/* Toggle: guardar como base */}
        <label
          htmlFor="recipe-is-base"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div
            onClick={() => setForm((f) => ({ ...f, isBase: !f.isBase }))}
            style={{
              position: "relative",
              width: "40px",
              height: "22px",
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
                top: "3px",
                left: form.isBase ? "21px" : "3px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s ease",
                boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }}
            />
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Guardar como receta base
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Estará disponible como sub-receta en otras fichas técnicas
            </p>
          </div>
        </label>
      </section>

      {/* ── Sección 2: Componentes ────────────────────────────────── */}
      <section
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-light)",
          borderRadius: "16px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px" }}>
            Componentes ({items.length})
          </h2>
          {catalogLoading && <LoadingSpinner size={14} />}
        </div>

        {/* Filas de items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
            />
          ))}
        </div>

        <Button
          id="btn-add-item"
          variant="ghost"
          size="sm"
          onClick={addItem}
          style={{ alignSelf: "flex-start" }}
        >
          <Plus size={14} />
          Agregar componente
        </Button>
      </section>

      {/* ── Error / Success / Guardar ─────────────────────────────── */}
      {formError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "12px",
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
            padding: "12px 16px",
            borderRadius: "12px",
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            color: "#166534",
          }}
        >
          <CheckCircle2 size={16} />
          <p className="text-sm font-medium">Receta guardada. Redirigiendo…</p>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingBottom: "24px" }}>
        <Button variant="ghost" onClick={() => router.push("/recetas")}>
          Cancelar
        </Button>
        <Button
          id="btn-save-recipe"
          variant="primary"
          loading={saving}
          onClick={handleSave}
        >
          <ChefHat size={16} />
          Guardar receta
        </Button>
      </div>
    </div>
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
}

function ItemRow({ item, index, ingredients, baseRecipes, onUpdate, onRemove, canRemove }: ItemRowProps) {
  const isIngredient = item.componentType === "ingredient"

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
      style={{
        display: "grid",
        gridTemplateColumns: "24px 120px 1fr 90px 32px",
        gap: "8px",
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: "12px",
        background: "var(--bg-primary)",
        border: "1px solid var(--border-light)",
      }}
    >
      {/* Drag handle visual (decorativo por ahora) */}
      <GripVertical size={16} style={{ color: "var(--border-medium)", cursor: "grab" }} />

      {/* Selector de tipo */}
      <select
        aria-label="Tipo de componente"
        value={item.componentType}
        onChange={(e) =>
          onUpdate({ componentType: e.target.value as "ingredient" | "recipe" })
        }
        style={{
          height: "36px",
          borderRadius: "8px",
          border: "1px solid var(--border-light)",
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
          fontSize: "12px",
          padding: "0 8px",
          cursor: "pointer",
        }}
      >
        <option value="ingredient">Ingrediente</option>
        <option value="recipe">Sub-receta</option>
      </select>

      {/* Selector de ingrediente o sub-receta con autocompletado */}
      {isIngredient ? (
        <SearchableSelect
          options={ingredientOptions}
          value={item.ingredientId}
          onChange={(val) => onUpdate({ ingredientId: val })}
          placeholder="Selecciona un ingrediente..."
          emptyMessage="No se encontraron ingredientes"
          ariaLabel="Ingrediente"
        />
      ) : (
        <SearchableSelect
          options={recipeOptions}
          value={item.subRecipeId}
          onChange={(val) => onUpdate({ subRecipeId: val })}
          placeholder="Selecciona una receta base..."
          emptyMessage="No se encontraron recetas base"
          ariaLabel="Sub-receta base"
        />
      )}

      {/* Cantidad en gramos */}
      <input
        type="number"
        aria-label="Cantidad en gramos"
        placeholder="g"
        min="0.01"
        step="0.5"
        value={item.quantityG}
        onChange={(e) => onUpdate({ quantityG: e.target.value })}
        style={{
          height: "36px",
          borderRadius: "8px",
          border: "1px solid var(--border-light)",
          background: "var(--bg-surface)",
          color: "var(--text-primary)",
          fontSize: "13px",
          padding: "0 8px",
          outline: "none",
          textAlign: "right",
        }}
      />

      {/* Eliminar fila */}
      <button
        aria-label="Eliminar componente"
        onClick={onRemove}
        disabled={!canRemove}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          border: "none",
          background: "transparent",
          color: canRemove ? "#B42020" : "var(--border-medium)",
          cursor: canRemove ? "pointer" : "not-allowed",
          transition: "background 0.15s ease",
        }}
        onMouseEnter={(e) => {
          if (canRemove)
            (e.currentTarget as HTMLButtonElement).style.background = "#FEF2F2"
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = "transparent"
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  height: "36px",
  borderRadius: "8px",
  border: "1px solid var(--border-light)",
  background: "var(--bg-surface)",
  color: "var(--text-primary)",
  fontSize: "13px",
  padding: "0 8px",
  cursor: "pointer",
  width: "100%",
}
