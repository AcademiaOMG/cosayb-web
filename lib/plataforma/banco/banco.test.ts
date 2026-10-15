import { describe, it, expect } from "vitest"
import {
  normalizeName, findDuplicateGroups, problemasIngrediente, problemasReceta, calcularCostos, usosEnRecetas,
  type IngredienteBanco, type RecetaBanco, type DetalleRecetas,
} from "./quality"
import { parseCsv, parseNumeroEs, validarImportacionIngredientes, resumenImportacion, construirCsv } from "./csv"
import { filtrarIngredientes, filtrarRecetas, paginar } from "./filters"

const ing = (id: string, name: string, cost = "1000", weight = "1000", extra: Partial<IngredienteBanco> = {}): IngredienteBanco => ({
  id, name, costPerUnit: cost, weightGrams: weight,
  costPerGram: String(parseFloat(cost) / parseFloat(weight)),
  unit: "g", organizationId: null, updatedAt: "2026-07-14T00:00:00Z", ...extra,
})
const rec = (id: string, name: string, extra: Partial<RecetaBanco> = {}): RecetaBanco => ({
  id, name, recipeNumber: "R-" + id, servings: "10", servingWeightG: "100", safetyMargin: "3",
  isBase: false, description: "x", itemCount: 1, updatedAt: "2026-07-14T00:00:00Z", ...extra,
})

describe("nombres y duplicados", () => {
  it("normaliza mayúsculas, tildes y espacios", () => {
    expect(normalizeName("  AZÚCAR   Morena ")).toBe("azucar morena")
  })
  it("agrupa solo los repetidos", () => {
    const g = findDuplicateGroups([ing("1", "Leche de coco"), ing("2", "LECHE  DE  COCO"), ing("3", "Papaya"), ing("4", "")])
    expect([...g.values()]).toEqual([["1", "2"]])
  })
})

describe("problemas de ingredientes", () => {
  const ctx = { duplicados: new Set(["d"]) }
  it("detecta duplicado, sin precio y precios absurdos", () => {
    expect(problemasIngrediente(ing("d", "A"), ctx)).toEqual(["duplicado"])
    expect(problemasIngrediente(ing("a", "A", "0", "1000"), ctx)).toEqual(["sin_precio"])
    expect(problemasIngrediente(ing("b", "A", "135000", "1"), ctx)).toEqual(["precio_alto"])
    expect(problemasIngrediente(ing("c", "A", "10", "1000"), ctx)).toEqual(["precio_bajo"])
    expect(problemasIngrediente(ing("e", "A"), ctx)).toEqual([])
  })
  it("marca «sin uso» solo si ya se conocen los usos", () => {
    expect(problemasIngrediente(ing("e", "A"), { duplicados: new Set(), usados: new Set() })).toEqual(["sin_uso"])
    expect(problemasIngrediente(ing("e", "A"), { duplicados: new Set(), usados: new Set(["e"]) })).toEqual([])
  })
})

