/** Ejecuta una operación sobre varios elementos de a uno, sin detenerse ante un fallo. */
export interface ResultadoLote<T> {
  hechos: T[]
  fallidos: { item: T; motivo: string }[]
}

export async function ejecutarEnLote<T>(
  items: T[],
  operacion: (item: T) => Promise<unknown>,
  alAvanzar?: (hechos: number, total: number) => void,
  motivoDe: (e: unknown) => string = (e) => (e instanceof Error ? e.message : "Error desconocido")
): Promise<ResultadoLote<T>> {
  const res: ResultadoLote<T> = { hechos: [], fallidos: [] }
  let n = 0
  for (const item of items) {
    try {
      await operacion(item)
      res.hechos.push(item)
    } catch (e) {
      res.fallidos.push({ item, motivo: motivoDe(e) })
    }
    alAvanzar?.(++n, items.length)
  }
  return res
}
