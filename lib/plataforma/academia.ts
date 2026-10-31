// Consola de plataforma · Academia (LMS). Tipos del API (/api/v1/platform/academia/*), llamadas y lógica PURA
// (etiquetas, contraseña temporal, variación mensual). Sin React. Aquí solo se LEE el LMS y se crean usuarios;
// la gestión de cursos vive en el LMS (/administracion).

import { json, qs, saasData } from "@/lib/saas/real"
import type { ManageOverview, ManageUser, OverviewCourse, Paged } from "@/lib/lms/types"

const API = "/api/v1/platform/academia"

export interface AcademiaPeople {
  students: number
  instructors: number
  admins: number
  disabled: number
  academiaOrganizations: number
}

export interface AcademiaOverview extends ManageOverview {
  topCourses: OverviewCourse[]
  people: AcademiaPeople
}

export type AcademiaRole = "student" | "instructor" | "admin"

export interface CreatedAcademiaUser {
  userId: string
  email: string
  name: string
  role: AcademiaRole
  /** Se muestra UNA sola vez: el servidor no la guarda en claro. */
  temporaryPassword: string
  emailSent: boolean
}

export const academiaApi = {
  overview: () => saasData<AcademiaOverview>(`${API}/overview`),
  users: (o: { q?: string; role?: string; status?: string; limit?: number; offset?: number } = {}) =>
    saasData<Paged<ManageUser>>(`${API}/users${qs({ limit: 25, ...o })}`),
  createUser: (body: { name: string; email: string; role: AcademiaRole; sendSetPasswordEmail: boolean }) =>
    saasData<CreatedAcademiaUser>(`${API}/users`, json(body)),
}

// ── Lógica pura ──────────────────────────────────────────────────────────────

export const ROLE_LABEL: Record<AcademiaRole, string> = { student: "Estudiante", instructor: "Instructor", admin: "Administrador" }

export const ROLE_HELP: Record<AcademiaRole, string> = {
  student: "Cursa cursos de la academia. No necesita un negocio.",
  instructor: "Crea y gestiona sus propios cursos, evaluaciones y estudiantes dentro del LMS.",
  admin: "Gestiona toda la academia dentro del LMS: cursos, instructores, matrículas, reportes y auditoría.",
}

/** Rol más alto de una persona de la lista (administrador > instructor > estudiante). */
export function roleOf(u: Pick<ManageUser, "roles" | "platformAdmin">): AcademiaRole {
  if (u.roles.includes("lms_admin") || u.platformAdmin) return "admin"
  if (u.roles.includes("lms_instructor")) return "instructor"
  return "student"
}

/** Variación porcentual mes contra mes. null si no hay base para comparar. */
export function monthDelta(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? null : 0
  return Math.round(((current - previous) * 100) / previous)
}

export function deltaText(d: number | null): string {
  if (d === null) return "Sin mes anterior para comparar"
  if (d === 0) return "Igual que el mes anterior"
  return `${d > 0 ? "+" : ""}${d} % frente al mes anterior`
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Errores de campo del formulario de alta (vacío = válido). */
export function validateNewUser(f: { name: string; email: string; role: string }): Record<string, string> {
  const e: Record<string, string> = {}
  const name = f.name.trim()
  if (name.length < 2) e.name = "Escribe el nombre (mínimo 2 letras)."
  else if (name.length > 100) e.name = "Máximo 100 caracteres."
  const email = f.email.trim()
  if (!email) e.email = "Escribe el correo."
  else if (!EMAIL_RE.test(email) || email.length > 254) e.email = "Ese correo no parece válido."
  if (!["student", "instructor", "admin"].includes(f.role)) e.role = "Elige un rol."
  return e
}