describe("problemas de recetas y costeo", () => {
  const detalle: DetalleRecetas = new Map([
    ["base", [{ componentType: "ingredient", ingredientId: "i1", subRecipeId: null, quantityG: "500" }]],
    ["plato", [
      { componentType: "recipe", ingredientId: null, subRecipeId: "base", quantityG: "100" },
      { componentType: "ingredient", ingredientId: "i2", subRecipeId: null, quantityG: "50" },
    ]],
    ["roto", [{ componentType: "ingredient", ingredientId: "fantasma", subRecipeId: null, quantityG: "10" }]],
  ])
  const ingredientes = [ing("i1", "Harina", "2000", "1000"), ing("i2", "Sal", "1000", "1000")]
  const recetas = [
    rec("base", "Masa", { isBase: true, servings: "5", servingWeightG: "100", safetyMargin: "0" }),
    rec("plato", "Plato", { servings: "2", safetyMargin: "10" }),
    rec("roto", "Roto", { servingWeightG: null, description: "" }),
  ]
  const costos = calcularCostos(recetas, detalle, ingredientes)

  it("calcula el costo con sub-recetas y margen", () => {
    // base: 500 g × $2/g = $1000 sobre 500 g de masa → $2/g
    expect(costos.get("base")?.costoPorGramo).toBeCloseTo(2)
    // plato: 100 g de base ($200) + 50 g × $1 = $250; con 10 % = $275; por 2 porciones = $137,5
    expect(costos.get("plato")?.costoPorPorcion).toBeCloseTo(137.5)
  })
  it("no inventa costo si falta un ingrediente", () => {
    expect(costos.get("roto")?.costoPorPorcion).toBeNull()
  })
  it("marca peso, descripción, componentes fuera del banco y costo", () => {
    const ctx = { ingredientIds: new Set(["i1", "i2"]), recipeIds: new Set(["base", "plato", "roto"]), detalle, costos }
    expect(problemasReceta(recetas[0], ctx)).toEqual([])
    expect(problemasReceta(recetas[2], ctx)).toEqual(["sin_peso", "fuera_del_banco", "sin_descripcion", "sin_costo"])
    expect(problemasReceta(rec("v", "V", { itemCount: 0 }), ctx)).toContain("sin_ingredientes")
  })
  it("no se cuelga con recetas que se usan a sí mismas", () => {
    const ciclo: DetalleRecetas = new Map([["a", [{ componentType: "recipe", ingredientId: null, subRecipeId: "a", quantityG: "1" }]]])
    expect(calcularCostos([rec("a", "A")], ciclo, []).get("a")?.costoPorPorcion).toBeNull()
  })
  it("cuenta los usos", () => {
    const u = usosEnRecetas(detalle)
    expect(u.ingredientes.get("i1")).toBe(1)
    expect(u.subRecetas.get("base")).toBe(1)
  })
})

describe("números en español", () => {
  it.each([
    ["14.500", 14500], ["14500", 14500], ["$ 14.500,50", 14500.5], ["1,5", 1.5],
    ["1.234.567", 1234567], ["0.5", 0.5], ["1,234", 1234],
  ])("%s", (txt, n) => expect(parseNumeroEs(txt)).toBe(n))
  it("rechaza texto", () => {
    expect(parseNumeroEs("abc")).toBeNull()
    expect(parseNumeroEs("")).toBeNull()
    expect(parseNumeroEs("12abc")).toBeNull()
  })
})

describe("CSV", () => {
  it("lee comillas, separador punto y coma y BOM", () => {
    const t = parseCsv('﻿nombre;costo\r\n"Sal; fina";1.000\r\n\r\n"Dice ""hola""";2')
    expect(t).toEqual([["nombre", "costo"], ["Sal; fina", "1.000"], ['Dice "hola"', "2"]])
  })
  it("exporta con escape y sin fórmulas", () => {
    const csv = construirCsv(["a", "b"], [["=SUMA(1)", 3], ['x"y', null]])
    expect(csv).toBe('﻿a;b\r\n\'=SUMA(1);3\r\n"x""y";\r\n')
  })
})

