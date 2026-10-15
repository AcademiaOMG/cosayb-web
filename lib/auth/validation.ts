/** Validaciones puras de los formularios de autenticación (sin dependencias de UI). */

export const PASSWORD_MIN_LENGTH = 10
export const PASSWORD_MAX_LENGTH = 128

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase()
}

/** Devuelve el mensaje de error o `null` si el correo es válido. */
export function validateEmail(raw: string): string | null {
  const v = normalizeEmail(raw)
  if (!v) return "Ingresa tu correo."
  if (!EMAIL_RE.test(v)) return "Ingresa un correo válido."
  return null
}

/** Reglas: 10–128 caracteres, con al menos una letra y un número. */
export function validatePassword(pw: string): string | null {
  if (!pw) return "Ingresa una contraseña."
  if (pw.length < PASSWORD_MIN_LENGTH) return `Usa al menos ${PASSWORD_MIN_LENGTH} caracteres.`
  if (pw.length > PASSWORD_MAX_LENGTH) return `Usa máximo ${PASSWORD_MAX_LENGTH} caracteres.`
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Combina letras y números."
  return null
}

export function validateName(raw: string): string | null {
  const v = raw.trim()
  if (v.length < 2) return "Ingresa tu nombre."
  if (v.length > 80) return "El nombre es demasiado largo."
  return null
}

export type PasswordStrength = { score: 0 | 1 | 2 | 3; label: "Muy débil" | "Débil" | "Buena" | "Fuerte" }

/** Indicador orientativo (no sustituye a validatePassword). */
export function passwordStrength(pw: string): PasswordStrength {
  if (!pw) return { score: 0, label: "Muy débil" }
  let points = 0
  if (pw.length >= PASSWORD_MIN_LENGTH) points++
  if (pw.length >= 12) points++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) points++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) points++
  if (points <= 1) return { score: 0, label: "Muy débil" }
  if (points === 2) return { score: 1, label: "Débil" }
  if (points === 3) return { score: 2, label: "Buena" }
  return { score: 3, label: "Fuerte" }
}

/** Traduce los códigos/mensajes habituales de Better Auth a español claro. */
export function authErrorMessage(err: { code?: string; message?: string; status?: number } | null | undefined): string {
  const code = (err?.code ?? "").toUpperCase()
  const msg = (err?.message ?? "").toLowerCase()
  if (code === "INVALID_EMAIL_OR_PASSWORD" || msg.includes("invalid email or password")) {
    return "Correo o contraseña incorrectos."
  }
  if (code === "EMAIL_NOT_VERIFIED" || msg.includes("not verified")) {
    return "Debes verificar tu correo antes de ingresar. Revisa tu bandeja de entrada."
  }
  if (code === "USER_ALREADY_EXISTS" || msg.includes("already exists")) {
    return "Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña."
  }
  if (code === "INVALID_TOKEN" || msg.includes("invalid token") || msg.includes("expired")) {
    return "El enlace no es válido o ya venció. Solicita uno nuevo."
  }
  if (code === "INVALID_PASSWORD" || msg.includes("invalid password")) {
    return "La contraseña actual no es correcta."
  }
  if (code === "PASSWORD_TOO_SHORT") return `Usa al menos ${PASSWORD_MIN_LENGTH} caracteres.`
  if (err?.status === 429 || msg.includes("too many")) {
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo."
  }
  if (err?.status === 404 || code === "NOT_FOUND") {
    return "Esta función aún no está disponible en el servidor."
  }
  return err?.message?.trim() || "No pudimos completar la operación. Inténtalo de nuevo."
}
