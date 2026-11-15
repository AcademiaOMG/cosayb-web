import type { MenuIndicator } from "@/types/domain"

// ─── Indicador (semáforo del % de materia prima) ──────────────────────────────
export const IND: Record<MenuIndicator, { color: string; bg: string; text: string; label: string; sublabel: string }> = {
  MUY_BUENO: { color: "var(--success)", bg: "var(--success-bg)", text: "#064E3B", label: "MUY BUENO", sublabel: "Excelente rentabilidad" },
  REGULAR:   { color: "var(--warning)", bg: "var(--warning-bg)", text: "var(--warning-text-strong)", label: "REGULAR",   sublabel: "Margen moderado" },
  MALO:      { color: "#EF4444", bg: "var(--error-bg)", text: "#7F1D1D", label: "MALO",      sublabel: "Revisar estructura de costos" },
}

// ─── Formato de números ───────────────────────────────────────────────────────
/** Pesos sin decimales: $9.841 */
export const fmt = (v: number) =>
  `$${v.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

/** Pesos con 2 decimales, para costos por gramo/unidad: $2,91 */
export const fmtDec = (v: number) =>
  `$${v.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Cantidad con su unidad: "1.000 g" · "20 und" */
export const fmtQty = (v: number, unidad: "g" | "ml" | "und" | "porcion") =>
  `${v.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${unidad}`
