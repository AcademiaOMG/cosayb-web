import type { AdminCourse, AdminQuestion, AdminQuiz, CertColor, InstructorOverview, QuestionType } from "./types"
import { blankTokens, validateQuestionDraft } from "./validation"

// Utilidades puras del estudio del instructor (sin React ni red): fáciles de probar.

/** Copia de `list` moviendo el elemento de `from` a `to` (índices fuera de rango se acotan). */
export function reorder<T>(list: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length) return [...list]
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(Math.max(0, Math.min(to, next.length)), 0, item)
  return next
}

export interface OutlineModule {
  id: string
  lessonIds: string[]
}

export const outlineOf = (course: Pick<AdminCourse, "modules">): OutlineModule[] =>
  course.modules.map((m) => ({ id: m.id, lessonIds: m.lessons.map((l) => l.id) }))

/** Mueve una lección a otro módulo (o dentro del mismo) en la posición indicada. */
export function moveLesson(outline: OutlineModule[], lessonId: string, toModuleId: string, toIndex: number): OutlineModule[] {
  const without = outline.map((m) => ({ ...m, lessonIds: m.lessonIds.filter((id) => id !== lessonId) }))
  return without.map((m) => {
    if (m.id !== toModuleId) return m
    const ids = [...m.lessonIds]
    ids.splice(Math.max(0, Math.min(toIndex, ids.length)), 0, lessonId)
    return { ...m, lessonIds: ids }
  })
}

export function moveModule(outline: OutlineModule[], moduleId: string, toIndex: number): OutlineModule[] {
  return reorder(outline, outline.findIndex((m) => m.id === moduleId), toIndex)
}

export interface ChecklistItem {
  id: string
  label: string
  ok: boolean
  /** Bloquea la publicación (el servidor exige al menos una lección). */
  required: boolean
  hint?: string
}

/** Requisitos para publicar: los obligatorios los exige el servidor; el resto son recomendaciones de calidad. */
export function publishChecklist(course: AdminCourse, quizzes: AdminQuiz[] | undefined): ChecklistItem[] {
  const lessons = course.modules.flatMap((m) => m.lessons)
  const withQuestions = (quizzes ?? []).filter((q) => q.questions.length > 0)
  return [
    { id: "title", label: "Título y descripción", ok: course.title.trim().length >= 3 && course.description.trim().length >= 20, required: false, hint: "Una descripción de 20 caracteres o más ayuda a que la gente decida inscribirse." },
    { id: "lessons", label: "Al menos una lección", ok: lessons.length >= 1, required: true, hint: "Sin lecciones el curso no puede publicarse." },
    { id: "content", label: "Todas las lecciones tienen contenido", ok: lessons.length > 0 && lessons.every((l) => l.body.trim() || l.assets.length || (l.kind === "link" && l.linkUrl)), required: false, hint: "Hay lecciones vacías: texto, archivo o enlace." },
    { id: "preview", label: "Una lección de vista previa gratuita", ok: lessons.some((l) => l.isPreview), required: false, hint: "Deja que quien visita el catálogo pruebe el curso antes de matricularse." },
    { id: "cover", label: "Portada, categoría y duración", ok: Boolean(course.coverKey) && course.category.trim().length > 0 && course.durationMinutes > 0, required: false, hint: "Define la duración estimada en Ajustes." },
    { id: "quiz", label: "Una evaluación con preguntas (opcional)", ok: withQuestions.length > 0, required: false, hint: "Las evaluaciones habilitan el certificado por mérito." },
  ]
}

export const canPublish = (items: ChecklistItem[]) => items.filter((i) => i.required).every((i) => i.ok)

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
/** "2026-05" → "may". */
export const monthLabel = (ym: string) => MONTHS[Number(ym.slice(5, 7)) - 1] ?? ym

/** Cambio porcentual respecto al periodo anterior; null si no hay base para comparar. */
export function deltaPercent(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? null : 0
  return Math.round(((current - previous) * 100) / previous)
}

