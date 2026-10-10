import type { MenuIndicator } from "@/types/domain"

// ─── Indicador (semáforo del % de materia prima) ──────────────────────────────
export const IND: Record<MenuIndicator, { color: string; bg: string; text: string; label: string; sublabel: string }> = {
  MUY_BUENO: { color: "#10B981", bg: "#ECFDF5", text: "#064E3B", label: "MUY BUENO", sublabel: "Excelente rentabilidad" },
  REGULAR:   { color: "#F59E0B", bg: "#FFFBEB", text: "#78350F", label: "REGULAR",   sublabel: "Margen moderado" },
  MALO:      { color: "#EF4444", bg: "#FEF2F2", text: "#7F1D1D", label: "MALO",      sublabel: "Revisar estructura de costos" },
}

// ─── Formato de números ───────────────────────────────────────────────────────
/** Pesos sin decimales: $9.841 */
export const fmt = (v: number) =>
  `$${v.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

/** Pesos con 2 decimales, para costos por gramo/unidad: $2,91 */
export const fmtDec = (v: number) =>
  `$${v.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** Cantidad con su unidad: "1.000 g" · "20 und" */
export const fmtQty = (v: number, unidad: "g" | "und") =>
  `${v.toLocaleString("es-CO", { maximumFractionDigits: 2 })} ${unidad}`
