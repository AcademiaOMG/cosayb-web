import { describe, expect, it } from "vitest"
import { dateRangeError, filterAudit, relativeTime, resolveTargetName, type AuditRow } from "./auditView"

const row = (over: Partial<AuditRow>): AuditRow => ({
  id: "1", actorUserId: "u1", action: "security.login", resourceType: "session", resourceId: null,
  organizationId: null, createdAt: "2026-03-05T12:00:00", ...over,
})

describe("relativeTime", () => {
  const now = new Date("2026-03-05T12:00:00")
  it("expresa el paso del tiempo en español", () => {
    expect(relativeTime("2026-03-05T11:59:40", now)).toBe("hace unos segundos")
    expect(relativeTime("2026-03-05T11:55:00", now)).toBe("hace 5 minutos")
    expect(relativeTime("2026-03-05T09:00:00", now)).toBe("hace 3 horas")
    expect(relativeTime("2026-03-03T12:00:00", now)).toBe("anteayer")
    expect(relativeTime("2026-01-05T12:00:00", now)).toBe("hace 2 meses")
  })
  it("fecha inválida no rompe", () => {
    expect(relativeTime("nada", now)).toBe("")
  })
})

describe("filterAudit", () => {
  const rows = [
    row({ id: "a", action: "security.login", createdAt: "2026-03-01T08:00:00" }),
    row({ id: "b", action: "billing.subscription.cancel", createdAt: "2026-03-05T23:30:00" }),
    row({ id: "c", action: "billing.subscription.cancel", createdAt: "2026-03-06T00:10:00" }),
  ]
  it("filtra por acción", () => {
    expect(filterAudit(rows, { action: "billing.subscription.cancel" }).map((r) => r.id)).toEqual(["b", "c"])
  })
  it("el rango incluye el día completo en ambos extremos", () => {
    expect(filterAudit(rows, { from: "2026-03-05", to: "2026-03-05" }).map((r) => r.id)).toEqual(["b"])
    expect(filterAudit(rows, { from: "2026-03-05" }).map((r) => r.id)).toEqual(["b", "c"])
    expect(filterAudit(rows, { to: "2026-03-01" }).map((r) => r.id)).toEqual(["a"])
  })
  it("sin filtros devuelve todo", () => {
    expect(filterAudit(rows, {})).toHaveLength(3)
  })
  it("detecta un rango invertido", () => {
    expect(dateRangeError("2026-03-06", "2026-03-05")).not.toBeNull()
    expect(dateRangeError("2026-03-05", "2026-03-05")).toBeNull()
    expect(dateRangeError("2026-03-05", undefined)).toBeNull()
  })
})

describe("resolveTargetName", () => {
  const users = { u9: "Luis Gómez" }
  const orgs = { o1: "Panadería La Esquina" }
  it("usuario afectado", () => {
    expect(resolveTargetName({ resourceType: "platform_users", resourceId: "u9", organizationId: null }, users, orgs)).toBe("Luis Gómez")
  })
  it("negocio por organizationId o por resourceId", () => {
    expect(resolveTargetName({ resourceType: "subscription", resourceId: "s1", organizationId: "o1" }, users, orgs)).toBe("Panadería La Esquina")
    expect(resolveTargetName({ resourceType: "organization", resourceId: "o1", organizationId: null }, users, orgs)).toBe("Panadería La Esquina")
  })
  it("desconocido → null", () => {
    expect(resolveTargetName({ resourceType: "session", resourceId: "x", organizationId: null }, users, orgs)).toBeNull()
  })
})
