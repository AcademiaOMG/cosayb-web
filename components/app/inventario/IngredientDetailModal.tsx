"use client"

import { Pencil, Trash2 } from "lucide-react"
import Modal from "@/components/ui/Modal"
import { FactRow, ModalHero, RAISED, Stat, StatGrid } from "@/components/ui/ModalKit"
import Button from "@/components/ui/Button"
import type { Ingredient } from "@/types/ingredient"
import {
  displayName,
  formatCOP,
  formatGrams,
  formatPerGram,
  formatPerKg,
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

export default function IngredientDetailModal({ ingredient, onClose, onEdit, onDelete }: Props) {
  if (!ingredient) return null

  const own = isOwnIngredient(ingredient)
  const status = getPriceStatus(ingredient)
  const confirmedAt = formatDate(ingredient.priceConfirmedAt)
  const canEdit = own && !!onEdit
  const canDelete = own && !!onDelete

  return (
    <Modal
      open
      onClose={onClose}
      title={displayName(ingredient.name)}
      tinted
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
      <div className="flex flex-col gap-6 pb-2">
        <ModalHero
          label="Costo por kilo"
          value={`${formatPerKg(ingredient.costPerGram)}/kg`}
          note={[own ? "Ingrediente propio" : "Banco general", ingredient.category].filter(Boolean).join(" · ")}
          aside={
            status === "stale" ? (
              <p className="text-right text-sm font-semibold" style={{ color: "#B7791F" }}>
                Precio desactualizado
              </p>
            ) : undefined
          }
        />

        <StatGrid cols={3}>
          <Stat label="Costo unidad" value={formatCOP(ingredient.costPerUnit)} />
          <Stat label="Peso unidad" value={formatGrams(ingredient.weightGrams)} />
          <Stat label="Costo por gramo" value={`${formatPerGram(ingredient.costPerGram)}/g`} />
        </StatGrid>

        {(ingredient.priceSource || ingredient.sipsaMatchName || confirmedAt || own) && (
          <dl className="m-0 px-5 py-3" style={{ ...RAISED, borderRadius: 20 }}>
            {ingredient.priceSource && (
              <FactRow label="Fuente del precio" value={SOURCE_LABEL[ingredient.priceSource] ?? ingredient.priceSource} />
            )}
            {ingredient.sipsaMatchName && <FactRow label="Nombre en el mercado" value={ingredient.sipsaMatchName} />}
            {confirmedAt && <FactRow label="Precio confirmado" value={confirmedAt} />}
            {own && <FactRow label="Visible para otros" value={ingredient.isPublic ? "Sí" : "No"} />}
          </dl>
        )}
      </div>
    </Modal>
  )
}
