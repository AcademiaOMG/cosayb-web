/**
 * Calidad de datos del banco público: lógica pura (sin red ni React) para detectar
 * ingredientes duplicados, precios dudosos, recetas sin peso por porción, componentes
 * que no están en el banco y para estimar el costo de una receta.
 */
import { normalizeForSearch } from "@/components/app/inventario/format"

// ─── Tipos mínimos (los de dominio los cumplen) ──────────────────────────────

export interface IngredienteBanco {
  id: string
  name: string
  costPerUnit: string
  weightGrams: string
  costPerGram: string
  unit?: string | null
  organizationId?: string | null
  updatedAt: string
}

export interface RecetaBanco {
  id: string
  name: string
  recipeNumber: string
  servings: string
  servingWeightG: string | null
  safetyMargin: string
  isBase: boolean
  description?: string | null
  itemCount?: number
  updatedAt: string
}

export interface ComponenteReceta {
  componentType: "ingredient" | "recipe"
  ingredientId: string | null
  subRecipeId: string | null
  quantityG: string
}

export type DetalleRecetas = Map<string, ComponenteReceta[]>

// ─── Nombres ─────────────────────────────────────────────────────────────────

/** «  Leche  de COCO » y «leche de coco» dan la misma clave; sin tildes. */
export function normalizeName(name: string): string {
  return normalizeForSearch(name).replace(/\s+/g, " ")
}

/** Grupos de 2 o más elementos con el mismo nombre normalizado → clave → ids. */
export function findDuplicateGroups(items: { id: string; name: string }[]): Map<string, string[]> {
  const groups = new Map<string, string[]>()
  for (const it of items) {
    const key = normalizeName(it.name)
    if (!key) continue
    const list = groups.get(key)
    if (list) list.push(it.id)
    else groups.set(key, [it.id])
  }
  for (const [key, ids] of groups) if (ids.length < 2) groups.delete(key)
  return groups
}

// ─── Ingredientes ────────────────────────────────────────────────────────────

/** Por encima de esto ($ por gramo) el precio casi seguro es un error de dedo ($500.000 el kilo). */
export const PRECIO_ALTO_POR_GRAMO = 500
/** Por debajo ($ por gramo) también es sospechoso ($100 el kilo). */
export const PRECIO_BAJO_POR_GRAMO = 0.1

export type ProblemaIngrediente = "duplicado" | "sin_precio" | "precio_alto" | "precio_bajo" | "sin_uso"

export const PROBLEMA_INGREDIENTE_TEXTO: Record<ProblemaIngrediente, string> = {
  duplicado: "Repetido",
  sin_precio: "Sin precio",
  precio_alto: "Precio muy alto",
  precio_bajo: "Precio muy bajo",
  sin_uso: "No se usa en recetas",
}

export interface ContextoIngredientes {
  /** ids de ingredientes cuyo nombre está repetido */
  duplicados: Set<string>
  /** ids usados por alguna receta del banco; undefined = aún no se sabe (no se marca «sin uso») */
  usados?: Set<string>
}

export function costPerGramOf(ing: Pick<IngredienteBanco, "costPerUnit" | "weightGrams" | "costPerGram">): number {
  const direct = parseFloat(ing.costPerGram)
  if (Number.isFinite(direct)) return direct
  const cost = parseFloat(ing.costPerUnit)
  const weight = parseFloat(ing.weightGrams)
  return weight > 0 ? cost / weight : NaN
}

export function problemasIngrediente(ing: IngredienteBanco, ctx: ContextoIngredientes): ProblemaIngrediente[] {
  const out: ProblemaIngrediente[] = []
  if (ctx.duplicados.has(ing.id)) out.push("duplicado")
  const cost = parseFloat(ing.costPerUnit)
  const perGram = costPerGramOf(ing)
  if (!(cost > 0) || !(perGram > 0)) out.push("sin_precio")
  else if (perGram > PRECIO_ALTO_POR_GRAMO) out.push("precio_alto")
  else if (perGram < PRECIO_BAJO_POR_GRAMO) out.push("precio_bajo")
  if (ctx.usados && !ctx.usados.has(ing.id)) out.push("sin_uso")
  return out
}

/** Ids de ingredientes y de sub-recetas usados por las recetas del banco. */
export function usosEnRecetas(detalle: DetalleRecetas): {
  ingredientes: Map<string, number>
  subRecetas: Map<string, number>
} {
  const ingredientes = new Map<string, number>()
  const subRecetas = new Map<string, number>()
  for (const items of detalle.values()) {
    for (const it of items) {
      if (it.ingredientId) ingredientes.set(it.ingredientId, (ingredientes.get(it.ingredientId) ?? 0) + 1)
      if (it.subRecipeId) subRecetas.set(it.subRecipeId, (subRecetas.get(it.subRecipeId) ?? 0) + 1)
    }
  }
  return { ingredientes, subRecetas }
}

// ─── Recetas ─────────────────────────────────────────────────────────────────

