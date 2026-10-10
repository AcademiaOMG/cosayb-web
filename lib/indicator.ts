import type { ValuationIndicator } from "@/types/domain"

/**
 * Semáforo de margen — fuente única de rangos y colores (web).
 *
 * Rangos PO (DOMINIO.md §4 "Semáforo de margen"):
 *   % de materia prima: < 32 MUY BUENO · 32–37 REGULAR · > 37 MALO
 *   espejo MC% (= 100 − %costo): > 68 MUY BUENO · 63–68 REGULAR · < 63 MALO
 *
 * Los límites en puntos porcentuales (escala 0–100) viven acá: cualquier
 * cambio de rangos se hace una sola vez y lo heredan Valoración, Menú,
 * Recetas y Punto de Equilibrio.
 */

/** Por debajo de este % de MP → MUY BUENO (el espejo MC% está por encima de 100 − MP_GOOD_MAX). */
export const MP_GOOD_MAX = 32
/** Por encima de este % de MP → MALO (el espejo MC% está por debajo de 100 − MP_BAD_MIN). */
export const MP_BAD_MIN = 37

/** Indicador desde el % de materia prima (0–100). */
export function indicatorFromPctMP(pct: number): ValuationIndicator {
  if (pct < MP_GOOD_MAX) return "MUY BUENO"
  if (pct > MP_BAD_MIN) return "MALO"
  return "REGULAR"
}

/** Indicador desde el Margen de Contribución % (0–100) — espejo exacto de %MP. */
export function indicatorFromMC(mcPct: number): ValuationIndicator {
  if (mcPct > 100 - MP_GOOD_MAX) return "MUY BUENO"
  if (mcPct < 100 - MP_BAD_MIN) return "MALO"
  return "REGULAR"
}

export const IND: Record<ValuationIndicator, { color: string; bg: string; text: string; sublabel: string }> = {
  "MUY BUENO": { color: "#10B981", bg: "#ECFDF5", text: "#064E3B", sublabel: "Excelente rentabilidad" },
  "REGULAR": { color: "#F59E0B", bg: "#FFFBEB", text: "#78350F", sublabel: "Margen moderado" },
  "MALO": { color: "#EF4444", bg: "#FEF2F2", text: "#7F1D1D", sublabel: "Revisar estructura de costos" },
}
