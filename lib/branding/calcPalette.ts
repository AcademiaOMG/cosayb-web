/**
 * Familia de colores de la calculadora (--calc-*) a partir de UN color base.
 *
 * Identidad conservada (carcasa oscura, teclas marfil, teclas de operación
 * azul acero, tecla igual saturada, LCD verdoso) con el matiz de la marca:
 *  - Carcasa: siempre oscura (L≈0.27/0.2) con croma contenido => cualquier base
 *    (blanco, amarillo, neón) da una carcasa sobria y las teclas claras siempre
 *    se distinguen de ella.
 *  - Teclas numéricas: marfil fijo (neutro cálido); operaciones: tono de la
 *    marca muy desaturado y claro; igual: matiz pleno con L/C normalizados.
 *  - LCD: verde-gris clásico (identidad de pantalla) con tinta por contraste.
 *  - Todo texto se calcula por contraste (>=4.5, pantalla >=7); anillos/acento
 *    >=3 contra la carcasa.
 * Con base = azul por defecto del tema (#12213A) el resultado es el azul actual.
 */
import { clamp, ensureContrast, fromOklch, onColor, toOklch } from "./color"

export function calcPaletteVars(base: string): Record<string, string> {
  const o = toOklch(base)
  const achromatic = o.c < 0.025
  const h = achromatic ? 262 : o.h
  const c = achromatic ? 0.03 : o.c

  const body = fromOklch({ l: 0.27, c: clamp(c, 0.04, 0.09), h })
  const body2 = fromOklch({ l: 0.2, c: clamp(c * 0.9, 0.035, 0.08), h })

  const key = fromOklch({ l: 0.965, c: 0.012, h: 90 })
  const inkBase = fromOklch({ l: 0.25, c: 0.03, h })
  const keyText = ensureContrast(inkBase, key, 7)

  const keyOp = fromOklch({ l: 0.84, c: clamp(c * 0.4, 0.02, 0.045), h })
  const keyOpText = ensureContrast(inkBase, keyOp, 7)

  const equalsRaw = fromOklch({ l: 0.56, c: achromatic ? 0.1 : clamp(c * 3, 0.1, 0.19), h })
  const equals = ensureContrast(equalsRaw, body, 3)
  const equalsText = onColor(equals)

  const displayBg = fromOklch({ l: 0.85, c: 0.045, h: 125 })
  const displayText = ensureContrast(fromOklch({ l: 0.22, c: 0.03, h: 125 }), displayBg, 7)

  const accentRaw = fromOklch({ l: 0.68, c: achromatic ? 0.1 : clamp(c * 2.6, 0.09, 0.17), h })
  const accent = ensureContrast(accentRaw, body, 3)
  const ring = ensureContrast(fromOklch({ l: 0.76, c: clamp(c * 1.2, 0.05, 0.11), h }), body, 3)

  return {
    "--calc-body": body,
    "--calc-body-2": body2,
    "--calc-key": key,
    "--calc-key-text": keyText,
    "--calc-key-op": keyOp,
    "--calc-key-op-text": keyOpText,
    "--calc-key-equals": equals,
    "--calc-key-equals-text": equalsText,
    "--calc-display-bg": displayBg,
    "--calc-display-text": displayText,
    "--calc-accent": accent,
    "--calc-ring": ring,
  }
}
