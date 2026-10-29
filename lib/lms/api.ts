import { fetchAPI } from "@/lib/api"
import type {
  AdminCertificateRow, AdminCourse, AdminCourseRow, AdminEnrollment, AdminQuiz, AssetAccess, AssetKind,
  AttemptResult, AttemptStart, CatalogCourse, CertificateDetail, CompleteResult, CourseDetail, Lesson,
  CourseAnalytics, CourseMeta, MyCertificate, MyCourse, QuestionDraft, QuizSummary, StudentSummary, VerifiedCertificate,
} from "./types"

// Cliente del API del LMS. Sin claves ni secretos: la sesión viaja en la cookie (credentials: include).
const B = "/api/v1/lms"
const A = `${B}/admin`
const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) })
const enc = encodeURIComponent

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
  submitAttempt: (attemptId: string, answers: Record<string, string>) =>
    data<AttemptResult>(
      fetchAPI(`${B}/attempts/${enc(attemptId)}/submit`, {
        method: "POST",
        ...json({ answers: Object.entries(answers).map(([questionId, optionId]) => ({ questionId, optionId })) }),
      })
    ),
  myCertificates: () => data<MyCertificate[]>(fetchAPI(`${B}/me/certificates`)),
  certificate: (id: string) => data<CertificateDetail>(fetchAPI(`${B}/certificates/${enc(id)}`)),

  // ─── instructor (requiere permisos *:platform_courses) ────────────────────
  admin: {
    courses: () => data<AdminCourseRow[]>(fetchAPI(`${A}/courses?limit=50`)),
    course: (id: string) => data<AdminCourse>(fetchAPI(`${A}/courses/${enc(id)}`)),
    analytics: (id: string) => data<CourseAnalytics>(fetchAPI(`${A}/courses/${enc(id)}/analytics`)),
    createCourse: (input: { slug: string; title: string; description: string; includedInAcademia: boolean } & Partial<CourseMeta>) =>
      data<AdminCourse>(fetchAPI(`${A}/courses`, { method: "POST", ...json(input) })),
    updateCourse: (id: string, patch: Partial<{ slug: string; title: string; description: string; includedInAcademia: boolean } & CourseMeta>) =>
      data<AdminCourse>(fetchAPI(`${A}/courses/${enc(id)}`, { method: "PATCH", ...json(patch) })),
    setStatus: (id: string, action: "publish" | "archive" | "unpublish") =>
      data<AdminCourse>(fetchAPI(`${A}/courses/${enc(id)}/${action}`, { method: "POST" })),
    deleteCourse: (id: string) => fetchAPI<void>(`${A}/courses/${enc(id)}`, { method: "DELETE" }).catch(ignoreEmpty),
    createModule: (courseId: string, title: string) =>
      data<{ id: string }>(fetchAPI(`${A}/courses/${enc(courseId)}/modules`, { method: "POST", ...json({ title }) })),
    updateModule: (id: string, patch: { title?: string; position?: number }) =>
      data<{ id: string }>(fetchAPI(`${A}/modules/${enc(id)}`, { method: "PATCH", ...json(patch) })),
    deleteModule: (id: string) => fetchAPI<void>(`${A}/modules/${enc(id)}`, { method: "DELETE" }).catch(ignoreEmpty),
    createLesson: (moduleId: string, input: { title: string; body: string; isPreview: boolean }) =>
      data<{ id: string }>(fetchAPI(`${A}/modules/${enc(moduleId)}/lessons`, { method: "POST", ...json(input) })),
    updateLesson: (id: string, patch: Partial<{ title: string; body: string; isPreview: boolean; position: number }>) =>
      data<{ id: string }>(fetchAPI(`${A}/lessons/${enc(id)}`, { method: "PATCH", ...json(patch) })),
    deleteLesson: (id: string) => fetchAPI<void>(`${A}/lessons/${enc(id)}`, { method: "DELETE" }).catch(ignoreEmpty),
    /** Subida de binario crudo: el Content-Type es el MIME; el servidor genera la clave y valida el contenido. */
    uploadAsset: (lessonId: string, kind: AssetKind, file: Blob) =>
      data<{ id: string }>(
        fetchAPI(`${A}/lessons/${enc(lessonId)}/assets?kind=${kind}`, { method: "POST", body: file, headers: { "Content-Type": file.type } })
      ),
    deleteAsset: (lessonId: string, assetId: string) =>
      fetchAPI<void>(`${A}/lessons/${enc(lessonId)}/assets/${enc(assetId)}`, { method: "DELETE" }).catch(ignoreEmpty),
    enrollments: (courseId: string) => data<AdminEnrollment[]>(fetchAPI(`${A}/courses/${enc(courseId)}/enrollments?limit=50`)),
    enroll: (courseId: string, email: string) =>
      data<AdminEnrollment>(fetchAPI(`${A}/courses/${enc(courseId)}/enrollments`, { method: "POST", ...json({ email }) })),
    revoke: (courseId: string, enrollmentId: string) =>
      fetchAPI<void>(`${A}/courses/${enc(courseId)}/enrollments/${enc(enrollmentId)}`, { method: "DELETE" }).catch(ignoreEmpty),
    quizzes: (courseId: string) => data<AdminQuiz[]>(fetchAPI(`${A}/courses/${enc(courseId)}/quizzes`)),
    createQuiz: (courseId: string, input: { title: string; description: string; passingScore: number; maxAttempts: number | null; required: boolean }) =>
      data<AdminQuiz>(fetchAPI(`${A}/courses/${enc(courseId)}/quizzes`, { method: "POST", ...json(input) })),
    updateQuiz: (id: string, patch: Partial<{ title: string; description: string; passingScore: number; maxAttempts: number | null; required: boolean }>) =>
      data<AdminQuiz>(fetchAPI(`${A}/quizzes/${enc(id)}`, { method: "PATCH", ...json(patch) })),
    deleteQuiz: (id: string) => fetchAPI<void>(`${A}/quizzes/${enc(id)}`, { method: "DELETE" }).catch(ignoreEmpty),
    createQuestion: (quizId: string, q: QuestionDraft) =>
      data<{ id: string }>(fetchAPI(`${A}/quizzes/${enc(quizId)}/questions`, { method: "POST", ...json(q) })),
    updateQuestion: (id: string, q: Partial<QuestionDraft>) =>
      data<{ id: string }>(fetchAPI(`${A}/questions/${enc(id)}`, { method: "PATCH", ...json(q) })),
    deleteQuestion: (id: string) => fetchAPI<void>(`${A}/questions/${enc(id)}`, { method: "DELETE" }).catch(ignoreEmpty),
    certificates: (courseId: string) => data<AdminCertificateRow[]>(fetchAPI(`${A}/courses/${enc(courseId)}/certificates?limit=50`)),
    revokeCertificate: (courseId: string, id: string) =>
      fetchAPI<void>(`${A}/courses/${enc(courseId)}/certificates/${enc(id)}`, { method: "DELETE" }).catch(ignoreEmpty),
  },
}
