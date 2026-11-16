/**
 * Utilidades de color sin dependencias: hex ↔ sRGB ↔ lineal ↔ OKLab ↔ OKLCH,
 * contraste WCAG 2.x, APCA (dato extra), gamut mapping y ajustes que conservan
 * el matiz. Todas las funciones reciben/devuelven #RRGGBB en mayúsculas.
 *
 * Por qué OKLCH: es perceptualmente uniforme (L = claridad percibida, C = croma,
 * h = matiz), de modo que "oscurecer", "mezclar" o "bajar el croma" no cambia el
 * matiz ni produce saltos raros como en HSL. El contraste se mide con WCAG 2.x
 * (criterio normativo AA) y APCA se expone solo como referencia.
 */

export type RGB = [number, number, number]
export interface Oklch {
  l: number
  c: number
  h: number
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/
export function isHexColor(v: unknown): v is string {
  return typeof v === "string" && HEX_RE.test(v)
}

export function parseHex(hex: string): RGB {
  const h = hex.replace("#", "")
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export function toHex([r, g, b]: RGB): string {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase()
}

/** Normaliza a #RRGGBB mayúsculas (acepta #RGB). Devuelve null si no es válido. */
export function normalizeHex(v: unknown): string | null {
  if (typeof v !== "string") return null
  const s = v.trim()
  if (/^#[0-9a-fA-F]{3}$/.test(s)) return `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`.toUpperCase()
  return HEX_RE.test(s) ? s.toUpperCase() : null
}

const toLinear = (v: number) => {
  const s = v / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}
const fromLinear = (x: number) => {
  const v = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
  return v * 255
}

type V3 = [number, number, number]

function linearToOklab([r, g, b]: V3): V3 {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabToLinear([L, a, b]: V3): V3 {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

export function toOklab(hex: string): V3 {
  const [r, g, b] = parseHex(hex)
  return linearToOklab([toLinear(r), toLinear(g), toLinear(b)])
}

export function toOklch(hex: string): Oklch {
  const [L, a, b] = toOklab(hex)
  const c = Math.hypot(a, b)
  const h = c < 1e-4 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360
  return { l: L, c, h }
}

const EPS = 1e-6
const inGamut = (v: V3) => v.every((x) => x >= -EPS && x <= 1 + EPS)

function lchToLinear(l: number, c: number, h: number): V3 {
  const hr = (h * Math.PI) / 180
  return oklabToLinear([l, c * Math.cos(hr), c * Math.sin(hr)])
}

/**
 * OKLCH → #RRGGBB con gamut mapping: si el color cae fuera de sRGB se reduce el
 * croma (conservando L y h) por bisección hasta entrar; nunca se recorta canal a
 * canal (eso cambiaría el matiz).
 */
export function fromOklch({ l, c, h }: Oklch): string {
  if (!(l > 0)) return "#000000"
  if (l >= 1) return "#FFFFFF"
  let cc = Math.max(0, c)
  let lin = lchToLinear(l, cc, h)
  if (!inGamut(lin)) {
    let lo = 0
    let hi = cc
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2
      if (inGamut(lchToLinear(l, mid, h))) lo = mid
      else hi = mid
    }
    cc = lo
    lin = lchToLinear(l, cc, h)
  }
  return toHex([fromLinear(Math.min(1, Math.max(0, lin[0]))), fromLinear(Math.min(1, Math.max(0, lin[1]))), fromLinear(Math.min(1, Math.max(0, lin[2])))])
}

/** Croma máximo que cabe en sRGB para (l, h). */
export function maxChroma(l: number, h: number): number {
  let lo = 0
  let hi = 0.4
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2
    if (inGamut(lchToLinear(l, mid, h))) lo = mid
    else hi = mid
  }
  return lo
}

/* ─── Contraste ─────────────────────────────────────────────────────── */

export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/** Relación de contraste WCAG 2.x (1 a 21). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * APCA (SAPC 0.0.98G) Lc con signo: positivo = texto oscuro sobre fondo claro,
 * negativo = texto claro sobre fondo oscuro. Solo informativo (el criterio
 * normativo del motor es WCAG 2.x).
 */
export function apca(textHex: string, bgHex: string): number {
  const y = (hex: string) => {
    const [r, g, b] = parseHex(hex).map((v) => Math.pow(v / 255, 2.4))
    const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b
    return Y < 0.022 ? Y + Math.pow(0.022 - Y, 1.414) : Y
  }
  const yt = y(textHex)
  const yb = y(bgHex)
  if (Math.abs(yb - yt) < 0.0005) return 0
  if (yb > yt) {
    const s = (Math.pow(yb, 0.56) - Math.pow(yt, 0.57)) * 1.14
    return s < 0.1 ? 0 : (s - 0.027) * 100
  }
  const s = (Math.pow(yb, 0.65) - Math.pow(yt, 0.62)) * 1.14
  return s > -0.1 ? 0 : (s + 0.027) * 100
}

export const INK = "#12213A"

/**
 * Texto legible sobre un fondo sólido. Prefiere blanco o la tinta de marca
 * (#12213A); si ninguno llega a 4.5:1 (fondos de luminosidad media) usa
 * negro/blanco puros. `prefer` fuerza un lado cuando ese lado ya cumple 4.5.
 */
export function onColor(bg: string, opts?: { prefer?: "light" | "dark" }): string {
  const white = "#FFFFFF"
  const cw = contrastRatio(white, bg)
  const cd = contrastRatio(INK, bg)
  if (opts?.prefer === "light" && cw >= 4.5) return white
  if (opts?.prefer === "dark" && cd >= 4.5) return INK
  const best = cw >= cd ? white : INK
  if (Math.max(cw, cd) >= 4.5) return best
  return contrastRatio("#000000", bg) >= cw ? "#000000" : white
}

/**
 * Ajusta la claridad (L en OKLCH) de `fg`, conservando matiz y croma (con gamut
 * mapping), hasta alcanzar `min` contra `bg`. Respeta la intención: un texto
 * claro sobre fondo oscuro sigue siendo claro. Si no hay solución, negro/blanco.
 */
export function ensureContrast(fg: string, bg: string, min: number): string {
  const start = normalizeHex(fg) ?? "#000000"
  if (contrastRatio(start, bg) >= min) return start
  const { l, c, h } = toOklch(start)
  const lighterFirst = relativeLuminance(start) >= relativeLuminance(bg)
  const attempt = (end: number): string | null => {
    if (contrastRatio(fromOklch({ l: end, c, h }), bg) < min) return null
    let from = l
    let to = end
    for (let i = 0; i < 22; i++) {
      const mid = (from + to) / 2
      if (contrastRatio(fromOklch({ l: mid, c, h }), bg) >= min) to = mid
      else from = mid
    }
    return fromOklch({ l: to, c, h })
  }
  const order: (0 | 1)[] = lighterFirst ? [1, 0] : [0, 1]
  for (const end of order) {
    const r = attempt(end)
    if (r) return r
  }
  return contrastRatio("#000000", bg) >= contrastRatio("#FFFFFF", bg) ? "#000000" : "#FFFFFF"
}

/** Garantiza contraste contra varias superficies a la vez (iterando hasta converger). */
export function ensureContrastAll(fg: string, bgs: string[], min: number): string {
  let out = fg
  for (let pass = 0; pass < 4; pass++) {
    let changed = false
    for (const bg of bgs) {
      const n = ensureContrast(out, bg, min)
      if (n !== out) {
        out = n
        changed = true
      }
    }
    if (!changed) break
  }
  return out
}

/* ─── Mezcla y ajustes perceptuales ─────────────────────────────────── */

/** Mezcla perceptual en OKLab; t=0 devuelve a, t=1 devuelve b. */
export function mix(a: string, b: string, t: number): string {
  const A = toOklab(a)
  const B = toOklab(b)
  const L = A[0] + (B[0] - A[0]) * t
  const x = A[1] + (B[1] - A[1]) * t
  const y = A[2] + (B[2] - A[2]) * t
  const c = Math.hypot(x, y)
  const h = c < 1e-5 ? toOklch(a).h : ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  return fromOklch({ l: L, c, h })
}

export function withOklch(hex: string, patch: Partial<Oklch>): string {
  return fromOklch({ ...toOklch(hex), ...patch })
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Un color es "fluorescente" si su croma es excesivo para su claridad (neones, #00FF00, #FF00FF...). */
export function isFluorescent(hex: string): boolean {
  const { l, c } = toOklch(hex)
  if (c >= 0.255) return true
  if (l >= 0.8 && c >= 0.19) return true
  return false
}

/** Limita el croma de un color a un rango sobrio (más bajo en claridades altas). */
export function tameChroma(hex: string, max = 0.19): string {
  const { l, c, h } = toOklch(hex)
  const cap = l >= 0.8 ? Math.min(max, 0.15) : max
  return c <= cap ? hex.toUpperCase() : fromOklch({ l, c: cap, h })
}
