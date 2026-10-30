import { describe, expect, it } from "vitest"
import {
  applyOutline, canPublish, convertType, defaultQuestion, deltaPercent, donutSegments, filterCourses, isSavable, linePoints, monthLabel,
  moveLesson, moveModule, niceMax, outlineOf, publishChecklist, reorder, timeAgo, toDraft,
} from "./studio"
import { validateQuestionDraft } from "./validation"
import type { AdminCourse, AdminQuestion, OverviewCourse, QuestionType } from "./types"

const lesson = (id: string, o: Partial<AdminCourse["modules"][0]["lessons"][0]> = {}) => ({ id, moduleId: "m1", title: id, body: "texto", kind: "reading" as const, linkUrl: null, position: 0, isPreview: false, assets: [], ...o })
const course = (o: Partial<AdminCourse> = {}): AdminCourse => ({
  id: "c", slug: "c", title: "Curso de costos", description: "Una descripción suficientemente larga para el curso.", status: "draft", includedInAcademia: true, updatedAt: "2026-01-01T00:00:00Z",
  category: "Costeo", level: "beginner", durationMinutes: 30, tags: [], coverKey: "cocina", instructorName: "Ana",
  certTitle: "t", certBody: "b", certSigner: "s", certSignerRole: "r", certColor: "blue",
  modules: [
    { id: "m1", title: "Uno", position: 0, lessons: [lesson("a", { isPreview: true }), lesson("b")] },
    { id: "m2", title: "Dos", position: 1, lessons: [lesson("c", { moduleId: "m2" })] },
  ],
  ...o,
})

describe("reordenar", () => {
  it("reorder mueve sin mutar y acota índices", () => {
    const src = ["a", "b", "c", "d"]
    expect(reorder(src, 0, 2)).toEqual(["b", "c", "a", "d"])
    expect(reorder(src, 3, 0)).toEqual(["d", "a", "b", "c"])
    expect(reorder(src, 1, 99)).toEqual(["a", "c", "d", "b"])
    expect(reorder(src, 9, 0)).toEqual(src)
    expect(src).toEqual(["a", "b", "c", "d"])
  })
  it("moveLesson cambia de módulo y de posición", () => {
    const o = outlineOf(course())
    expect(moveLesson(o, "a", "m2", 0)).toEqual([{ id: "m1", lessonIds: ["b"] }, { id: "m2", lessonIds: ["a", "c"] }])
    expect(moveLesson(o, "c", "m1", 1)).toEqual([{ id: "m1", lessonIds: ["a", "c", "b"] }, { id: "m2", lessonIds: [] }])
    expect(moveLesson(o, "a", "m1", 1)).toEqual([{ id: "m1", lessonIds: ["b", "a"] }, { id: "m2", lessonIds: ["c"] }])
  })
  it("moveModule y applyOutline conservan el contenido", () => {
    const c = course()
    const o = moveModule(outlineOf(c), "m2", 0)
    expect(o.map((m) => m.id)).toEqual(["m2", "m1"])
    const next = applyOutline(c, moveLesson(o, "a", "m2", 1))
    expect(next.modules.map((m) => m.id)).toEqual(["m2", "m1"])
    expect(next.modules[0].lessons.map((l) => l.id)).toEqual(["c", "a"])
    expect(next.modules[1].lessons.map((l) => l.id)).toEqual(["b"])
    expect(next.title).toBe(c.title)
  })
})

describe("lista de requisitos para publicar", () => {
  it("sin lecciones no se puede publicar; con una sí aunque falten recomendaciones", () => {
    const empty = course({ modules: [{ id: "m1", title: "Uno", position: 0, lessons: [] }] })
    expect(canPublish(publishChecklist(empty, []))).toBe(false)
    const one = course({ modules: [{ id: "m1", title: "Uno", position: 0, lessons: [lesson("a", { body: "" })] }], description: "" })
    const items = publishChecklist(one, undefined)
    expect(canPublish(items)).toBe(true)
    expect(items.find((i) => i.id === "content")?.ok).toBe(false)
    expect(items.find((i) => i.id === "title")?.ok).toBe(false)
    expect(items.find((i) => i.id === "preview")?.ok).toBe(false)
  })
  it("un enlace o un archivo cuentan como contenido", () => {
    const c = course({ modules: [{ id: "m1", title: "U", position: 0, lessons: [lesson("a", { body: "", kind: "link", linkUrl: "https://x.co" }), lesson("b", { body: "", assets: [{ id: "x", lessonId: "b", kind: "video", mime: "video/mp4", sizeBytes: 1 }] })] }] })
    expect(publishChecklist(c, []).find((i) => i.id === "content")?.ok).toBe(true)
  })
})

