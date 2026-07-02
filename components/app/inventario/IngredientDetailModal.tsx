"use client"

import { DollarSign, Scale, Zap, Tag, CheckCircle, Clock, Store, Pencil } from "lucide-react"
import Modal from "@/components/ui/Modal"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import type { Ingredient } from "@/types/ingredient"

interface Props {
  ingredient: Ingredient | null
  onClose: () => void
  onEdit: (ingredient: Ingredient) => void
}

function Row({ icon, label, value, mono = false }: { icon: React.ReactNode; label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3" style={{ borderBottom: "1px solid var(--border-light)" }}>
      <div className="flex items-center gap-2.5" style={{ color: "var(--text-muted)" }}>
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span
        className={`text-sm font-semibold text-right ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  )
}

function getPriceStatus(ingredient: Ingredient): { label: string; variant: "success" | "warning" | "muted" } {
  if (!ingredient.priceConfirmedAt) return { label: "Precio pendiente de confirmar", variant: "muted" }
  const stale = Date.now() - new Date(ingredient.priceConfirmedAt).getTime() > 30 * 24 * 60 * 60 * 1000
  if (stale) return { label: "Precio desactualizado (+30 días)", variant: "warning" }
  return { label: "Precio confirmado recientemente", variant: "success" }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

export default function IngredientDetailModal({ ingredient, onClose, onEdit }: Props) {
  if (!ingredient) return null

  const isOwn = ingredient.userId !== null
  const costPerUnit = parseFloat(ingredient.costPerUnit)
  const weightGrams = parseFloat(ingredient.weightGrams)
  const costPerGram = parseFloat(ingredient.costPerGram)
  const priceStatus = getPriceStatus(ingredient)

  const sourceLabel: Record<string, string> = {
    exito: "Éxito",
    makro: "Makro",
    sipsa: "SIPSA",
    user: "Confirmado por usuarios",
  }

  return (
    <Modal
      open={!!ingredient}
      onClose={onClose}
      title={ingredient.name}
      footer={
        isOwn ? (
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => { onClose(); onEdit(ingredient) }}
            >
              <Pencil size={14} className="mr-1.5" />
              Editar ingrediente
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-5">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={isOwn ? "accent" : "muted"}>
            {isOwn ? "Ingrediente propio" : "Banco base"}
          </Badge>
          {ingredient.category && (
            <Badge variant="muted">{ingredient.category}</Badge>
          )}
          <Badge variant={priceStatus.variant}>{priceStatus.label}</Badge>
        </div>

        {/* Precio destacado */}
        <div
          className="flex items-center justify-between rounded-2xl px-5 py-4"
          style={{ background: "var(--accent-light)" }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium" style={{ color: "var(--accent-text)" }}>
              Costo por gramo
            </span>
            <span className="text-2xl font-bold font-mono" style={{ color: "var(--accent-text)" }}>
              ${costPerGram.toFixed(4)}
              <span className="text-sm font-normal ml-1">/g</span>
            </span>
          </div>
          <Zap size={28} style={{ color: "var(--accent-text)", opacity: 0.4 }} />
        </div>

        {/* Filas de datos */}
        <div>
          <Row
            icon={<DollarSign size={15} />}
            label="Precio de compra"
            value={`$${costPerUnit.toLocaleString("es-CO")} COP`}
            mono
          />
          <Row
            icon={<Scale size={15} />}
            label="Peso del empaque"
            value={`${weightGrams.toLocaleString("es-CO")} g`}
            mono
          />
          <Row
            icon={<DollarSign size={15} />}
            label="Costo por kg"
            value={`$${(costPerGram * 1000).toLocaleString("es-CO", { maximumFractionDigits: 0 })} COP`}
            mono
          />
          <Row
            icon={<Store size={15} />}
            label="Fuente de precio"
            value={
              ingredient.priceSource
                ? (sourceLabel[ingredient.priceSource] ?? ingredient.priceSource)
                : "—"
            }
          />
          {ingredient.sipsaMatchName && (
            <Row
              icon={<Tag size={15} />}
              label="Nombre en mercado"
              value={ingredient.sipsaMatchName}
            />
          )}
          <Row
            icon={<Clock size={15} />}
            label="Precio confirmado el"
            value={formatDate(ingredient.priceConfirmedAt)}
          />
          <Row
            icon={<CheckCircle size={15} />}
            label="Visible para otros"
            value={ingredient.isPublic ? "Sí" : "No"}
          />
        </div>
      </div>
    </Modal>
  )
}
