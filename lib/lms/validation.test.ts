import { describe, expect, it } from "vitest"
import {
  UPLOAD_RULES, formatBytes, isValidCertificateCode, normalizeCertificateCode, progressPercent, slugify,
  safeDecode, unansweredCount, validateQuestionDraft, validateSlug, validateUpload,
} from "./validation"

describe("validateUpload", () => {
  it("acepta tipos y tamaños permitidos", () => {
    expect(validateUpload("video", { type: "video/mp4", size: 1024 })).toBeNull()
    expect(validateUpload("document", { type: "application/pdf", size: 1024 })).toBeNull()
    expect(validateUpload("subtitle", { type: "text/vtt", size: 10 })).toBeNull()
  })
  it("rechaza HTML, SVG, ejecutables y tipos cruzados", () => {
    for (const [kind, type] of [["video", "text/html"], ["thumbnail", "image/svg+xml"], ["document", "application/x-msdownload"], ["video", "application/pdf"], ["document", ""]] as const) {
      expect(validateUpload(kind, { type, size: 10 }), `${kind} ${type}`).toMatch(/Tipo no permitido/)
    }
  })
  it("rechaza vacío y exceso de tamaño", () => {
    expect(validateUpload("document", { type: "application/pdf", size: 0 })).toMatch(/vacío/)
    expect(validateUpload("document", { type: "application/pdf", size: UPLOAD_RULES.document.maxBytes + 1 })).toMatch(/máximo/)
  })
})

describe("slug", () => {
  it("normaliza acentos y símbolos", () => {
    expect(slugify("Costos de Alimentos y Bebidas — Módulo 1!")).toBe("costos-de-alimentos-y-bebidas-modulo-1")
    expect(slugify("  ñandú  ")).toBe("nandu")
    expect(slugify("x".repeat(200)).length).toBe(80)
  })
  it("valida el formato que exige el servidor", () => {
    expect(validateSlug("curso-uno")).toBeNull()
    expect(validateSlug("ab")).toMatch(/Mínimo/)
    expect(validateSlug("Curso Uno")).toMatch(/minúsculas/)
    expect(validateSlug("a--b")).toMatch(/minúsculas/)
    expect(validateSlug("' or 1=1 --")).not.toBeNull()
  })
})

describe("progreso y evaluación", () => {
  it("porcentaje acotado", () => {
    expect(progressPercent(1, 3)).toBe(33)
    expect(progressPercent(5, 3)).toBe(100)
    expect(progressPercent(0, 0)).toBe(0)
  })
  it("cuenta preguntas sin responder", () => {
    const qs = [{ id: "a", prompt: "", points: 1, options: [] }, { id: "b", prompt: "", points: 1, options: [] }]
    expect(unansweredCount(qs, { a: "x" })).toBe(1)
    expect(unansweredCount(qs, {})).toBe(2)
  })
  it("valida el borrador de pregunta (una correcta, 2–6 opciones)", () => {
    const ok = { prompt: "¿?", explanation: "", points: 1, options: [{ text: "a", isCorrect: true }, { text: "b", isCorrect: false }] }
    expect(validateQuestionDraft(ok)).toBeNull()
    expect(validateQuestionDraft({ ...ok, prompt: " " })).toMatch(/enunciado/)
    expect(validateQuestionDraft({ ...ok, options: [{ text: "a", isCorrect: true }] })).toMatch(/dos opciones/)
    expect(validateQuestionDraft({ ...ok, options: [{ text: "a", isCorrect: false }, { text: "b", isCorrect: false }] })).toMatch(/exactamente una/)
    expect(validateQuestionDraft({ ...ok, options: [{ text: "a", isCorrect: true }, { text: "b", isCorrect: true }] })).toMatch(/exactamente una/)
    expect(validateQuestionDraft({ ...ok, points: 0 })).toMatch(/puntos/)
  })
})

describe("código de certificado", () => {
  it("normaliza lo que escribe la persona", () => {
    expect(normalizeCertificateCode(" abcd efgh jkmn pqrs ")).toBe("ABCD-EFGH-JKMN-PQRS")
    expect(normalizeCertificateCode("abcdefghjkmnpqrs")).toBe("ABCD-EFGH-JKMN-PQRS")
    expect(isValidCertificateCode("ABCD-EFGH-JKMN-PQRS")).toBe(true)
  })
  it("rechaza formatos ajenos", () => {
    for (const bad of ["", "0000-0000-0000-0000", "<script>", "ABCD-EFGH-JKMN", "' OR 1=1 --"]) expect(isValidCertificateCode(normalizeCertificateCode(bad)), bad).toBe(false)
  })
})

describe("formatBytes", () => {
  it("formatea", () => {
    expect(formatBytes(500)).toBe("500 B")
    expect(formatBytes(2048)).toBe("2 KB")
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB")
  })
})

describe("safeDecode", () => {
  it("no lanza con secuencias % inválidas", () => {
    expect(safeDecode("ABCD%2DEFGH")).toBe("ABCD-EFGH")
    expect(safeDecode("%E0%A4%A")).toBe("%E0%A4%A")
    expect(safeDecode("%")).toBe("%")
  })
})
