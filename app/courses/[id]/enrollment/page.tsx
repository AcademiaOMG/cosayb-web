"use client"

import { use } from "react"
import EnrollmentFlow from "@/components/commerce/EnrollmentFlow"
import { COURSE_PROGRAM, PROGRAMS } from "@/lib/commerce/catalog"

export default function CourseEnrollmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const defaultProgram = COURSE_PROGRAM[id] ?? PROGRAMS[0]
  return <EnrollmentFlow courseId={id} defaultProgram={defaultProgram} />
}
