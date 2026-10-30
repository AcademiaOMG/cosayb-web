import { afterEach, describe, expect, it } from "vitest"
import { blankTokens, buildAnswerPayload, isAnswered, splitBlanks, unansweredCount, validateQuestionDraft } from "./validation"
import { lms, uploadWithProgress } from "./api"
import type { AttemptQuestion } from "./types"

const q = (o: Partial<AttemptQuestion>): AttemptQuestion => ({ id: "q", type: "single", prompt: "p", points: 1, options: [{ id: "o1", text: "a" }, { id: "o2", text: "b" }], ...o })

describe("respuestas del estudiante por tipo", () => {
  it("isAnswered exige una respuesta completa según el tipo", () => {
    expect(isAnswered(q({}), { optionId: "o1" })).toBe(true)
    expect(isAnswered(q({}), undefined)).toBe(false)
    expect(isAnswered(q({}), "o1")).toBe(true) // forma antigua: solo el id
    expect(isAnswered(q({ type: "multiple" }), { optionIds: [] })).toBe(false)
    expect(isAnswered(q({ type: "multiple" }), { optionIds: ["o1"] })).toBe(true)
    expect(isAnswered(q({ type: "short_text", options: [] }), { text: "   " })).toBe(false)
    expect(isAnswered(q({ type: "short_text", options: [] }), { text: "merma" })).toBe(true)
    const f = q({ type: "fill_blank", prompt: "El {{1}} y el {{2}}" })
    expect(isAnswered(f, { blanks: { 1: "o1" } })).toBe(false)
    expect(isAnswered(f, { blanks: { 1: "o1", 2: "o2" } })).toBe(true)
  })
  it("unansweredCount cuenta las que faltan (acepta la forma antigua)", () => {
    const qs = [q({ id: "a" }), q({ id: "b", type: "multiple" })]
    expect(unansweredCount(qs, { a: "o1" })).toBe(1)
    expect(unansweredCount(qs, { a: { optionId: "o1" }, b: { optionIds: ["o2"] } })).toBe(0)
  })
  it("buildAnswerPayload envía solo lo contestado y con la forma del servidor", () => {
    expect(buildAnswerPayload({ a: "o1", b: { optionIds: ["x", "y"] }, c: { text: "hola" }, d: { blanks: { 1: "p", 2: "" } }, e: { optionIds: [] }, f: { text: "  " }, g: { blanks: {} } })).toEqual([
      { questionId: "a", optionId: "o1" },
      { questionId: "b", optionIds: ["x", "y"] },
      { questionId: "c", text: "hola" },
      { questionId: "d", blanks: [{ index: 1, optionId: "p" }] },
    ])
  })
  it("nunca incluye campos de calificación", () => {
    const json = JSON.stringify(buildAnswerPayload({ a: { optionId: "o1" } }))
    expect(json).not.toMatch(/correct|score|passed|userId/i)
  })
})

describe("huecos", () => {
  it("blankTokens y splitBlanks", () => {
    expect(blankTokens("{{2}} x {{1}}")).toEqual([1, 2])
    expect(splitBlanks("El {{1}} es {{2}}.")).toEqual([{ text: "El " }, { blank: 1 }, { text: " es " }, { blank: 2 }, { text: "." }])
    expect(splitBlanks("sin huecos")).toEqual([{ text: "sin huecos" }])
    // el enunciado nunca se interpreta como HTML: se devuelve como texto
    expect(splitBlanks("<b>{{1}}</b>")).toEqual([{ text: "<b>" }, { blank: 1 }, { text: "</b>" }])
  })
})

describe("validateQuestionDraft por tipo", () => {
  const base = { prompt: "¿?", explanation: "", points: 1 }
  const o = (text: string, isCorrect = false, blankIndex?: number) => ({ text, isCorrect, blankIndex })
  it("verdadero/falso, varias, corta y huecos", () => {
    expect(validateQuestionDraft({ ...base, type: "true_false", options: [o("Verdadero", true), o("Falso")] })).toBeNull()
    expect(validateQuestionDraft({ ...base, type: "true_false", options: [o("V"), o("F")] })).toMatch(/verdadera o falsa/)
    expect(validateQuestionDraft({ ...base, type: "multiple", options: [o("a", true), o("b", true), o("c")] })).toBeNull()
    expect(validateQuestionDraft({ ...base, type: "multiple", options: [o("a"), o("b")] })).toMatch(/al menos una/)
    expect(validateQuestionDraft({ ...base, type: "short_text", options: [o("merma", true)] })).toBeNull()
    expect(validateQuestionDraft({ ...base, type: "short_text", options: [o("a", true), o("b")] })).toMatch(/aceptadas/)
    expect(validateQuestionDraft({ ...base, prompt: "El {{1}} y {{2}}", type: "fill_blank", options: [o("x", true, 1), o("y", true, 2), o("z")] })).toBeNull()
    expect(validateQuestionDraft({ ...base, prompt: "El {{1}} y {{2}}", type: "fill_blank", options: [o("x", true, 1), o("z")] })).toMatch(/hueco \{\{2\}\}/)
    expect(validateQuestionDraft({ ...base, prompt: "Sin huecos", type: "fill_blank", options: [o("x", true, 1), o("z")] })).toMatch(/huecos/)
  })
})

