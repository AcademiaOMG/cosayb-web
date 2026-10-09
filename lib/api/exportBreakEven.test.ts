import { describe, it, expect, vi, afterEach } from "vitest"
import { exportBreakEvenExcel } from "./index"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("exportBreakEvenExcel", () => {
  it("propaga el mensaje real del API cuando la exportación falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () =>
          JSON.stringify({
            error: "Membresía insuficiente",
            code: "FEATURE_NOT_AVAILABLE",
            message: "Tu membresía actual (free) no incluye esta función.",
          }),
      })
    )

    await expect(exportBreakEvenExcel()).rejects.toThrow(
      "Tu membresía actual (free) no incluye esta función."
    )
  })

  it("devuelve el blob cuando el API responde bien", async () => {
    const blob = new Blob([new Uint8Array([0x50, 0x4b])])
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => blob,
      })
    )

    await expect(exportBreakEvenExcel()).resolves.toBe(blob)
  })
})
