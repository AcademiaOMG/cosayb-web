"use client"

import useSWR, { useSWRConfig } from "swr"
import { useCallback, useMemo, useRef, useState } from "react"
import type { Ingrediente, Recipe } from "@/types/domain"
import { bancoGetRecipe, bancoListIngredients, bancoListRecipes } from "@/lib/api"
import {
  calcularCostos, findDuplicateGroups, problemasIngrediente, problemasReceta, usosEnRecetas,
  type ComponenteReceta, type CostoReceta, type DetalleRecetas, type ProblemaIngrediente, type ProblemaReceta,
} from "@/lib/plataforma/banco/quality"

type RecetaLista = Recipe & { itemCount: number }

const KEY_ING = "banco-todos-ingredientes"
const KEY_REC = "banco-todas-recetas"
const KEY_DET = "banco-detalle-recetas"
const SWR_OPTS = { revalidateOnFocus: false, keepPreviousData: true } as const

/** Detalle ya descargado por receta; se reutiliza mientras la receta no cambie (id + fecha de edición). */
const cacheDetalle = new Map<string, ComponenteReceta[]>()

async function cargarTodosLosIngredientes(): Promise<Ingrediente[]> {
  const out: Ingrediente[] = []
  for (let page = 1; page <= 20; page++) {
    const r = await bancoListIngredients(undefined, page, 1000)
    out.push(...r.data)
    if (out.length >= r.total || r.data.length === 0) break
  }
  return out
}

async function cargarTodasLasRecetas(): Promise<RecetaLista[]> {
  const out: RecetaLista[] = []
  for (let page = 1; page <= 20; page++) {
    const r = await bancoListRecipes(undefined, page, "all", 300)
    out.push(...r.data)
    if (out.length >= r.total || r.data.length === 0) break
  }
  return out
}

/**
 * Todo el banco en memoria (son unos cientos de filas): permite filtrar, ordenar y revisar la
 * calidad sin pedir nada más al servidor. El detalle de recetas (componentes) se baja en segundo
 * plano, de a pocas a la vez, y solo para las que cambiaron.
 */
export function useBanco() {
  const { mutate: mutateGlobal } = useSWRConfig()
  const ing = useSWR(KEY_ING, cargarTodosLosIngredientes, SWR_OPTS)
  const rec = useSWR(KEY_REC, cargarTodasLasRecetas, SWR_OPTS)
  const ingredientes = ing.data
  const recetas = rec.data

  const [avance, setAvance] = useState<{ hechas: number; total: number } | null>(null)
  const firma = recetas ? recetas.map((r) => `${r.id}:${r.updatedAt}`).join("|") : null
  const detalleKey = firma ? [KEY_DET, firma] : null
  const det = useSWR<DetalleRecetas>(
    detalleKey,
    async () => {
      const lista = recetas ?? []
      const pendientes = lista.filter((r) => !cacheDetalle.has(`${r.id}:${r.updatedAt}`))
      let hechas = 0
      setAvance(pendientes.length > 0 ? { hechas: 0, total: pendientes.length } : null)
      let siguiente = 0
      const trabajador = async () => {
        while (siguiente < pendientes.length) {
          const r = pendientes[siguiente++]
          try {
            const res = await bancoGetRecipe(r.id)
            cacheDetalle.set(`${r.id}:${r.updatedAt}`, (res.data.items ?? []) as unknown as ComponenteReceta[])
          } catch {
            // se reintenta en la próxima carga; la receta queda «sin revisar»
          }
          hechas++
          setAvance({ hechas, total: pendientes.length })
        }
      }
      await Promise.all(Array.from({ length: 4 }, trabajador))
      setAvance(null)
      const mapa: DetalleRecetas = new Map()
      for (const r of lista) {
        const items = cacheDetalle.get(`${r.id}:${r.updatedAt}`)
        if (items) mapa.set(r.id, items)
      }
      return mapa
    },
    { revalidateOnFocus: false, keepPreviousData: true }
  )
  const detalle = det.data

  const calculos = useMemo(() => {
    if (!ingredientes || !recetas) return null
    const dup = findDuplicateGroups(ingredientes)
    const duplicados = new Set<string>()
    dup.forEach((ids) => ids.forEach((id) => duplicados.add(id)))
    const detalleCompleto = detalle && recetas.every((r) => detalle.has(r.id)) ? detalle : undefined
    const usos = detalleCompleto ? usosEnRecetas(detalleCompleto) : null
    const costos: Map<string, CostoReceta> | undefined = detalle ? calcularCostos(recetas, detalle, ingredientes) : undefined
    return { dup, duplicados, detalleCompleto, usos, costos }
  }, [ingredientes, recetas, detalle])

  const problemasDeIngrediente = useCallback(
    (i: Ingrediente): ProblemaIngrediente[] =>
      calculos
        ? problemasIngrediente(i, {
            duplicados: calculos.duplicados,
            usados: calculos.usos ? new Set(calculos.usos.ingredientes.keys()) : undefined,
          })
        : [],
    [calculos]
  )

  const idsIng = useMemo(() => new Set((ingredientes ?? []).map((i) => i.id)), [ingredientes])
  const idsRec = useMemo(() => new Set((recetas ?? []).map((r) => r.id)), [recetas])
  const problemasDeReceta = useCallback(
    (r: RecetaLista): ProblemaReceta[] =>
      calculos
        ? problemasReceta(r, {
            ingredientIds: idsIng,
            recipeIds: idsRec,
            detalle: calculos.detalleCompleto,
            costos: calculos.detalleCompleto ? calculos.costos : undefined,
          })
        : [],
    [calculos, idsIng, idsRec]
  )

  const recargarIngredientes = useCallback(() => ing.mutate(), [ing])
  const recargarRecetas = useCallback(() => rec.mutate(), [rec])
  const recargarTodo = useCallback(async () => {
    await Promise.all([ing.mutate(), rec.mutate()])
    void mutateGlobal((k) => Array.isArray(k) && k[0] === KEY_DET)
  }, [ing, rec, mutateGlobal])

  const ref = useRef({ recargarTodo })
  ref.current = { recargarTodo }

  return {
    ingredientes,
    recetas,
    cargando: (ing.isLoading && !ingredientes) || (rec.isLoading && !recetas),
    error: (ing.error && !ingredientes) || (rec.error && !recetas) ? true : false,
    detalle,
    revisando: avance,
    detalleListo: !!calculos?.detalleCompleto,
    costos: calculos?.costos,
    duplicados: calculos?.dup ?? new Map<string, string[]>(),
    usos: calculos?.usos ?? null,
    problemasDeIngrediente,
    problemasDeReceta,
    recargarIngredientes,
    recargarRecetas,
    recargarTodo,
  }
}

export type BancoData = ReturnType<typeof useBanco>
