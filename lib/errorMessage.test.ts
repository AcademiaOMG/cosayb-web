import { describe, it, expect } from "vitest"
import { friendlyError, NETWORK_ERROR_MESSAGE } from "./errorMessage"

describe("friendlyError", () => {
  it("muestra tal cual los mensajes del API en español (p. ej. 409 en uso)", () => {
    const msg = "No se puede eliminar: el ingrediente está en uso en 3 recetas."
    expect(friendlyError(new Error(msg), "fallback")).toBe(msg)
  })
  it("traduce fallos de red", () => {
    expect(friendlyError(new TypeError("Failed to fetch"), "fallback")).toBe(NETWORK_ERROR_MESSAGE)
    expect(friendlyError(new Error("NetworkError when attempting to fetch resource."), "x")).toBe(NETWORK_ERROR_MESSAGE)
  })
  it("sustituye mensajes técnicos por el fallback", () => {
    expect(friendlyError(new Error("Internal Server Error"), "fb")).toBe("fb")
    expect(friendlyError(new Error("Unexpected token < in JSON at position 0"), "fb")).toBe("fb")
    expect(friendlyError(new Error("HTTP 500"), "fb")).toBe("fb")
  })
  it("usa el fallback si no hay mensaje", () => {
    expect(friendlyError(new Error(""), "fb")).toBe("fb")
    expect(friendlyError(null, "fb")).toBe("fb")
    expect(friendlyError(undefined, "fb")).toBe("fb")
  })
  it("acepta strings", () => {
    expect(friendlyError("Ya existe un menú con ese nombre", "fb")).toBe("Ya existe un menú con ese nombre")
  })
})
