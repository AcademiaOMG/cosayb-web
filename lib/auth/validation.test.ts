import { describe, it, expect } from "vitest"
import {
  validateEmail, validatePassword, validateName, passwordStrength, authErrorMessage, normalizeEmail,
  PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, translateAuthError,
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

describe("authErrorMessage: cobertura de códigos de Better Auth", () => {
  it("traduce los códigos que el usuario puede encontrar (nunca deja inglés en pantalla)", () => {
    const codes = [
      "PASSWORD_TOO_LONG", "INVALID_EMAIL", "VALIDATION_ERROR", "USER_NOT_FOUND", "EMAIL_ALREADY_VERIFIED",
      "SESSION_EXPIRED", "SESSION_NOT_FRESH", "CREDENTIAL_ACCOUNT_NOT_FOUND", "INVALID_ORIGIN",
      "MISSING_OR_NULL_ORIGIN", "CROSS_SITE_NAVIGATION_LOGIN_BLOCKED", "INVALID_CALLBACK_URL", "TOKEN_EXPIRED",
      "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", "FAILED_TO_UNLINK_LAST_ACCOUNT",
    ]
    for (const code of codes) {
      // el mensaje en inglés del servidor no debe ganar a la traducción
      const out = authErrorMessage({ code, message: "Some english message from the server" })
      expect(out, code).not.toMatch(/english|server/i)
      expect(out.length, code).toBeGreaterThan(10)
    }
  })

  it("usa el límite real de longitud de la contraseña", () => {
    expect(authErrorMessage({ code: "PASSWORD_TOO_LONG" })).toContain(String(PASSWORD_MAX_LENGTH))
    expect(authErrorMessage({ code: "PASSWORD_TOO_SHORT" })).toContain(String(PASSWORD_MIN_LENGTH))
  })

  it("sin código, sigue reconociendo los mensajes en inglés más comunes", () => {
    expect(authErrorMessage({ message: "Invalid email or password" })).toMatch(/incorrectos/)
    expect(authErrorMessage({ message: "Token expired" })).toMatch(/venció/)
  })
})

describe("translateAuthError", () => {
  it("devuelve null cuando no hay traducción conocida (la pantalla usa su texto en español)", () => {
    expect(translateAuthError({ code: "ALGO_NUEVO", message: "Something new" })).toBeNull()
    expect(translateAuthError(null)).toBeNull()
  })
  it("traduce el límite de intentos del cambio de contraseña y la contraseña actual incorrecta", () => {
    expect(translateAuthError({ status: 429 })).toMatch(/Demasiados/)
    expect(translateAuthError({ code: "INVALID_PASSWORD" })).toMatch(/contraseña actual/)
  })
})

describe("translateAuthError: servidor lento o caído", () => {
  it("5xx del proxy y códigos de plazo muestran el aviso de servidor lento", () => {
    expect(translateAuthError({ status: 504 })).toMatch(/tardando más de lo normal/)
    expect(translateAuthError({ status: 503, code: "REQUEST_TIMEOUT" })).toMatch(/tardando más de lo normal/)
    expect(translateAuthError({ code: "AUTH_TIMEOUT" })).toMatch(/tardando más de lo normal/)
  })
  it("un 500 genérico no se confunde con servidor lento", () => {
    expect(translateAuthError({ status: 500 })).toBeNull()
  })
})
