"use client"

import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { ModalHero, Panel, RAISED, RowList, ShareRow, Stat, StatGrid } from "@/components/ui/ModalKit"
import { saveFactorRendimientoAsIngrediente } from "@/lib/api"
import { useState } from "react"
import { toast } from "@/lib/toast"
import { friendlyError } from "@/lib/errorMessage"
import type { FactorRendimiento } from "@/types/domain"

const grams = (n: number) => `${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })} g`
const percent = (n: number) => `${n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`

function formatCOP(amount: number): string {
  return `$ ${amount.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

interface YieldFactorDetailModalProps {
  isOpen: boolean
  onClose: () => void
  factor: FactorRendimiento | null
  /** Abre la calculadora con este registro (no se pasa si no hay permiso de editar) */
  onEdit?: (factor: FactorRendimiento) => void
  /** Sin permiso de borrar no se pasa y el botón no aparece (en el celular la fila no trae el bote de basura) */
  onDelete?: (factor: FactorRendimiento) => void
}

export default function YieldFactorDetailModal({ isOpen, onClose, factor, onEdit, onDelete }: YieldFactorDetailModalProps) {
  const [isSaving, setIsSaving] = useState(false)

  if (!factor) return null

  const yieldFactor = parseFloat(factor.yieldFactor)
  const netWeight = parseFloat(factor.netWeightGrams)
  const totalWeight = parseFloat(factor.totalWeightGrams)
  const wasteSum = parseFloat(factor.totalWasteGrams)
  const realCostPerGram = parseFloat(factor.realCostPerGram)
  const totalCost = parseFloat(factor.totalCost)

  const handleSaveAsIngredient = async () => {
    try {
      setIsSaving(true)
      const result = await saveFactorRendimientoAsIngrediente(factor.id)
      toast.success("Ingrediente creado en Inventario", { description: result.message ?? factor.ingredientName })
    } catch (err) {
      toast.error("No se pudo crear el ingrediente en Inventario", {
        description: friendlyError(err, "Inténtalo de nuevo en unos segundos."),
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={factor.ingredientName}
      tinted
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          {onDelete && (
            <Button variant="ghost" onClick={() => onDelete(factor)}>Eliminar</Button>
          )}
          {onEdit && (
            <Button variant="primary" onClick={() => onEdit(factor)}>Editar en la calculadora</Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-6 pb-2">
        <ModalHero
          label="Cada gramo que aprovechas te cuesta"
          value={`${formatCOP(realCostPerGram)}/g`}
          note={`${factor.variant === "bfactor" ? "Proteína" : "Vegetal"} · rendimiento ${percent(yieldFactor * 100)}`}
        />

        <StatGrid cols={3}>
          <Stat label="Peso útil" value={grams(netWeight)} hint={`de ${grams(totalWeight)} comprados`} />
          <Stat label="Rendimiento" value={percent(yieldFactor * 100)} tone="accent" />
          <Stat label="Costo de lo comprado" value={formatCOP(totalCost)} />
        </StatGrid>

        {wasteSum > 0 && (
          <Panel title="Lo que se pierde" aside={`${grams(wasteSum)} · ${percent((wasteSum / totalWeight) * 100)}`}>
            <RowList>
              {factor.wasteItems.map((w) => (
                <ShareRow
                  key={w.id}
                  name={w.name}
                  amount={grams(parseFloat(w.weightGrams))}
                  share={totalWeight > 0 ? parseFloat(w.weightGrams) / totalWeight : undefined}
                />
              ))}
            </RowList>
          </Panel>
        )}

        <div className="flex flex-col items-stretch gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ ...RAISED, borderRadius: 20 }}>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold" style={{ color: "var(--text-primary)", letterSpacing: "-0.01em" }}>Úsalo en tus recetas</p>
            <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
              Crea «{factor.ingredientName} (LIMPIO)» en Inventario con el peso útil y este costo por gramo.
            </p>
          </div>
          <Button variant="primary" onClick={handleSaveAsIngredient} disabled={isSaving} className="whitespace-nowrap">
            {isSaving ? "Creando…" : "Crear en Inventario"}
          </Button>
        </div>

        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Calculado el {formatDate(factor.createdAt)}
          {factor.updatedAt !== factor.createdAt ? ` · editado el ${formatDate(factor.updatedAt)}` : ""}
        </p>
      </div>
    </Modal>
  )
}
