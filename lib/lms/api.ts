import { fetchAPI } from "@/lib/api"
import type {
  AdminCertificateRow, AdminCourse, AdminCourseRow, AdminEnrollment, AdminQuiz, AssetAccess, AssetKind, BankQuestion,
  AttemptResult, AttemptStart, CatalogCourse, CertificateDetail, CertColor, CompleteResult, CourseDetail, InstructorOverview, Lesson,
  CourseAnalytics, CourseMeta, LessonKind, MyCertificate, MyCourse, QuestionDraft, QuizSettings, QuizSummary, StudentAnswer, StudentHit,
  StudentSummary, VerifiedCertificate,
} from "./types"
import { buildAnswerPayload } from "./validation"

// Cliente del API del LMS. Sin claves ni secretos: la sesión viaja en la cookie (credentials: include).
const B = "/api/v1/lms"
const A = `${B}/admin`
const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) })
const enc = encodeURIComponent

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"

/**
 * Subida de binario crudo con progreso real (fetch aún no expone el avance de subida).
 * La sesión viaja en la cookie; el Content-Type es el MIME del archivo y el servidor revalida todo.
 */
export function uploadWithProgress<T>(path: string, file: Blob, onProgress?: (percent: number) => void, method: "POST" | "PUT" = "POST"): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, `${API_BASE}${path}`)
    xhr.withCredentials = true
    xhr.setRequestHeader("Content-Type", file.type)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.min(100, Math.round((e.loaded * 100) / e.total)))
    }
    xhr.onerror = () => reject(new Error("No pudimos conectar con el servidor. Revisa tu conexión."))
    xhr.onabort = () => reject(new Error("Subida cancelada."))
    xhr.onload = () => {
      let body: { data?: T; error?: string } = {}
      try {
        body = JSON.parse(xhr.responseText)
      } catch {
        /* sin JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.data !== undefined) {
        onProgress?.(100)
        resolve(body.data)
      } else reject(new Error(body.error ?? `No se pudo subir el archivo (HTTP ${xhr.status}).`))
    }
    xhr.send(file)
  })
}

async function data<T>(p: Promise<{ data: T }>): Promise<T> {
  return (await p).data
}

/** Las respuestas 204 no traen JSON: fetchAPI falla al parsear un cuerpo vacío; eso no es un error del API. */
function ignoreEmpty(err: unknown): void {
  if (err instanceof SyntaxError) return
  throw err
}

export const lms = {
  // ─── público ──────────────────────────────────────────────────────────────
  catalog: (limit = 50, offset = 0) => data<CatalogCourse[]>(fetchAPI(`${B}/courses?limit=${limit}&offset=${offset}`)),
  course: (slug: string) => data<CourseDetail>(fetchAPI(`${B}/courses/${enc(slug)}`)),
  verifyCertificate: async (code: string): Promise<VerifiedCertificate | null> => {
    try {
      return (await fetchAPI<{ data: VerifiedCertificate }>(`${B}/certificates/verify/${enc(code)}`)).data
    } catch (err) {
      if ((err as { status?: number }).status === 404) return null
      throw err
    }
  },

  // ─── estudiante ───────────────────────────────────────────────────────────
  summary: () => data<StudentSummary>(fetchAPI(`${B}/me/summary`)),
  myCourses: () => data<MyCourse[]>(fetchAPI(`${B}/me/courses?limit=50`)),
  lesson: (id: string) => data<Lesson>(fetchAPI(`${B}/lessons/${enc(id)}`)),
  /** URL temporal (5 min) del recurso, emitida tras autorizar en el servidor. */
  assetAccess: (lessonId: string, assetId: string) =>
    data<AssetAccess>(fetchAPI(`${B}/lessons/${enc(lessonId)}/assets/${enc(assetId)}/access`, { method: "POST" })),
  completeLesson: (lessonId: string) => data<CompleteResult>(fetchAPI(`${B}/lessons/${enc(lessonId)}/complete`, { method: "POST" })),
  courseQuizzes: (courseId: string) => data<QuizSummary[]>(fetchAPI(`${B}/courses/${enc(courseId)}/quizzes`)),
  quiz: (id: string) => data<QuizSummary>(fetchAPI(`${B}/quizzes/${enc(id)}`)),
  startAttempt: (quizId: string) => data<AttemptStart>(fetchAPI(`${B}/quizzes/${enc(quizId)}/attempts`, { method: "POST" })),
  submitAttempt: (attemptId: string, answers: Record<string, string | StudentAnswer>) =>
    data<AttemptResult>(
      fetchAPI(`${B}/attempts/${enc(attemptId)}/submit`, {
        method: "POST",
        ...json({ answers: buildAnswerPayload(answers) }),
      })
    ),
  /** URL temporal (5 min) de una imagen de pregunta o respuesta. */
  quizMediaAccess: (mediaId: string) => data<{ url: string; expiresIn: number; mime: string }>(fetchAPI(`${B}/quiz-media/${enc(mediaId)}/access`, { method: "POST" })),
  myCertificates: () => data<MyCertificate[]>(fetchAPI(`${B}/me/certificates`)),
  certificate: (id: string) => data<CertificateDetail>(fetchAPI(`${B}/certificates/${enc(id)}`)),

  // ─── instructor (requiere permisos *:platform_courses) ────────────────────
  admin: {
    overview: () => data<InstructorOverview>(fetchAPI(`${A}/overview`)),
    courses: () => data<AdminCourseRow[]>(fetchAPI(`${A}/courses?limit=50`)),
    course: (id: string) => data<AdminCourse>(fetchAPI(`${A}/courses/${enc(id)}`)),
    analytics: (id: string) => data<CourseAnalytics>(fetchAPI(`${A}/courses/${enc(id)}/analytics`)),
    createCourse: (input: { slug: string; title: string; description: string; includedInAcademia: boolean } & Partial<CourseMeta>) =>
      data<AdminCourse>(fetchAPI(`${A}/courses`, { method: "POST", ...json(input) })),
    updateCourse: (
      id: string,
      patch: Partial<{ slug: string; title: string; description: string; includedInAcademia: boolean; certTitle: string; certBody: string; certSigner: string; certSignerRole: string; certColor: CertColor } & CourseMeta>
    ) => data<AdminCourse>(fetchAPI(`${A}/courses/${enc(id)}`, { method: "PATCH", ...json(patch) })),
    setStatus: (id: string, action: "publish" | "archive" | "unpublish") =>
      data<AdminCourse>(fetchAPI(`${A}/courses/${enc(id)}/${action}`, { method: "POST" })),
    deleteCourse: (id: string) => fetchAPI<void>(`${A}/courses/${enc(id)}`, { method: "DELETE" }).catch(ignoreEmpty),
    /** Reordena de una vez módulos y lecciones (también mueve lecciones entre módulos). */
    reorderOutline: (courseId: string, modules: { id: string; lessonIds: string[] }[]) =>
      data<{ ok: true }>(fetchAPI(`${A}/courses/${enc(courseId)}/outline`, { method: "PUT", ...json({ modules }) })),
    createModule: (courseId: string, title: string) =>
      data<{ id: string }>(fetchAPI(`${A}/courses/${enc(courseId)}/modules`, { method: "POST", ...json({ title }) })),
    updateModule: (id: string, patch: { title?: string; position?: number }) =>
      data<{ id: string }>(fetchAPI(`${A}/modules/${enc(id)}`, { method: "PATCH", ...json(patch) })),
    deleteModule: (id: string) => fetchAPI<void>(`${A}/modules/${enc(id)}`, { method: "DELETE" }).catch(ignoreEmpty),
    createLesson: (moduleId: string, input: { title: string; body: string; isPreview: boolean; kind?: LessonKind; linkUrl?: string | null }) =>
      data<{ id: string }>(fetchAPI(`${A}/modules/${enc(moduleId)}/lessons`, { method: "POST", ...json(input) })),
    updateLesson: (id: string, patch: Partial<{ title: string; body: string; isPreview: boolean; position: number; kind: LessonKind; linkUrl: string | null }>) =>
      data<{ id: string }>(fetchAPI(`${A}/lessons/${enc(id)}`, { method: "PATCH", ...json(patch) })),
    duplicateLesson: (id: string) => data<{ id: string }>(fetchAPI(`${A}/lessons/${enc(id)}/duplicate`, { method: "POST" })),
    deleteLesson: (id: string) => fetchAPI<void>(`${A}/lessons/${enc(id)}`, { method: "DELETE" }).catch(ignoreEmpty),
    /** Subida de binario crudo: el Content-Type es el MIME; el servidor genera la clave y valida el contenido. */
    uploadAsset: (lessonId: string, kind: AssetKind, file: Blob, onProgress?: (percent: number) => void) => {
      const path = `${A}/lessons/${enc(lessonId)}/assets?kind=${kind}`
      return onProgress
        ? uploadWithProgress<{ id: string }>(path, file, onProgress)
        : data<{ id: string }>(fetchAPI(path, { method: "POST", body: file, headers: { "Content-Type": file.type } }))
    },
    deleteAsset: (lessonId: string, assetId: string) =>
      fetchAPI<void>(`${A}/lessons/${enc(lessonId)}/assets/${enc(assetId)}`, { method: "DELETE" }).catch(ignoreEmpty),

    // ─── estudiantes y matrículas ───────────────────────────────────────────
    enrollments: async (courseId: string, o: { q?: string; status?: "active" | "revoked"; limit?: number; offset?: number } = {}) => {
      const p = new URLSearchParams({ limit: String(o.limit ?? 50), offset: String(o.offset ?? 0) })
      if (o.q) p.set("q", o.q)
      if (o.status) p.set("status", o.status)
      const r = await fetchAPI<{ data: AdminEnrollment[]; total: number }>(`${A}/courses/${enc(courseId)}/enrollments?${p}`)
      return { rows: r.data, total: r.total }
    },
    students: (courseId: string, o: { q?: string; filter?: "all" | "available" | "enrolled"; limit?: number; offset?: number } = {}) => {
      const p = new URLSearchParams({ filter: o.filter ?? "available", limit: String(o.limit ?? 50), offset: String(o.offset ?? 0) })
      if (o.q) p.set("q", o.q)
      return data<StudentHit[]>(fetchAPI(`${A}/courses/${enc(courseId)}/students?${p}`))
    },
    enroll: (courseId: string, email: string) =>
      data<{ id: string }>(fetchAPI(`${A}/courses/${enc(courseId)}/enrollments`, { method: "POST", ...json({ email }) })),
    bulkEnroll: (courseId: string, userIds: string[]) =>
      data<{ enrolled: number; unknown: number }>(fetchAPI(`${A}/courses/${enc(courseId)}/enrollments/bulk`, { method: "POST", ...json({ userIds }) })),
    setEnrollmentStatus: (courseId: string, enrollmentId: string, status: "active" | "revoked") =>
      data<{ id: string; status: string }>(fetchAPI(`${A}/courses/${enc(courseId)}/enrollments/${enc(enrollmentId)}`, { method: "PATCH", ...json({ status }) })),
    remind: (courseId: string, enrollmentId: string) =>
      data<{ sent: boolean }>(fetchAPI(`${A}/courses/${enc(courseId)}/enrollments/${enc(enrollmentId)}/remind`, { method: "POST" })),
    /** CSV de matriculados (el servidor neutraliza fórmulas). Devuelve el archivo para descargarlo. */
    exportEnrollments: async (courseId: string): Promise<Blob> => {
      const res = await fetch(`${API_BASE}${A}/courses/${enc(courseId)}/enrollments/export`, { credentials: "include", cache: "no-store" })
      if (!res.ok) throw new Error(res.status === 403 ? "No tienes permiso para exportar." : "No se pudo exportar la lista.")
      return res.blob()
    },

    // ─── evaluaciones ───────────────────────────────────────────────────────
    quizzes: (courseId: string) => data<AdminQuiz[]>(fetchAPI(`${A}/courses/${enc(courseId)}/quizzes`)),
    quiz: (id: string) => data<AdminQuiz>(fetchAPI(`${A}/quizzes/${enc(id)}`)),
    createQuiz: (courseId: string, input: Partial<QuizSettings> & { title: string }) =>
      data<AdminQuiz>(fetchAPI(`${A}/courses/${enc(courseId)}/quizzes`, { method: "POST", ...json(input) })),
    updateQuiz: (id: string, patch: Partial<QuizSettings>) => data<AdminQuiz>(fetchAPI(`${A}/quizzes/${enc(id)}`, { method: "PATCH", ...json(patch) })),
    duplicateQuiz: (id: string) => data<AdminQuiz>(fetchAPI(`${A}/quizzes/${enc(id)}/duplicate`, { method: "POST" })),
    deleteQuiz: (id: string) => fetchAPI<void>(`${A}/quizzes/${enc(id)}`, { method: "DELETE" }).catch(ignoreEmpty),
    createQuestion: (quizId: string, q: QuestionDraft) =>
      data<{ id: string; options: { id: string }[] }>(fetchAPI(`${A}/quizzes/${enc(quizId)}/questions`, { method: "POST", ...json(q) })),
    updateQuestion: (id: string, q: Partial<QuestionDraft>) =>
      data<{ id: string; options: { id: string }[] }>(fetchAPI(`${A}/questions/${enc(id)}`, { method: "PATCH", ...json(q) })),
    duplicateQuestion: (id: string) => data<{ id: string }>(fetchAPI(`${A}/questions/${enc(id)}/duplicate`, { method: "POST" })),
    deleteQuestion: (id: string) => fetchAPI<void>(`${A}/questions/${enc(id)}`, { method: "DELETE" }).catch(ignoreEmpty),
    reorderQuestions: (quizId: string, ids: string[]) =>
      data<{ ok: true }>(fetchAPI(`${A}/quizzes/${enc(quizId)}/order`, { method: "PUT", ...json({ ids }) })),
    questionBank: (q: string) => data<BankQuestion[]>(fetchAPI(`${A}/question-bank?q=${enc(q)}&limit=20`)),
    importQuestions: (quizId: string, questionIds: string[]) =>
      data<{ id: string }[]>(fetchAPI(`${A}/quizzes/${enc(quizId)}/import`, { method: "POST", ...json({ questionIds }) })),
    setQuestionImage: (questionId: string, file: Blob, onProgress?: (p: number) => void) =>
      uploadWithProgress<{ id: string }>(`${A}/questions/${enc(questionId)}/image`, file, onProgress, "PUT"),
    setOptionImage: (optionId: string, file: Blob, onProgress?: (p: number) => void) =>
      uploadWithProgress<{ id: string }>(`${A}/options/${enc(optionId)}/image`, file, onProgress, "PUT"),
    deleteMedia: (mediaId: string) => fetchAPI<void>(`${A}/quiz-media/${enc(mediaId)}`, { method: "DELETE" }).catch(ignoreEmpty),
    mediaAccess: (mediaId: string) => data<{ url: string; expiresIn: number; mime: string }>(fetchAPI(`${A}/quiz-media/${enc(mediaId)}/access`, { method: "POST" })),

    // ─── certificados ───────────────────────────────────────────────────────
    certificates: (courseId: string) => data<AdminCertificateRow[]>(fetchAPI(`${A}/courses/${enc(courseId)}/certificates?limit=50`)),
    issueCertificate: (courseId: string, userId: string) =>
      data<{ id: string; code: string; reissued: boolean }>(fetchAPI(`${A}/courses/${enc(courseId)}/certificates`, { method: "POST", ...json({ userId }) })),
    revokeCertificate: (courseId: string, id: string, reason: string) =>
      data<{ id: string }>(fetchAPI(`${A}/courses/${enc(courseId)}/certificates/${enc(id)}/revoke`, { method: "POST", ...json({ reason }) })),
  },
}
