// Tipos del LMS tal como los devuelve /api/v1/lms. Ningún tipo de estudiante contiene la respuesta correcta.

export type CourseLevel = "beginner" | "intermediate" | "advanced"
export type LessonKind = "reading" | "video" | "file" | "link"
export type QuestionType = "single" | "multiple" | "true_false" | "fill_blank" | "short_text"
export type CertColor = "blue" | "teal" | "amber" | "rose"

/** Metadatos de catálogo (migración 0035). */
export interface CourseMeta {
  category: string
  level: CourseLevel
  durationMinutes: number
  tags: string[]
  coverKey: string
  instructorName: string
}

export interface CatalogCourse extends CourseMeta {
  id: string
  slug: string
  title: string
  description: string
  includedInAcademia: boolean
  lessonCount: number
  enrolledCount: number
  createdAt: string
}

export interface OutlineLesson {
  id: string
  title: string
  position: number
  isPreview: boolean
  kind?: LessonKind
  completed: boolean
}

export interface CourseDetail extends CourseMeta {
  id: string
  slug: string
  title: string
  description: string
  includedInAcademia: boolean
  status?: CourseStatus
  /** instructorView: el propietario o un administrador lo ve como estudiante (nada se guarda) */
  access: { enrolled: boolean; viaAcademia: boolean; canViewAll: boolean; instructorView?: boolean }
  progress: { completed: number; total: number } | null
  modules: { id: string; title: string; position: number; lessons: OutlineLesson[] }[]
}

export interface MyCourse {
  id: string
  slug: string
  title: string
  description: string
  category: string
  level: CourseLevel
  durationMinutes: number
  coverKey: string
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
  kind?: LessonKind
  /** Solo http(s): el servidor lo valida; aun así se abre siempre con rel="noopener noreferrer". */
  linkUrl?: string | null
  isPreview: boolean
  completed: boolean
  instructorView?: boolean
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
  preview?: boolean
}

export interface QuizSummary {
  instructorView?: boolean
  id: string
  courseId: string
  title: string
  description: string
  passingScore: number
  maxAttempts: number | null
  required: boolean
  timeLimitMinutes?: number | null
  questionCount: number
  attemptsUsed: number
  bestScore: number | null
  passed: boolean
}

export interface AttemptQuestion {
  id: string
  type?: QuestionType
  prompt: string
  points: number
  required?: boolean
  /** Id de la imagen adjunta (se pide por URL temporal). */
  imageId?: string | null
  options: { id: string; text: string; imageId?: string | null }[]
}

export interface AttemptStart {
  attemptId: string
  startedAt: string
  timeLimitMinutes?: number | null
  expiresAt?: string | null
  questions: AttemptQuestion[]
  /** intento de prueba del instructor: no se guarda */
  preview?: boolean
}

/** Clave de una pregunta, solo tras calificar y si el instructor lo permitió. */
export interface RevealedKey {
  questionId: string
  optionIds?: string[]
  texts?: string[]
  blanks?: Record<number, string[]>
}

