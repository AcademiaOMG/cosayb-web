import { describe, expect, it } from "vitest"
import { ADMIN_NAV, AREA_HOME, AUDIT_FILTERS, INSTRUCTOR_NAV, areaOf, areaPaths, areaRedirect, areasFor, auditLabel, csvFileName, formatBytes, homeFor, isNavActive, staffHomeFor } from "./roles"

const student = { roles: [], isAdmin: false, isInstructor: false, hasCourses: true }
const instructor = { roles: ["lms_instructor"], isAdmin: false, isInstructor: true, hasCourses: false }
const instructorStudent = { ...instructor, hasCourses: true }
const admin = { roles: ["lms_admin"], isAdmin: true, isInstructor: true, hasCourses: false }

describe("areaOf: en qué área está la ruta", () => {
  it("administración e instructor tienen la suya; el resto es estudiante", () => {
    expect(areaOf("/administracion")).toBe("admin")
    expect(areaOf("/administracion/ver/costeo")).toBe("admin")
    expect(areaOf("/instructor")).toBe("instructor")
    expect(areaOf("/instructor/cursos/abc/evaluacion/xyz")).toBe("instructor")
    for (const p of ["/inicio", "/cursos", "/cursos/costeo", "/aprender/costeo", "/evaluacion/1", "/certificados", "/mis-cursos"]) expect(areaOf(p), p).toBe("student")
  })
  it("no confunde rutas parecidas", () => {
    expect(areaOf("/administracionx")).toBe("student")
    expect(areaOf("/instructores")).toBe("student")
  })
})

describe("áreas separadas: cada cuenta ve solo las de sus roles", () => {
  it("estudiante: solo estudiante", () => expect(areasFor(student)).toEqual(["student"]))
  it("instructor puro: solo instructor (sin menú de estudiante)", () => expect(areasFor(instructor)).toEqual(["instructor"]))
  it("instructor que además estudia: las dos, sin mezclarlas", () => expect(areasFor(instructorStudent)).toEqual(["student", "instructor"]))
  it("administrador puro: solo administración", () => expect(areasFor(admin)).toEqual(["admin"]))
  it("sin cargar: ninguna (no se redirige aún)", () => expect(areasFor(undefined)).toEqual([]))
})

describe("portada tras iniciar sesión: la de SU rol", () => {
  it("estudiante → /inicio, instructor → /instructor, administrador → /administracion", () => {
    expect(homeFor(student)).toBe("/inicio")
    expect(homeFor(instructor)).toBe("/instructor")
    expect(homeFor(admin)).toBe("/administracion")
    expect(homeFor(undefined)).toBe("/inicio")
    expect(AREA_HOME).toEqual({ student: "/inicio", instructor: "/instructor", admin: "/administracion" })
  })
  it("staffHomeFor solo devuelve portada para roles de gestión", () => {
    expect(staffHomeFor({ isAdmin: true, isInstructor: true })).toBe("/administracion")
    expect(staffHomeFor({ isAdmin: false, isInstructor: true })).toBe("/instructor")
    expect(staffHomeFor({ isAdmin: false, isInstructor: false })).toBeNull()
    expect(staffHomeFor(undefined)).toBeNull()
  })
})

describe("areaRedirect: quien entra a un área que no es la suya vuelve a su portada", () => {
  it("mientras no se conocen los roles no se redirige", () => {
    expect(areaRedirect("admin", undefined, "/administracion")).toBeNull()
  })
  it("un estudiante no entra a instructor ni a administración", () => {
    expect(areaRedirect("instructor", student, "/instructor")).toBe("/inicio")
    expect(areaRedirect("admin", student, "/administracion/usuarios")).toBe("/inicio")
  })
  it("un instructor no entra a administración", () => {
    expect(areaRedirect("admin", instructor, "/administracion")).toBe("/instructor")
    expect(areaRedirect("instructor", instructor, "/instructor/cursos")).toBeNull()
  })
  it("un administrador sin rol de instructor no usa el área del instructor", () => {
    expect(areaRedirect("instructor", admin, "/instructor")).toBe("/administracion")
    expect(areaRedirect("admin", admin, "/administracion")).toBeNull()
  })
  it("una cuenta solo-gestión no usa las páginas personales de estudiante, pero sí el catálogo público", () => {
    for (const p of ["/inicio", "/mis-cursos", "/evaluaciones", "/certificados", "/certificados/abc"]) expect(areaRedirect("student", instructor, p), p).toBe("/instructor")
    expect(areaRedirect("student", admin, "/inicio")).toBe("/administracion")
    expect(areaRedirect("student", instructor, "/cursos")).toBeNull()
    expect(areaRedirect("student", instructor, "/verificar")).toBeNull()
    // si además estudia, sí puede
    expect(areaRedirect("student", instructorStudent, "/inicio")).toBeNull()
    expect(areaRedirect("student", student, "/inicio")).toBeNull()
  })
})

