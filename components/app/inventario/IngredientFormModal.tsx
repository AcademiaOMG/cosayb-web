"use client"

import { useState, useEffect, useCallback, startTransition } from "react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import PriceSuggestion from "@/components/app/inventario/PriceSuggestion"
import { Plus } from "lucide-react"
import { createIngrediente, updateIngrediente, fetchAPI } from "@/lib/api"
import type { Ingredient, IngredientForm } from "@/types/ingredient"

interface IngredientFormModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  editing?: Ingredient | null
}

export default function IngredientFormModal({
  open,
  onClose,
  onSaved,
  editing = null,
}: IngredientFormModalProps) {
  const isEditing = !!editing

  const [form, setForm] = useState<IngredientForm>({
    name: "",
    costPerUnit: "",
    weightGrams: "",
  })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const handlePriceAccept = useCallback((pricePerUnit: number, weightGrams: number, source: string) => {
    setForm((f) => ({
      ...f,
      costPerUnit: String(pricePerUnit),
      weightGrams: String(weightGrams),
    }))
    setPriceSource(source)
  }, [])
  const [priceSource, setPriceSource] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      startTransition(() => {
        setForm({
          name: editing.name,
          costPerUnit: String(editing.costPerUnit),
          weightGrams: String(editing.weightGrams),
        })
        setFormError(null)
      })
    } else {
      startTransition(() => {
        setForm({ name: "", costPerUnit: "", weightGrams: "" })
        setFormError(null)
      })
    }
  }, [open, editing])

  async function handleSave() {
    if (!form.name.trim() || !form.costPerUnit || !form.weightGrams) {
      setFormError("Todos los campos son obligatorios")
      return
    }
    setSaving(true)
    setFormError(null)

    const payload = {
      name: form.name.trim(),
      costPerUnit: parseFloat(form.costPerUnit),
      weightGrams: parseFloat(form.weightGrams),
      ...(priceSource && { priceConfirmation: { priceSource } }),
    }

    try {
      const url = editing
        ? `/api/v1/ingredients/${editing.id}`
        : `/api/v1/ingredients`
      const method = editing ? "PUT" : "POST"

      await fetchAPI<{ data: unknown }>(url, {
        method,
        body: JSON.stringify(payload),
      })

      onSaved()
      setTimeout(() => onClose(), 350)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <Modal
      open
      onClose={onClose}
      title={isEditing ? "Editar ingrediente" : "Nuevo ingrediente"}
      footer={
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
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
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          autoFocus
        />
        <Input
          label="Precio de compra (COP)"
          placeholder="Ej. 3500"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          value={form.costPerUnit}
          onChange={(e) => setForm((f) => ({ ...f, costPerUnit: e.target.value }))}
          hint="Lo que pagaste por esta presentación o empaque"
        />
        <Input
          label="Peso del empaque (g)"
          placeholder="Ej. 1000"
          type="number"
          min="1"
          step="1"
          value={form.weightGrams}
          onChange={(e) => setForm((f) => ({ ...f, weightGrams: e.target.value }))}
          hint="¿Cuántos gramos trae la presentación que compraste?"
        />
        <PriceSuggestion
          ingredientName={form.name}
          onAccept={handlePriceAccept}
        />
        {form.costPerUnit && form.weightGrams && parseFloat(form.weightGrams) > 0 && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Costo por gramo calculado:{" "}
            <strong>
              ${(() => {
                const cost = parseFloat(form.costPerUnit) / parseFloat(form.weightGrams)
                return Number.isInteger(cost)
                  ? cost.toLocaleString("es-CO")
                  : cost.toLocaleString("es-CO", { minimumFractionDigits: 1, maximumFractionDigits: 2 })
              })()}
            </strong>{" "}
            /g
          </p>
        )}
        {formError && (
          <p className="text-sm" style={{ color: "#E24B4A" }}>{formError}</p>
        )}
      </div>
    </Modal>
  )
}