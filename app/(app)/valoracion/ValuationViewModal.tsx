"use client"

import useSWR from "swr"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { ModalHero, Panel, RAISED, ShareDonut, Stat, StatGrid } from "@/components/ui/ModalKit"
import { RotateCcw } from "lucide-react"
import { getRecipeById } from "@/lib/api"
import type { Valuation } from "@/types/domain"
import { fmt, fmtPct, refLabel, calcPricing, moneyFromPct } from "./lib"

const ratingText = (i: string) => (i === "MUY BUENO" ? "Muy buena" : i === "MALO" ? "Mala" : "Regular")
const toneColor = (i: string) => (i === "MUY BUENO" ? "#0F8F5F" : i === "MALO" ? "#C2362B" : "#B7791F")

export default function ValuationViewModal({
  valuation,
  onClose,
  onReuse,
}: {
  valuation: Valuation | null
  onClose: () => void
  onReuse: (v: Valuation) => void
}) {
  const linkedRecipeId = valuation?.refType === "recipe" ? valuation.refId : null
  const { data: linkedRecipe } = useSWR(
    linkedRecipeId ? ["recipe-name", linkedRecipeId] : null,
    () => getRecipeById(linkedRecipeId!).then((r) => r.data),
  )

  if (!valuation) return null

  const cost = parseFloat(valuation.costMateriaprima)
  const pctMP = parseFloat(valuation.pctMateriaprima)
  const margin = parseFloat(valuation.safetyMargin)
  const result = calcPricing(cost, pctMP, margin)
  const actualPrice = valuation.actualPrice != null ? parseFloat(valuation.actualPrice) : null

  return (
    <Modal
      open={!!valuation}
      onClose={onClose}
      title={valuation.name}
      tinted
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {new Date(valuation.createdAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
            <Button variant="primary" onClick={() => onReuse(valuation)}>
              <RotateCcw size={14} />
              Reutilizar
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6 pb-2">
        {result && (
          <>
            <ModalHero
              label="Precio sugerido"
              value={fmt(result.suggested)}
              note={
                valuation.refType === "recipe" && valuation.refId
                  ? `Basada en la receta ${linkedRecipe?.name ?? "—"}`
                  : valuation.refType === "recipe"
                    ? "Basada en una receta"
                    : refLabel(valuation.refType)
              }
              aside={
                <p className="text-right text-sm" style={{ color: "var(--text-muted)" }}>
                  Rentabilidad
                  <span className="block text-xl font-bold" style={{ color: toneColor(result.indicator) }}>
                    {ratingText(result.indicator)}
                  </span>
                </p>
              }
            />

            <StatGrid cols={3}>
              <Stat label="Costo de materia prima" value={fmt(valuation.costMateriaprima)} />
              <Stat label="Margen de seguridad" value={fmtPct(valuation.safetyMargin)} />
              <Stat
                label="Precio cobrado"
                value={actualPrice != null ? fmt(actualPrice) : "—"}
                hint={actualPrice != null ? (actualPrice >= result.suggested ? "por encima del sugerido" : "por debajo del sugerido") : "sin registrar"}
                tone={actualPrice == null ? "plain" : actualPrice >= result.suggested ? "good" : "bad"}
              />
            </StatGrid>

            <Panel title="Cómo se reparte el precio">
              <ShareDonut
                centerLabel="de ganancia"
                centerValue={fmtPct(result.pctProfit)}
                centerColor="#0F8F5F"
                segments={[
                  { key: "mp", label: "Materia prima", pct: result.pctMateriaprima, color: "#3B82F6", amount: fmt(cost) },
                  { key: "fixed", label: "Costos fijos", pct: result.pctFixedCosts, color: "#FB923C", amount: fmt(moneyFromPct(result.pctFixedCosts, result.suggested)) },
                  { key: "tax", label: "Impuestos de ley", pct: result.pctImpuestos, color: "#A78BFA", amount: fmt(moneyFromPct(result.pctImpuestos, result.suggested)) },
                  { key: "other", label: "Otros", pct: result.pctOtros, color: "#94A3B8", amount: fmt(moneyFromPct(result.pctOtros, result.suggested)) },
                  { key: "profit", label: "Ganancia neta", pct: result.pctProfit, color: "#10B981", amount: fmt(moneyFromPct(result.pctProfit, result.suggested)) },
                ]}
              />
            </Panel>
          </>
        )}

        {valuation.notes && (
          <Panel title="Notas">
            <p className="px-5 py-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)", ...RAISED, borderRadius: 20 }}>
              {valuation.notes}
            </p>
          </Panel>
        )}
      </div>
    </Modal>
  )
}
