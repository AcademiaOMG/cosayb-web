import { formatCOP } from "@/lib/commerce/catalog"

export { formatCOP }

const dateFmt = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "long", year: "numeric" })
const shortFmt = new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" })

export function fmtDate(iso: string | null | undefined, style: "long" | "short" = "long"): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "—"
  return (style === "long" ? dateFmt : shortFmt).format(d)
}

/** «2026-10-15» → «15 oct» (corto) o «15 de octubre de 2026» (largo). */
export function fmtDay(yyyymmdd: string, style: "short" | "long" = "short"): string {
  const [y, m, d] = yyyymmdd.slice(0, 10).split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return new Intl.DateTimeFormat("es-CO", style === "short" ? { day: "numeric", month: "short", timeZone: "UTC" } : { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date)
}

/** Hace cuánto ocurrió algo, en español corto. */
export function timeAgoEs(iso: string, now: Date = new Date()): string {
  const diff = Math.max(0, now.getTime() - new Date(iso).getTime())
  const min = Math.floor(diff / 60_000)
  if (min < 1) return "ahora"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  if (d < 30) return `hace ${d} ${d === 1 ? "día" : "días"}`
  return fmtDate(iso, "short")
}
