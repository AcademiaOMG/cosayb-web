/** CSV del banco: lectura, validación con errores por fila y exportación. Lógica pura. */
import { normalizeName, PRECIO_ALTO_POR_GRAMO, PRECIO_BAJO_POR_GRAMO, type IngredienteBanco } from "./quality"

export const MAX_FILAS_IMPORTACION = 1000
export const MAX_NOMBRE = 120
export const MAX_COSTO = 100_000_000
export const MAX_PESO_G = 10_000_000

// ─── Lectura ─────────────────────────────────────────────────────────────────

/** Detecta el separador (Excel en español usa «;»). */
export function detectarSeparador(texto: string): string {
  const primera = texto.split(/\r?\n/, 1)[0] ?? ""
  const cuentas = [";", ",", "\t"].map((s) => [s, primera.split(s).length - 1] as const)
  cuentas.sort((a, b) => b[1] - a[1])
  return cuentas[0][1] > 0 ? cuentas[0][0] : ";"
}

/** Parte un CSV en filas de celdas (comillas dobles, saltos de línea dentro de comillas). */
export function parseCsv(texto: string): string[][] {
  const t = texto.replace(/^﻿/, "")
  const sep = detectarSeparador(t)
  const filas: string[][] = []
  let fila: string[] = []
  let celda = ""
  let comillas = false
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (comillas) {
      if (c === '"') {
        if (t[i + 1] === '"') { celda += '"'; i++ } else comillas = false
      } else celda += c
    } else if (c === '"') comillas = true
    else if (c === sep) { fila.push(celda); celda = "" }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && t[i + 1] === "\n") i++
      fila.push(celda); celda = ""
      filas.push(fila); fila = []
    } else celda += c
  }
  if (celda !== "" || fila.length > 0) { fila.push(celda); filas.push(fila) }
  return filas.filter((f) => f.some((c) => c.trim() !== ""))
}

/** «14.500», «14500», «$ 14.500,50», «1,5» → número; null si no es un número. */
export function parseNumeroEs(valor: string): number | null {
  let s = valor.trim().replace(/[$\s]/g, "")
  if (!s || !/^-?[\d.,]+$/.test(s)) return null
  const punto = s.lastIndexOf(".")
  const coma = s.lastIndexOf(",")
  if (punto >= 0 && coma >= 0) {
    // el último separador es el decimal
    s = coma > punto ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "")
  } else if (coma >= 0) {
    s = /^-?\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".")
  } else if (punto >= 0) {
    if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "")
  }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

// ─── Importación de ingredientes ─────────────────────────────────────────────

const ALIAS: Record<"nombre" | "costo" | "peso", string[]> = {
  nombre: ["nombre", "ingrediente", "name"],
  costo: ["costo", "costo de compra", "precio", "costo compra", "costperunit", "costo_compra"],
  peso: ["peso", "peso gramos", "peso (gramos)", "gramos", "peso_gramos", "weightgrams", "peso g"],
}

function claveColumna(texto: string): string {
  return normalizeName(texto).replace(/[_()]/g, " ").replace(/\s+/g, " ").trim()
}

export type AccionImportacion = "crear" | "actualizar" | "sin_cambios" | "error"

export interface FilaImportacion {
  /** número de fila en el archivo (la 1 es el encabezado) */
  fila: number
  nombre: string
  costo: number | null
  peso: number | null
  accion: AccionImportacion
  existenteId?: string
  errores: string[]
  avisos: string[]
}

export interface ResultadoImportacion {
  /** error general del archivo (encabezado ausente, vacío, demasiadas filas) */
  errorArchivo?: string
  filas: FilaImportacion[]
}

