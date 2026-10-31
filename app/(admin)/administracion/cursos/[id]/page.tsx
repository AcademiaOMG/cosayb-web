"use client"

import { Suspense } from "react"
import { useParams } from "next/navigation"
import CourseStudio from "@/components/lms/studio/CourseStudio"
import { Skeleton } from "@/components/lms/ui"

export default function CursoInstructorPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <Suspense fallback={<Skeleton className="h-96 !rounded-[22px]" />}>
      <CourseStudio id={id} />
    </Suspense>
  )
}
