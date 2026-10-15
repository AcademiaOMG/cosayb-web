/** «hace 5 min», «hace 3 h», «hace 2 días» a partir de minutos transcurridos. */
export function haceMinutos(min: number): string {
  if (!Number.isFinite(min) || min < 0) return "hace un momento"
  if (min < 1) return "hace un momento"
  if (min < 60) return `hace ${Math.round(min)} min`
  const horas = min / 60
  if (horas < 24) return `hace ${Math.round(horas)} h`
  const dias = Math.round(horas / 24)
  return dias === 1 ? "hace 1 día" : `hace ${dias} días`
}

/** Fecha ISO → «hace …» respecto de `ahora`. */
export function haceFecha(iso: string | null | undefined, ahora = Date.now()): string | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  return haceMinutos((ahora - t) / 60_000)
}

export interface CambioPrecios {
  cambiaron: number
  subieron: number
  bajaron: number
  nuevos: number
}

/** Compara el costo de compra antes y después de una sincronización. */
export function compararPrecios(
  antes: Map<string, number>,
  despues: { id: string; costPerUnit: string }[]
): CambioPrecios {
  const r: CambioPrecios = { cambiaron: 0, subieron: 0, bajaron: 0, nuevos: 0 }
  for (const i of despues) {
    const previo = antes.get(i.id)
    const ahora = parseFloat(i.costPerUnit)
    if (previo === undefined) { r.nuevos++; continue }
    if (ahora !== previo) {
      r.cambiaron++
      if (ahora > previo) r.subieron++
      else r.bajaron++
    }
  }
  return r
}
