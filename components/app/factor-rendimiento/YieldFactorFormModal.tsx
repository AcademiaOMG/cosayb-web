"use client"

import { useState, useEffect, useCallback } from "react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { Plus, Trash2 } from "lucide-react"
import type { FactorRendimiento } from "@/types/domain"

interface WasteItem {
  name: string
  weightGrams: string
}

interface FormData {
  variant: "bfactor" | "bfactorveg"
  ingredientName: string
  totalCost: string
  totalWeightGrams: string
  wasteItems: WasteItem[]
}

interface Calculado {
  costPerGram: number
  wasteItems: { name: string; weightGrams: number; allocatedCost: number }[]
  totalWasteGrams: number
  totalWasteCost: number
  netWeightGrams: number
  yieldFactor: number
  realCostPerGram: number
}

const INITIAL_FORM: FormData = {
  variant: "bfactor",
  ingredientName: "",
  totalCost: "",
  totalWeightGrams: "",
  wasteItems: [{ name: "", weightGrams: "" }],
}

function calcular(data: {
  costoTotal: number
  pesoTotalGramos: number
  wasteItems: { name: string; weightGrams: number }[]
}): Calculado | null {
  if (!data.costoTotal || !data.pesoTotalGramos) return null
  if (data.costoTotal <= 0 || data.pesoTotalGramos <= 0) return null

  const costPerGram = data.costoTotal / data.pesoTotalGramos
  const validWaste = data.wasteItems.filter((i) => i.weightGrams > 0)

  const wasteItems = validWaste.map((item) => ({
    name: item.name,
    weightGrams: item.weightGrams,
    allocatedCost: Number(((item.weightGrams / data.pesoTotalGramos) * data.costoTotal).toFixed(2)),
  }))

  const totalWasteGrams = wasteItems.reduce((sum, item) => sum + item.weightGrams, 0)
  const totalWasteCost = wasteItems.reduce((sum, item) => sum + item.allocatedCost, 0)
  const netWeightGrams = data.pesoTotalGramos - totalWasteGrams
  const yieldFactor = totalWasteGrams === 0 ? 1 : netWeightGrams / data.pesoTotalGramos
  const realCostPerGram = totalWasteGrams === 0 ? costPerGram : data.costoTotal / netWeightGrams

  return {
    costPerGram: Number(costPerGram.toFixed(4)),
    wasteItems,
    totalWasteGrams: Number(totalWasteGrams.toFixed(2)),
    totalWasteCost: Number(totalWasteCost.toFixed(2)),
    netWeightGrams: Number(netWeightGrams.toFixed(2)),
    yieldFactor: Number(yieldFactor.toFixed(4)),
    realCostPerGram: Number(realCostPerGram.toFixed(4)),
  }
}

