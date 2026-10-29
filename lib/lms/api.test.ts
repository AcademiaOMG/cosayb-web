import { afterEach, describe, expect, it } from "vitest"
import { lms } from "./api"

const original = globalThis.fetch
afterEach(() => {
  globalThis.fetch = original
})

interface Call {
  url: string
  init: RequestInit
}

function mock(status: number, body: unknown): Call[] {
  const calls: Call[] = []
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url: String(url), init })
    return new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
  }) as typeof fetch
  return calls
}

describe("cliente del LMS", () => {
  it("envía credenciales (cookie de sesión) y nunca cabeceras de secretos", async () => {
    const calls = mock(200, { data: [] })
    await lms.myCourses()
    expect(calls[0].init.credentials).toBe("include")
    const headers = JSON.stringify(calls[0].init.headers)
    expect(headers).not.toMatch(/authorization|apikey|service|secret/i)
  })

  it("codifica los parámetros de ruta (no permite inyectar segmentos)", async () => {
    const calls = mock(200, { data: {} })
    await lms.course("../../admin/courses?x=1#")
    expect(calls[0].url).toContain("/api/v1/lms/courses/..%2F..%2Fadmin%2Fcourses%3Fx%3D1%23")
    await lms.lesson("a/b")
    expect(calls[1].url).toContain("/lessons/a%2Fb")
  })

  it("la URL del recurso se pide por POST al endpoint autorizado", async () => {
    const calls = mock(200, { data: { url: "http://x/media/t", expiresIn: 300, mime: "video/mp4", assetKind: "video" } })
    const a = await lms.assetAccess("L1", "A1")
    expect(calls[0].url).toMatch(/\/api\/v1\/lms\/lessons\/L1\/assets\/A1\/access$/)
    expect(calls[0].init.method).toBe("POST")
    expect(a.expiresIn).toBe(300)
  })

  it("enviar intento: solo ids de pregunta y opción, nada de nota ni usuario", async () => {
    const calls = mock(200, { data: {} })
    await lms.submitAttempt("T1", { q1: "o1", q2: "o2" })
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      answers: [{ questionId: "q1", optionId: "o1" }, { questionId: "q2", optionId: "o2" }],
    })
  })

  it("verificar certificado: 404 se interpreta como no válido, otros errores se propagan", async () => {
    mock(404, { valid: false })
    expect(await lms.verifyCertificate("AAAA-BBBB-CCCC-DDDD")).toBeNull()
    mock(500, { error: "boom" })
    await expect(lms.verifyCertificate("AAAA-BBBB-CCCC-DDDD")).rejects.toThrow()
    const calls = mock(200, { valid: true, data: { recipientName: "Ana", courseTitle: "C", issuedAt: "2026-01-01T00:00:00Z" } })
    expect((await lms.verifyCertificate("AAAA-BBBB-CCCC-DDDD"))?.recipientName).toBe("Ana")
    expect(calls[0].init.method ?? "GET").toBe("GET")
  })

  it("subida del instructor: binario crudo con el MIME como Content-Type y kind en la query", async () => {
    const calls = mock(201, { data: { id: "a1" } })
    const file = new Blob([new Uint8Array([1, 2, 3])], { type: "video/mp4" })
    await lms.admin.uploadAsset("L1", "video", file)
    expect(calls[0].url).toMatch(/\/api\/v1\/lms\/admin\/lessons\/L1\/assets\?kind=video$/)
    expect(calls[0].init.method).toBe("POST")
    expect((calls[0].init.headers as Record<string, string>)["Content-Type"]).toBe("video/mp4")
    expect(calls[0].init.body).toBe(file)
  })

  it("borrados con respuesta 204 no se tratan como error", async () => {
    mock(204, null)
    await expect(lms.admin.deleteLesson("L1")).resolves.toBeUndefined()
    await expect(lms.admin.revoke("C1", "E1")).resolves.toBeUndefined()
  })

  it("los mensajes de error del API se conservan", async () => {
    mock(403, { error: "No tienes acceso a esta lección", code: "NOT_ENROLLED" })
    await expect(lms.lesson("L1")).rejects.toMatchObject({ status: 403, code: "NOT_ENROLLED", message: "No tienes acceso a esta lección" })
  })
})
