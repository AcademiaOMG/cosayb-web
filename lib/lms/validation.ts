import type { AssetKind, AttemptQuestion, QuestionDraft } from "./types"

// Validaciones de cliente (comodidad). El servidor es la autoridad: repite todas las reglas.

export const UPLOAD_RULES: Record<AssetKind, { mimes: string[]; maxBytes: number; label: string }> = {
  video: { mimes: ["video/mp4", "video/webm"], maxBytes: 200 * 1024 * 1024, label: "Video (MP4 o WebM)" },
  document: { mimes: ["application/pdf"], maxBytes: 25 * 1024 * 1024, label: "Documento (PDF)" },
  subtitle: { mimes: ["text/vtt"], maxBytes: 1024 * 1024, label: "Subtítulos (VTT)" },
  thumbnail: { mimes: ["image/jpeg", "image/png", "image/webp"], maxBytes: 5 * 1024 * 1024, label: "Miniatura (JPG, PNG o WebP)" },
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/** Devuelve un mensaje de error o null si el archivo puede subirse. */
export function validateUpload(kind: AssetKind, file: { type: string; size: number }): string | null {
  const rule = UPLOAD_RULES[kind]
  if (!rule.mimes.includes(file.type)) return `Tipo no permitido. Se acepta: ${rule.mimes.join(", ")}.`
  if (file.size === 0) return "El archivo está vacío."
  if (file.size > rule.maxBytes) return `El archivo pesa ${formatBytes(file.size)} y el máximo es ${formatBytes(rule.maxBytes)}.`
  return null
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export function validateSlug(slug: string): string | null {
  if (slug.length < 3) return "Mínimo 3 caracteres."
  if (slug.length > 80) return "Máximo 80 caracteres."
  if (!SLUG_RE.test(slug)) return "Solo minúsculas, números y guiones."
  return null
}

export function progressPercent(completed: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(100, Math.round((completed * 100) / total))
}

/** Preguntas sin responder (para avisar antes de enviar el intento). */
export function unansweredCount(questions: AttemptQuestion[], answers: Record<string, string>): number {
  return questions.filter((q) => !answers[q.id]).length
}

export function validateQuestionDraft(q: QuestionDraft): string | null {
  if (!q.prompt.trim()) return "Escribe el enunciado de la pregunta."
  if (q.prompt.length > 2000) return "El enunciado admite hasta 2000 caracteres."
  const opts = q.options.filter((o) => o.text.trim())
  if (opts.length < 2) return "Agrega al menos dos opciones."
  if (opts.length > 6) return "Máximo seis opciones."
  if (opts.filter((o) => o.isCorrect).length !== 1) return "Marca exactamente una opción correcta."
  if (q.options.some((o) => o.isCorrect && !o.text.trim())) return "La opción correcta no puede estar vacía."
  if (!Number.isInteger(q.points) || q.points < 1 || q.points > 100) return "Los puntos deben ser un entero entre 1 y 100."
  return null
}

const CODE_RE = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}(-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}){3}$/

/** Normaliza lo escrito (mayúsculas, espacios, guiones faltantes) para verificar un certificado. */
export function normalizeCertificateCode(raw: string): string {
  const compact = raw.toUpperCase().replace(/[^A-Z0-9]/g, "")
  return compact.length === 16 ? compact.match(/.{4}/g)!.join("-") : raw.trim().toUpperCase()
}

export function isValidCertificateCode(code: string): boolean {
  return CODE_RE.test(code)
}

/** decodeURIComponent que nunca lanza (un % suelto en la URL no debe tumbar la página). */
export function safeDecode(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