function formatCOP(amount: number): string {
  return `$ ${amount.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

interface YieldFactorFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: FormData) => Promise<void>
  editingFactor?: FactorRendimiento | null
}

export default function YieldFactorFormModal({ isOpen, onClose, onSubmit, editingFactor }: YieldFactorFormModalProps) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [calculado, setCalculado] = useState<Calculado | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!editingFactor

  useEffect(() => {
    if (editingFactor && isOpen) {
      setForm({
        variant: editingFactor.variant,
        ingredientName: editingFactor.ingredientName,
        totalCost: editingFactor.totalCost,
        totalWeightGrams: editingFactor.totalWeightGrams,
        wasteItems: editingFactor.wasteItems.length > 0
          ? editingFactor.wasteItems.map((w) => ({ name: w.name, weightGrams: w.weightGrams }))
          : [{ name: "", weightGrams: "" }],
      })
    } else if (!isOpen) {
      setForm(INITIAL_FORM)
      setCalculado(null)
      setErrors({})
    }
  }, [editingFactor, isOpen])

  useEffect(() => {
    const costoTotal = parseFloat(form.totalCost) || 0
    const pesoTotalGramos = parseFloat(form.totalWeightGrams) || 0
    const wasteItems = form.wasteItems
      .filter((i) => i.name.trim())
      .map((i) => ({ name: i.name, weightGrams: parseFloat(i.weightGrams) || 0 }))
    setCalculado(calcular({ costoTotal, pesoTotalGramos, wasteItems }))
  }, [form])

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }, [])

  const handleWasteChange = useCallback((index: number, field: keyof WasteItem, value: string) => {
    setForm((prev) => {
      const items = [...prev.wasteItems]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, wasteItems: items }
    })
  }, [])

  const addWasteRow = useCallback(() => {
    setForm((prev) => ({ ...prev, wasteItems: [...prev.wasteItems, { name: "", weightGrams: "" }] }))
  }, [])

  const removeWasteRow = useCallback((index: number) => {
    setForm((prev) => {
      const items = prev.wasteItems.filter((_, i) => i !== index)
      return { ...prev, wasteItems: items.length > 0 ? items : [{ name: "", weightGrams: "" }] }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    if (!form.ingredientName.trim()) newErrors.ingredientName = "El nombre es requerido"
    if (!form.totalCost || parseFloat(form.totalCost) <= 0) newErrors.totalCost = "Ingresa un costo válido"
    if (!form.totalWeightGrams || parseFloat(form.totalWeightGrams) <= 0) newErrors.totalWeightGrams = "Ingresa un peso válido"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const validWaste = form.wasteItems.filter((i) => i.name.trim() && parseFloat(i.weightGrams) > 0)

    try {
      setIsSubmitting(true)
      await onSubmit({
        ...form,
        wasteItems: validWaste.map((i) => ({ name: i.name, weightGrams: i.weightGrams })),
      })
      onClose()
    } catch {
      // El error se maneja en el padre
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Factor de Rendimiento" : "Nuevo Factor de Rendimiento"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear factor"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="contents">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Variante</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleChange("variant", "bfactor")}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: form.variant === "bfactor" ? "var(--accent)" : "var(--bg-secondary)",
                color: form.variant === "bfactor" ? "white" : "var(--text-secondary)",
              }}
            >
              BFACTOR (Proteínas)
            </button>
            <button
              type="button"
              onClick={() => handleChange("variant", "bfactorveg")}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: form.variant === "bfactorveg" ? "var(--accent)" : "var(--bg-secondary)",
                color: form.variant === "bfactorveg" ? "white" : "var(--text-secondary)",
              }}
            >
              BFACTORVEG (Vegetales)
            </button>
          </div>
        </div>

        <Input
          label="Nombre del ingrediente"
          placeholder="Ej: POLLO"
          value={form.ingredientName}
          onChange={(e) => handleChange("ingredientName", e.target.value)}
          error={errors.ingredientName}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Costo Total ($)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej: 56000"
            value={form.totalCost}
            onChange={(e) => handleChange("totalCost", e.target.value)}
            error={errors.totalCost}
          />
          <Input
            label="Peso Total (gramos)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej: 5420"
            value={form.totalWeightGrams}
            onChange={(e) => handleChange("totalWeightGrams", e.target.value)}
            error={errors.totalWeightGrams}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Merma / Desperdicio</label>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)" }}>Opcional</span>
            </div>
            <button type="button" onClick={addWasteRow} className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded" style={{ color: "var(--accent)" }}>
              <Plus size={14} /> Agregar
            </button>
          </div>

          {form.wasteItems.map((item, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Input placeholder="Nombre (ej: Huesos)" value={item.name} onChange={(e) => handleWasteChange(index, "name", e.target.value)} />
              </div>
              <div className="w-28">
                <Input placeholder="Gramos" type="number" step="0.01" min="0" value={item.weightGrams} onChange={(e) => handleWasteChange(index, "weightGrams", e.target.value)} />
              </div>
              {form.wasteItems.length > 1 && (
                <button type="button" onClick={() => removeWasteRow(index)} className="p-2 rounded" style={{ color: "var(--text-muted)" }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        {calculado && (
          <div className="p-3 rounded-lg grid grid-cols-3 gap-3 text-center" style={{ background: "var(--bg-secondary)" }}>
            <div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Rendimiento</div>
              <div className="text-sm font-bold" style={{ color: "var(--accent-text)" }}>{(calculado.yieldFactor * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Merma</div>
              <div className="text-sm font-bold" style={{ color: calculado.totalWasteGrams > 0 ? "#EF4444" : "var(--text-primary)" }}>
                {calculado.totalWasteGrams.toFixed(0)}g
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Costo Real/g</div>
              <div className="text-sm font-bold" style={{ color: "var(--accent-text)" }}>{formatCOP(calculado.realCostPerGram)}</div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
