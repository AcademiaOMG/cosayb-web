import { describe, it, expect } from "vitest"
import { deltaText, monthDelta, roleOf, validateNewUser } from "./academia"
import { visibleGroups, breadcrumbsFor, sectionForPath } from "./nav"
import { authErrorMessage } from "@/lib/auth/validation"
import { NAV_GROUPS as APP_NAV } from "@/lib/navigation"

const hrefs = (roles: string[]) => visibleGroups(roles).flatMap((g) => g.items.map((i) => i.href))
const u = (roles: ("lms_instructor" | "lms_admin")[], platformAdmin = false) => ({ roles, platformAdmin })

describe("rol de una persona de la academia", () => {
  it("administrador > instructor > estudiante", () => {
    expect(roleOf(u([]))).toBe("student")
    expect(roleOf(u(["lms_instructor"]))).toBe("instructor")
    expect(roleOf(u(["lms_instructor", "lms_admin"]))).toBe("admin")
    expect(roleOf(u([], true))).toBe("admin") // el equipo de plataforma administra la academia
  })
})

describe("variación mensual", () => {
  it("calcula el porcentaje y no inventa datos sin base", () => {
    expect(monthDelta(15, 10)).toBe(50)
    expect(monthDelta(5, 10)).toBe(-50)
    expect(monthDelta(0, 0)).toBe(0)
    expect(monthDelta(4, 0)).toBeNull()
  })
  it("lo dice en español", () => {
    expect(deltaText(50)).toBe("+50 % frente al mes anterior")
    expect(deltaText(-20)).toBe("-20 % frente al mes anterior")
    expect(deltaText(0)).toBe("Igual que el mes anterior")
    expect(deltaText(null)).toMatch(/Sin mes anterior/)
  })
})

describe("alta de usuarios: validación del formulario", () => {
  it("acepta datos correctos", () => {
    expect(validateNewUser({ name: "Ana Pérez", email: "ana@correo.co", role: "student" })).toEqual({})
  })
  it("señala cada campo inválido", () => {
    const e = validateNewUser({ name: "A", email: "no-es-correo", role: "root" })
    expect(Object.keys(e).sort()).toEqual(["email", "name", "role"])
    expect(validateNewUser({ name: "Ana", email: "", role: "student" }).email).toMatch(/correo/)
    expect(validateNewUser({ name: "x".repeat(101), email: "a@b.co", role: "admin" }).name).toMatch(/100/)
  })
})

describe("la academia en la consola de plataforma", () => {
  it("la ven el propietario, administración, auditoría y solo lectura; no soporte ni chef", () => {
    for (const r of ["platform_owner", "platform_admin", "platform_readonly"]) expect(hrefs([r])).toContain("/plataforma/academia")
    for (const r of ["platform_support", "platform_chef", "platform_billing"]) expect(hrefs([r])).not.toContain("/plataforma/academia")
  })
  it("migas de pan y sección activa de la pestaña de usuarios", () => {
    expect(sectionForPath("/plataforma/academia/usuarios")?.href).toBe("/plataforma/academia")
    expect(breadcrumbsFor("/plataforma/academia/usuarios").map((c) => c.label)).toEqual(["Plataforma", "Academia", "Academia", "Usuarios"])
  })
})

describe("CO$AYB ↔ LMS en la app del negocio", () => {
  it("el menú del negocio tiene la entrada «Cursos / Academia» visible para todo miembro", () => {
    const item = APP_NAV.flatMap((g) => g.items).find((i) => i.href === "/academia")
    expect(item).toBeDefined()
    expect(item).toMatchObject({ label: "Cursos / Academia", resource: "organization", action: "read" })
    expect(item?.feature).toBeUndefined() // no depende del plan: sin plan muestra el catálogo y la invitación
  })
})

describe("inicio de sesión de una cuenta desactivada", () => {
  it("muestra un mensaje comprensible por código", () => {
    expect(authErrorMessage({ code: "LMS_ACCOUNT_DISABLED", message: "x" })).toMatch(/desactivado/)
  })
})
