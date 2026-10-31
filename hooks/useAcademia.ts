"use client"

import { useLmsAccess, useMyCourses } from "@/lib/lms/hooks"

/**
 * Cómo se conecta CO$AYB con el LMS desde la app del negocio. La decisión real la toma el servidor:
 *  - `hasPlan`: el negocio tiene plan Academia → los cursos incluidos aparecen "de una", sin matrícula manual.
 *  - `courses`: los cursos a los que ya puede entrar (los del plan + sus matrículas), con avance.
 * No bloquea nada: sin plan, la entrada muestra el catálogo y una invitación a mejorar el plan.
 */
export function useAcademia() {
  const { data: access, error: accessError } = useLmsAccess(true)
  const hasPlan = Boolean(access?.academia)
  const wantsCourses = Boolean(access?.hasCourses) && !access?.disabled
  const { data: courses, error: coursesError, mutate } = useMyCourses(wantsCourses)
  return {
    loading: !access && !accessError,
    hasPlan,
    disabled: Boolean(access?.disabled),
    courses: wantsCourses ? courses : [],
    coursesLoading: wantsCourses && !courses && !coursesError,
    error: coursesError,
    retry: () => void mutate(),
  }
}