describe("cliente: subida con progreso y endpoints nuevos", () => {
  const original = globalThis.fetch
  const originalXhr = (globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest
  afterEach(() => {
    globalThis.fetch = original
    ;(globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest = originalXhr
  })

  class FakeXhr {
    static last: FakeXhr
    method = ""
    url = ""
    headers: Record<string, string> = {}
    withCredentials = false
    status = 201
    responseText = JSON.stringify({ data: { id: "a1" } })
    upload: { onprogress?: (e: { lengthComputable: boolean; loaded: number; total: number }) => void } = {}
    onload?: () => void
    onerror?: () => void
    onabort?: () => void
    body: unknown
    constructor() {
      FakeXhr.last = this
    }
    open(m: string, u: string) { this.method = m; this.url = u }
    setRequestHeader(k: string, v: string) { this.headers[k] = v }
    send(b: unknown) {
      this.body = b
      this.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 })
      this.onload?.()
    }
  }

  it("sube el binario con credenciales, el MIME como Content-Type y notifica el progreso", async () => {
    ;(globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest = FakeXhr
    const seen: number[] = []
    const file = new Blob([new Uint8Array([1, 2])], { type: "video/mp4" })
    const r = await lms.admin.uploadAsset("L1", "video", file, (p) => seen.push(p))
    expect(r).toEqual({ id: "a1" })
    expect(seen).toEqual([50, 100])
    expect(FakeXhr.last.method).toBe("POST")
    expect(FakeXhr.last.url).toMatch(/\/api\/v1\/lms\/admin\/lessons\/L1\/assets\?kind=video$/)
    expect(FakeXhr.last.withCredentials).toBe(true)
    expect(FakeXhr.last.headers["Content-Type"]).toBe("video/mp4")
    expect(FakeXhr.last.body).toBe(file)
  })

  it("propaga el mensaje de error del servidor (415, 413…)", async () => {
    class Failing extends FakeXhr {
      status = 415
      responseText = JSON.stringify({ error: "Tipo de archivo no permitido para este recurso" })
    }
    ;(globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest = Failing
    await expect(uploadWithProgress("/x", new Blob(["a"], { type: "image/png" }), undefined, "PUT")).rejects.toThrow("Tipo de archivo no permitido")
  })

  it("las imágenes de preguntas usan PUT", async () => {
    ;(globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest = FakeXhr
    await lms.admin.setQuestionImage("Q1", new Blob(["x"], { type: "image/png" }))
    expect(FakeXhr.last.method).toBe("PUT")
    expect(FakeXhr.last.url).toMatch(/\/admin\/questions\/Q1\/image$/)
    await lms.admin.setOptionImage("O1", new Blob(["x"], { type: "image/png" }))
    expect(FakeXhr.last.url).toMatch(/\/admin\/options\/O1\/image$/)
  })

  function mock(body: unknown) {
    const calls: { url: string; init: RequestInit }[] = []
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url: String(url), init })
      return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })
    }) as typeof fetch
    return calls
  }

  it("matrícula masiva, estado, recordatorio y orden usan los métodos y rutas correctos", async () => {
    const calls = mock({ data: {} })
    await lms.admin.bulkEnroll("C1", ["u1", "u2"])
    expect(calls[0].url).toMatch(/\/admin\/courses\/C1\/enrollments\/bulk$/)
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ userIds: ["u1", "u2"] })
    await lms.admin.setEnrollmentStatus("C1", "E1", "revoked")
    expect(calls[1].init.method).toBe("PATCH")
    await lms.admin.remind("C1", "E1")
    expect(calls[2].url).toMatch(/\/enrollments\/E1\/remind$/)
    await lms.admin.reorderOutline("C1", [{ id: "m", lessonIds: ["l"] }])
    expect(calls[3].init.method).toBe("PUT")
    expect(JSON.parse(String(calls[3].init.body))).toEqual({ modules: [{ id: "m", lessonIds: ["l"] }] })
    await lms.admin.revokeCertificate("C1", "X1", "Emitido por error")
    expect(JSON.parse(String(calls[4].init.body))).toEqual({ reason: "Emitido por error" })
  })

  it("los parámetros de búsqueda se codifican", async () => {
    const calls = mock({ data: [], total: 0 })
    await lms.admin.students("C1", { q: "a&b=1 ñ", filter: "available" })
    expect(calls[0].url).toContain("q=a%26b%3D1+%C3%B1")
    await lms.admin.enrollments("C1", { q: "x y", status: "active" })
    expect(calls[1].url).toMatch(/status=active/)
    await lms.admin.questionBank("costo fijo&x")
    expect(calls[2].url).toContain("q=costo%20fijo%26x")
  })
})
