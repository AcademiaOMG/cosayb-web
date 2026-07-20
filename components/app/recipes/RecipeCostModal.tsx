"use client"

import { useState } from "react"
import type { RecipeCostResult } from "@/types/domain"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface RecipeCostModalProps {
  open: boolean
  onClose: () => void
  loading: boolean
  result: RecipeCostResult | null
  error: string | null
  recipeName: string
  onRecalculate?: (materialCostPct: number) => void
}

const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

function fmt(n: number) {
  return COP.format(n)
}

export default function RecipeCostModal({
  open,
  onClose,
  loading,
  result,
  error,
  recipeName,
  onRecalculate,
}: RecipeCostModalProps) {
  const [materialCostPct, setMaterialCostPct] = useState("30")
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Costo — ${recipeName}`}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      }
    >
      {/* ── Loading ─────────────────────────────────────────────── */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="animate-pulse rounded-xl h-16" style={{ background: "var(--bg-primary)" }} />
          <div className="animate-pulse rounded-xl h-16" style={{ background: "var(--bg-primary)" }} />
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────── */}
      {!loading && error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "16px",
            borderRadius: "12px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#B42020",
          }}
        >
          <AlertTriangle size={18} />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* ── Result ──────────────────────────────────────────────── */}
      {!loading && result && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Ciclo detectado */}
          {result.circularRefs && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                color: "#92400E",
              }}
            >
              <AlertTriangle size={16} />
              <p className="text-xs font-medium">
                Se detectó una referencia circular. El costo puede ser incompleto.
              </p>
            </div>
          )}

          {/* ── Resumen de costos ─────────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <SummaryCard
              label="Costo total (sin margen)"
              value={fmt(result.rawCostTotal)}
              muted
            />
            <SummaryCard
              label="Costo por porción (sin margen)"
              value={fmt(result.rawCostPerServing)}
              muted
            />
            <SummaryCard
              label={`Con margen ${result.safetyMarginPct} %`}
              value={fmt(result.costWithMarginTotal)}
            />
            <SummaryCard
              label="Costo por porción"
              value={fmt(result.costWithMarginPerServing)}
              accent
            />
            {result.costPerGram != null && (
              <SummaryCard
                label="Costo por gramo"
                value={fmt(result.costPerGram)}
                colSpan
              />
            )}
          </div>

          {/* ── Análisis de rentabilidad ──────────────────────────── */}
          <div
            style={{
              padding: "16px",
              borderRadius: "12px",
              background: "var(--bg-primary)",
              border: "1px solid var(--border-light)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <p
                className="text-xs font-semibold uppercase"
                style={{ color: "var(--text-muted)", letterSpacing: "0.8px" }}
              >
                Análisis de rentabilidad
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <label className="text-xs" style={{ color: "var(--text-muted)" }}>
                  % Materia Prima:
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={materialCostPct}
                  onChange={(e) => setMaterialCostPct(e.target.value)}
                  style={{
                    width: "50px",
                    padding: "4px 6px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-light)",
                    background: "var(--bg-surface)",
                    fontSize: "12px",
                    textAlign: "right",
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const pct = parseFloat(materialCostPct)
                    if (!isNaN(pct) && pct > 0 && pct < 100 && onRecalculate) {
                      onRecalculate(pct / 100)
                    }
                  }}
                >
                  Calcular
                </Button>
              </div>
            </div>

            {result.profitability ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "8px",
                }}
              >
                {/* % Materia Prima */}
                <div style={{ padding: "10px", borderRadius: "8px", background: "var(--bg-surface)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)", marginBottom: "4px" }}>
                    % Materia Prima
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                      {(result.profitability.materialCostPct * 100).toFixed(1)}%
                    </p>
                    <RatingBadge rating={result.profitability.materialCostRating} />
                  </div>
                </div>

                {/* Costos Fijos */}
                <div style={{ padding: "10px", borderRadius: "8px", background: "var(--bg-surface)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)", marginBottom: "4px" }}>
                    Costos Fijos
                  </p>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    {(result.profitability.fixedCostPct * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {fmt(result.profitability.fixedCostAmount)}
                  </p>
                </div>

                {/* Ganancia */}
                <div style={{ padding: "10px", borderRadius: "8px", background: "var(--bg-surface)" }}>
                  <p className="text-xs" style={{ color: "var(--text-muted)", marginBottom: "4px" }}>
                    Ganancia
                  </p>
                  <p className="text-sm font-bold" style={{
                    color: result.profitability.profitPct > 0 ? "#16A34A" : "#B42020"
                  }}>
                    {(result.profitability.profitPct * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {fmt(result.profitability.profitAmount)}
                  </p>
                </div>

                {/* Precio Potencial de Venta */}
                <div
                  style={{
                    gridColumn: "span 3",
                    padding: "12px",
                    borderRadius: "8px",
                    background: "var(--accent-light)",
                    border: "1px solid var(--accent)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <p className="text-xs font-semibold" style={{ color: "var(--accent-text)" }}>
                    Precio potencial de venta
                  </p>
                  <p className="text-base font-bold" style={{ color: "var(--accent)" }}>
                    {fmt(result.profitability.potentialSalePrice)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-center" style={{ color: "var(--text-muted)", padding: "12px 0" }}>
                Ingresa el porcentaje de materia prima y haz clic en &quot;Calcular&quot; para ver el análisis de rentabilidad.
              </p>
            )}
          </div>

          {/* ── Breakdown ─────────────────────────────────────────── */}
          {result.breakdown.length > 0 && (
            <div>
              <p
                className="text-xs font-semibold uppercase"
                style={{ color: "var(--text-muted)", letterSpacing: "0.8px", marginBottom: "10px" }}
              >
                Desglose de ingredientes
              </p>
              <div
                style={{
                  border: "1px solid var(--border-light)",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
                {/* Encabezados */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 80px 80px 80px",
                    padding: "8px 12px",
                    background: "var(--bg-secondary)",
                    gap: "8px",
                  }}
                >
                  {["Ingrediente", "Cantidad (g)", "$/g", "Costo"].map((h) => (
                    <p
                      key={h}
                      className="text-xs font-semibold"
                      style={{ color: "var(--text-muted)", textAlign: h !== "Ingrediente" ? "right" : "left" }}
                    >
                      {h}
                    </p>
                  ))}
                </div>

                {/* Rows */}
                {result.breakdown.map((item, idx) => (
                  <div
                    key={item.ingredientId + idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 80px 80px 80px",
                      padding: "8px 12px",
                      gap: "8px",
                      borderTop: idx === 0 ? undefined : "1px solid var(--border-light)",
                      background: idx % 2 === 0 ? "var(--bg-surface)" : "var(--bg-primary)",
                    }}
                  >
                    <p
                      className="text-xs"
                      style={{
                        color: "var(--text-primary)",
                        paddingLeft: item.depth > 0 ? `${item.depth * 10}px` : undefined,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={item.ingredientName}
                    >
                      {item.depth > 0 && (
                        <span style={{ color: "var(--text-muted)", marginRight: "4px" }}>└</span>
                      )}
                      {item.ingredientName}
                    </p>
                    <p className="text-xs text-right" style={{ color: "var(--text-secondary)" }}>
                      {item.effectiveQuantityG.toFixed(2)}
                    </p>
                    <p className="text-xs text-right" style={{ color: "var(--text-secondary)" }}>
                      {item.costPerGram.toFixed(2)}
                    </p>
                    <p className="text-xs text-right font-medium" style={{ color: "var(--text-primary)" }}>
                      {COP.format(item.lineCost)}
                    </p>
                  </div>
                ))}

                {/* Total row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 80px 80px 80px",
                    padding: "10px 12px",
                    gap: "8px",
                    borderTop: "2px solid var(--border-medium)",
                    background: "var(--bg-secondary)",
                  }}
                >
                  <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                    Total
                  </p>
                  <p />
                  <p />
                  <p className="text-xs text-right font-bold" style={{ color: "var(--accent)" }}>
                    {COP.format(result.rawCostTotal)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {result.breakdown.length === 0 && (
            <p className="text-sm text-center" style={{ color: "var(--text-muted)", padding: "20px 0" }}>
              Esta receta no tiene ingredientes registrados.
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}

function SummaryCard({
  label,
  value,
  muted = false,
  accent = false,
  colSpan = false,
}: {
  label: string
  value: string
  muted?: boolean
  accent?: boolean
  colSpan?: boolean
}) {
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "12px",
        background: accent ? "var(--accent-light)" : "var(--bg-primary)",
        border: accent ? "1px solid var(--accent)" : "1px solid var(--border-light)",
        gridColumn: colSpan ? "span 2" : undefined,
      }}
    >
      <p
        className="text-xs"
        style={{ color: accent ? "var(--accent-text)" : "var(--text-muted)", marginBottom: "4px" }}
      >
        {label}
      </p>
      <p
        className="text-base font-bold"
        style={{ color: accent ? "var(--accent)" : muted ? "var(--text-secondary)" : "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  )
}

function RatingBadge({ rating }: { rating: "MUY_BUENO" | "REGULAR" | "MALO" }) {
  const config = {
    MUY_BUENO: { bg: "#DCFCE7", color: "#166534", label: "MUY BUENO", icon: TrendingUp },
    REGULAR: { bg: "#FEF9C3", color: "#854D0E", label: "REGULAR", icon: Minus },
    MALO: { bg: "#FEE2E2", color: "#991B1B", label: "MALO", icon: TrendingDown },
  }
  const { bg, color, label, icon: Icon } = config[rating]
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "3px",
        fontSize: "9px",
        fontWeight: 600,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        color,
        background: bg,
        borderRadius: "100px",
        padding: "2px 6px",
      }}
    >
      <Icon size={9} />
      {label}
    </span>
  )
}