export function validarImportacionIngredientes(texto: string, existentes: IngredienteBanco[]): ResultadoImportacion {
  const tabla = parseCsv(texto)
  if (tabla.length === 0) return { errorArchivo: "El archivo está vacío.", filas: [] }

  const enc = tabla[0].map(claveColumna)
  const idx = {
    nombre: enc.findIndex((c) => ALIAS.nombre.includes(c)),
    costo: enc.findIndex((c) => ALIAS.costo.includes(c)),
    peso: enc.findIndex((c) => ALIAS.peso.includes(c)),
  }
  const faltan = (["nombre", "costo", "peso"] as const).filter((k) => idx[k] < 0)
  if (faltan.length > 0) {
    const t = { nombre: "«nombre»", costo: "«costo»", peso: "«peso_gramos»" }
    return {
      errorArchivo: `Al archivo le falta${faltan.length > 1 ? "n las columnas" : " la columna"} ${faltan.map((k) => t[k]).join(", ")} en la primera fila.`,
      filas: [],
    }
  }
  const datos = tabla.slice(1)
  if (datos.length === 0) return { errorArchivo: "El archivo solo tiene el encabezado, no hay ingredientes.", filas: [] }
  if (datos.length > MAX_FILAS_IMPORTACION) {
    return { errorArchivo: `El archivo tiene ${datos.length} filas; el máximo por importación es ${MAX_FILAS_IMPORTACION}.`, filas: [] }
  }

  const porNombre = new Map<string, IngredienteBanco[]>()
  for (const e of existentes) {
    const k = normalizeName(e.name)
    porNombre.set(k, [...(porNombre.get(k) ?? []), e])
  }
  const vistos = new Map<string, number>()

  const filas = datos.map((celdas, i): FilaImportacion => {
    const fila = i + 2
    const nombre = (celdas[idx.nombre] ?? "").trim().replace(/\s+/g, " ")
    const costo = parseNumeroEs(celdas[idx.costo] ?? "")
    const peso = parseNumeroEs(celdas[idx.peso] ?? "")
    const errores: string[] = []
    const avisos: string[] = []

    if (!nombre) errores.push("Falta el nombre.")
    else if (nombre.length > MAX_NOMBRE) errores.push(`El nombre supera ${MAX_NOMBRE} caracteres.`)
    if (costo === null) errores.push((celdas[idx.costo] ?? "").trim() ? "El costo no es un número válido." : "Falta el costo.")
    else if (costo <= 0) errores.push("El costo debe ser mayor que cero.")
    else if (costo > MAX_COSTO) errores.push("El costo es demasiado grande.")
    if (peso === null) errores.push((celdas[idx.peso] ?? "").trim() ? "El peso no es un número válido." : "Falta el peso en gramos.")
    else if (peso <= 0) errores.push("El peso debe ser mayor que cero.")
    else if (peso > MAX_PESO_G) errores.push("El peso es demasiado grande.")

    const clave = normalizeName(nombre)
    let existenteId: string | undefined
    let accion: AccionImportacion = "crear"
    if (clave) {
      const antes = vistos.get(clave)
      if (antes !== undefined) errores.push(`Este nombre ya aparece en la fila ${antes}.`)
      else vistos.set(clave, fila)
      const coinciden = porNombre.get(clave) ?? []
      if (coinciden.length > 1) errores.push("Hay varios ingredientes repetidos con este nombre en el banco; corrígelos antes de importar.")
      else if (coinciden.length === 1) {
        existenteId = coinciden[0].id
        accion = "actualizar"
        const sinCambios = parseFloat(coinciden[0].costPerUnit) === costo && parseFloat(coinciden[0].weightGrams) === peso
        if (sinCambios) accion = "sin_cambios"
      }
    }
    if (errores.length === 0 && costo !== null && peso !== null) {
      const porGramo = costo / peso
      if (porGramo > PRECIO_ALTO_POR_GRAMO) avisos.push("El precio por gramo es muy alto; revisa que no sobren ceros.")
      if (porGramo < PRECIO_BAJO_POR_GRAMO) avisos.push("El precio por gramo es muy bajo; revisa el costo o el peso.")
    }
    return { fila, nombre, costo, peso, accion: errores.length > 0 ? "error" : accion, existenteId, errores, avisos }
  })
  return { filas }
}

export function resumenImportacion(filas: FilaImportacion[]) {
  const c = { crear: 0, actualizar: 0, sin_cambios: 0, error: 0 }
  for (const f of filas) c[f.accion]++
  return c
}

// ─── Exportación ─────────────────────────────────────────────────────────────

/** Evita que Excel interprete una celda de texto como fórmula (=, +, -, @). */
function celdaSegura(valor: string): string {
  return /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor
}

function escapar(valor: string | number | null | undefined, esTexto: boolean): string {
  const s = valor == null ? "" : String(valor)
  const v = esTexto ? celdaSegura(s) : s
  return /[";\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

/** CSV con «;» y BOM para que Excel en español lo abra bien. Los números van sin separador de miles. */
export function construirCsv(encabezado: string[], filas: (string | number | null)[][]): string {
  const lineas = [encabezado.map((e) => escapar(e, false)).join(";")]
  for (const f of filas) lineas.push(f.map((c) => escapar(c, typeof c === "string")).join(";"))
  return "﻿" + lineas.join("\r\n") + "\r\n"
}
