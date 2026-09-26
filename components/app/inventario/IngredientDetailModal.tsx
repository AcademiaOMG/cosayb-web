"use client"

import { Pencil, Trash2 } from "lucide-react"
import Modal from "@/components/ui/Modal"
import Badge from "@/components/ui/Badge"
import Button from "@/components/ui/Button"
import type { Ingredient } from "@/types/ingredient"
import {
  displayName,
  formatCOP,
  formatGrams,
  formatPerGram,
  getPriceStatus,
  isOwnIngredient,
} from "./format"

interface Props {
  ingredient: Ingredient | null
  onClose: () => void
  /** Sin handler = sin permiso → no se muestra la acción */
  onEdit?: (ingredient: Ingredient) => void
  onDelete?: (ingredient: Ingredient) => void
}

const SOURCE_LABEL: Record<string, string> = {
  exito: "Éxito",
  makro: "Makro",
  sipsa: "SIPSA",
  user: "Confirmado por usuarios",
}

function formatDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-sm" style={{ color: "var(--text-muted)" }}>
        {label}
      </dt>
      <dd className="text-right text-sm font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
        {value}
      </dd>
    </div>
  )
}

export default function IngredientDetailModal({ ingredient, onClose, onEdit, onDelete }: Props) {
  if (!ingredient) return null

  const own = isOwnIngredient(ingredient)
  const status = getPriceStatus(ingredient)
  const costPerGram = parseFloat(ingredient.costPerGram)
  const confirmedAt = formatDate(ingredient.priceConfirmedAt)
  const canEdit = own && !!onEdit
  const canDelete = own && !!onDelete

  return (
    <Modal
      open
      onClose={onClose}
      title={displayName(ingredient.name)}
      footer={
        canEdit || canDelete ? (
          <div className="flex items-center justify-between gap-3">
            {canDelete ? (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onDelete(ingredient)
                }}
                className="inline-flex h-10 items-center gap-2 px-3 text-sm font-semibold transition-colors hover:bg-red-50"
                style={{ color: "#B42020", borderRadius: "var(--radius-md)" }}
              >
                <Trash2 size={15} aria-hidden="true" />
                Eliminar
              </button>
            ) : (
              <span />
            )}
            {canEdit && (
              <Button
                variant="primary"
                onClick={() => {
                  onClose()
                  onEdit(ingredient)
                }}
              >
                <Pencil size={15} aria-hidden="true" />
                Editar ingrediente
              </Button>
            )}
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={own ? "accent" : "muted"}>{own ? "Ingrediente propio" : "Banco general"}</Badge>
          {ingredient.category && <Badge variant="muted">{ingredient.category}</Badge>}
          {status === "stale" && <Badge variant="warning">Precio desactualizado</Badge>}
          {status === "pending" && <Badge variant="muted">Precio sin confirmar</Badge>}
        </div>

        {/* La cifra que se usa para costear recetas */}
        <div className="flex flex-col gap-1">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Costo por gramo
          </span>
          <span className="text-4xl font-bold tabular-nums leading-none" style={{ color: "var(--text-primary)" }}>
            {formatPerGram(ingredient.costPerGram)}
            <span className="ml-1 text-lg font-semibold" style={{ color: "var(--text-muted)" }}>
              /g
            </span>
          </span>
        </div>

        <dl
          className="flex flex-col px-4 py-1"
          style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-md)" }}
        >
          <Row label="Costo unidad" value={formatCOP(ingredient.costPerUnit)} />
          <Row label="Peso unidad" value={formatGrams(ingredient.weightGrams)} />
          <Row label="Costo por kilo" value={formatCOP(costPerGram * 1000)} />
          {ingredient.priceSource && (
            <Row label="Fuente del precio" value={SOURCE_LABEL[ingredient.priceSource] ?? ingredient.priceSource} />
          )}
          {ingredient.sipsaMatchName && <Row label="Nombre en el mercado" value={ingredient.sipsaMatchName} />}
          {confirmedAt && <Row label="Precio confirmado" value={confirmedAt} />}
          {own && <Row label="Visible para otros" value={ingredient.isPublic ? "Sí" : "No"} />}
        </dl>

        {!own && (
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Este ingrediente es del banco general y no se puede editar. Si tu precio es distinto,
            créalo como ingrediente propio.
          </p>
        )}
      </div>
    </Modal>
  )
}
