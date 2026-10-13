import { describe, it, expect } from "vitest"
import { confirmDialog, settleConfirm, getActiveConfirm } from "./confirm"

describe("confirmDialog", () => {
  it("resuelve true al confirmar y false al cancelar", async () => {
    const p1 = confirmDialog({ title: "Eliminar receta", variant: "danger" })
    expect(getActiveConfirm()?.title).toBe("Eliminar receta")
    settleConfirm(true)
    expect(await p1).toBe(true)
    const p2 = confirmDialog({ title: "Otra" })
    settleConfirm(false)
    expect(await p2).toBe(false)
    expect(getActiveConfirm()).toBeNull()
  })

  it("encola solicitudes simultáneas en orden", async () => {
    const a = confirmDialog({ title: "A" })
    const b = confirmDialog({ title: "B" })
    expect(getActiveConfirm()?.title).toBe("A")
    settleConfirm(true)
    expect(getActiveConfirm()?.title).toBe("B")
    settleConfirm(false)
    expect([await a, await b]).toEqual([true, false])
  })
})
