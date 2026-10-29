// Tipos del LMS tal como los devuelve /api/v1/lms. Ningún tipo de estudiante contiene la respuesta correcta.

export interface CatalogCourse {
  id: string
  slug: string
  title: string
  description: string
  includedInAcademia: boolean
  lessonCount: number
}

export interface OutlineLesson {
  id: string
  title: string
  position: number
  isPreview: boolean
  completed: boolean
}

export interface CourseDetail {
  id: string
  slug: string
  title: string
  description: string
  includedInAcademia: boolean
  access: { enrolled: boolean; viaAcademia: boolean; canViewAll: boolean }
  progress: { completed: number; total: number } | null
  modules: { id: string; title: string; position: number; lessons: OutlineLesson[] }[]
}

export interface MyCourse {
  id: string
  slug: string
  title: string
  description: string
  enrolledAt: string
  lessonCount: number
  completedCount: number
}

export type AssetKind = "video" | "document" | "subtitle" | "thumbnail"

export interface LessonAsset {
  id: string
  kind: AssetKind
  mime: string
  sizeBytes: number
}

export interface Lesson {
  id: string
  courseId: string
  courseSlug: string
  title: string
  /** Texto plano: se muestra SIEMPRE como texto escapado, nunca como HTML. */
  body: string
  isPreview: boolean
  completed: boolean
  assets: LessonAsset[]
}

export interface AssetAccess {
  url: string
  expiresIn: number
  mime: string
  assetKind: AssetKind
}

export interface CertificateRef {
  id: string
  code: string
}

export interface CompleteResult {
  courseId: string
  completed: number
  total: number
  certificate: CertificateRef | null
}

export interface QuizSummary {
  id: string
  courseId: string
  title: string
  description: string
  passingScore: number
  maxAttempts: number | null
  required: boolean
  questionCount: number
  attemptsUsed: number
  bestScore: number | null
  passed: boolean
}

export interface AttemptQuestion {
  id: string
  prompt: string
  points: number
  options: { id: string; text: string }[]
}

export interface AttemptStart {
  attemptId: string
  startedAt: string
  questions: AttemptQuestion[]
}

export interface AttemptResult {
  attemptId: string
  quizId: string
  status: "in_progress" | "submitted"
  score: number | null
  passed: boolean | null
  submittedAt: string | null
  passingScore?: number
  results?: { questionId: string; correct: boolean; explanation: string }[]
  certificate?: CertificateRef | null
  questions?: AttemptQuestion[]
}

export interface MyCertificate {
  id: string
  code: string
  courseId: string
  courseTitle: string
  issuedAt: string
}

export interface CertificateDetail {
  id: string
  code: string
  recipientName: string
  courseTitle: string
  issuedAt: string
}

export interface VerifiedCertificate {
  recipientName: string
  courseTitle: string
  issuedAt: string
}

// ─── Instructor ─────────────────────────────────────────────────────────────

export type CourseStatus = "draft" | "published" | "archived"

export interface AdminCourseRow {
  id: string
  slug: string
  title: string
  status: CourseStatus
  includedInAcademia: boolean
  updatedAt: string
  lessonCount: number
  enrolledCount: number
}

export interface AdminAsset {
  id: string
  lessonId: string
  kind: AssetKind
  mime: string
  sizeBytes: number
}

export interface AdminLesson {
  id: string
  moduleId: string
  title: string
  body: string
  position: number
  isPreview: boolean
  assets: AdminAsset[]
}

export interface AdminCourse {
  id: string
  slug: string
  title: string
  description: string
  status: CourseStatus
  includedInAcademia: boolean
  modules: { id: string; title: string; position: number; lessons: AdminLesson[] }[]
}

export interface AdminQuiz {
  id: string
  courseId: string
  title: string
  description: string
  passingScore: number
  maxAttempts: number | null
  required: boolean
  questions: { id: string; prompt: string; explanation: string; points: number; options: { id: string; text: string; isCorrect: boolean }[] }[]
}

export interface AdminEnrollment {
  id: string
  userId: string
  email: string
  name: string
  status: "active" | "revoked"
  createdAt: string
}

export interface AdminCertificateRow {
  id: string
  code: string
  recipientName: string
  email: string
  issuedAt: string
  revokedAt: string | null
}

export interface QuestionDraft {
  prompt: string
  explanation: string
  points: number
  options: { text: string; isCorrect: boolean }[]
}
