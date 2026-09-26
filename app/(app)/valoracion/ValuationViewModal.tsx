"use client"

import useSWR from "swr"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import InfoStat from "@/components/ui/InfoStat"
import ValuationDetailCard from "./ValuationDetailCard"
import "./calculator.css"
import { RotateCcw, StickyNote, ChefHat } from "lucide-react"
import { getRecipeById } from "@/lib/api"
import type { Valuation } from "@/types/domain"
import { fmt, fmtPct, refLabel, calcPricing } from "./lib"

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
      <div className="flex flex-col gap-5">
        <div
          className="flex items-center gap-2 px-3 py-2.5 text-sm"
          style={{ background: "var(--bg-primary)", borderRadius: "var(--radius-md)" }}
        >
          <ChefHat size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          {valuation.refType === "recipe" && valuation.refId ? (
            <span style={{ color: "var(--text-secondary)" }}>
              Basada en la receta{" "}
              <strong style={{ color: "var(--text-primary)" }}>{linkedRecipe?.name ?? "—"}</strong>
            </span>
          ) : valuation.refType === "recipe" ? (
            <span style={{ color: "var(--text-secondary)" }}>Basada en una receta (sin vínculo registrado)</span>
          ) : (
            <span style={{ color: "var(--text-secondary)" }}>{refLabel(valuation.refType)}</span>
          )}
        </div>

        {result && (
          <>
            <div className="calc-screen" style={{ maxWidth: 260, margin: "0 auto" }}>
              <span className="calc-screen-label">PRECIO SUGERIDO</span>
              <span className="calc-screen-value">{fmt(result.suggested)}</span>
            </div>
            <ValuationDetailCard
              headline="Desglose de la valoración"
              result={result}
              cost={cost}
              margin={margin}
              actualPrice={actualPrice}
            />
          </>
        )}

        <div>
          <p className="text-xs font-semibold tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
            DATOS DE LA VALORACIÓN
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoStat label="Costo materia prima" value={fmt(valuation.costMateriaprima)} mono />
            <InfoStat label="Margen de seguridad" value={fmtPct(valuation.safetyMargin)} mono />
          </div>
        </div>

        {valuation.notes && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StickyNote size={14} style={{ color: "var(--text-muted)" }} />
              <p className="text-xs font-semibold tracking-widest" style={{ color: "var(--text-muted)" }}>NOTAS</p>
            </div>
            <p
              className="text-sm px-3 py-2.5"
              style={{ color: "var(--text-secondary)", background: "var(--bg-primary)", borderRadius: "var(--radius-md)" }}
            >
              {valuation.notes}
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
