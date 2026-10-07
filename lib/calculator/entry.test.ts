import { describe, expect, it } from "vitest"
import {
  applyEntryKey,
  entryKeyFromKeyboard,
  formatMoneyEntry,
  formatPercentEntry,
  parseEntry,
  sanitizeEntry,
  type EntryKey,
  type EntryOptions,
} from "./entry"

const MONEY: EntryOptions = { decimals: false }
const PCT: EntryOptions = { decimals: true, maxDigits: 5, maxDecimals: 2 }

const digit = (d: string): EntryKey => ({ type: "digit", digit: d })

function typeKeys(start: string, keys: EntryKey[], opts: EntryOptions, fresh = false) {
  let v = start
  let f = fresh
  for (const k of keys) {
    v = applyEntryKey(v, k, f, opts)
    f = false
  }
  return v
}

describe("applyEntryKey", () => {
  // Regresión del bug de "Precio de materia prima": el % recordado (ej. "22")
  // se concatenaba con lo que el usuario tecleaba ("2235") → valor ≥ 100 →
  // el botón Calcular quedaba deshabilitado sin explicación.
  it("la primera tecla sobre un valor recién enfocado lo reemplaza", () => {
    expect(typeKeys("22", [digit("3"), digit("5")], PCT, true)).toBe("35")
  })

  it("sin foco fresco, los dígitos se agregan al final", () => {
    expect(typeKeys("3", [digit("5")], PCT)).toBe("35")
  })

  it("borrar sobre un valor fresco lo limpia completo", () => {
    expect(applyEntryKey("22", { type: "backspace" }, true, PCT)).toBe("")
  })

  it("borrar edita el último dígito del número (no un símbolo de formato)", () => {
    expect(applyEntryKey("35", { type: "backspace" }, false, PCT)).toBe("3")
    expect(applyEntryKey("25000", { type: "backspace" }, false, MONEY)).toBe("2500")
  })

  it("los montos en COP no aceptan decimales", () => {
    expect(applyEntryKey("250", { type: "decimal" }, false, MONEY)).toBe("250")
  })

  it("los porcentajes aceptan un solo separador decimal y hasta 2 decimales", () => {
    expect(typeKeys("", [digit("3"), { type: "decimal" }, digit("5"), { type: "decimal" }, digit("2"), digit("9")], PCT)).toBe("3.52")
  })

  it("el separador decimal sobre un registro vacío produce 0.", () => {
    expect(applyEntryKey("", { type: "decimal" }, false, PCT)).toBe("0.")
  })

  it("'000' sobre un registro vacío no deja ceros a la izquierda", () => {
    expect(applyEntryKey("", digit("000"), false, MONEY)).toBe("0")
    expect(applyEntryKey("25", digit("000"), false, MONEY)).toBe("25000")
  })

  it("respeta el máximo de dígitos", () => {
    expect(applyEntryKey("999999999999", digit("9"), false, MONEY)).toBe("999999999999")
  })

  it("clear vacía el registro", () => {
    expect(applyEntryKey("12345", { type: "clear" }, false, MONEY)).toBe("")
  })
})

describe("entryKeyFromKeyboard", () => {
  it("traduce dígitos, separadores y teclas de borrado", () => {
    expect(entryKeyFromKeyboard("7")).toEqual(digit("7"))
    expect(entryKeyFromKeyboard(",")).toEqual({ type: "decimal" })
    expect(entryKeyFromKeyboard(".")).toEqual({ type: "decimal" })
    expect(entryKeyFromKeyboard("Backspace")).toEqual({ type: "backspace" })
    expect(entryKeyFromKeyboard("Escape")).toEqual({ type: "clear" })
    expect(entryKeyFromKeyboard("a")).toBeNull()
  })
})

describe("sanitizeEntry", () => {
  it("limpia montos pegados con formato", () => {
    expect(sanitizeEntry("$ 25.000", MONEY)).toBe("25000")
  })
  it("limpia porcentajes pegados con coma decimal", () => {
    expect(sanitizeEntry("35,5 %", PCT)).toBe("35.5")
  })
})

describe("sanitizeEntry: pegar con separador de miles", () => {
  const d = { decimals: true, maxDigits: 9, maxDecimals: 2 }
  it("el último separador es el decimal; el otro agrupa miles", () => {
    expect(sanitizeEntry("1.234,5", d)).toBe("1234.5")
    expect(sanitizeEntry("1,234.5", d)).toBe("1234.5")
    expect(sanitizeEntry("35,5 %", d)).toBe("35.5")
  })
})

describe("formato", () => {
  it("formatea montos y porcentajes solo para mostrar", () => {
    expect(formatMoneyEntry("25000")).toBe("$ 25.000")
    expect(formatMoneyEntry("")).toBe("")
    expect(formatPercentEntry("35.5")).toBe("35,5 %")
  })
  it("parseEntry devuelve null para registros vacíos", () => {
    expect(parseEntry("")).toBeNull()
    expect(parseEntry("35.5")).toBe(35.5)
  })
})
