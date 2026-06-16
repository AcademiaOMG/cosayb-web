"use client"

import { useState } from "react"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import Badge from "@/components/ui/Badge"
import { saveFactorRendimientoAsIngrediente } from "@/lib/api"
import type { FactorRendimiento } from "@/types/domain"

function formatCOP(amount: number): string {
  return `$ ${amount.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

interface YieldFactorDetailModalProps {
  isOpen: boolean
  onClose: () => void
  factor: FactorRendimiento | null
  onSavedAsIngredient?: () => void
}

export default function YieldFactorDetailModal({ isOpen, onClose, factor, onSavedAsIngredient }: YieldFactorDetailModalProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  if (!factor) return null

  const totalCost = parseFloat(factor.totalCost)
  const totalWeight = parseFloat(factor.totalWeightGrams)
  const costPerGram = parseFloat(factor.costPerGram)
  const totalWasteGrams = parseFloat(factor.totalWasteGrams)
  const totalWasteCost = parseFloat(factor.totalWasteCost)
  const netWeight = parseFloat(factor.netWeightGrams)
  const yieldFactor = parseFloat(factor.yieldFactor)
  const realCostPerGram = parseFloat(factor.realCostPerGram)

  const handleSaveAsIngredient = async () => {
    try {
      setIsSaving(true)
      setSavedMsg(null)
      const res = await saveFactorRendimientoAsIngrediente(factor.id)
      const msg = res.data?.id
        ? `"${factor.ingredientName} (LIMPIO)" guardado en inventario`
        : `"${factor.ingredientName} (LIMPIO)" actualizado en inventario`
      setSavedMsg(msg)
      onSavedAsIngredient?.()
    } catch (err) {
      setSavedMsg(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={factor.ingredientName}
      footer={
        <div className="flex justify-between">
          <Button variant="primary" onClick={handleSaveAsIngredient} disabled={isSaving}>
            {isSaving ? "Guardando..." : "Guardar como Ingrediente"}
          </Button>
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Badge variant={factor.variant === "bfactor" ? "accent" : "success"}>
            {factor.variant === "bfactor" ? "Proteína (BFACTOR)" : "Vegetal (BFACTORVEG)"}
          </Badge>
        </div>

        {/* Datos de entrada */}
        <div className="p-4 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>Datos de entrada</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Costo Total</div>
              <div className="font-bold" style={{ color: "var(--text-primary)" }}>{formatCOP(totalCost)}</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Peso Total</div>
              <div className="font-bold" style={{ color: "var(--text-primary)" }}>{totalWeight.toFixed(0)}g</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Costo/g original</div>
              <div className="font-bold" style={{ color: "var(--text-primary)" }}>{formatCOP(costPerGram)}</div>
            </div>
          </div>
        </div>

        {/* Mermas */}
        {factor.wasteItems.length > 0 && (
          <div className="p-4 rounded-xl" style={{ background: "#FEF2F2" }}>
            <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#991B1B" }}>Porciones de merma ({factor.wasteItems.length})</div>
            <div className="flex flex-col gap-1.5">
              {factor.wasteItems.map((w) => (
                <div key={w.id} className="flex justify-between text-sm" style={{ color: "#7F1D1D" }}>
                  <span>{w.name}</span>
                  <span className="font-mono">{parseFloat(w.weightGrams).toFixed(0)}g = {formatCOP(parseFloat(w.allocatedCost))}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-bold mt-3 pt-3" style={{ borderTop: "1px solid #FECACA", color: "#991B1B" }}>
              <span>Total merma</span>
              <span className="font-mono">{totalWasteGrams.toFixed(0)}g = {formatCOP(totalWasteCost)}</span>
            </div>
          </div>
        )}

        {factor.wasteItems.length === 0 && (
          <div className="p-4 rounded-xl text-center" style={{ background: "var(--bg-secondary)" }}>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>Sin mermas registradas — Rendimiento = 100%</div>
          </div>
        )}

        {/* Resultado */}
        <div className="p-4 rounded-xl" style={{ background: "var(--accent-light)" }}>
          <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--accent-text)" }}>Resultado</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Peso Neto</div>
              <div className="font-bold" style={{ color: "var(--text-primary)" }}>{netWeight.toFixed(0)}g</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Rendimiento</div>
              <div className="text-lg font-bold" style={{ color: "var(--accent-text)" }}>{(yieldFactor * 100).toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Costo Real/g</div>
              <div className="text-lg font-bold" style={{ color: "var(--accent-text)" }}>{formatCOP(realCostPerGram)}</div>
            </div>
          </div>
        </div>

        {/* Mensaje de guardado */}
        {savedMsg && (
          <div className="text-sm text-center py-2 rounded-xl" style={{ background: "#D1FAE5", color: "#065F46" }}>
            {savedMsg}
          </div>
        )}
      </div>
    </Modal>
  )
}
