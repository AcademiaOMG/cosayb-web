import { describe, it, expect } from "vitest"
import { FAQ, FAQ_CATEGORIES, filterFaq, normalizeText } from "./faq"
import { hasErrors, validateTicket } from "@/lib/saas/support"

describe("filterFaq", () => {
  it("devuelve todo sin filtros", () => {
    expect(filterFaq("")).toHaveLength(FAQ.length)
  })

  it("ignora tildes y mayúsculas", () => {
    expect(normalizeText("  Contraseña ÚNICA ")).toBe("contrasena unica")
    expect(filterFaq("CONTRASENA").some((e) => e.id === "olvide-clave")).toBe(true)
  })

  it("exige todas las palabras", () => {
    const r = filterFaq("cancelo suscripcion")
    expect(r.map((e) => e.id)).toContain("cancelar")
    expect(filterFaq("cancelo zzzzz")).toHaveLength(0)
  })

  it("filtra por categoría", () => {
    const r = filterFaq("", "planes")
    expect(r.length).toBeGreaterThan(3)
    expect(r.every((e) => e.category === "planes")).toBe(true)
  })

  it("todas las entradas pertenecen a una categoría válida y los ids son únicos", () => {
    const cats = new Set(FAQ_CATEGORIES.map((c) => c.id))
    expect(FAQ.every((e) => cats.has(e.category))).toBe(true)
    expect(new Set(FAQ.map((e) => e.id)).size).toBe(FAQ.length)
  })
})

describe("validateTicket", () => {
  const ok = { name: "Ana", email: "ana@x.co", category: "tecnico" as const, subject: "No carga", message: "La pantalla queda en blanco." }

  it("acepta un ticket completo", () => {
    expect(hasErrors(validateTicket(ok, true))).toBe(false)
  })

  it("reporta cada campo inválido", () => {
    const e = validateTicket({ name: "", email: "x", category: undefined, subject: "a", message: "corto" }, false)
    expect(Object.keys(e).sort()).toEqual(["category", "consent", "email", "message", "name", "subject"])
  })

  it("limita asunto y mensaje", () => {
    expect(validateTicket({ ...ok, subject: "a".repeat(121) }, true).subject).toMatch(/Máximo/)
    expect(validateTicket({ ...ok, message: "a".repeat(4001) }, true).message).toMatch(/Máximo/)
  })
})
