import type { CourseLevel } from "./types"

export const LEVEL_LABEL: Record<CourseLevel, string> = { beginner: "Básico", intermediate: "Intermedio", advanced: "Avanzado" }

export function durationLabel(min: number): string {
  if (min <= 0) return "A tu ritmo"
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

export function pct(done: number, total: number): number {
  return total <= 0 ? 0 : Math.min(100, Math.round((done * 100) / total))
}

export function isNew(createdAt: string, now = Date.now()): boolean {
  return now - new Date(createdAt).getTime() < 30 * 86_400_000
}

/** Color por avance (clave de pastel) para barras y filas. */
export function toneForPct(p: number): "rose" | "amber" | "sky" | "mint" {
  if (p >= 100) return "mint"
  if (p >= 60) return "sky"
  if (p >= 30) return "amber"
  return "rose"
}

export function secondsLabel(s: number): string {
  if (s <= 0) return "—"
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}