/** Puntos de una serie normalizados al área de un gráfico de líneas (y crece hacia arriba). */
export function linePoints(values: number[], width: number, height: number, max = Math.max(1, ...values)): { x: number; y: number }[] {
  const step = values.length > 1 ? width / (values.length - 1) : 0
  return values.map((v, i) => ({ x: Math.round(i * step * 10) / 10, y: Math.round((height - (Math.min(v, max) / max) * height) * 10) / 10 }))
}

/** Máximo "bonito" para el eje (1, 2, 5 × 10^n). */
export function niceMax(n: number): number {
  if (n <= 5) return 5
  const pow = 10 ** Math.floor(Math.log10(n))
  const m = n / pow
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * pow
}

/** Segmentos de una dona: ángulos acumulados a partir de los conteos (omite ceros). */
export function donutSegments(counts: number[]): { start: number; share: number }[] {
  const total = counts.reduce((a, b) => a + b, 0)
  if (total === 0) return []
  let acc = 0
  return counts.map((c) => {
    const seg = { start: acc / total, share: c / total }
    acc += c
    return seg
  })
}

const CERT_COLORS: Record<CertColor, { name: string; hex: string; soft: string }> = {
  blue: { name: "Azul", hex: "#1b4fd8", soft: "#e8efff" },
  teal: { name: "Turquesa", hex: "#0f8f8a", soft: "#dcf5f3" },
  amber: { name: "Ámbar", hex: "#b7791f", soft: "#fff1d4" },
  rose: { name: "Rosa", hex: "#c0305f", soft: "#ffe2ea" },
}
export const certPalette = (c: CertColor | undefined) => CERT_COLORS[c ?? "blue"] ?? CERT_COLORS.blue
export const CERT_COLOR_LIST = Object.entries(CERT_COLORS).map(([id, v]) => ({ id: id as CertColor, ...v }))

/** "hace 3 días" a partir de una fecha ISO (now inyectable para pruebas). */
export function timeAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return "Sin actividad"
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000))
  if (mins < 1) return "ahora"
  if (mins < 60) return `hace ${mins} min`
  const h = Math.round(mins / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.round(h / 24)
  if (d < 30) return `hace ${d} d`
  const mo = Math.round(d / 30)
  return mo < 12 ? `hace ${mo} mes${mo > 1 ? "es" : ""}` : "hace más de un año"
}

/** Filtra y ordena las tarjetas del panorama. */
export function filterCourses(
  courses: InstructorOverview["courses"],
  o: { q: string; status: "all" | "published" | "draft" | "archived"; sort: "recent" | "students" | "progress" | "title" }
): InstructorOverview["courses"] {
  const q = o.q.trim().toLowerCase()
  const list = courses.filter((c) => (o.status === "all" || c.status === o.status) && (!q || c.title.toLowerCase().includes(q)))
  const by = {
    recent: (a: (typeof list)[0], b: (typeof list)[0]) => b.updatedAt.localeCompare(a.updatedAt),
    students: (a: (typeof list)[0], b: (typeof list)[0]) => b.enrolled - a.enrolled,
    progress: (a: (typeof list)[0], b: (typeof list)[0]) => b.avgProgress - a.avgProgress,
    title: (a: (typeof list)[0], b: (typeof list)[0]) => a.title.localeCompare(b.title, "es"),
  }[o.sort]
  return [...list].sort(by)
}

/** Aplica un orden de estructura (módulos y lecciones) sobre el curso, para actualizar la pantalla antes de que responda el servidor. */
export function applyOutline<C extends { modules: { id: string; lessons: { id: string }[] }[] }>(course: C, outline: OutlineModule[]): C {
  const mods = new Map(course.modules.map((m) => [m.id, m]))
  const lessons = new Map(course.modules.flatMap((m) => m.lessons.map((l) => [l.id, l] as const)))
  return {
    ...course,
    modules: outline.flatMap((o) => {
      const m = mods.get(o.id)
      return m ? [{ ...m, lessons: o.lessonIds.flatMap((id) => (lessons.has(id) ? [lessons.get(id)!] : [])) }] : []
    }),
  }
}