describe("isNavActive", () => {
  it("la portada solo coincide exacta (si no estaría siempre activa)", () => {
    expect(isNavActive("/administracion", "/administracion")).toBe(true)
    expect(isNavActive("/administracion/cursos", "/administracion")).toBe(false)
    expect(isNavActive("/instructor/cursos/abc", "/instructor")).toBe(false)
  })
  it("las demás secciones incluyen sus subrutas y ver-como-estudiante cuenta como cursos", () => {
    expect(isNavActive("/administracion/cursos/abc", "/administracion/cursos")).toBe(true)
    expect(isNavActive("/instructor/ver/costeo", "/instructor/cursos")).toBe(true)
    expect(isNavActive("/administracion/ver/costeo", "/administracion/cursos")).toBe(true)
    expect(isNavActive("/instructor/estudiantes", "/instructor/estudiantes")).toBe(true)
    expect(isNavActive("/administracion/cursosx", "/administracion/cursos")).toBe(false)
  })
})

describe("menús por área (sin mezclar)", () => {
  it("instructor: Panorama, Mis cursos, Estudiantes, Evaluaciones, Analítica; todo cuelga de /instructor", () => {
    expect(INSTRUCTOR_NAV.map((n) => n.label)).toEqual(["Panorama", "Mis cursos", "Estudiantes", "Evaluaciones", "Analítica"])
    expect(INSTRUCTOR_NAV.every((n) => n.href === "/instructor" || n.href.startsWith("/instructor/"))).toBe(true)
  })
  it("administración: 8 secciones, todas de /administracion", () => {
    expect(ADMIN_NAV).toHaveLength(8)
    expect(ADMIN_NAV.every((n) => n.href === "/administracion" || n.href.startsWith("/administracion/"))).toBe(true)
  })
})

describe("areaPaths: las pantallas compartidas enlazan solo dentro de su área", () => {
  it("instructor", () => {
    const p = areaPaths("instructor")
    expect(p.course("c1")).toBe("/instructor/cursos/c1")
    expect(p.quiz("c1", "q1")).toBe("/instructor/cursos/c1/evaluacion/q1")
    expect(p.view("costeo")).toBe("/instructor/ver/costeo")
    expect(p.viewQuiz("q1")).toBe("/instructor/ver/evaluacion/q1")
  })
  it("administrador", () => {
    const p = areaPaths("admin")
    expect(p.course("c1")).toBe("/administracion/cursos/c1")
    expect(p.view("costeo")).toBe("/administracion/ver/costeo")
    expect(p.viewQuiz("q1")).toBe("/administracion/ver/evaluacion/q1")
    expect(p.students).toBe("/administracion/matriculas")
  })
  it("estudiante", () => {
    const p = areaPaths("student")
    expect(p.course("x", "costeo")).toBe("/cursos/costeo")
    expect(p.view("costeo")).toBe("/aprender/costeo")
    expect(p.viewQuiz("q1")).toBe("/evaluacion/q1")
  })
  it("ninguna ruta de gestión apunta al área de estudiante ni a la de otra área", () => {
    for (const area of ["instructor", "admin"] as const) {
      const p = areaPaths(area)
      const root = area === "admin" ? "/administracion" : "/instructor"
      for (const href of [p.home, p.courses, p.course("a", "b"), p.quiz("a", "b"), p.view("s"), p.viewQuiz("q")]) expect(href.startsWith(root), href).toBe(true)
    }
  })
})

describe("textos", () => {
  it("traduce las acciones de auditoría y deja pasar las desconocidas", () => {
    expect(auditLabel("lms.role.grant")).toBe("Otorgó un rol")
    expect(auditLabel("lms.enrollment.bulk_grant")).toBe("Matriculó a varios estudiantes")
    expect(auditLabel("lms.algo.nuevo")).toBe("algo.nuevo")
    expect(AUDIT_FILTERS[0].value).toBe("")
  })
  it("formatBytes y nombre de CSV", () => {
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(1536)).toBe("1.5 KB")
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB")
    expect(formatBytes(250 * 1024 * 1024)).toBe("250 MB")
    expect(csvFileName("cursos", new Date("2026-10-29T10:00:00Z"))).toBe("cursos-2026-10-29.csv")
  })
})
