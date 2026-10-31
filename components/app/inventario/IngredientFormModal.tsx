"use client"

import { useState, useEffect, useCallback, useRef, startTransition } from "react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import PriceSuggestion from "@/components/app/inventario/PriceSuggestion"
import { Plus } from "lucide-react"
import { createIngrediente, updateIngrediente, fetchAPI } from "@/lib/api"
import { toast } from "@/lib/toast"
import { useConfirm } from "@/components/ui/ConfirmDialog"
import InfoTip from "@/components/ui/InfoTip"
import type { Ingredient } from "@/types/ingredient"
import {
  EMPTY_INGREDIENT_FORM,
  INGREDIENT_UNIT_CHOICES,
  contentLabel,
  contentPlaceholder,
  costPerBase,
  findDuplicateIngredient,
  validateIngredientForm,
  type IngredientFormErrors,
  type IngredientFormValues,
  type IngredientUnit,
} from "@/lib/recipes/ingredientForm"

function formatBaseCost(cost: number) {
  return Number.isInteger(cost)
    ? cost.toLocaleString("es-CO")
    : cost.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}

interface IngredientFormModalProps {
  open: boolean
  onClose: () => void
  /** Se llama con el ingrediente guardado (cuando el API lo devuelve) */
  onSaved: (saved?: Ingredient) => void
  editing?: Ingredient | null
  /** Nombre con el que arranca el formulario (p. ej. lo que se buscó en un selector) */
  initialName?: string
  /** Catálogo conocido (propios + banco) para avisar duplicados antes de enviar */
  existing?: { name: string }[]
  /**
   * Cómo se guarda un ingrediente NUEVO. Ausente = el API del inventario del negocio. El banco de plataforma
   * inyecta el suyo (/platform/banco/ingredients).
   */
  createIngredient?: (payload: {
    name: string
    costPerUnit: number
    weightGrams: number
    unit: "g" | "ml" | "und" | "porcion"
  }) => Promise<{ data?: Ingredient }>
}