// ─── Preguntas: borradores por tipo ─────────────────────────────────────────

export type DraftOption = { id?: string; text: string; isCorrect: boolean; blankIndex?: number | null }
export interface QDraft {
  type: QuestionType
  prompt: string
  explanation: string
  points: number
  required: boolean
  shuffleOptions: boolean
  estimatedMinutes: number
  options: DraftOption[]
}

/** Plantillas con texto de ejemplo: el servidor no admite respuestas vacías, así que nacen válidas y la persona las edita. */
export function defaultQuestion(type: QuestionType): QDraft {
  const base = { type, explanation: "", points: 1, required: true, shuffleOptions: true, estimatedMinutes: 1 }
  switch (type) {
    case "true_false":
      return { ...base, prompt: "Escribe aquí una afirmación", shuffleOptions: false, options: [{ text: "Verdadero", isCorrect: true }, { text: "Falso", isCorrect: false }] }
    case "multiple":
      return { ...base, prompt: "Escribe aquí la pregunta", options: [{ text: "Respuesta correcta 1", isCorrect: true }, { text: "Respuesta correcta 2", isCorrect: true }, { text: "Respuesta incorrecta", isCorrect: false }] }
    case "short_text":
      return { ...base, prompt: "Escribe aquí la pregunta", shuffleOptions: false, options: [{ text: "respuesta", isCorrect: true }] }
    case "fill_blank":
      return { ...base, prompt: "Completa la frase: el {{1}} se calcula con el {{2}}", options: [{ text: "margen", isCorrect: true, blankIndex: 1 }, { text: "costo", isCorrect: true, blankIndex: 2 }, { text: "distractor", isCorrect: false }] }
    default:
      return { ...base, type: "single", prompt: "Escribe aquí la pregunta", options: [{ text: "Respuesta correcta", isCorrect: true }, { text: "Respuesta incorrecta", isCorrect: false }] }
  }
}

/** Cambia el tipo conservando enunciado, explicación y ajustes; las respuestas se adaptan (o se reinician si no son compatibles). */
export function convertType(d: QDraft, to: QuestionType): QDraft {
  if (d.type === to) return d
  const fresh = defaultQuestion(to)
  const keep = { prompt: d.prompt, explanation: d.explanation, points: d.points, required: d.required, estimatedMinutes: d.estimatedMinutes }
  const opts = d.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect }))
  if ((d.type === "single" || d.type === "multiple") && (to === "single" || to === "multiple")) {
    const firstCorrect = opts.findIndex((o) => o.isCorrect)
    return { ...d, ...keep, type: to, options: to === "single" ? opts.map((o, i) => ({ ...o, isCorrect: i === Math.max(0, firstCorrect) })) : opts }
  }
  if (to === "short_text") {
    const accepted = d.options.filter((o) => o.isCorrect && o.text.trim())
    return { ...fresh, ...keep, options: accepted.length ? accepted.map((o) => ({ text: o.text, isCorrect: true })) : fresh.options }
  }
  if (to === "fill_blank" && !blankTokens(d.prompt).length) return { ...fresh, explanation: d.explanation, points: d.points, required: d.required, estimatedMinutes: d.estimatedMinutes }
  return { ...fresh, ...keep }
}

/** Solo se autoguardan borradores válidos y sin respuestas vacías (el servidor las rechaza). */
export function isSavable(d: QDraft): boolean {
  return validateQuestionDraft(d) === null && d.options.every((o) => o.text.trim().length > 0)
}

export function toDraft(q: AdminQuestion): QDraft {
  return {
    type: q.type, prompt: q.prompt, explanation: q.explanation, points: q.points, required: q.required, shuffleOptions: q.shuffleOptions, estimatedMinutes: q.estimatedMinutes,
    options: q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect, blankIndex: o.blankIndex })),
  }
}
