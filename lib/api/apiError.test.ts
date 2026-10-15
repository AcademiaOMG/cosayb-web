import { afterEach, describe, expect, it } from "vitest"
import { ApiError, fetchAPI, isPlanLimitError } from "./index"

const original = globalThis.fetch
afterEach(() => {
  globalThis.fetch = original
})

function respond(status: number, body: unknown) {
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })) as typeof fetch
}

describe("fetchAPI: errores del API", () => {
  it("límite de membresía: mensaje con el detalle y la salida, y se reconoce como error de plan", async () => {
    respond(429, {
      error: "Límite de membresía alcanzado",
      code: "MEMBERSHIP_LIMIT_REACHED",
      message: "Tu membresía (free) permite un máximo de 20. Actualmente tienes 20.",
      feature: "max_recipes",
      limit: 20,
    })
    const err = await fetchAPI("/api/v1/recipes", { method: "POST" }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(isPlanLimitError(err)).toBe(true)
    expect((err as ApiError).status).toBe(429)
    expect((err as ApiError).message).toBe("Tu membresía (free) permite un máximo de 20. Actualmente tienes 20. Mejora tu plan para continuar.")
  })

  it("función fuera del plan (403) también se trata como error de plan", async () => {
    respond(403, { error: "Membresía insuficiente", code: "FEATURE_NOT_AVAILABLE", message: "Tu membresía actual (free) no incluye esta función." })
    const err = await fetchAPI("/api/v1/exports").catch((e: unknown) => e)
    expect(isPlanLimitError(err)).toBe(true)
    expect((err as Error).message).toContain("no incluye esta función")
  })

  it("otros errores conservan su mensaje y no son de plan", async () => {
    respond(400, { error: "Datos inválidos", details: { fieldErrors: { name: ["Requerido"] } } })
    const err = await fetchAPI("/api/v1/ingredients", { method: "POST" }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(isPlanLimitError(err)).toBe(false)
    expect((err as Error).message).toBe("Datos inválidos — name: Requerido")
    respond(403, { error: "Sin permisos de plataforma", required: "read:platform_metrics" })
    const e2 = await fetchAPI("/x").catch((e: unknown) => e)
    expect(isPlanLimitError(e2)).toBe(false)
  })
})

describe("fetchAPI: conflictos 409", () => {
  it("muestra el detalle accionable en vez del título", async () => {
    respond(409, {
      error: "Receta en uso en menús",
      code: "RECIPE_IN_MENU",
      message: "Esta receta está en el menú: Menú Boda. Quítala de él antes de eliminarla.",
    })
    const err = await fetchAPI("/api/v1/recipes/1", { method: "DELETE" }).catch((e: unknown) => e)
    expect((err as ApiError).status).toBe(409)
    expect((err as ApiError).code).toBe("RECIPE_IN_MENU")
    expect((err as Error).message).toBe("Esta receta está en el menú: Menú Boda. Quítala de él antes de eliminarla.")
  })

  it("un 409 sin detalle conserva el título", async () => {
    respond(409, { error: "Ya existe" })
    const err = await fetchAPI("/x", { method: "POST" }).catch((e: unknown) => e)
    expect((err as Error).message).toBe("Ya existe")
  })
})
