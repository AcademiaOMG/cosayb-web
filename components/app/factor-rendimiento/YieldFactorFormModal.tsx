"use client"

import { useState, useEffect } from "react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import type { FactorRendimiento } from "@/types/domain"

interface YieldFactorFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    variant: "bfactor" | "bfactorveg"
    ingredientName: string
    totalCost: string
    totalWeightGrams: string
    wasteItems: { name: string; weightGrams: string }[]
  }) => Promise<void>
  editingFactor?: FactorRendimiento | null
}

interface WasteItem {
  name: string
  weightGrams: string
}

const WASTE_SUGGESTIONS: Record<"bfactor" | "bfactorveg", string[]> = {
  bfactor: ["Huesos", "Grasa visible", "Piel", "Cabeza", "Cola", "Patas"],
  bfactorveg: ["Cascara", "Tallo", "Hojas externas", "Raiz", "Semillas"],
}

function calcPreview(totalCost: string, totalWeight: string, wasteItems: WasteItem[]) {
  const tc = parseFloat(totalCost)
  const tw = parseFloat(totalWeight)
  const wasteSum = wasteItems.reduce((s, i) => s + (parseFloat(i.weightGrams) || 0), 0)
  if (!tc || !tw) return null
  const netWeight = tw - wasteSum
  if (netWeight <= 0) return null
  const yieldFactor = netWeight / tw
  const realCostPerGram = tc / netWeight
  return { netWeight, yieldFactor, realCostPerGram, wasteGrams: wasteSum, wastePercent: (wasteSum / tw) * 100 }
}

function formatCOP(amount: number): string {
  return `$ ${amount.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

export default function YieldFactorFormModal({ isOpen, onClose, onSubmit, editingFactor }: YieldFactorFormModalProps) {
  const isEditing = !!editingFactor

  const [variant, setVariant] = useState<"bfactor" | "bfactorveg">("bfactor")
  const [ingredientName, setIngredientName] = useState("")
  const [totalCost, setTotalCost] = useState("")
  const [totalWeightGrams, setTotalWeightGrams] = useState("")
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (editingFactor) {
        setVariant(editingFactor.variant as "bfactor" | "bfactorveg")
        setIngredientName(editingFactor.ingredientName)
        setTotalCost(String(editingFactor.totalCost))
        setTotalWeightGrams(String(editingFactor.totalWeightGrams))
        setWasteItems(
          editingFactor.wasteItems.length > 0
            ? editingFactor.wasteItems.map((w) => ({ name: w.name, weightGrams: String(w.weightGrams) }))
            : []
        )
      } else {
        setVariant("bfactor")
        setIngredientName("")
        setTotalCost("")
        setTotalWeightGrams("")
        setWasteItems([])
      }
      setError(null)
    }
  }, [isOpen, editingFactor])

  const preview = calcPreview(totalCost, totalWeightGrams, wasteItems)

  const addWasteItem = () => {
    setWasteItems((prev) => [...prev, { name: "", weightGrams: "" }])
  }

  const updateWasteItem = (idx: number, field: keyof WasteItem, val: string) => {
    setWasteItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: val } : item)))
  }

  const removeWasteItem = (idx: number) => {
    setWasteItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    if (!ingredientName.trim()) { setError("Ingresa el nombre del ingrediente"); return }
    if (!totalCost || parseFloat(totalCost) <= 0) { setError("Ingresa el costo total"); return }
    if (!totalWeightGrams || parseFloat(totalWeightGrams) <= 0) { setError("Ingresa el peso completo"); return }

    try {
      setIsSubmitting(true)
      setError(null)
      await onSubmit({
        variant,
        ingredientName: ingredientName.trim(),
        totalCost,
        totalWeightGrams,
        wasteItems: wasteItems.filter((w) => w.name.trim() && parseFloat(w.weightGrams) > 0),
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setIsSubmitting(false)
    }
  }

  const suggestions = WASTE_SUGGESTIONS[variant]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Editar: ${editingFactor.ingredientName}` : "Nuevo ingrediente"}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting || !preview}>
            {isEditing ? "Guardar cambios" : "Registrar ingrediente"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Tipo de ingrediente */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Tipo de ingrediente
          </label>
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

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Nombre del ingrediente
          </label>
          <input
            type="text"
            value={ingredientName}
            onChange={(e) => setIngredientName(e.target.value)}
            placeholder="Pechuga de pollo, Lomo de res..."
            className="w-full h-10 px-3 rounded-xl text-sm outline-none transition-colors"
            style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
          />
        </div>

        {/* Costo total + Peso completo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Costo total ($)
            </label>
            <input
              type="number"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              placeholder="25000"
              className="w-full h-10 px-3 rounded-xl text-sm outline-none transition-colors"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Peso completo (g)
            </label>
            <input
              type="number"
              value={totalWeightGrams}
              onChange={(e) => setTotalWeightGrams(e.target.value)}
              placeholder="5420"
              className="w-full h-10 px-3 rounded-xl text-sm outline-none transition-colors"
              style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
            />
          </div>
        </div>

        {/* Desechos */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Desperdicio (opcional)
            </label>
            <Button variant="ghost" onClick={addWasteItem} className="text-xs h-7 px-2">
              + Agregar
            </Button>
          </div>

          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            Agrega lo que se tira. Ejemplo: huesos, grasa, cascara, tallo.
          </p>

          {wasteItems.length > 0 ? (
            <div className="flex flex-col gap-2">
              {wasteItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateWasteItem(idx, "name", e.target.value)}
                    placeholder="Nombre"
                    list={`waste-names-${variant}`}
                    className="flex-1 h-9 px-3 rounded-lg text-sm outline-none transition-colors"
                    style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                  />
                  <input
                    type="number"
                    value={item.weightGrams}
                    onChange={(e) => updateWasteItem(idx, "weightGrams", e.target.value)}
                    placeholder="gramos"
                    className="w-24 h-9 px-3 rounded-lg text-sm outline-none transition-colors"
                    style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)", color: "var(--text-primary)" }}
                  />
                  <button
                    onClick={() => removeWasteItem(idx)}
                    className="h-9 w-9 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                    style={{ color: "#EF4444", background: "rgba(239,68,68,0.08)" }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl p-3" style={{ background: "var(--bg-primary)", border: "1px dashed var(--border-light)" }}>
              <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                Sin desperdicio registrado &mdash; el rendimiento sera del 100%
              </p>
            </div>
          )}

          <datalist id={`waste-names-${variant}`}>
            {suggestions.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>

        {/* Resultado */}
        {preview && (
          <div className="rounded-xl p-3" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Resultado</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Peso util</p>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {preview.netWeight.toFixed(0)}g
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Rendimiento</p>
                <p className="text-sm font-semibold" style={{ color: "var(--accent-text)" }}>
                  {(preview.yieldFactor * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Costo/g</p>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {formatCOP(preview.realCostPerGram)}/g
                </p>
              </div>
            </div>
            {preview.wasteGrams > 0 && (
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                Se tiran {preview.wasteGrams.toFixed(0)}g ({preview.wastePercent.toFixed(1)}% del total)
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="text-xs" style={{ color: "#EF4444" }}>{error}</p>
        )}
      </div>
    </Modal>
  )
}
