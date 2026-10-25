import { describe, it, expect } from "vitest"
import {
  AuthRequestError,
  RequestTimeoutError,
  SERVER_BUSY_MESSAGE,
  authFailureMessage,
  fetchWithTimeout,
} from "./timeouts"

describe("fetchWithTimeout", () => {
  it("devuelve la respuesta si llega a tiempo", async () => {
    const ok = (async () => new Response("{}", { status: 200 })) as typeof fetch
    const res = await fetchWithTimeout(ok, "http://x", {}, 100)
    expect(res.status).toBe(200)
  })

  it("lanza RequestTimeoutError y aborta si el servidor no responde", async () => {
    let aborted = false
    const hang = ((_u: string, init?: RequestInit) =>
      new Promise((_res, rej) => {
        init?.signal?.addEventListener("abort", () => {
          aborted = true
          rej(new DOMException("aborted", "AbortError"))
        })
      })) as typeof fetch
    await expect(fetchWithTimeout(hang, "http://x", {}, 20)).rejects.toBeInstanceOf(RequestTimeoutError)
    expect(aborted).toBe(true)
  })

  it("no oculta otros errores de red", async () => {
    const boom = (async () => {
      throw new TypeError("network")
    }) as typeof fetch
    await expect(fetchWithTimeout(boom, "http://x", {}, 100)).rejects.toBeInstanceOf(TypeError)
  })
})

describe("authFailureMessage", () => {
  it("plazo vencido y 5xx muestran el aviso de servidor lento", () => {
    expect(authFailureMessage(new RequestTimeoutError(5), "x")).toBe(SERVER_BUSY_MESSAGE)
    expect(authFailureMessage(new AuthRequestError(504), "x")).toBe(SERVER_BUSY_MESSAGE)
    expect(authFailureMessage(new DOMException("t", "TimeoutError"), "x")).toBe(SERVER_BUSY_MESSAGE)
  })
  it("un 4xx o un fallo de red conserva el texto por defecto", () => {
    expect(authFailureMessage(new AuthRequestError(400), "por defecto")).toBe("por defecto")
    expect(authFailureMessage(new TypeError("net"), "por defecto")).toBe("por defecto")
  })
})
