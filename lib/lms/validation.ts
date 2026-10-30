import type { AssetKind, AttemptQuestion, QuestionDraft, StudentAnswer } from "./types"

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

/** Huecos {{1}}, {{2}}… presentes en un enunciado (únicos y ordenados). */
export function blankTokens(prompt: string): number[] {
  const found = new Set<number>()
  for (const m of prompt.matchAll(/\{\{(\d{1,2})\}\}/g)) found.add(Number(m[1]))
  return [...found].sort((x, y) => x - y)
}

/** Parte un enunciado en texto y huecos para dibujarlo sin HTML: [{text}, {blank: 1}, {text}…]. */
export function splitBlanks(prompt: string): ({ text: string } | { blank: number })[] {
  const out: ({ text: string } | { blank: number })[] = []
  let last = 0
  for (const m of prompt.matchAll(/\{\{(\d{1,2})\}\}/g)) {
    if (m.index! > last) out.push({ text: prompt.slice(last, m.index) })
    out.push({ blank: Number(m[1]) })
    last = m.index! + m[0].length
  }
  if (last < prompt.length) out.push({ text: prompt.slice(last) })
  return out
}

type AnswerLike = string | StudentAnswer | undefined

function asAnswer(a: AnswerLike): StudentAnswer | undefined {
  return typeof a === "string" ? { optionId: a } : a
}

/** ¿La pregunta tiene una respuesta completa? (varias respuestas: al menos una; huecos: todos llenos). */
export function isAnswered(q: AttemptQuestion, raw: AnswerLike): boolean {
  const a = asAnswer(raw)
  if (!a) return false
  switch (q.type ?? "single") {
    case "multiple":
      return (a.optionIds?.length ?? 0) > 0
    case "short_text":
      return (a.text ?? "").trim().length > 0
    case "fill_blank": {
      const total = blankTokens(q.prompt).length
      return total > 0 && Object.values(a.blanks ?? {}).filter(Boolean).length === total
    }
    default:
      return Boolean(a.optionId)
  }
}

/** Preguntas sin responder (para avisar antes de enviar el intento). */
export function unansweredCount(questions: AttemptQuestion[], answers: Record<string, AnswerLike>): number {
  return questions.filter((q) => !isAnswered(q, answers[q.id])).length
}

/** Cuerpo del envío: solo las preguntas contestadas, con la forma que espera el servidor. */
export function buildAnswerPayload(answers: Record<string, AnswerLike>): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = []
  for (const [questionId, raw] of Object.entries(answers)) {
    const a = asAnswer(raw)
    if (!a) continue
    if (a.optionId) out.push({ questionId, optionId: a.optionId })
    else if (a.optionIds && a.optionIds.length) out.push({ questionId, optionIds: a.optionIds })
    else if (a.text !== undefined && a.text.trim()) out.push({ questionId, text: a.text })
    else if (a.blanks) {
      const blanks = Object.entries(a.blanks).filter(([, o]) => o).map(([index, optionId]) => ({ index: Number(index), optionId }))
      if (blanks.length) out.push({ questionId, blanks })
    }
  }
  return out
}

export const QUESTION_TYPE_LABEL: Record<NonNullable<QuestionDraft["type"]>, string> = {
  single: "Opción múltiple",
  multiple: "Varias respuestas",
  true_false: "Verdadero o falso",
  fill_blank: "Completar espacios",
  short_text: "Respuesta corta",
}

/** Mismas reglas que el servidor (lms.questions.ts); el servidor es la autoridad. */
export function validateQuestionDraft(q: QuestionDraft): string | null {
  if (!q.prompt.trim()) return "Escribe el enunciado de la pregunta."
  if (q.prompt.length > 2000) return "El enunciado admite hasta 2000 caracteres."
  if (!Number.isInteger(q.points) || q.points < 1 || q.points > 100) return "Los puntos deben ser un entero entre 1 y 100."
  const type = q.type ?? "single"
  const filled = q.options.filter((o) => o.text.trim())
  const correct = filled.filter((o) => o.isCorrect)
  if (q.options.some((o) => o.isCorrect && !o.text.trim())) return "La opción correcta no puede estar vacía."
  switch (type) {
    case "single":
      if (filled.length < 2) return "Agrega al menos dos opciones."
      if (filled.length > 6) return "Máximo seis opciones."
      if (correct.length !== 1) return "Marca exactamente una opción correcta."
      return null
    case "true_false":
      return correct.length === 1 && filled.length === 2 ? null : "Marca si la afirmación es verdadera o falsa."
    case "multiple":
      if (filled.length < 2) return "Agrega al menos dos opciones."
      if (filled.length > 8) return "Máximo ocho opciones."
      return correct.length >= 1 ? null : "Marca al menos una opción correcta."
    case "short_text":
      if (correct.length < 1) return "Escribe al menos una respuesta aceptada."
      if (filled.length > 10) return "Máximo diez respuestas aceptadas."
      return filled.length === correct.length ? null : "En respuesta corta todas las respuestas guardadas son aceptadas."
    case "fill_blank": {
      const blanks = blankTokens(q.prompt)
      if (blanks.length < 1 || blanks.length > 5) return "Escribe entre 1 y 5 huecos con {{1}}, {{2}}…"
      if (blanks.some((b, i) => b !== i + 1)) return "Los huecos deben numerarse seguidos desde {{1}}."
      for (const b of blanks) if (!correct.some((o) => o.blankIndex === b)) return `Falta la respuesta del hueco {{${b}}}.`
      if (correct.some((o) => !o.blankIndex || o.blankIndex > blanks.length)) return "Cada respuesta correcta debe indicar su hueco."
      return filled.length > 12 ? "Máximo doce fichas." : null
    }
  }
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
