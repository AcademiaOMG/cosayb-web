/** Validaciones puras de los formularios de autenticación (sin dependencias de UI). */

import { SERVER_BUSY_MESSAGE } from "./timeouts"

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

const REQUEST_REJECTED = "No pudimos validar esta solicitud desde este sitio. Recarga la página e inténtalo de nuevo."
const REAUTH = "Por seguridad, vuelve a iniciar sesión para hacer este cambio."

/** Código de Better Auth → mensaje claro en español (los que una persona puede encontrar de verdad). */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Correo o contraseña incorrectos.",
  EMAIL_NOT_VERIFIED: "Debes verificar tu correo antes de ingresar. Revisa tu bandeja de entrada.",
  USER_ALREADY_EXISTS: "Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Ya existe una cuenta con ese correo. Usa otro correo.",
  INVALID_TOKEN: "El enlace no es válido o ya venció. Solicita uno nuevo.",
  TOKEN_EXPIRED: "El enlace no es válido o ya venció. Solicita uno nuevo.",
  INVALID_PASSWORD: "La contraseña actual no es correcta.",
  PASSWORD_TOO_SHORT: `Usa al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
  PASSWORD_TOO_LONG: `Usa como máximo ${PASSWORD_MAX_LENGTH} caracteres.`,
  INVALID_EMAIL: "Ingresa un correo válido.",
  VALIDATION_ERROR: "Revisa los datos ingresados e inténtalo de nuevo.",
  USER_NOT_FOUND: "No encontramos una cuenta con ese correo.",
  USER_EMAIL_NOT_FOUND: "No encontramos una cuenta con ese correo.",
  EMAIL_ALREADY_VERIFIED: "Tu correo ya está verificado. Inicia sesión.",
  SESSION_EXPIRED: REAUTH,
  SESSION_NOT_FRESH: REAUTH,
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Tu cuenta no tiene contraseña (entras con Google). Define una desde recuperar contraseña.",
  PASSWORD_ALREADY_SET: "Tu cuenta ya tiene una contraseña.",
  USER_ALREADY_HAS_PASSWORD: "Tu cuenta ya tiene una contraseña.",
  FAILED_TO_UNLINK_LAST_ACCOUNT: "No puedes desvincular tu único método de acceso.",
  EMAIL_CAN_NOT_BE_UPDATED: "No se puede cambiar el correo de esta cuenta.",
  CHANGE_EMAIL_DISABLED: "El cambio de correo no está disponible.",
  INVALID_ORIGIN: REQUEST_REJECTED,
  MISSING_OR_NULL_ORIGIN: REQUEST_REJECTED,
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED: REQUEST_REJECTED,
  INVALID_CALLBACK_URL: REQUEST_REJECTED,
  INVALID_REDIRECT_URL: REQUEST_REJECTED,
}

type AuthError = { code?: string; message?: string; status?: number } | null | undefined

/** Traducción conocida del error, o `null` si no la hay (para pantallas que prefieren su propio texto genérico en español). */
export function translateAuthError(err: AuthError): string | null {
  const code = (err?.code ?? "").toUpperCase()
  const msg = (err?.message ?? "").toLowerCase()
  if (AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code]
  // Respaldo por texto, por si el servidor no envía el código
  if (msg.includes("invalid email or password")) return AUTH_ERROR_MESSAGES.INVALID_EMAIL_OR_PASSWORD
  if (msg.includes("not verified")) return AUTH_ERROR_MESSAGES.EMAIL_NOT_VERIFIED
  if (msg.includes("already exists")) return AUTH_ERROR_MESSAGES.USER_ALREADY_EXISTS
  if (msg.includes("invalid token") || msg.includes("expired")) return AUTH_ERROR_MESSAGES.INVALID_TOKEN
  if (msg.includes("invalid password")) return AUTH_ERROR_MESSAGES.INVALID_PASSWORD
  if (err?.status === 429 || msg.includes("too many")) {
    return "Demasiados intentos. Espera un momento e inténtalo de nuevo."
  }
  if ((err?.status ?? 0) >= 502 || code === "AUTH_TIMEOUT" || code === "REQUEST_TIMEOUT") {
    return SERVER_BUSY_MESSAGE
  }
  if (err?.status === 404 || code === "NOT_FOUND") {
    return "Esta función aún no está disponible en el servidor."
  }
  return null
}

/** Traduce los códigos/mensajes habituales de Better Auth a español claro. */
export function authErrorMessage(err: AuthError): string {
  return translateAuthError(err) ?? (err?.message?.trim() || "No pudimos completar la operación. Inténtalo de nuevo.")
}