export default function IngredientFormModal({
  open,
  onClose,
  onSaved,
  editing = null,
  initialName = "",
  existing = [],
  createIngredient,
}: IngredientFormModalProps) {
  const isEditing = !!editing

  const [form, setForm] = useState<IngredientFormValues>({ ...EMPTY_INGREDIENT_FORM, name: initialName })
  const [fieldErrors, setFieldErrors] = useState<IngredientFormErrors>({})
  const [saving, setSaving] = useState(false)
  // Guard síncrono contra doble envío (el estado `saving` se actualiza en el
  // siguiente render; dos clics seguidos podían crear el ingrediente dos veces).
  // Tras un guardado exitoso queda bloqueado hasta que el modal se reabra.
  const submitLock = useRef(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [priceSource, setPriceSource] = useState<string | null>(null)
  const confirm = useConfirm()
  const handlePriceAccept = useCallback((pricePerUnit: number, weightGrams: number, source: string) => {
    setForm((f) => ({
      ...f,
      costPerUnit: String(pricePerUnit),
      weightGrams: String(weightGrams),
    }))
    setPriceSource(source)
  }, [])

  useEffect(() => {
    if (!open) return
    submitLock.current = false
    if (editing) {
      startTransition(() => {
        setForm({
          name: editing.name,
          costPerUnit: String(editing.costPerUnit),
          weightGrams: String(editing.weightGrams),
          unit: editing.unit === "und" ? "und" : "g",
        })
        setFormError(null)
        setFieldErrors({})
      })
    } else {
      startTransition(() => {
        setForm({ ...EMPTY_INGREDIENT_FORM, name: initialName })
        setFormError(null)
        setFieldErrors({})
      })
    }
  }, [open, editing, initialName])

  // Hay cambios sin guardar respecto al estado con el que se abrió el modal
  const dirty = editing
    ? form.name !== editing.name ||
      form.costPerUnit !== String(editing.costPerUnit) ||
      form.weightGrams !== String(editing.weightGrams) ||
      form.unit !== (editing.unit === "und" ? "und" : "g")
    : !!(form.name.trim() || form.costPerUnit || form.weightGrams)

  async function requestClose() {
    if (saving || submitLock.current) return
    if (dirty) {
      const ok = await confirm({
        title: "Descartar cambios",
        description: "Tienes cambios sin guardar. Si cierras, se perderán.",
        confirmLabel: "Descartar",
        cancelLabel: "Seguir editando",
        variant: "danger",
      })
      if (!ok) return
    }
    onClose()
  }

  async function handleSave() {
    if (submitLock.current) return
    const errors = validateIngredientForm(form)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setFormError(null)
      return
    }
    const dup = findDuplicateIngredient(form.name, editing ? existing.filter((e) => e.name !== editing.name) : existing)
    if (dup) {
      setFieldErrors({ name: `Ya existe «${dup.name}». Selecciónalo en lugar de crearlo de nuevo.` })
      return
    }
    setFieldErrors({})
    submitLock.current = true
    setSaving(true)
    setFormError(null)

    const payload = {
      name: form.name.trim(),
      costPerUnit: parseFloat(form.costPerUnit),
      weightGrams: parseFloat(form.weightGrams),
      unit: form.unit,
      ...(priceSource && { priceConfirmation: { priceSource } }),
    }

    try {
      const url = editing
        ? `/api/v1/ingredients/${editing.id}`
        : `/api/v1/ingredients`
      const method = editing ? "PUT" : "POST"

      const res =
        !editing && createIngredient
          ? await createIngredient({ name: payload.name, costPerUnit: payload.costPerUnit, weightGrams: payload.weightGrams, unit: payload.unit })
          : await fetchAPI<{ data?: Ingredient }>(url, {
              method,
              body: JSON.stringify(payload),
            })

      onSaved(res.data)
      toast.success(editing ? "Ingrediente actualizado" : "Ingrediente creado", { description: payload.name })
      setTimeout(() => onClose(), 350)
    } catch (err: unknown) {
      submitLock.current = false
      setFormError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <Modal
      open
      onClose={() => void requestClose()}
      title={isEditing ? "Editar ingrediente" : "Nuevo ingrediente"}
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => void requestClose()}>
            Cancelar
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            <Plus size={16} aria-hidden="true" />
            {isEditing ? "Guardar cambios" : "Crear ingrediente"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Nombre del ingrediente"
          placeholder="Ej. Harina de trigo"
          value={form.name}
          error={fieldErrors.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          autoFocus
        />
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 flex items-center gap-1 text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            ¿Cómo lo usas en tus recetas?
            <InfoTip help="ingredient.unit" label="la unidad del ingrediente" />
          </legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Unidad del ingrediente">
            {INGREDIENT_UNIT_CHOICES.map((c) => (
              <label
                key={c.value}
                className="flex cursor-pointer flex-col rounded-lg border px-3 py-2 text-sm"
                style={{
                  borderColor: form.unit === c.value ? "var(--accent)" : "var(--border-light)",
                  background: form.unit === c.value ? "var(--accent-light)" : "var(--bg-surface)",
                }}
              >
                <span className="flex items-center gap-2 font-medium">
                  <input
                    type="radio"
                    name="ingredient-unit"
                    value={c.value}
                    checked={form.unit === c.value}
                    onChange={() => setForm((f) => ({ ...f, unit: c.value as IngredientUnit }))}
                  />
                  {c.label}
                </span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{c.description}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Input
          label="Precio de compra (COP)"
          help="ingredient.cost"
          placeholder="Ej. 3500"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={form.costPerUnit}
          error={fieldErrors.costPerUnit}
          onChange={(e) => setForm((f) => ({ ...f, costPerUnit: e.target.value }))}
        />
        <Input
          label={contentLabel(form.unit)}
          help="ingredient.content"
          placeholder={contentPlaceholder(form.unit)}
          type="number"
          min="1"
          step="1"
          value={form.weightGrams}
          error={fieldErrors.weightGrams}
          onChange={(e) => setForm((f) => ({ ...f, weightGrams: e.target.value }))}
        />
        <PriceSuggestion
          ingredientName={form.name}
          onAccept={handlePriceAccept}
        />
        {costPerBase(form) != null && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {form.unit === "und" ? "Costo por unidad calculado: " : "Costo por gramo calculado: "}
            <strong>
              ${formatBaseCost(costPerBase(form) as number)}
            </strong>{" "}
            {form.unit === "und" ? "/und" : "/g"}
          </p>
        )}
        {formError && (
          <p className="text-sm" style={{ color: "#E24B4A" }}>{formError}</p>
        )}
      </div>
    </Modal>
  )
}