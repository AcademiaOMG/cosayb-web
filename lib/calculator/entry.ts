// ─── Entrada de dígitos de una calculadora ──────────────────────────────────
// Lógica pura, sin React: la usan el teclado en pantalla y el teclado físico
// por igual, así ambos caminos se comportan exactamente igual.
//
// Un "registro" guarda su valor como texto crudo ("25000", "35.5", "") — nunca
// con formato ($, puntos de miles, %). El formato es solo de presentación; si
// el formato vive dentro del valor editable, borrar o agregar dígitos termina
// operando sobre el símbolo en vez del número.

export interface EntryOptions {
  /** Permite parte decimal (porcentajes). Los montos en COP son enteros. */
  decimals: boolean
  /** Dígitos máximos (sin contar el separador decimal). */
  maxDigits?: number
  /** Decimales máximos cuando `decimals` es true. */
  maxDecimals?: number
}

export type EntryKey =
  | { type: "digit"; digit: string }
  | { type: "decimal" }
  | { type: "backspace" }
  | { type: "clear" }

const DEFAULT_MAX_DIGITS = 12
const DEFAULT_MAX_DECIMALS = 2

function digitCount(v: string) {
  return v.replace(".", "").length
}

/**
 * Aplica una tecla al valor actual.
 *
 * `fresh` = el registro acaba de recibir el foco y todavía muestra el valor
 * anterior (ej. el % de MP recordado). Como en una calculadora real, la
 * primera tecla numérica REEMPLAZA ese valor en vez de concatenarse — sin
 * esto, un "35" recordado + escribir "32" da "3532".
 */
export function applyEntryKey(value: string, key: EntryKey, fresh: boolean, opts: EntryOptions): string {
  const maxDigits = opts.maxDigits ?? DEFAULT_MAX_DIGITS
  const maxDecimals = opts.maxDecimals ?? DEFAULT_MAX_DECIMALS

  switch (key.type) {
    case "clear":
      return ""

    case "backspace":
      // Con el valor "fresco" (recién enfocado), borrar lo limpia completo —
      // igual que borrar un texto seleccionado.
      if (fresh) return ""
      return value.slice(0, -1)

    case "decimal": {
      if (!opts.decimals) return value
      if (fresh || value === "") return "0."
      if (value.includes(".")) return value
      return value + "."
    }

    case "digit": {
      const d = key.digit
      if (!/^\d+$/.test(d)) return value
      const base = fresh ? "" : value
      let next = base === "0" ? d : base + d
      // "000" sobre un registro vacío no debe producir "000"
      next = normalizeLeadingZeros(next)
      if (digitCount(next) > maxDigits) return base
      if (next.includes(".")) {
        const decimals = next.split(".")[1] ?? ""
        if (decimals.length > maxDecimals) return base
      }
      return next
    }
  }
}

function normalizeLeadingZeros(v: string) {
  if (v.includes(".")) {
    const [int, dec] = v.split(".")
    return `${int.replace(/^0+(?=\d)/, "")}.${dec}`
  }
  return v.replace(/^0+(?=\d)/, "")
}

/** Traduce una tecla física (KeyboardEvent.key) a una tecla de la calculadora. */
export function entryKeyFromKeyboard(key: string): EntryKey | null {
  if (/^\d$/.test(key)) return { type: "digit", digit: key }
  if (key === "." || key === ",") return { type: "decimal" }
  if (key === "Backspace") return { type: "backspace" }
  if (key === "Delete" || key === "Escape") return { type: "clear" }
  return null
}

/**
 * Limpia texto pegado o autocompletado. Acepta "$ 25.000", "25,000", "35,5 %".
 * En montos enteros los puntos/comas son separadores de miles; en porcentajes
 * la coma o el punto es el separador decimal.
 */
export function sanitizeEntry(raw: string, opts: EntryOptions): string {
  const maxDigits = opts.maxDigits ?? DEFAULT_MAX_DIGITS
  if (!opts.decimals) {
    return raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, maxDigits)
  }
  const cleaned = raw.replace(/[^\d.,]/g, "").replace(",", ".")
  const [int = "", ...rest] = cleaned.split(".")
  const dec = rest.join("").slice(0, opts.maxDecimals ?? DEFAULT_MAX_DECIMALS)
  const intPart = int.replace(/^0+(?=\d)/, "").slice(0, maxDigits)
  return cleaned.includes(".") ? `${intPart || "0"}.${dec}` : intPart
}

/** Valor numérico de un registro; null si está vacío o no es un número. */
export function parseEntry(value: string): number | null {
  if (value.trim() === "" || value === ".") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** Formato para mostrar un monto en COP: "$ 25.000". Vacío si no hay valor. */
export function formatMoneyEntry(value: string): string {
  const n = parseEntry(value)
  if (n == null) return ""
  return `$ ${Math.round(n).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`
}

/**
 * Formato para mostrar un porcentaje mientras se escribe: "35,5 %". Conserva
 * un separador final ("35," mientras el usuario va a escribir el decimal).
 */
export function formatPercentEntry(value: string): string {
  if (value === "") return ""
  return `${value.replace(".", ",")} %`
}
