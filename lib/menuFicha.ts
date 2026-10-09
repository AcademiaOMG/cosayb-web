import type { CostoMenuResult, MenuIndicator } from "@/types/domain"

/**
 * Cálculos del módulo Menú — espejo de la hoja FORMATOMENU del Excel APPAYB002
 * (y de calcularCostoMenu en la API). Todo en funciones puras para poder
 * probarlos contra los valores reales del Excel.
 */

export interface RecetaCalculo {
  cantidadGramos: number
  costoGramo: number
}

/** Fórmulas de FORMATOMENU. `margenSeguridad` y `pctMateriaPrima` van en escala 0–100. */
export function calcularCosto(
  recetas: RecetaCalculo[],
  numPersonas: number,
  margenSeguridad: number,
  pctMateriaPrima: number,
): CostoMenuResult | null {
  // Con "!(x > 0)" en vez de "x <= 0": NaN (valor vacío del teclado) también cuenta como inválido.
  if (recetas.length === 0 || !(numPersonas > 0) || !(pctMateriaPrima > 0)) return null
  const pctMP = pctMateriaPrima / 100
  const margin = (Number.isFinite(margenSeguridad) ? margenSeguridad : 0) / 100

  const costoTotalPorcion = recetas.reduce((s, r) => s + r.cantidadGramos * r.costoGramo, 0)
  const costoTotalPersonas = costoTotalPorcion * numPersonas
  const margenAplicadoPorcion = costoTotalPorcion * margin
  const costoConMargenPorcion = costoTotalPorcion + margenAplicadoPorcion
  const costoConMargenPersonas = costoConMargenPorcion * numPersonas
  const precioPotencialVentaPorcion = costoConMargenPorcion / pctMP
  const precioPotencialVentaTotal = precioPotencialVentaPorcion * numPersonas
  const pctCostosFijos = ((1 - pctMP) / 1.8) * 100
  const pctGanancia = (1 - (1 - pctMP) / 1.8 - pctMP) * 100
  const indicator: MenuIndicator = pctMP < 0.32 ? "MUY_BUENO" : pctMP > 0.37 ? "MALO" : "REGULAR"

  return {
    recetas: recetas.map((r) => ({
      recipeId: "", nombre: "", ...r,
      costoPorcionEnMenu: r.cantidadGramos * r.costoGramo,
      costoTotalEnMenu: r.cantidadGramos * r.costoGramo * numPersonas,
    })),
    costoTotalPorcion, costoTotalPersonas, margenAplicadoPorcion,
    costoConMargenPorcion, costoConMargenPersonas,
    precioPotencialVentaPorcion, precioPotencialVentaTotal,
    pctCostosFijos, pctGanancia, indicator,
  }
}

// ─── Ficha del menú (lo que se muestra al usuario, en el orden del Excel) ─────

export interface FichaItemInput {
  key: string
  nombre: string
  /** true = extra que se cuenta por unidad (gaseosa, desechables…) */
  extra: boolean
  /** Cantidad por persona: gramos (recetas) o unidades (extras) */
  cantidad: number
  unidad: "g" | "und"
  /** $ por gramo (recetas) o $ por unidad (extras) */
  costoUnit: number
}

export interface FichaItem extends FichaItemInput {
  /** Costo de una porción: cantidad × costo unitario */
  porPorcion: number
  /** Cantidad para todas las personas */
  cantidadTotal: number
  /** Costo para todas las personas */
  costoTotal: number
}

export function buildFichaItems(inputs: FichaItemInput[], numPersonas: number): FichaItem[] {
  return inputs.map((i) => {
    const porPorcion = i.cantidad * i.costoUnit
    return {
      ...i,
      porPorcion,
      cantidadTotal: i.cantidad * numPersonas,
      costoTotal: porPorcion * numPersonas,
    }
  })
}

/** Peso de una porción en gramos: solo cuentan las recetas (los extras van por unidad). */
export function pesoPorcionG(items: Pick<FichaItemInput, "cantidad" | "unidad">[]): number {
  return items.filter((i) => i.unidad === "g").reduce((s, i) => s + i.cantidad, 0)
}

export interface FichaLinea {
  key: "mp" | "margen" | "conMargen" | "fijos" | "ganancia" | "precio"
  label: string
  /** Texto corto que explica la línea a quien no conoce el tema */
  hint: string
  porPorcion: number
  total: number
  /** "suma" = subtotal · "resultado" = precio final */
  kind: "base" | "suma" | "resultado"
}

/**
 * «Cómo se arma el precio»: mismas filas de FORMATOMENU (costo de materia prima,
 * margen de seguridad, costo con margen, costos fijos, ganancia, precio potencial
 * de venta) para una porción y para todas las personas. Costo con margen + fijos
 * + ganancia = precio potencial.
 */
export function buildFichaPrecio(
  costo: CostoMenuResult,
  numPersonas: number,
  margenPct: number,
  pctMP: number,
): FichaLinea[] {
  const precio = costo.precioPotencialVentaPorcion
  const fijos = (precio * costo.pctCostosFijos) / 100
  const ganancia = (precio * costo.pctGanancia) / 100
  const x = (v: number) => v * numPersonas
  const fmtPct = (v: number) => `${Number.isFinite(v) ? Math.round(v * 10) / 10 : 0}%`
  return [
    { key: "mp", kind: "base", label: "Costo de materia prima", hint: "Lo que cuestan los ingredientes", porPorcion: costo.costoTotalPorcion, total: x(costo.costoTotalPorcion) },
    { key: "margen", kind: "base", label: `+ Margen de seguridad (${fmtPct(margenPct)})`, hint: "Colchón por si suben los precios", porPorcion: costo.margenAplicadoPorcion, total: x(costo.margenAplicadoPorcion) },
    { key: "conMargen", kind: "suma", label: `Costo con margen (${fmtPct(pctMP)} del precio)`, hint: "Materia prima más colchón", porPorcion: costo.costoConMargenPorcion, total: x(costo.costoConMargenPorcion) },
    { key: "fijos", kind: "base", label: `+ Costos fijos (${fmtPct(costo.pctCostosFijos)})`, hint: "Arriendo, sueldos, servicios…", porPorcion: fijos, total: x(fijos) },
    { key: "ganancia", kind: "base", label: `+ Ganancia (${fmtPct(costo.pctGanancia)})`, hint: "Lo que te queda a ti", porPorcion: ganancia, total: x(ganancia) },
    { key: "precio", kind: "resultado", label: "= Precio potencial de venta", hint: "Lo que deberías cobrar", porPorcion: precio, total: x(precio) },
  ]
}
