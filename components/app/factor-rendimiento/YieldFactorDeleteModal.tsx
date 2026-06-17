"use client"

import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { AlertTriangle } from "lucide-react"
import type { FactorRendimiento } from "@/types/domain"

interface YieldFactorDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  factor: FactorRendimiento | null
  isDeleting?: boolean
}

export default function YieldFactorDeleteModal({ isOpen, onClose, onConfirm, factor, isDeleting }: YieldFactorDeleteModalProps) {
  if (!factor) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar ingrediente"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? "Eliminando..." : "Sí, eliminar"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 items-center text-center">
        <div className="p-3 rounded-full" style={{ background: "#FEE2E2" }}>
          <AlertTriangle size={24} style={{ color: "#B42020" }} />
        </div>
        <div>
          <p className="text-sm" style={{ color: "var(--text-primary)" }}>
            Vas a eliminar el rendimiento de{" "}
            <strong>{factor.ingredientName}</strong>
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Se borrarán todos los datos de desecho asociados. Esta acción no se puede deshacer.
          </p>
        </div>
      </div>
    </Modal>
  )
}