export type ProblemaReceta = "sin_peso" | "sin_ingredientes" | "fuera_del_banco" | "sin_descripcion" | "sin_costo"

export const PROBLEMA_RECETA_TEXTO: Record<ProblemaReceta, string> = {
  sin_peso: "Sin peso por porción",
  sin_ingredientes: "Sin ingredientes",
  fuera_del_banco: "Usa algo que no está en el banco",
  sin_descripcion: "Sin descripción",
  sin_costo: "No se puede calcular el costo",
}

export interface ContextoRecetas {
  ingredientIds: Set<string>
  recipeIds: Set<string>
  /** undefined = los componentes aún no se han cargado */
  detalle?: DetalleRecetas
  costos?: Map<string, CostoReceta>
}

export function problemasReceta(r: RecetaBanco, ctx: ContextoRecetas): ProblemaReceta[] {
  const out: ProblemaReceta[] = []
  const peso = r.servingWeightG == null ? 0 : parseFloat(r.servingWeightG)
  if (!(peso > 0)) out.push("sin_peso")
  const items = ctx.detalle?.get(r.id)
  if ((r.itemCount ?? items?.length ?? 0) === 0) out.push("sin_ingredientes")
  if (items) {
    const fuera = items.some(
      (it) =>
        (it.ingredientId && !ctx.ingredientIds.has(it.ingredientId)) ||
        (it.subRecipeId && !ctx.recipeIds.has(it.subRecipeId)) ||
        (!it.ingredientId && !it.subRecipeId)
    )
    if (fuera) out.push("fuera_del_banco")
  }
  if (!r.description || !r.description.trim()) out.push("sin_descripcion")
  const costo = ctx.costos?.get(r.id)
  if (ctx.costos && (!costo || costo.costoPorPorcion === null)) out.push("sin_costo")
  return out
}

// ─── Costeo estimado ─────────────────────────────────────────────────────────

export interface CostoReceta {
  /** costo de materia prima sin margen */
  costoBase: number
  /** costo por porción con el margen de seguridad de la receta; null si faltan datos */
  costoPorPorcion: number | null
  /** costo por gramo con margen (necesita peso por porción o, si no, la masa de los componentes) */
  costoPorGramo: number | null
}

/**
 * Misma regla del cálculo del servidor: una sub-receta aporta `cantidad × costo / masa`, con
 * masa = porciones × peso por porción (o la suma de sus componentes si no hay peso). No considera
 * rendimientos/mermas, por eso es una estimación.
 */
export function calcularCostos(
  recetas: RecetaBanco[],
  detalle: DetalleRecetas,
  ingredientes: IngredienteBanco[]
): Map<string, CostoReceta> {
  const porId = new Map(recetas.map((r) => [r.id, r]))
  const gramo = new Map(ingredientes.map((i) => [i.id, costPerGramOf(i)]))
  const memo = new Map<string, number | null>() // costo base total
  const enCurso = new Set<string>()

  function costoBase(id: string): number | null {
    if (memo.has(id)) return memo.get(id) ?? null
    if (enCurso.has(id)) return null // ciclo
    const items = detalle.get(id)
    if (!items) return null
    enCurso.add(id)
    let total = 0
    let ok = items.length > 0
    for (const it of items) {
      const q = parseFloat(it.quantityG)
      if (!(q > 0)) { ok = false; continue }
      if (it.ingredientId) {
        const g = gramo.get(it.ingredientId)
        if (g === undefined || !Number.isFinite(g)) { ok = false; continue }
        total += q * g
      } else if (it.subRecipeId) {
        const sub = porId.get(it.subRecipeId)
        const base = sub ? costoBase(it.subRecipeId) : null
        const masa = sub ? masaDe(sub, detalle.get(sub.id)) : 0
        if (base === null || !(masa > 0)) { ok = false; continue }
        total += (q * base) / masa
      } else ok = false
    }
    enCurso.delete(id)
    const res = ok ? total : null
    memo.set(id, res)
    return res
  }

  const out = new Map<string, CostoReceta>()
  for (const r of recetas) {
    const base = costoBase(r.id)
    const porciones = parseFloat(r.servings)
    const margen = parseFloat(r.safetyMargin)
    const conMargen = base === null ? null : base * (1 + (Number.isFinite(margen) ? margen : 0) / 100)
    const masa = masaDe(r, detalle.get(r.id))
    out.set(r.id, {
      costoBase: base ?? 0,
      costoPorPorcion: conMargen !== null && porciones > 0 ? conMargen / porciones : null,
      costoPorGramo: conMargen !== null && masa > 0 ? conMargen / masa : null,
    })
  }
  return out
}

function masaDe(r: RecetaBanco, items: ComponenteReceta[] | undefined): number {
  const porciones = parseFloat(r.servings)
  const peso = r.servingWeightG == null ? 0 : parseFloat(r.servingWeightG)
  if (porciones > 0 && peso > 0) return porciones * peso
  return (items ?? []).reduce((s, it) => s + (parseFloat(it.quantityG) || 0), 0)
}
