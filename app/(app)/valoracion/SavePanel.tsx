"use client"

import { useEffect, useRef, useState } from "react"
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
  const nameRef = useRef<HTMLInputElement>(null)

  // Vive dentro de <Modal>, que al abrir enfoca su botón de cerrar (timeout 0).
  // El primer dato a escribir es el nombre: tomar el foco justo después.
  useEffect(() => {
    const t = setTimeout(() => nameRef.current?.focus(), 30)
    return () => clearTimeout(t)
  }, [])

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
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!saving && !success) void handleSave()
      }}
    >
      <div className="flex flex-col gap-4">
        <Input
          ref={nameRef}
          label="Nombre del plato o producto"
          placeholder="Ej. Pollo con champiñones"
          value={form.name}
          onChange={(e) => f("name", e.target.value)}
        />
        <Input
          label="Precio real de venta (COP)"
          type="number" min="0"
          placeholder="Opcional, para comparar"
          value={form.actualPrice}
          onChange={(e) => f("actualPrice", e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="save-valuation-notes" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Notas</label>
          <textarea
            id="save-valuation-notes"
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

        {error && <p className="text-sm" role="alert" style={{ color: "#DC2626" }}>{error}</p>}
        {success && (
          <p className="text-sm flex items-center gap-1.5" role="status" style={{ color: "#166534" }}>
            <CheckCircle2 size={14} />
            Guardado en el historial
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={saving || success}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={saving} disabled={success}>
            Guardar valoración
          </Button>
        </div>
      </div>
    </form>
  )
}