describe("importación de ingredientes", () => {
  const existentes = [ing("1", "Harina", "2000", "1000"), ing("2", "Papaya", "1", "1"), ing("3", "PAPAYA", "1", "1")]

  it("rechaza archivos sin columnas o vacíos", () => {
    expect(validarImportacionIngredientes("", existentes).errorArchivo).toMatch(/vacío/)
    expect(validarImportacionIngredientes("nombre;costo\nA;1", existentes).errorArchivo).toMatch(/peso_gramos/)
    expect(validarImportacionIngredientes("nombre;costo;peso\n", existentes).errorArchivo).toMatch(/solo tiene el encabezado/)
  })

  it("clasifica filas y da error por fila en español", () => {
    const csv = [
      "nombre;costo;peso_gramos",
      "Harina;2.000;1000",
      "HARINA;2500;1000",
      "Aceite;14.500;1500",
      ";100;100",
      "Sal;abc;100",
      "Pimienta;100;0",
      "Papaya;10;10",
      "Oro;900000;1",
    ].join("\n")
    const r = validarImportacionIngredientes(csv, existentes)
    const por = (f: number) => r.filas.find((x) => x.fila === f)!
    expect(por(2).accion).toBe("sin_cambios")
    expect(por(3).errores[0]).toMatch(/fila 2/)
    expect(por(4)).toMatchObject({ accion: "crear", costo: 14500, peso: 1500 })
    expect(por(5).errores).toEqual(["Falta el nombre."])
    expect(por(6).errores).toEqual(["El costo no es un número válido."])
    expect(por(7).errores).toEqual(["El peso debe ser mayor que cero."])
    expect(por(8).errores[0]).toMatch(/repetidos/)
    expect(por(9).avisos[0]).toMatch(/muy alto/)
    expect(por(9).accion).toBe("crear")
    expect(resumenImportacion(r.filas)).toEqual({ crear: 2, actualizar: 0, sin_cambios: 1, error: 5 })
  })

  it("actualiza cuando el precio cambia", () => {
    const r = validarImportacionIngredientes("Nombre,Costo,Peso (gramos)\nharina,2500,1000", existentes)
    expect(r.filas[0]).toMatchObject({ accion: "actualizar", existenteId: "1" })
  })
})

describe("filtros y orden", () => {
  const lista = [
    ing("1", "Zanahoria", "500", "1000"),
    ing("2", "Ají", "5000", "1000", { updatedAt: "2026-10-01T00:00:00Z" }),
    ing("3", "Negocio X", "100", "1000", { organizationId: "o1" }),
  ]
  const sinProblemas = () => []
  const base = { busqueda: "", orden: "nombre" as const }
  it("busca sin tildes y ordena", () => {
    expect(filtrarIngredientes(lista, { ...base, busqueda: "aji" }, sinProblemas).map((i) => i.id)).toEqual(["2"])
    expect(filtrarIngredientes(lista, base, sinProblemas).map((i) => i.id)).toEqual(["2", "3", "1"])
    expect(filtrarIngredientes(lista, { ...base, orden: "precio_desc" }, sinProblemas).map((i) => i.id)).toEqual(["2", "1", "3"])
  })
  it("filtra por origen, antigüedad y problema", () => {
    const ahora = new Date("2026-10-15").getTime()
    expect(filtrarIngredientes(lista, { ...base, origen: "negocio" }, sinProblemas).map((i) => i.id)).toEqual(["3"])
    expect(filtrarIngredientes(lista, { ...base, actualizacion: "reciente" }, sinProblemas, ahora).map((i) => i.id)).toEqual(["2"])
    expect(filtrarIngredientes(lista, { ...base, problema: "duplicado" }, (i) => (i.id === "1" ? ["duplicado"] : [])).map((i) => i.id)).toEqual(["1"])
  })
  it("filtra recetas por tipo y problema", () => {
    const rs = [rec("a", "Arroz", { isBase: true }), rec("b", "Bandeja")]
    expect(filtrarRecetas(rs, { busqueda: "", tipo: "base", orden: "nombre" }, () => []).map((r) => r.id)).toEqual(["a"])
    expect(filtrarRecetas(rs, { busqueda: "", tipo: "all", problema: "sin_peso", orden: "nombre" }, (r) => (r.id === "b" ? ["sin_peso"] : [])).map((r) => r.id)).toEqual(["b"])
  })
  it("pagina y limita la página", () => {
    const p = paginar([1, 2, 3, 4, 5], 9, 2)
    expect(p).toEqual({ items: [5], paginas: 3, pagina: 3 })
    expect(paginar([], 1, 10)).toEqual({ items: [], paginas: 1, pagina: 1 })
  })
})
