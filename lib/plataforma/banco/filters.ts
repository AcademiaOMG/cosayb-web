/** Filtros, orden y paginación (en el cliente) de las listas del banco. Lógica pura. */
import { normalizeForSearch } from "@/components/app/inventario/format"
import {
  costPerGramOf,
  type CostoReceta,
  type IngredienteBanco,
  type ProblemaIngrediente,
  type ProblemaReceta,
  type RecetaBanco,
} from "./quality"

const STALE_MS = 30 * 24 * 60 * 60 * 1000

// ─── Ingredientes ────────────────────────────────────────────────────────────

export type OrdenIngredientes = "nombre" | "precio_asc" | "precio_desc" | "reciente"

export interface FiltroIngredientes {
  busqueda: string
  problema?: ProblemaIngrediente
  unidad?: string
  /** «banco» = creado por la plataforma; «negocio» = marcado público por un negocio */
  origen?: "banco" | "negocio"
  /** «viejo» = sin tocar hace más de 30 días */
  actualizacion?: "viejo" | "reciente"
  orden: OrdenIngredientes
}

export function origenIngrediente(i: object): "banco" | "negocio" {
  return (i as { organizationId?: string | null }).organizationId ? "negocio" : "banco"
}

export function filtrarIngredientes<T extends IngredienteBanco>(
  items: T[],
  f: FiltroIngredientes,
  problemas: (i: T) => ProblemaIngrediente[],
  ahora = Date.now()
): T[] {
  const q = normalizeForSearch(f.busqueda)
  const out = items.filter((i) => {
    if (q && !normalizeForSearch(i.name).includes(q)) return false
    if (f.unidad && (i.unit ?? "g") !== f.unidad) return false
    if (f.origen && origenIngrediente(i) !== f.origen) return false
    if (f.actualizacion) {
      const viejo = ahora - new Date(i.updatedAt).getTime() > STALE_MS
      if ((f.actualizacion === "viejo") !== viejo) return false
    }
    if (f.problema && !problemas(i).includes(f.problema)) return false
    return true
  })
  const cmpNombre = (a: T, b: T) => a.name.localeCompare(b.name, "es")
  const precio = (i: T) => {
    const p = costPerGramOf(i)
    return Number.isFinite(p) ? p : 0
  }
  switch (f.orden) {
    case "precio_asc": return out.sort((a, b) => precio(a) - precio(b) || cmpNombre(a, b))
    case "precio_desc": return out.sort((a, b) => precio(b) - precio(a) || cmpNombre(a, b))
    case "reciente": return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || cmpNombre(a, b))
    default: return out.sort(cmpNombre)
  }
}

// ─── Recetas ─────────────────────────────────────────────────────────────────

export type OrdenRecetas = "nombre" | "costo_desc" | "costo_asc" | "reciente"

export interface FiltroRecetas {
  busqueda: string
  tipo: "all" | "base" | "principal"
  problema?: ProblemaReceta
  orden: OrdenRecetas
}

export function filtrarRecetas<T extends RecetaBanco>(
  items: T[],
  f: FiltroRecetas,
  problemas: (r: T) => ProblemaReceta[],
  costos?: Map<string, CostoReceta>
): T[] {
  const q = normalizeForSearch(f.busqueda)
  const out = items.filter((r) => {
    if (f.tipo === "base" && !r.isBase) return false
    if (f.tipo === "principal" && r.isBase) return false
    if (q && !normalizeForSearch(`${r.name} ${r.recipeNumber}`).includes(q)) return false
    if (f.problema && !problemas(r).includes(f.problema)) return false
    return true
  })
  const cmpNombre = (a: T, b: T) => a.name.localeCompare(b.name, "es")
  const costo = (r: T) => costos?.get(r.id)?.costoPorPorcion ?? -1
  switch (f.orden) {
    case "costo_desc": return out.sort((a, b) => costo(b) - costo(a) || cmpNombre(a, b))
    case "costo_asc": return out.sort((a, b) => costo(a) - costo(b) || cmpNombre(a, b))
    case "reciente": return out.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || cmpNombre(a, b))
    default: return out.sort(cmpNombre)
  }
}

// ─── Paginación ──────────────────────────────────────────────────────────────

export function paginar<T>(items: T[], pagina: number, tamano: number): { items: T[]; paginas: number; pagina: number } {
  const paginas = Math.max(1, Math.ceil(items.length / tamano))
  const p = Math.min(Math.max(1, pagina), paginas)
  return { items: items.slice((p - 1) * tamano, p * tamano), paginas, pagina: p }
}
