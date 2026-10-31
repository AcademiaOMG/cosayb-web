// Las tres áreas del LMS: ESTUDIANTE, INSTRUCTOR y ADMINISTRADOR. Cada una tiene su propio shell, menú y portada;
// no se mezclan menús ni hay selector de "ver como". La web solo ORGANIZA la vista: cada rol se vuelve a comprobar
// en el servidor en cada petición (/api/v1/lms/admin/* y /manage/*).

import type { LmsAccess } from "./types"

export type Area = "student" | "instructor" | "admin"

export const AREA_LABEL: Record<Area, string> = { student: "Estudiante", instructor: "Instructor", admin: "Administrador" }
export const AREA_HOME: Record<Area, string> = { student: "/inicio", instructor: "/instructor", admin: "/administracion" }

const under = (path: string, base: string) => path === base || path.startsWith(`${base}/`)

/** En qué área está la ruta. */
export function areaOf(pathname: string): Area {
  if (under(pathname, "/administracion")) return "admin"
  if (under(pathname, "/instructor")) return "instructor"
  return "student"
}

type Roles = Pick<LmsAccess, "roles" | "isAdmin" | "isInstructor"> & { hasCourses?: boolean }

const isStaff = (a: Roles) => a.isAdmin || a.isInstructor
const hasInstructorRole = (a: Roles) => a.roles.includes("lms_instructor")

/**
 * Áreas que puede usar la cuenta. Una cuenta con un solo rol ve solo su área: el instructor no ve el área de
 * estudiante (salvo que además esté matriculado) y el administrador no ve la del instructor (salvo que además
 * tenga ese rol).
 */
export function areasFor(a: Roles | undefined): Area[] {
  if (!a) return []
  const out: Area[] = []
  if (!isStaff(a) || a.hasCourses) out.push("student")
  if (hasInstructorRole(a)) out.push("instructor")
  if (a.isAdmin) out.push("admin")
  return out
}

/** Portada de la cuenta tras iniciar sesión: la de SU rol (administrador > instructor > estudiante). */
export function homeFor(a: Roles | undefined): string {
  if (a?.isAdmin) return AREA_HOME.admin
  if (a && hasInstructorRole(a)) return AREA_HOME.instructor
  return AREA_HOME.student
}

/** Portada del LMS para quien tiene un rol de gestión (null si es solo estudiante). */
export function staffHomeFor(a: Pick<LmsAccess, "isAdmin" | "isInstructor"> & { roles?: string[] } | null | undefined): string | null {
  if (a?.isAdmin) return AREA_HOME.admin
  if (a?.isInstructor) return AREA_HOME.instructor
  return null
}

const PERSONAL_STUDENT_PATHS = ["/inicio", "/mis-cursos", "/evaluaciones", "/certificados"]

/**
 * ¿A dónde hay que mandar a la persona si está en un área que no es la suya? null = puede quedarse (o aún no se
 * sabe: mientras se cargan los roles no se redirige). El servidor igualmente rechaza (403) lo que no le corresponde.
 */
export function areaRedirect(area: Area, access: Roles | undefined, pathname: string): string | null {
  if (!access) return null
  if (area === "admin") return access.isAdmin ? null : homeFor(access)
  if (area === "instructor") return hasInstructorRole(access) ? null : homeFor(access)
  // Área de estudiante: las páginas personales no son de una cuenta solo-gestión sin matrículas
  if (isStaff(access) && !access.hasCourses && PERSONAL_STUDENT_PATHS.some((p) => under(pathname, p))) return homeFor(access)
  return null
}

export interface NavEntry {
  href: string
  label: string
  /** etiqueta corta de la barra móvil */
  short: string
}

export const INSTRUCTOR_NAV: NavEntry[] = [
  { href: "/instructor", label: "Panorama", short: "Panorama" },
  { href: "/instructor/cursos", label: "Mis cursos", short: "Cursos" },
  { href: "/instructor/estudiantes", label: "Estudiantes", short: "Alumnos" },
  { href: "/instructor/evaluaciones", label: "Evaluaciones", short: "Quizzes" },
  { href: "/instructor/analitica", label: "Analítica", short: "Analítica" },
]

