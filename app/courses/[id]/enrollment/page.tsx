"use client"

import { useParams } from "next/navigation"
import EnrollmentFlow from "@/components/commerce/EnrollmentFlow"
import { COURSE_PROGRAM, PROGRAMS } from "@/lib/commerce/catalog"

export default function CourseEnrollmentPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""
  const defaultProgram = COURSE_PROGRAM[id] ?? PROGRAMS[0]
  return <EnrollmentFlow courseId={id} defaultProgram={defaultProgram} />
}
