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
    expect(validatePassword("abc123")).toMatch(/al menos 8/)
    expect(validatePassword("abcdefgh")).toMatch(/letras y números/)
    expect(validatePassword("12345678")).toMatch(/letras y números/)
    expect(validatePassword("abcd1234")).toBeNull()
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
    expect(passwordStrength("abcd1234").score).toBeLessThanOrEqual(1)
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