export const ADMIN_NAV: NavEntry[] = [
  { href: "/administracion", label: "Panorama", short: "Panorama" },
  { href: "/administracion/cursos", label: "Cursos", short: "Cursos" },
  { href: "/administracion/usuarios", label: "Instructores y usuarios", short: "Usuarios" },
  { href: "/administracion/matriculas", label: "Matrículas", short: "Matrículas" },
  { href: "/administracion/certificados", label: "Certificados", short: "Diplomas" },
  { href: "/administracion/reportes", label: "Reportes", short: "Reportes" },
  { href: "/administracion/auditoria", label: "Auditoría", short: "Auditoría" },
  { href: "/administracion/ajustes", label: "Ajustes y salud", short: "Ajustes" },
]

/** ¿Está activa la entrada? La portada solo coincide exacta; ver un curso como estudiante cuenta como «cursos». */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/administracion" || href === "/instructor") return pathname === href
  if (href === "/administracion/cursos" && under(pathname, "/administracion/ver")) return true
  if (href === "/instructor/cursos" && under(pathname, "/instructor/ver")) return true
  return under(pathname, href)
}

/** Rutas de cada área de gestión (el mismo componente sirve al instructor y al administrador). */
export function areaPaths(area: Area) {
  const root = area === "admin" ? "/administracion" : "/instructor"
  if (area === "student") {
    return {
      home: "/inicio",
      courses: "/mis-cursos",
      course: (_id: string, slug = "") => `/cursos/${slug}`,
      quiz: (courseId: string, quizId: string) => `/instructor/cursos/${courseId}/evaluacion/${quizId}`,
      view: (slug: string) => `/aprender/${slug}`,
      viewQuiz: (id: string) => `/evaluacion/${id}`,
      quizzes: "/evaluaciones",
      certificates: "/certificados",
      students: "/mis-cursos",
    }
  }
  return {
    home: root,
    courses: `${root}/cursos`,
    course: (id: string) => `${root}/cursos/${id}`,
    quiz: (courseId: string, quizId: string) => `${root}/cursos/${courseId}/evaluacion/${quizId}`,
    /** Ver el curso como lo ve un estudiante, dentro de la misma área (sin menú de estudiante). */
    view: (slug: string) => `${root}/ver/${slug}`,
    viewQuiz: (id: string) => `${root}/ver/evaluacion/${id}`,
    quizzes: `${root}/cursos`,
    certificates: area === "admin" ? "/administracion/certificados" : "/instructor/estudiantes",
    students: area === "admin" ? "/administracion/matriculas" : "/instructor/estudiantes",
  }
}

/** Nombre del archivo CSV descargado. */
export function csvFileName(base: string, now = new Date()): string {
  return `${base}-${now.toISOString().slice(0, 10)}.csv`
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  const u = ["KB", "MB", "GB", "TB"]
  let v = n / 1024
  let i = 0
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024
    i++
  }
  return `${v >= 10 ? Math.round(v) : v.toFixed(1)} ${u[i]}`
}

const AUDIT_LABELS: Record<string, string> = {
  "course.create": "Creó un curso",
  "course.update": "Editó un curso",
  "course.publish": "Publicó un curso",
  "course.archive": "Archivó un curso",
  "course.unpublish": "Pasó un curso a borrador",
  "course.delete": "Eliminó un curso",
  "course.reassign": "Cambió el propietario de un curso",
  "role.grant": "Otorgó un rol",
  "role.revoke": "Revocó un rol",
  "enrollment.grant": "Matriculó a un estudiante",
  "enrollment.bulk_grant": "Matriculó a varios estudiantes",
  "enrollment.revoke": "Revocó una matrícula",
  "enrollment.reactivate": "Reactivó una matrícula",
  "enrollment.export": "Exportó matriculados",
  "enrollment.remind": "Envió un recordatorio",
  "certificate.issue": "Emitió un certificado",
  "certificate.revoke": "Revocó un certificado",
  "quiz.create": "Creó una evaluación",
  "report.export": "Exportó un reporte",
  "category.create": "Creó una categoría",
  "category.rename": "Renombró una categoría",
  "category.delete": "Eliminó una categoría",
}

/** Texto en español de una acción de auditoría (`lms.course.create`); las desconocidas se muestran tal cual. */
export function auditLabel(action: string): string {
  const key = action.replace(/^lms\./, "")
  return AUDIT_LABELS[key] ?? key
}

export const AUDIT_FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Todas las acciones" },
  { value: "lms.course", label: "Cursos" },
  { value: "lms.role", label: "Roles" },
  { value: "lms.enrollment", label: "Matrículas" },
  { value: "lms.certificate", label: "Certificados" },
  { value: "lms.quiz", label: "Evaluaciones" },
  { value: "lms.report", label: "Reportes" },
  { value: "lms.category", label: "Categorías" },
]
