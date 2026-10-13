"use client"

import { useRef, useState } from "react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Input from "@/components/ui/Input"
import { createExtra } from "@/lib/api"
import type { Ingrediente } from "@/types/domain"
import {
  EXTRA_UNITS,
  costPerBaseUnit,
  findDuplicateByName,
  unitShort,
  validateExtraForm,
  type ExtraFormErrors,
  type ExtraUnit,
} from "@/lib/menuExtras"

const fmtCOP = (v: number) => `$${v.toLocaleString("es-CO", { maximumFractionDigits: 2 })}`

/**
 * Formulario compacto para crear un extra (vaso, plato, bebida, acompañamiento…)
 * sin salir del flujo del menú. Se guarda en el inventario (ingredients, kind='extra').
 */
export default function ExtraCreateModal(props: ExtraCreateModalProps) {
  // Se monta solo mientras está abierto: cada apertura arranca con el formulario limpio.
  return props.open ? <ExtraCreateForm {...props} /> : null
}

interface ExtraCreateModalProps {
  open: boolean
  initialName?: string
  /** Catálogo actual (propios + banco) para evitar duplicados */
  existing: Ingrediente[]
  onClose: () => void
  /** El extra quedó guardado en el inventario */
  onCreated: (extra: Ingrediente) => void
  /** El nombre ya existía: se reutiliza el existente en vez de duplicarlo */
  onUseExisting: (extra: Ingrediente) => void
}

function ExtraCreateForm({
  open,
  initialName = "",
  existing,
  onClose,
  onCreated,
  onUseExisting,
}: ExtraCreateModalProps) {
  const [name, setName] = useState(initialName)
  const [unit, setUnit] = useState<ExtraUnit>("und")
  const [cost, setCost] = useState("")
  const [content, setContent] = useState("1")
  const [errors, setErrors] = useState<ExtraFormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const lock = useRef(false) // doble submit

  const duplicate = name.trim() ? findDuplicateByName(name, existing) : undefined
  const costNum = parseFloat(cost.replace(",", "."))
  const contentNum = content.trim() === "" ? 1 : parseFloat(content.replace(",", "."))
  const perUnit = costNum > 0 && contentNum > 0 ? costPerBaseUnit(costNum, contentNum) : null
  const unitLabel = unitShort(unit)

  function handleClose() {
    if (saving) return
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (lock.current) return
    setServerError(null)
    const v = validateExtraForm({ name, unit, cost, content }, existing)
    if (!v.ok) {
      setErrors(v.errors)
      return
    }
    setErrors({})
    lock.current = true
    setSaving(true)
    try {
      const res = await createExtra({
        name: v.payload.name,
        unit: v.payload.unit,
        costPerUnit: v.payload.costPerUnit,
        weightGrams: v.payload.weightGrams,
      })
      onCreated(res.data)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo guardar el extra"
      setServerError(msg)
      lock.current = false
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Crear nuevo extra"
      blur
      footer={
        <>
          <Button variant="ghost" type="button" onClick={handleClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="extra-create-form" loading={saving}>
            {saving ? "Guardando…" : "Guardar extra"}
          </Button>
        </>
      }
    >
      <form id="extra-create-form" onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Bebidas, vasos, platos, cucharas, acompañamientos… Se guarda en tu inventario y queda seleccionado.
        </p>

        <Input
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Vaso plástico 9 oz"
          maxLength={120}
          autoFocus
          error={errors.name}
          disabled={saving}
        />
        {duplicate && (
          <div
            className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm"
            style={{ background: "var(--accent-light)", color: "var(--accent-text)" }}
          >
            <span className="min-w-0 truncate">Ya tienes «{duplicate.name}».</span>
            <button
              type="button"
              className="shrink-0 font-semibold underline"
              onClick={() => onUseExisting(duplicate)}
              disabled={saving}
            >
              Usar este
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="extra-unit" className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            Se mide en
          </label>
          <select
            id="extra-unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as ExtraUnit)}
            disabled={saving}
            className="h-10 w-full px-3 text-sm"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
            }}
          >
            {EXTRA_UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Costo del empaque ($)"
            inputMode="decimal"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="15000"
            error={errors.cost}
            disabled={saving}
          />
          <Input
            label={`Contenido (${unitLabel})`}
            inputMode="decimal"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="1"
            error={errors.content}
            disabled={saving}
          />
        </div>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {perUnit != null
            ? `Costo por ${unitLabel}: ${fmtCOP(perUnit)}`
            : "Si lo compras suelto, deja el contenido en 1."}
        </p>

        {serverError && (
          <p role="alert" className="text-sm" style={{ color: "var(--error)" }}>
            {serverError}
          </p>
        )}
      </form>
    </Modal>
  )
}