describe("indicadores y gráficos", () => {
  it("deltaPercent", () => {
    expect(deltaPercent(15, 10)).toBe(50)
    expect(deltaPercent(5, 10)).toBe(-50)
    expect(deltaPercent(0, 0)).toBe(0)
    expect(deltaPercent(4, 0)).toBeNull()
  })
  it("linePoints escala al área (y crece hacia arriba) y no se sale del máximo", () => {
    expect(linePoints([0, 5, 10], 100, 50, 10)).toEqual([{ x: 0, y: 50 }, { x: 50, y: 25 }, { x: 100, y: 0 }])
    expect(linePoints([20], 100, 50, 10)[0].y).toBe(0)
    expect(linePoints([], 100, 50)).toEqual([])
  })
  it("niceMax da topes redondos", () => {
    expect([0, 3, 7, 18, 45, 97, 230].map(niceMax)).toEqual([5, 5, 10, 20, 50, 100, 500])
  })
  it("donutSegments reparte proporcionalmente", () => {
    expect(donutSegments([1, 1, 2])).toEqual([{ start: 0, share: 0.25 }, { start: 0.25, share: 0.25 }, { start: 0.5, share: 0.5 }])
    expect(donutSegments([0, 0])).toEqual([])
  })
  it("monthLabel y timeAgo", () => {
    expect(monthLabel("2026-05")).toBe("may")
    const now = Date.parse("2026-06-10T12:00:00Z")
    expect(timeAgo(null, now)).toBe("Sin actividad")
    expect(timeAgo("2026-06-10T11:30:00Z", now)).toBe("hace 30 min")
    expect(timeAgo("2026-06-10T09:00:00Z", now)).toBe("hace 3 h")
    expect(timeAgo("2026-06-07T12:00:00Z", now)).toBe("hace 3 d")
    expect(timeAgo("2026-03-10T12:00:00Z", now)).toBe("hace 3 meses")
  })
})

describe("filtrar cursos del panorama", () => {
  const mk = (id: string, o: Partial<OverviewCourse>): OverviewCourse => ({ id, slug: id, title: id, status: "published", level: "beginner", coverKey: "cocina", updatedAt: "2026-01-01", lessonCount: 1, enrolled: 0, avgProgress: 0, finished: 0, passRate: null, certificates: 0, ...o })
  const list = [mk("Beta", { enrolled: 5, avgProgress: 10, updatedAt: "2026-02-01" }), mk("alfa", { status: "draft", enrolled: 9, avgProgress: 80, updatedAt: "2026-03-01" }), mk("Gamma", { enrolled: 1, avgProgress: 50 })]
  it("por estado, texto y orden", () => {
    expect(filterCourses(list, { q: "", status: "draft", sort: "recent" }).map((c) => c.id)).toEqual(["alfa"])
    expect(filterCourses(list, { q: "GAM", status: "all", sort: "recent" }).map((c) => c.id)).toEqual(["Gamma"])
    expect(filterCourses(list, { q: "", status: "all", sort: "students" }).map((c) => c.id)).toEqual(["alfa", "Beta", "Gamma"])
    expect(filterCourses(list, { q: "", status: "all", sort: "progress" }).map((c) => c.id)).toEqual(["alfa", "Gamma", "Beta"])
    expect(filterCourses(list, { q: "", status: "all", sort: "title" }).map((c) => c.id)).toEqual(["alfa", "Beta", "Gamma"])
  })
})

describe("borradores de pregunta", () => {
  const TYPES: QuestionType[] = ["single", "multiple", "true_false", "fill_blank", "short_text"]
  it("cada plantilla nace válida y guardable (el servidor no admite respuestas vacías)", () => {
    for (const t of TYPES) {
      const d = defaultQuestion(t)
      expect(d.type).toBe(t)
      expect(validateQuestionDraft(d), t).toBeNull()
      expect(isSavable(d), t).toBe(true)
    }
  })
  it("una respuesta vacía no es guardable", () => {
    const d = defaultQuestion("single")
    d.options.push({ text: "  ", isCorrect: false })
    expect(isSavable(d)).toBe(false)
  })
  it("convertType conserva enunciado y ajustes, y deja siempre una pregunta válida", () => {
    for (const from of TYPES) for (const to of TYPES) {
      const d = { ...defaultQuestion(from), prompt: from === "fill_blank" ? "El {{1}} y el {{2}}" : "Mi pregunta", points: 4, explanation: "porque" }
      const out = convertType(d, to)
      expect(out.type).toBe(to)
      expect(out.points).toBe(4)
      expect(out.explanation).toBe("porque")
      expect(isSavable(out), `${from}→${to}`).toBe(true)
    }
  })
  it("single↔multiple conserva las respuestas; a única deja solo una correcta", () => {
    const m = defaultQuestion("multiple")
    const s = convertType(m, "single")
    expect(s.options.map((o) => o.text)).toEqual(m.options.map((o) => o.text))
    expect(s.options.filter((o) => o.isCorrect)).toHaveLength(1)
    expect(convertType(s, "multiple").options).toHaveLength(m.options.length)
  })
  it("a respuesta corta aprovecha las respuestas correctas existentes", () => {
    const d = convertType(defaultQuestion("single"), "short_text")
    expect(d.options).toEqual([{ text: "Respuesta correcta", isCorrect: true }])
  })
  it("toDraft copia la pregunta del servidor con los ids de sus respuestas", () => {
    const q: AdminQuestion = { id: "q", type: "multiple", prompt: "p", explanation: "", points: 2, required: true, shuffleOptions: false, estimatedMinutes: 3, imageId: "img", options: [{ id: "o1", text: "a", isCorrect: true, blankIndex: null, imageId: null }, { id: "o2", text: "b", isCorrect: false, blankIndex: null, imageId: "i" }] }
    const d = toDraft(q)
    expect(d).toMatchObject({ type: "multiple", points: 2, required: true, shuffleOptions: false, estimatedMinutes: 3 })
    expect(d.options.map((o) => o.id)).toEqual(["o1", "o2"])
    expect(JSON.stringify(d)).not.toContain("imageId")
  })
})
