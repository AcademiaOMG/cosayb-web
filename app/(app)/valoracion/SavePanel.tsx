"use client"

import { useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { CheckCircle2 } from "lucide-react"
import { createValuation } from "@/lib/api"
import type { CreateValuationPayload } from "@/lib/api"
import type { SaveFormState } from "./lib"

export default function SavePanel({
  form,
  onChange,
  costMateriaprima,
  pctMateriaprima,
  safetyMargin,
  recipeId,
  onCancel,
  onSaved,
}: {
  form: SaveFormState
  onChange: (form: SaveFormState) => void
  costMateriaprima: number
  pctMateriaprima: number
  safetyMargin: number
  recipeId: string | null
  onCancel: () => void
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function f<K extends keyof SaveFormState>(k: K, v: SaveFormState[K]) {
    onChange({ ...form, [k]: v })
    setError(null)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Ingresa un nombre para guardar este análisis.")
      return
    }
    setSaving(true)
    setError(null)
    const payload: CreateValuationPayload = {
      name: form.name.trim(),
      refType: recipeId ? "recipe" : form.refType,
      costMateriaprima,
      pctMateriaprima,
      safetyMargin,
    }
    if (recipeId) payload.refId = recipeId
    if (form.actualPrice) payload.actualPrice = parseFloat(form.actualPrice)
    if (form.notes.trim()) payload.notes = form.notes.trim()
    try {
      await createValuation(payload)
      setSuccess(true)
      setTimeout(() => onSaved(), 800)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <p className="text-xs font-semibold tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
        GUARDAR EN HISTORIAL
      </p>
      <div className="flex flex-col gap-4">
        <Input
          label="Nombre del plato o producto"
          placeholder="Ej. Pollo con champiñones"
          value={form.name}
          onChange={(e) => f("name", e.target.value)}
          autoFocus
        />
        <Input
          label="Precio real de venta (COP)"
          type="number" min="0"
          placeholder="Opcional — para comparar con el sugerido"
          value={form.actualPrice}
          onChange={(e) => f("actualPrice", e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Notas</label>
          <textarea
            rows={2} placeholder="Observaciones... (opcional)"
            value={form.notes}
            onChange={(e) => f("notes", e.target.value)}
            className="w-full px-3 py-2.5 text-sm outline-none resize-none"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        <div className="flex items-center gap-3 justify-end">
          {error && <span className="text-sm mr-auto" style={{ color: "#EF4444" }}>{error}</span>}
          {success && (
            <span className="text-sm flex items-center gap-1.5 mr-auto" style={{ color: "#166534" }}>
              <CheckCircle2 size={14} />
              Guardado
            </span>
          )}
          <Button variant="ghost" onClick={onCancel} disabled={saving || success}>
            Cancelar
          </Button>
          <Button variant="primary" loading={saving} disabled={success} onClick={handleSave}>
            Guardar valoración
          </Button>
        </div>
      </div>
    </Card>
  )
}