export interface AttemptResult {
  attemptId: string
  quizId: string
  status: "in_progress" | "submitted" | "preview"
  preview?: boolean
  score: number | null
  passed: boolean | null
  submittedAt: string | null
  passingScore?: number
  expired?: boolean
  message?: string
  reveal?: RevealedKey[] | null
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

export interface CertTemplate {
  title: string
  body: string
  signer: string
  signerRole: string
  color: CertColor
}

export interface CertificateDetail {
  id: string
  code: string
  recipientName: string
  courseTitle: string
  issuedAt: string
  template?: CertTemplate
}

export interface VerifiedCertificate {
  recipientName: string
  courseTitle: string
  issuedAt: string
}

// ─── Instructor ─────────────────────────────────────────────────────────────

export type CourseStatus = "draft" | "published" | "archived"

export interface AdminCourseRow {
  category: string
  level: CourseLevel
  durationMinutes: number
  tags: string[]
  coverKey: string
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
  kind: LessonKind
  linkUrl: string | null
  position: number
  isPreview: boolean
  assets: AdminAsset[]
}

export interface AdminCourse extends CourseMeta {
  id: string
  slug: string
  title: string
  description: string
  status: CourseStatus
  includedInAcademia: boolean
  updatedAt: string
  certTitle: string
  certBody: string
  certSigner: string
  certSignerRole: string
  certColor: CertColor
  modules: { id: string; title: string; position: number; lessons: AdminLesson[] }[]
}

export interface AdminOption {
  id: string
  text: string
  isCorrect: boolean
  blankIndex: number | null
  imageId: string | null
}

export interface AdminQuestion {
  id: string
  type: QuestionType
  prompt: string
  explanation: string
  points: number
  required: boolean
  shuffleOptions: boolean
  estimatedMinutes: number
  imageId: string | null
  options: AdminOption[]
}

export interface QuizSettings {
  title: string
  description: string
  passingScore: number
  maxAttempts: number | null
  required: boolean
  timeLimitMinutes: number | null
  shuffleQuestions: boolean
  revealAnswers: boolean
  passMessage: string
  failMessage: string
}

export interface AdminQuiz extends QuizSettings {
  id: string
  courseId: string
  questions: AdminQuestion[]
}

export interface AdminEnrollment {
  id: string
  userId: string
  name: string
  email: string
  status: "active" | "revoked"
  enrolledAt: string
  completed: number
  total: number
  percent: number
  lastActivity: string | null
  score: number | null
  certificate: boolean
  remindedAt: string | null
}

export interface StudentHit {
  id: string
  name: string
  email: string
  courses: number
  enrolled: boolean
}

export interface BankQuestion {
  id: string
  prompt: string
  type: QuestionType
  points: number
  quizTitle: string
  courseTitle: string
}

export interface AdminCertificateRow {
  id: string
  userId: string
  code: string
  recipientName: string
  email: string
  issuedAt: string
  revokedAt: string | null
  revokedReason: string | null
  manual: boolean
}

/** Pregunta tal como se edita y se envía (las respuestas con id conservan su imagen). */
export interface QuestionDraft {
  type?: QuestionType
  prompt: string
  explanation: string
  points: number
  required?: boolean
  shuffleOptions?: boolean
  estimatedMinutes?: number
  options: { id?: string; text: string; isCorrect: boolean; blankIndex?: number | null }[]
}

/** Respuesta de estudiante en el cliente (el envío al servidor la normaliza). */
export interface StudentAnswer {
  optionId?: string
  optionIds?: string[]
  text?: string
  blanks?: Record<number, string>
}

// ─── Resumen del estudiante y analítica ─────────────────────────────────────

export interface StudentSummary {
  lessons: { completed: number; total: number }
  quizzes: { passed: number; total: number }
  certificates: { count: number; total: number }
  streak: number
  activity: { date: string; count: number }[]
  resume: { courseId: string; slug: string; title: string; coverKey: string; lessonId: string | null; lessonTitle: string | null; completed: number; total: number } | null
  upcoming: { kind: "lesson" | "quiz"; courseId: string; courseSlug: string; courseTitle: string; id: string; title: string }[]
}

export interface QuestionAnalytics {
  id: string
  type?: QuestionType
  prompt: string
  points: number
  responses: number
  correctPct: number
  options: { id: string; text: string; isCorrect: boolean; count: number; pct: number }[]
}

export interface CourseAnalytics {
  enrolled: number
  avgProgress: number
  completionRate: number
  finished: number
  certificates: number
  lessons: { id: string; title: string; completions: number }[]
  quizzes: {
    id: string
    title: string
    passingScore: number
    submissions: number
    avgScore: number
    passRate: number
    avgSeconds: number
    scoreBuckets?: number[]
    questions: QuestionAnalytics[]
  }[]
  topFailed?: { quizId: string; quizTitle: string; questionId: string; prompt: string; type: QuestionType; responses: number; failPct: number }[]
}

// ─── Panorama del instructor ────────────────────────────────────────────────

export interface OverviewCourse {
  id: string
  slug: string
  title: string
  status: CourseStatus
  level: CourseLevel
  coverKey: string
  updatedAt: string
  lessonCount: number
  enrolled: number
  avgProgress: number
  finished: number
  passRate: number | null
  certificates: number
}

export interface InstructorOverview {
  kpis: {
    courses: { published: number; draft: number; archived: number; total: number }
    students: number
    enrollments: number
    avgProgress: number
    passRate: number | null
    certificates: number
    enrollmentsThisMonth: number
    enrollmentsPrevMonth: number
  }
  series: { month: string; enrollments: number; completions: number; attempts: number }[]
  byLevel: { level: CourseLevel; count: number }[]
  courses: OverviewCourse[]
}

// ─── Roles y administración de la academia ──────────────────────────────────

export interface LmsAccess {
  roles: string[]
  isAdmin: boolean
  /** puede gestionar cursos propios (rol de instructor o de administrador) */
  isInstructor: boolean
  /** además estudia: tiene alguna matrícula activa */
  hasCourses?: boolean
}

export interface InstructorCard {
  id: string
  name: string
  email: string
  role: "admin" | "instructor"
  courses: number
  published: number
  students: number
  enrollmentsThisMonth: number
  enrollmentsPrevMonth: number
  passRate: number | null
  certificates: number
}

export interface ManageOverview extends InstructorOverview {
  instructors: InstructorCard[]
  attention: { drafts: number; withoutOwner: number; revokedCertificates: number; actionsLastWeek: number }
}

export interface Paged<T> {
  total: number
  rows: T[]
}

export interface ManageCourse {
  id: string
  slug: string
  title: string
  status: CourseStatus
  category: string
  level: CourseLevel
  coverKey: string
  includedInAcademia: boolean
  updatedAt: string | null
  lessons: number
  enrolled: number
  owner: { id: string; name: string; email: string } | null
}

export interface ManageUser {
  id: string
  name: string
  email: string
  createdAt: string | null
  roles: ("lms_instructor" | "lms_admin")[]
  platformAdmin: boolean
  courses: number
  enrollments: number
}

export interface ManageEnrollment {
  id: string
  courseId: string
  courseTitle: string
  userId: string
  name: string
  email: string
  status: "active" | "revoked"
  enrolledAt: string | null
  percent: number
  lastActivity: string | null
  certificate: boolean
}

export interface ManageCertificate {
  id: string
  courseId: string
  userId: string
  code: string
  recipientName: string
  email: string
  courseTitle: string
  issuedAt: string | null
  revokedAt: string | null
  revokedReason: string | null
}

export interface AuditRow {
  id: string
  at: string | null
  actorId: string
  actorName: string
  actorEmail: string
  actorRoles: string[]
  action: string
  resourceId: string | null
  metadata: Record<string, unknown> | null
}

export interface CategoryRow {
  slug: string
  name: string
  position: number
  courses: number
}

export interface StorageUsage {
  totalBytes: number
  reclaimableBytes: number
  courses: { id: string; title: string; status: CourseStatus; owner: string | null; assets: number; media: number; bytes: number; enrolled: number; reclaimable: boolean }[]
}

export interface ReportCourse extends OverviewCourse {
  instructor: string
}

export interface MyQuiz {
  id: string
  title: string
  courseId: string
  courseTitle: string
  courseSlug: string
  courseStatus: CourseStatus
  passingScore: number
  required: boolean
  questions: number
  attempts: number
  passRate: number | null
  avgScore: number | null
}
