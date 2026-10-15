import { describe, it, expect } from "vitest"
import {
  validateEmail, validatePassword, validateName, passwordStrength, authErrorMessage, normalizeEmail,
} from "./validation"

describe("validateEmail", () => {
  it("acepta correos válidos y normaliza", () => {
    expect(validateEmail("  Ana@Correo.CO ")).toBeNull()
    expect(normalizeEmail("  Ana@Correo.CO ")).toBe("ana@correo.co")
  })
  it("rechaza vacío y malformado", () => {
    expect(validateEmail("")).toMatch(/Ingresa tu correo/)
    expect(validateEmail("ana@")).toMatch(/válido/)
    expect(validateEmail("ana correo@x.co")).toMatch(/válido/)
  })
})

describe("validatePassword", () => {
  it("exige longitud y mezcla", () => {
    expect(validatePassword("")).toBeTruthy()
    expect(validatePassword("abc12")).toMatch(/al menos 10/)
    expect(validatePassword("abcdefghij")).toMatch(/letras y números/)
    expect(validatePassword("1234567890")).toMatch(/letras y números/)
    expect(validatePassword("abcdefg1234")).toBeNull()
    expect(validatePassword("a1".repeat(70))).toMatch(/máximo/)
  })
})

describe("validateName", () => {
  it("requiere 2+ caracteres", () => {
    expect(validateName(" a ")).toBeTruthy()
    expect(validateName("Ana")).toBeNull()
  })
})

describe("passwordStrength", () => {
  it("escala de 0 a 3", () => {
    expect(passwordStrength("").score).toBe(0)
    expect(passwordStrength("abc").score).toBe(0)
    expect(passwordStrength("abcdefg1234").score).toBeLessThanOrEqual(1)
    expect(passwordStrength("Abcdefgh1234!").score).toBe(3)
  })
})

describe("authErrorMessage", () => {
  it("traduce códigos conocidos", () => {
    expect(authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toMatch(/incorrectos/)
    expect(authErrorMessage({ code: "EMAIL_NOT_VERIFIED" })).toMatch(/verificar/)
    expect(authErrorMessage({ code: "USER_ALREADY_EXISTS" })).toMatch(/Ya existe/)
    expect(authErrorMessage({ status: 429 })).toMatch(/Demasiados/)
    expect(authErrorMessage({ status: 404 })).toMatch(/no está disponible/)
  })
  it("usa el mensaje o un genérico", () => {
    expect(authErrorMessage({ message: "Algo raro" })).toBe("Algo raro")
    expect(authErrorMessage(null)).toMatch(/No pudimos/)
  })
})
