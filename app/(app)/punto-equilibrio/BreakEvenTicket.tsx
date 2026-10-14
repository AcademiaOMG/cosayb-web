"use client"

import type { ReactNode } from "react"
// Las clases .calc-receipt-* (boleto, filas con puntos de guía) son las de Valoración.
import "../valoracion/calculator.css"
import { COLOR_MP, COLOR_PROFIT, RatioRow } from "@/components/ui/RatioDonut"
import { formatCOP, formatNumber } from "@/lib/calculator/format"
import type { BreakEvenOutcome } from "@/lib/calculator/breakEven"
import styles from "./breakEven.module.css"

export interface BreakEvenTicketProps {
  /** Resultado válido o null si no puede calcularse */
  result: Extract<BreakEvenOutcome, { ok: true }> | null
  /** Motivo en lenguaje claro cuando no hay resultado */
  message: string
  /** El motivo es un error (no solo datos pendientes) */
  isError: boolean
  fixedTotal: number
  salePrice: number | null
  variableCost: number | null
  margin: number | null
}

const DASH = "—"

function Row({ label, value, bad = false }: { label: string; value: ReactNode; bad?: boolean }) {
  return (
    <div className="calc-receipt-row">
      <span className="calc-receipt-row-label">{label}</span>
      <span className="calc-receipt-row-leader" />
      <span className="calc-receipt-row-value" style={bad ? { color: "var(--error)" } : undefined}>
        {value}
      </span>
    </div>
  )
}

/**
 * Boleto de resultados (mismo lenguaje que el recibo de Valoración): los datos
 * que escribiste, lo que se deriva y, al final, la cifra grande. Si algo no se
 * puede calcular muestra «—» y el motivo; nunca una cifra a medias.
 */
export default function BreakEvenTicket({ result, message, isError, fixedTotal, salePrice, variableCost, margin }: BreakEvenTicketProps) {
  const marginBad = margin !== null && margin <= 0
  const pctOfPrice = (n: number) => (result ? (n / result.salePrice) * 100 : 0)

  return (
    <div className="calc-printer">
      <div className="calc-printer-slot" />
      <div className="calc-printer-mask">
        <div className="calc-receipt calc-receipt-print" role="region" aria-label="Resultado del punto de equilibrio">
          <div className="calc-receipt-torn" />
          <p className="calc-receipt-title">Punto de equilibrio</p>

          <Row label="Costos fijos del mes" value={fixedTotal > 0 ? formatCOP(fixedTotal) : DASH} />
          <Row label="Precio de venta" value={salePrice !== null && salePrice > 0 ? formatCOP(salePrice) : DASH} />
          <Row label="Costo variable por unidad" value={variableCost !== null ? formatCOP(variableCost) : DASH} />
          <Row label="Margen por unidad" value={margin !== null ? formatCOP(margin) : DASH} bad={marginBad} />

          {result && (
            <div className={styles.split}>
              <p className={styles.splitTitle}>A dónde va cada peso del precio</p>
              <RatioRow label="Costo variable" color={COLOR_MP} pct={pctOfPrice(result.variableCost)} />
              <RatioRow label="Margen" color={COLOR_PROFIT} pct={pctOfPrice(result.contributionMargin)} />
            </div>
          )}

          <hr className="calc-receipt-divider" />

          <Row label="Unidades por día (÷ 30)" value={result ? formatNumber(result.unitsPerDay, 2) : DASH} />
          <Row label="Ventas del mes" value={result ? formatCOP(result.revenuePerMonth) : DASH} />
          <Row label="Ventas del día" value={result ? formatCOP(result.revenuePerDay) : DASH} />

          <hr className="calc-receipt-divider" />

          <div className={styles.hero}>
            <span className="calc-receipt-total-label">Unidades para cubrir costos al mes</span>
            <span className={styles.heroValue} data-empty={result ? undefined : "true"}>
              {result ? formatNumber(result.unitsPerMonth, 2) : DASH}
            </span>
            {!result && (
              <p className={styles.reason} data-tone={isError ? "error" : undefined} role={isError ? "alert" : "status"}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
