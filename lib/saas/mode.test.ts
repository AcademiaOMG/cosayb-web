import { describe, expect, it } from "vitest"
import { resolveSaasMode } from "./mode"

describe("resolveSaasMode", () => {
  it("respeta el valor explícito en cualquier entorno", () => {
    expect(resolveSaasMode("real", "development")).toBe("real")
    expect(resolveSaasMode("mock", "production")).toBe("mock")
  })
  it("sin variable: desarrollo usa mock y producción usa el API real", () => {
    expect(resolveSaasMode(undefined, "development")).toBe("mock")
    expect(resolveSaasMode(undefined, "test")).toBe("mock")
    expect(resolveSaasMode(undefined, "production")).toBe("real")
  })
  it("un valor desconocido se trata como ausente", () => {
    expect(resolveSaasMode("REAL ", "production")).toBe("real")
    expect(resolveSaasMode("", "development")).toBe("mock")
  })
})
