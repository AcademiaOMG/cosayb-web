"use client"

import useSWR from "swr"
import { ApiError } from "@/lib/api"
import { lms } from "./api"

const opts = { revalidateOnFocus: false, revalidateOnMount: true, dedupingInterval: 1000 } as const

export const lmsKeys = {
  catalog: "lms/catalog",
  course: (slug: string) => `lms/course/${slug}`,
  mine: "lms/mine",
  summary: "lms/summary",
  analytics: (id: string) => `lms/admin/analytics/${id}`,
  lesson: (id: string) => `lms/lesson/${id}`,
  quizzes: (courseId: string) => `lms/quizzes/${courseId}`,
  certificates: "lms/certificates",
  adminCourses: "lms/admin/courses",
  adminCourse: (id: string) => `lms/admin/course/${id}`,
  overview: "lms/admin/overview",
  adminQuizzes: (id: string) => `lms/admin/quizzes/${id}`,
  adminQuiz: (id: string) => `lms/admin/quiz/${id}`,
  adminEnrollments: (id: string) => `lms/admin/enrollments/${id}`,
  adminCertificates: (id: string) => `lms/admin/certificates/${id}`,
}

export const useCatalog = () => useSWR(lmsKeys.catalog, () => lms.catalog(), opts)
export const useCourse = (slug: string | undefined) => useSWR(slug ? lmsKeys.course(slug) : null, () => lms.course(slug!), opts)
export const useSummary = (enabled = true) => useSWR(enabled ? lmsKeys.summary : null, () => lms.summary(), opts)
export const useAnalytics = (id: string | undefined) => useSWR(id ? lmsKeys.analytics(id) : null, () => lms.admin.analytics(id!), opts)
export const useMyCourses = () => useSWR(lmsKeys.mine, () => lms.myCourses(), opts)
export const useLesson = (id: string | null) => useSWR(id ? lmsKeys.lesson(id) : null, () => lms.lesson(id!), opts)
export const useCourseQuizzes = (courseId: string | undefined) => useSWR(courseId ? lmsKeys.quizzes(courseId) : null, () => lms.courseQuizzes(courseId!), opts)
export const useMyCertificates = () => useSWR(lmsKeys.certificates, () => lms.myCertificates(), opts)

export const useAdminCourses = () => useSWR(lmsKeys.adminCourses, () => lms.admin.courses(), opts)
export const useAdminCourse = (id: string | undefined) => useSWR(id ? lmsKeys.adminCourse(id) : null, () => lms.admin.course(id!), opts)
export const useAdminQuizzes = (id: string | undefined) => useSWR(id ? lmsKeys.adminQuizzes(id) : null, () => lms.admin.quizzes(id!), opts)
export const useOverview = () => useSWR(lmsKeys.overview, () => lms.admin.overview(), opts)
export const useAdminQuiz = (id: string | undefined) => useSWR(id ? lmsKeys.adminQuiz(id) : null, () => lms.admin.quiz(id!), opts)
export const useAdminEnrollments = (id: string | undefined, q = "", status: "active" | "revoked" | undefined = undefined, offset = 0) =>
  useSWR(id ? [lmsKeys.adminEnrollments(id), q, status ?? "", offset] : null, () => lms.admin.enrollments(id!, { q: q || undefined, status, offset }), opts)
export const useAdminCertificates = (id: string | undefined) => useSWR(id ? lmsKeys.adminCertificates(id) : null, () => lms.admin.certificates(id!), opts)

/** 401 = sin sesión; 403 = sin acceso al contenido; 404 = no existe o no está publicado. */
export function errorStatus(err: unknown): number | null {
  return err instanceof ApiError ? err.status : null
}
