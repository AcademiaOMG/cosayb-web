"use client"

import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Badge from "@/components/ui/Badge"
import { saveFactorRendimientoAsIngrediente } from "@/lib/api"
import { useState } from "react"
import type { FactorRendimiento } from "@/types/domain"

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
  onSaved?: () => void
}

export default function YieldFactorDetailModal({ isOpen, onClose, factor }: YieldFactorDetailModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

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
      setSaveMsg(null)
      const result = await saveFactorRendimientoAsIngrediente(factor.id)
      setSaveMsg(result.message ?? "Ingrediente guardado correctamente")
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "No se pudo guardar como ingrediente")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalle del ingrediente">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>{factor.ingredientName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={factor.variant === "bfactor" ? "accent" : "success"}>
                {factor.variant === "bfactor" ? "Proteina" : "Vegetal"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Lo que compraste */}
        <div className="rounded-xl p-3" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}>
          <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Lo que compraste</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Peso completo</p>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{totalWeight.toFixed(2)}g</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Costo total</p>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{formatCOP(totalCost)}</p>
            </div>
          </div>
        </div>

        {/* Lo que se desechó */}
        {wasteSum > 0 && (
          <div className="rounded-xl p-3" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
            <p className="text-xs font-medium mb-1.5" style={{ color: "#B42020" }}>Lo que se desecho</p>
            <div className="flex flex-col gap-1.5">
              {factor.wasteItems.map((w) => (
                <div key={w.id} className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-secondary)" }}>{w.name}</span>
                  <span className="font-mono font-semibold" style={{ color: "#B42020" }}>-{parseFloat(w.weightGrams).toFixed(2)}g</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold pt-1" style={{ borderTop: "1px solid rgba(239,68,68,0.12)" }}>
                <span style={{ color: "var(--text-secondary)" }}>Total desecho</span>
                <span className="font-mono" style={{ color: "#B42020" }}>-{wasteSum.toFixed(2)}g ({((wasteSum / totalWeight) * 100).toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        )}

        {/* Lo que realmente tienes */}
        <div className="rounded-xl p-3" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}>
          <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Lo que realmente tienes</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Peso util</p>
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{netWeight.toFixed(2)}g</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Rendimiento</p>
              <p className="text-base font-bold" style={{ color: "var(--accent-text)" }}>{(yieldFactor * 100).toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Costo por gramo</p>
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>{formatCOP(realCostPerGram)}/g</p>
            </div>
          </div>
        </div>

        {/* Fechas */}
        <div className="rounded-xl p-3" style={{ background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}>
          <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Fechas</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Creado</p>
              <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{formatDate(factor.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Ultima modificacion</p>
              <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{formatDate(factor.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Guardar como ingrediente limpio */}
        <div className="rounded-xl p-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-light)" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Guardar como ingrediente limpio</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Crea o actualiza un ingrediente en la tabla de Inventario con el peso util y costo real calculados.
              </p>
            </div>
            <Button variant="primary" onClick={handleSaveAsIngredient} disabled={isSaving} className="whitespace-nowrap">
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
          {saveMsg && (
            <p className="text-xs mt-2" style={{ color: saveMsg.includes("No se pudo") ? "#EF4444" : "#16A34A" }}>{saveMsg}</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
